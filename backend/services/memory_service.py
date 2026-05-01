import json
import threading
from copy import deepcopy
from datetime import date, datetime
from pathlib import Path
from typing import Any

_LOCK = threading.Lock()
_MEMORY_PATH = Path(__file__).resolve().parent.parent / "data" / "memory.json"


def _default_user_state(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "topics_learned": [],
        "weak_areas": [],
        "strong_areas": [],
        "mistakes": [],
        "learning_style": "balanced",
        "quiz_performance": {
            "total_questions": 0,
            "correct_answers": 0,
            "by_topic": {},
        },
        "accuracy_history": [],
        "study_streak": 0,
        "last_activity_date": None,
        "quiz_sessions": 0,
        "repeated_topic_errors": {},
    }


def load_memory(user_id: str) -> dict[str, Any]:
    with _LOCK:
        if not _MEMORY_PATH.exists():
            _MEMORY_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(_MEMORY_PATH, "w", encoding="utf-8") as f:
                json.dump({}, f)
            return deepcopy(_default_user_state(user_id))
        with open(_MEMORY_PATH, encoding="utf-8") as f:
            raw = json.load(f)
        if not isinstance(raw, dict):
            raw = {}
        user = raw.get(user_id)
        if user is None:
            return deepcopy(_default_user_state(user_id))
        merged = deepcopy(_default_user_state(user_id))
        merged.update(user)
        if "quiz_performance" not in merged or not isinstance(
            merged["quiz_performance"], dict
        ):
            merged["quiz_performance"] = _default_user_state(user_id)["quiz_performance"]
        else:
            qp = _default_user_state(user_id)["quiz_performance"]
            qp.update(merged["quiz_performance"])
            merged["quiz_performance"] = qp
        return merged


def save_memory(user_id: str, data: dict[str, Any]) -> None:
    data = deepcopy(data)
    data["user_id"] = user_id
    with _LOCK:
        _MEMORY_PATH.parent.mkdir(parents=True, exist_ok=True)
        if not _MEMORY_PATH.exists():
            store: dict[str, Any] = {}
        else:
            with open(_MEMORY_PATH, encoding="utf-8") as f:
                store = json.load(f)
            if not isinstance(store, dict):
                store = {}
        store[user_id] = data
        with open(_MEMORY_PATH, "w", encoding="utf-8") as f:
            json.dump(store, f, indent=2, ensure_ascii=False)


def _touch_streak(state: dict[str, Any]) -> None:
    today = date.today().isoformat()
    last = state.get("last_activity_date")
    if last == today:
        return
    if last is None:
        state["study_streak"] = 1
    else:
        try:
            last_d = date.fromisoformat(str(last))
            delta = (date.today() - last_d).days
            if delta == 1:
                state["study_streak"] = int(state.get("study_streak") or 0) + 1
            elif delta > 1:
                state["study_streak"] = 1
        except ValueError:
            state["study_streak"] = 1
    state["last_activity_date"] = today


def record_topic_learned(state: dict[str, Any], topic: str) -> None:
    t = topic.strip()
    topics = list(state.get("topics_learned") or [])
    if t not in topics:
        topics.append(t)
    state["topics_learned"] = topics
    _touch_streak(state)


def update_memory_after_quiz(
    state: dict[str, Any],
    topic: str,
    correct_count: int,
    total: int,
    wrong_indices: list[int],
) -> None:
    _touch_streak(state)
    qp = state.setdefault("quiz_performance", {})
    qp["total_questions"] = int(qp.get("total_questions") or 0) + total
    qp["correct_answers"] = int(qp.get("correct_answers") or 0) + correct_count
    by_topic = qp.setdefault("by_topic", {})
    key = topic.strip()
    bt = by_topic.get(key) or {"attempts": 0, "correct": 0, "wrong": 0}
    bt["attempts"] = int(bt.get("attempts") or 0) + total
    bt["correct"] = int(bt.get("correct") or 0) + correct_count
    bt["wrong"] = int(bt.get("wrong") or 0) + (total - correct_count)
    by_topic[key] = bt

    acc = (correct_count / total * 100.0) if total else 0.0
    hist = list(state.get("accuracy_history") or [])
    hist.append({"ts": datetime.utcnow().isoformat() + "Z", "accuracy": acc})
    state["accuracy_history"] = hist[-50:]

    state["quiz_sessions"] = int(state.get("quiz_sessions") or 0) + 1

    rte = state.setdefault("repeated_topic_errors", {})
    err_key = key
    if wrong_indices:
        rte[err_key] = int(rte.get(err_key) or 0) + len(wrong_indices)

    weak = list(state.get("weak_areas") or [])
    strong = list(state.get("strong_areas") or [])
    if acc < 50 and key not in weak:
        weak.append(key)
    elif acc >= 70 and key in weak:
        weak = [w for w in weak if w != key]
    state["weak_areas"] = weak

    # Track strong areas: score >= 70% and at least 2 questions
    if acc >= 70 and total >= 2:
        if key not in strong:
            strong.append(key)
    elif acc < 50 and key in strong:
        strong = [s for s in strong if s != key]
    state["strong_areas"] = strong

    mistakes = list(state.get("mistakes") or [])
    for w in wrong_indices:
        mistakes.append(
            {
                "topic": key,
                "question_index": w,
                "ts": datetime.utcnow().isoformat() + "Z",
            }
        )
    state["mistakes"] = mistakes[-200:]

    if len(wrong_indices) >= max(2, total // 2):
        state["learning_style"] = "step_by_step"
    elif acc >= 85 and total >= 3:
        state["learning_style"] = "challenge"


def infer_improvement_trend(state: dict[str, Any]) -> str:
    hist = state.get("accuracy_history") or []
    if len(hist) < 2:
        return "insufficient_data"
    recent = [h["accuracy"] for h in hist[-5:] if "accuracy" in h]
    older = [h["accuracy"] for h in hist[-10:-5] if "accuracy" in h]
    if not recent:
        return "insufficient_data"
    r_avg = sum(recent) / len(recent)
    if not older:
        if len(hist) >= 3:
            first = hist[0]["accuracy"]
            if r_avg > first + 5:
                return "up"
            if r_avg < first - 5:
                return "down"
        return "stable"
    o_avg = sum(older) / len(older)
    if r_avg > o_avg + 3:
        return "up"
    if r_avg < o_avg - 3:
        return "down"
    return "stable"


def accuracy_percentage(state: dict[str, Any]) -> float:
    qp = state.get("quiz_performance") or {}
    total = int(qp.get("total_questions") or 0)
    if total == 0:
        return 0.0
    correct = int(qp.get("correct_answers") or 0)
    return round(100.0 * correct / total, 2)


def ensure_memory_dir() -> None:
    _MEMORY_PATH.parent.mkdir(parents=True, exist_ok=True)


def memento_snapshot(state: dict[str, Any]) -> dict[str, Any]:
    return deepcopy(state)


def restore_memento(user_id: str, snapshot: dict[str, Any]) -> None:
    save_memory(user_id, snapshot)

def reset_memory(user_id: str) -> dict[str, Any]:
    state = _default_user_state(user_id)
    save_memory(user_id, state)
    return state
