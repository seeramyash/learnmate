from fastapi import APIRouter, HTTPException

from models.schemas import (
    QuizRequest,
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
from services.memory_service import (
    load_memory,
    save_memory,
    update_memory_after_quiz,
)
from services.quiz_service import build_quiz

router = APIRouter(tags=["quiz"])


def _difficulty_from_memory(state: dict, _topic: str, requested: str | None) -> str:
    if requested:
        return requested
    from services.adaptation_service import explanation_level_from_accuracy
    from services.memory_service import accuracy_percentage

    acc = accuracy_percentage(state)
    level = explanation_level_from_accuracy(acc)
    if level == "very_simple":
        return "easy"
    if level == "moderate":
        return "medium"
    return "hard"


@router.post("/quiz", response_model=QuizResponse)
def create_quiz(body: QuizRequest):
    state = load_memory(body.user_id)
    difficulty = _difficulty_from_memory(state, body.topic, body.difficulty)
    try:
        questions, model_used = build_quiz(body.topic, difficulty, body.num_questions)
    except (RuntimeError, ValueError) as e:
        raise HTTPException(status_code=502, detail=f"Quiz generation failed: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected quiz error: {e}") from e
    return QuizResponse(
        questions=questions,
        topic=body.topic,
        user_id=body.user_id,
        difficulty=difficulty,
        model_used=model_used,
    )


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(body: QuizSubmitRequest):
    if not body.questions:
        raise HTTPException(status_code=400, detail="questions list is required")
    state = load_memory(body.user_id)
    results: list[dict] = []
    wrong_indices: list[int] = []
    for i, q in enumerate(body.questions):
        key = str(i)
        sel = body.answers.get(key, body.answers.get(str(i)))
        if sel is None:
            wrong_indices.append(i)
            results.append(
                {
                    "index": i,
                    "correct": False,
                    "selected": None,
                    "expected": q.answer,
                }
            )
            continue
        sel_s = str(sel).strip()
        ok = sel_s == q.answer.strip()
        if not ok:
            for opt in q.options:
                if sel_s == opt.strip():
                    ok = opt.strip() == q.answer.strip()
                    break
        if not ok:
            wrong_indices.append(i)
        results.append(
            {
                "index": i,
                "correct": ok,
                "selected": sel_s,
                "expected": q.answer,
            }
        )
    total = len(body.questions)
    score = sum(1 for r in results if r.get("correct"))
    pct = round(100.0 * score / total, 2) if total else 0.0

    resolved_topic = body.topic or "General"
    if resolved_topic == "General" and body.questions:
        first_q = body.questions[0].question.strip()
        if first_q:
            resolved_topic = first_q[:60]
    update_memory_after_quiz(state, resolved_topic, score, total, wrong_indices)
    save_memory(body.user_id, state)

    return QuizSubmitResponse(
        score=score,
        total=total,
        accuracy_percentage=pct,
        results=results,
        correct_answers=score,
        wrong_answers=total - score,
    )
