import os
from typing import Any

import httpx

from services.llm_service import summarize_text, generate_response, parse_json_lenient


def _api_key() -> str | None:
    k = os.environ.get("FIRECRAWL_API_KEY", "").strip()
    return k or None


async def search_educational_content(
    query: str,
    limit: int = 3,
) -> list[dict[str, str]]:
    key = _api_key()
    if not key:
        return []
    url = os.environ.get("FIRECRAWL_API_URL", "https://api.firecrawl.dev/v1/search").rstrip(
        "/"
    )
    payload: dict[str, Any] = {"query": query, "limit": min(limit, 10)}
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
    except Exception:
        return []
    items: list[dict[str, str]] = []
    raw_list = data.get("data") or data.get("results") or []
    if isinstance(raw_list, list):
        for it in raw_list[:limit]:
            if not isinstance(it, dict):
                continue
            title = str(it.get("title") or it.get("name") or "Untitled")
            link = str(it.get("url") or it.get("link") or "")
            snippet = str(it.get("description") or it.get("snippet") or "")
            items.append({"title": title, "url": link, "summary": snippet})
    return items


def _generate_resources_with_llm(topic: str) -> list[dict[str, str]]:
    prompt = f"""Generate exactly 3 relevant learning resources for the topic "{topic}".
Provide the output as JSON with a list of resources.
Each resource must have:
- title: string
- summary: string (description of the resource)
- type: string (e.g., Article, Video, Tutorial, Course)
- url: string (use a realistic link placeholder like "https://example.com/learn-{topic.replace(' ', '-').lower()}")

Format requirements:
{{
  "resources": [
    {{
      "title": "...",
      "summary": "...",
      "type": "...",
      "url": "..."
    }}
  ]
}}"""
    try:
        raw, _model_used = generate_response(prompt)
        parsed = parse_json_lenient(raw)
        return parsed.get("resources", [])[:3]
    except Exception:
        return []


def _google_fallback_resources(topic: str) -> list[dict[str, str]]:
    query = topic.strip()
    encoded = query.replace(" ", "+")
    return [
        {
            "title": f"{query} overview",
            "url": f"https://www.google.com/search?q={encoded}+overview",
            "summary": f"Quick Google results for beginner-friendly {query} explanations.",
        },
        {
            "title": f"{query} tutorial",
            "url": f"https://www.google.com/search?q={encoded}+tutorial",
            "summary": f"Step-by-step tutorials and examples related to {query}.",
        },
        {
            "title": f"{query} practice questions",
            "url": f"https://www.google.com/search?q={encoded}+practice+questions",
            "summary": f"Practice material and revision links for {query}.",
        },
    ]


async def fetch_and_summarize_resources(topic: str, max_sources: int = 3) -> tuple[str, list[dict[str, str]]]:
    sources = await search_educational_content(f"{topic} educational overview tutorial", limit=max_sources)
    if not sources:
        sources = _generate_resources_with_llm(topic)
        if not sources:
            sources = _google_fallback_resources(topic)[:max_sources]

    chunks = []
    for s in sources:
        line = f"{s.get('title', '')}: {s.get('summary', '')} ({s.get('url', '')})"
        chunks.append(line)
    blob = "\n".join(chunks)
    try:
        summary = summarize_text(blob, max_words=180)
    except RuntimeError:
        summary = blob[:800]
    return summary, sources
