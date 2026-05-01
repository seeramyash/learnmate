import re


def safe_topic_slug(topic: str) -> str:
    t = topic.strip().lower()
    t = re.sub(r"[^\w\s-]", "", t)
    t = re.sub(r"[-\s]+", "_", t)
    return t[:120] or "general"


def clamp_float(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))
