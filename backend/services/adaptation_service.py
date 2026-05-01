from typing import Literal

from utils.helpers import clamp_float


def explanation_level_from_accuracy(
    accuracy_pct: float,
) -> Literal["very_simple", "moderate", "advanced"]:
    a = clamp_float(accuracy_pct, 0.0, 100.0)
    if a < 50:
        return "very_simple"
    if a <= 80:
        return "moderate"
    return "advanced"


def adjust_for_repeated_mistakes(
    base: Literal["very_simple", "moderate", "advanced"],
    repeated_errors_on_topic: int,
) -> Literal["very_simple", "moderate", "advanced"]:
    if repeated_errors_on_topic >= 3:
        return "very_simple"
    if repeated_errors_on_topic >= 1 and base == "advanced":
        return "moderate"
    return base


def build_adaptation_prompt_fragment(
    level: Literal["very_simple", "moderate", "advanced"],
    learning_style: str,
    weak_areas: list[str],
    topic: str,
) -> str:
    lines = [
        f"Adaptation level: {level}.",
        f"Student learning style hint: {learning_style}.",
    ]
    if weak_areas:
        lines.append(
            "Student has struggled with: "
            + ", ".join(weak_areas[:8])
            + ". Use extra clarity when those relate to the topic."
        )
    if topic.strip() in weak_areas:
        lines.append(
            "This topic is a known weak area: use short sentences, one concrete example, "
            "and a quick recap at the end."
        )
    if level == "very_simple":
        lines.append(
            "Use very simple language, short paragraphs, analogies, and avoid jargon; "
            "define any necessary term in one line."
        )
    elif level == "moderate":
        lines.append(
            "Use balanced depth: clear structure, one example, brief connections to prior ideas."
        )
    else:
        lines.append(
            "Use advanced explanation: deeper intuition, edge cases, and precise terminology."
        )
    return "\n".join(lines)
