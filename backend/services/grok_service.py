import os
import json
import asyncio
from services.llm_service import generate_response, parse_json_lenient

FALLBACK_ANIMATIONS = ["Talking_0", "Talking_1", "Talking_2", "Idle"]
FALLBACK_EXPRESSIONS = ["smile", "surprised", "default"]

def get_fallback_message():
    import random
    return [
        {
            "text": "I'm having trouble connecting right now, but I'm here for you.",
            "facialExpression": random.choice(FALLBACK_EXPRESSIONS),
            "animation": random.choice(FALLBACK_ANIMATIONS),
        }
    ]

async def generate_grok_response(prompt, history=None):
    system_prompt = (
        "You are an AI tutor. Explain concepts clearly, use examples, and help students learn step-by-step. "
        "Keep short explanations, beginner friendly, structured answers. "
        "You must reply ONLY with strict JSON like this shape (no extra text or markdown formatting):\n"
        "{\n"
        '  "messages": [\n'
        '    { "text": "...", "facialExpression": "smile|sad|angry|surprised|funnyFace|default", "animation": "Talking_0|Talking_1|Talking_2|Crying|Laughing|Rumba|Idle|Terrified|Angry" }\n'
        "  ]\n"
        "}\n"
        "Return between 1 and 3 messages in the array. Ensure valid JSON without wrapping in ```json codeblocks."
    )

    history_str = ""
    if history:
        for m in history:
            history_str += f"{m.get('role', 'user')}: {m.get('content', '')}\n"

    full_prompt = f"{system_prompt}\n\nHistory:\n{history_str}\nUser: {prompt}\n\nRespond ONLY with JSON."

    try:
        raw_text, model_used = await asyncio.to_thread(generate_response, full_prompt)
        parsed = parse_json_lenient(raw_text)
        result = parsed.get("messages", parsed)
        if not isinstance(result, list):
            result = [result]
        return result[:3]
    except Exception as e:
        print(f"Error querying LLM fallback: {e}")
        return get_fallback_message()
