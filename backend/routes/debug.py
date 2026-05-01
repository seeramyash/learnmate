from fastapi import APIRouter, HTTPException, Query

from models.schemas import ProgressRequest
from services.memory_service import load_memory, reset_memory

router = APIRouter(tags=["debug"])


@router.get("/debug/memory")
def debug_memory(user_id: str | None = Query(default=None)):
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")
    uid = user_id.strip()
    return {"user_id": uid, "memory": load_memory(uid)}


@router.post("/debug/reset")
def debug_reset(body: ProgressRequest):
    state = reset_memory(body.user_id)
    return {"user_id": body.user_id, "memory": state, "message": "Progress reset"}
