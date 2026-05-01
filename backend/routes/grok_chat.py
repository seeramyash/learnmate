from fastapi import APIRouter, Request, HTTPException
from services.grok_service import generate_grok_response
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/grok-chat")
async def grok_chat(request: Request):
    """
    Endpoint for Her-Haven frontend to chat with Grok.
    Expected JSON body: {"message": "hello", "sessionId": "...", ...}
    Returns JSON: {"messages": [{text, facialExpression, animation}]}
    """
    try:
        body = await request.json()
        user_message = body.get("message", "")
        # Assuming frontend manages history or just sends single message.
        # If frontend sends history inside 'history' key, parse it:
        history = body.get("history", [])
        
        # Avoid empty calls taking token space
        if not user_message and not history:
            return {"messages": [
                {
                    "text": "Hey there! Ready to learn something new?",
                    "facialExpression": "smile",
                    "animation": "Talking_1"
                }
            ]}

        messages = await generate_grok_response(user_message, history)
        
        # Ensure we always return something that doesn't break the frontend loop
        if not messages:
             messages = [{
                 "text": "I'm listening.",
                 "facialExpression": "default",
                 "animation": "Idle"
             }]
             
        # Add basic mapping for missing facial/anim values if model fails to include them
        for m in messages:
            if not m.get("facialExpression"):
                m["facialExpression"] = "default"
            if not m.get("animation"):
                m["animation"] = "Talking_0"

        return {"messages": messages}
    except Exception as e:
        logger.error(f"Error processing grok_chat: {e}")
        return {"messages": [{
            "text": "Oh, something went wrong on my end while thinking about that.",
            "facialExpression": "sad",
            "animation": "Talking_0"
        }]}
