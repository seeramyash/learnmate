from fastapi import APIRouter, Query

from models.schemas import LearnRequest, LearnResponse, ResourcesRequest, ResourcesResponse
from services.adaptation_service import (
    adjust_for_repeated_mistakes,
    build_adaptation_prompt_fragment,
    explanation_level_from_accuracy,
)
from services.firecrawl_service import fetch_and_summarize_resources
from services.llm_service import safe_generate_explanation
from services.memory_service import (
    accuracy_percentage,
    load_memory,
    record_topic_learned,
    save_memory,
)

router = APIRouter(tags=["tutor"])


@router.post("/learn", response_model=LearnResponse)
async def learn(
    body: LearnRequest,
    include_resources: bool = Query(
        default=False,
        description="If true, attempt Firecrawl search and attach a short summary",
    ),
):
    state = load_memory(body.user_id)
    acc = accuracy_percentage(state)
    level = explanation_level_from_accuracy(acc)
    rte = state.get("repeated_topic_errors") or {}
    err_n = int(rte.get(body.topic.strip(), 0) or 0)
    level = adjust_for_repeated_mistakes(level, err_n)

    weak = list(state.get("weak_areas") or [])
    adapt = build_adaptation_prompt_fragment(
        level,
        str(state.get("learning_style") or "balanced"),
        weak,
        body.topic,
    )

    prompt = f"""You are LearnMate AI, a smart, friendly, and adaptive tutor.

The student will enter a topic name.

Your job is to generate a detailed, topic-specific explanation for beginners.

For every topic, structure the response in this format:

# Definition

Explain what the topic means in simple words.

# Important Concepts

List the main concepts related to the topic.

# Key Subtopics

Mention the most important subtopics.

# Real-World Example

Give one simple real-life example.

# Code Example

If the topic is technical, include a short code example.

# Common Mistakes

Mention common mistakes students make while learning this topic.

# Quick Summary

Give a short summary in 2–3 lines.

# Suggested Next Topic

Suggest what the student should learn next.

Rules:

* Never use generic filler phrases like:

  * Here is a stable overview
  * Best learned by starting with
  * Focus on the main idea
  * Practice with a small problem
  * Core principle
  * Rare edge cases
* Always give actual educational content related to the topic.
* Keep explanations beginner-friendly.
* Use clean formatting, headings, and bullet points.
* Keep the tone friendly and helpful.
* Make sure the content is specific to the topic entered.

If the topic is DBMS, include:

* What DBMS is
* Advantages of DBMS
* Types of DBMS
* Examples like MySQL, Oracle, MongoDB
* SQL mention if relevant

If the topic is OOPS, include:

* Definition of OOPS
* Four pillars:

  * Encapsulation
  * Inheritance
  * Polymorphism
  * Abstraction
* Real-world examples
* Small Java or Python class example

End every explanation with:
'Would you like a quiz on this topic?'

Topic to explain: {body.topic}
{adapt}
"""

    resources_summary = None
    if include_resources:
        try:
            summary, _src = await fetch_and_summarize_resources(body.topic)
            if summary:
                resources_summary = summary
                prompt += (
                    "\n\nOptional context from external search (may be incomplete):\n"
                    + summary
                )
        except Exception:
            resources_summary = None

    explanation, model_used = safe_generate_explanation(prompt, body.topic)

    record_topic_learned(state, body.topic)
    save_memory(body.user_id, state)

    return LearnResponse(
        explanation=explanation,
        adaptation_level=level,
        user_id=body.user_id,
        topic=body.topic,
        resources_summary=resources_summary,
        model_used=model_used,
    )


@router.post("/resources", response_model=ResourcesResponse)
async def resources(body: ResourcesRequest):
    try:
        summary, sources = await fetch_and_summarize_resources(body.topic)
    except Exception:
        summary, sources = "", []
    if not sources and not summary:
        summary = (
            "External resources are optional and currently unavailable. "
            "You can still use Learn and Quiz normally."
        )
    return ResourcesResponse(
        topic=body.topic,
        user_id=body.user_id,
        summary=summary,
        sources=sources,
    )
