from fastapi import APIRouter, HTTPException, Query

from models.schemas import ProgressReport, ProgressRequest
from services.memory_service import (
    accuracy_percentage,
    infer_improvement_trend,
    load_memory,
)

router = APIRouter(tags=["progress"])


@router.get("/progress", response_model=ProgressReport)
def get_progress(
    user_id: str | None = Query(default=None),
):
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")
    uid = user_id.strip()
    state = load_memory(uid)
    qp = state.get("quiz_performance") or {}
    total_q = int(qp.get("total_questions") or 0)
    correct = int(qp.get("correct_answers") or 0)
    acc = accuracy_percentage(state)
    trend = infer_improvement_trend(state)
    topics = list(state.get("topics_learned") or [])
    weak = list(state.get("weak_areas") or [])
    strong = list(state.get("strong_areas") or [])
    by_topic = dict(qp.get("by_topic") or {})
    return ProgressReport(
        user_id=uid,
        topics_covered=topics,
        weak_areas=weak,
        strong_areas=strong,
        total_questions=total_q,
        correct_answers=correct,
        accuracy_percentage=acc,
        improvement_trend=trend,  # type: ignore[arg-type]
        learning_style=str(state.get("learning_style") or "balanced"),
        study_streak=int(state.get("study_streak") or 0),
        quiz_sessions=int(state.get("quiz_sessions") or 0),
        by_topic=by_topic,
    )


@router.post("/progress", response_model=ProgressReport)
def post_progress(body: ProgressRequest):
    return get_progress(user_id=body.user_id)
