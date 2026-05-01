import json
import logging
import os
import re
from typing import Any, Literal

import google.generativeai as genai
import httpx

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_MODELS = [
    "models/gemini-2.0-flash",
    "models/gemini-2.5-flash",
    "models/gemini-pro-latest",
]
DEFAULT_OLLAMA_MODEL = "llama3.1:8b"
DEFAULT_OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_OLLAMA_TIMEOUT = 120.0
_JSON_BLOCK = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.I)
_TRAILING_COMMAS = re.compile(r",(\s*[}\]])")


def _gemini_key() -> str:
    return os.environ.get("GEMINI_API_KEY", "").strip() or os.environ.get(
        "GOOGLE_API_KEY", ""
    ).strip()


def _gemini_candidates(model: str | None = None) -> list[str]:
    candidates: list[str] = []
    for item in [
        model,
        os.environ.get("GEMINI_MODEL", "").strip() or None,
        *DEFAULT_GEMINI_MODELS,
    ]:
        if item and item not in candidates:
            candidates.append(item)
    return candidates


def _extract_text(resp: Any) -> str:
    text = getattr(resp, "text", None)
    if text:
        return str(text).strip()

    prompt_feedback = getattr(resp, "prompt_feedback", None)
    block_reason = getattr(prompt_feedback, "block_reason", None)
    if block_reason:
        raise RuntimeError(f"Gemini blocked the response: {block_reason}")

    parts: list[str] = []
    for cand in getattr(resp, "candidates", []) or []:
        finish_reason = getattr(cand, "finish_reason", None)
        if finish_reason and str(finish_reason).upper() not in {"STOP", "1"}:
            continue
        content = getattr(cand, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", []) or []:
            t = getattr(part, "text", None)
            if t:
                parts.append(str(t))
    return "\n".join(parts).strip()


def _generate_with_gemini(prompt: str, model: str | None = None) -> str:
    key = _gemini_key()
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    genai.configure(api_key=key)
    last_error: str | None = None

    for candidate in _gemini_candidates(model):
        try:
            model_client = genai.GenerativeModel(candidate)
            resp = model_client.generate_content(prompt)
            text = _extract_text(resp)
            if text:
                return text
            last_error = f"{candidate} returned an empty response."
        except Exception as exc:
            last_error = f"{candidate} failed: {exc}"
            logger.warning("Gemini model failed: %s", last_error)

    raise RuntimeError(last_error or "Gemini failed to generate a response.")


def _ollama_url() -> str:
    return os.environ.get("OLLAMA_API_URL", DEFAULT_OLLAMA_URL).strip() or DEFAULT_OLLAMA_URL


def _ollama_model(model: str | None = None) -> str:
    return model or os.environ.get("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL).strip() or DEFAULT_OLLAMA_MODEL


def _ollama_timeout() -> float:
    raw = os.environ.get("OLLAMA_TIMEOUT", "").strip()
    if raw:
        try:
            return float(raw)
        except ValueError:
            pass
    return DEFAULT_OLLAMA_TIMEOUT


def _generate_with_ollama(prompt: str, model: str | None = None) -> str:
    payload = {
        "model": _ollama_model(model),
        "prompt": prompt,
        "stream": False,
    }
    try:
        with httpx.Client(timeout=_ollama_timeout()) as client:
            response = client.post(_ollama_url(), json=payload)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        raise RuntimeError(f"Ollama request failed: {exc}") from exc

    text = str(data.get("response") or "").strip()
    if not text:
        raise RuntimeError("Ollama returned an empty response.")
    return text


def generate_response(
    prompt: str,
    model: str | None = None,
) -> tuple[str, Literal["gemini", "ollama"]]:
    errors: list[str] = []

    if _gemini_key():
        try:
            return _generate_with_gemini(prompt, model=model), "gemini"
        except Exception as exc:
            logger.warning("Gemini fallback triggered: %s", exc)
            errors.append(f"Gemini error: {exc}")

    try:
        return _generate_with_ollama(prompt, model=model), "ollama"
    except Exception as exc:
        logger.warning("Ollama fallback failed: %s", exc)
        errors.append(f"Ollama error: {exc}")

    joined = " | ".join(errors) if errors else ""
    raise RuntimeError(
        "No LLM response available. Configure GEMINI_API_KEY or run Ollama locally."
        + (f" Details: {joined}" if joined else "")
    )


def _safe_json_loads(raw: str) -> dict[str, Any]:
    value = json.loads(raw)
    if isinstance(value, dict):
        return value
    raise ValueError("Model output was valid JSON but not a JSON object")


def _try_fix_common_json_issues(raw: str) -> str:
    cleaned = raw.strip()
    cleaned = _TRAILING_COMMAS.sub(r"\1", cleaned)
    return cleaned


def parse_json_lenient(raw: str) -> dict[str, Any]:
    raw = (raw or "").strip()
    if not raw:
        raise ValueError("Could not parse JSON from empty model output")

    candidates = [raw]

    m = _JSON_BLOCK.search(raw)
    if m:
        candidates.append(m.group(1).strip())

    start = raw.find("{")
    end = raw.rfind("}")
    if start >= 0 and end > start:
        candidates.append(raw[start : end + 1].strip())

    seen: set[str] = set()
    for candidate in candidates:
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        for attempt in [candidate, _try_fix_common_json_issues(candidate)]:
            try:
                return _safe_json_loads(attempt)
            except (json.JSONDecodeError, ValueError):
                continue

    raise ValueError("Could not parse JSON from model output")


def parse_text_quiz(raw_text: str) -> dict[str, Any]:
    questions = []

    # Split by "Question X:" while tolerating markdown emphasis like **Question 1:**
    blocks = re.split(r"\*{0,2}Question\s+\d+:\*{0,2}\s*", raw_text.strip(), flags=re.IGNORECASE)
    for block in blocks:
        block = block.strip()
        if not block:
            continue

        normalized = block.replace("**Correct Answer:", "Correct Answer:")
        normalized = normalized.replace("**Correct answer:", "Correct Answer:")
        normalized = normalized.replace("**Question:", "Question:")
        normalized = normalized.replace("**", "")

        q_match = re.search(
            r"(?:Question:\s*)?(.*?)\n\s*((?:[A-D]\.\s.*(?:\n|$)){4})\s*Correct Answer:\s*([A-D])",
            normalized,
            re.DOTALL | re.IGNORECASE,
        )
        if q_match:
            question_text = q_match.group(1).strip()
            options_block = q_match.group(2).strip()
            correct_letter = q_match.group(3).strip().upper()

            options_lines = options_block.split('\n')
            options = []
            answer = ""
            for line in options_lines:
                line = line.strip()
                if re.match(r"^[A-D]\. ", line):
                    opt_text = line[3:].strip()
                    options.append(opt_text)
                    if line.startswith(f"{correct_letter}."):
                        answer = opt_text
            
            # Ensure we only add valid questions
            if len(options) == 4 and answer:
                questions.append({
                    "question": question_text,
                    "options": options,
                    "answer": answer,
                    "explanation": f"The correct answer is {answer}."
                })

    if not questions:
        raise ValueError("Could not parse generated quiz questions.")
        
    return {"questions": questions}

def generate_quiz(
    topic: str,
    difficulty: str,
    num_questions: int,
    model: str | None = None,
) -> dict[str, Any]:
    prompt = f"""You are LearnMate AI Quiz Generator.

Generate exactly 5 multiple-choice questions for the topic entered by the student.

Topic: {topic}

Rules:

* Questions must be directly related to the topic.
* Avoid generic or repeated wording.
* Every question must have:

  * Question
  * 4 answer options
  * Correct answer
* Mix easy and medium-level questions.
* Questions should test understanding, not memorization only.
* Do not repeat the same question structure.
* Never use phrases like:

  * Which statement best reflects a key idea
  * Core principle
  * Rare edge cases
  * Unrelated to learning
* Make each question meaningful.

Return the quiz in this format:

Question 1:
Question: What does DBMS stand for?
A. Data Backup Management System
B. Database Management System
C. Data Building Monitoring Service
D. Database Backup Monitoring Software
Correct Answer: B

Question 2:
Question: Which of the following is an example of a DBMS?
A. Chrome
B. Linux
C. MySQL
D. Windows
Correct Answer: C

Continue until 5 questions are generated."""

    try:
        raw, model_used = generate_response(prompt, model=model)
        parsed = parse_text_quiz(raw)
        parsed["model_used"] = model_used
        return parsed
    except Exception as exc:
        raise RuntimeError("Quiz generation failed. Please try again.")

def summarize_text(text: str, max_words: int = 200, model: str | None = None) -> str:
    if not text.strip():
        return ""
    prompt = (
        f"Summarize the following for a student in at most {max_words} words. "
        f"Focus on definitions, key ideas, and one actionable next step.\n\n{text}"
    )
    try:
        summary, _model_used = generate_response(prompt, model=model)
        return summary
    except RuntimeError:
        words = text.split()
        return " ".join(words[:max_words]).strip()

def safe_generate_explanation(
    prompt: str,
    topic: str,
    model: str | None = None,
) -> tuple[str, Literal["gemini", "ollama", "fallback"]]:
    try:
        text, model_used = generate_response(prompt, model=model)
        if not text:
            return "Sorry, I could not generate a response right now. Please try again.", "fallback"
        return text, model_used
    except Exception:
        return "Sorry, I could not generate a response right now. Please try again.", "fallback"
