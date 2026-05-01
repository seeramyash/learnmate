from typing import Any, Literal

from models.schemas import QuizQuestion
from services.llm_service import generate_quiz as llm_generate_quiz


def normalize_questions(raw: dict[str, Any]) -> list[QuizQuestion]:
    qs = raw.get("questions")
    if not isinstance(qs, list):
        raise ValueError("Invalid quiz payload: missing questions array")
    out: list[QuizQuestion] = []
    for i, item in enumerate(qs):
        if not isinstance(item, dict):
            continue
        q = item.get("question", "")
        opts = item.get("options")
        ans = item.get("answer", "")
        expl = item.get("explanation", "")
        if not isinstance(opts, list):
            continue
        opt_strs = [str(o).strip() for o in opts if str(o).strip()]
        if len(opt_strs) < 2:
            continue
        if len(opt_strs) > 4:
            opt_strs = opt_strs[:4]
        while len(opt_strs) < 4:
            opt_strs.append(f"Option {len(opt_strs) + 1}")
        ans_s = str(ans).strip()
        if ans_s not in opt_strs:
            for o in opt_strs:
                if ans_s and (o.startswith(ans_s) or ans_s.startswith(o[:1])):
                    ans_s = o
                    break
        if ans_s not in opt_strs:
            ans_s = opt_strs[0]
        out.append(
            QuizQuestion(
                question=str(q).strip() or f"Question {i + 1}",
                options=opt_strs,
                answer=ans_s,
                explanation=str(expl).strip() or "Review the core idea and compare each option carefully.",
            )
        )
    if not out:
        raise ValueError("No valid questions in quiz response")
    return out


def build_quiz(
    topic: str,
    difficulty: str,
    num_questions: int,
) -> tuple[list[QuizQuestion], Literal["gemini", "ollama", "fallback"]]:
    raw = llm_generate_quiz(
        topic=topic,
        difficulty=difficulty,  # type: ignore[arg-type]
        num_questions=num_questions,
    )
    questions = normalize_questions(raw)
    model_used = raw.get("model_used", "fallback")
    if model_used not in {"gemini", "ollama", "fallback"}:
        model_used = "fallback"
    return questions, model_used
