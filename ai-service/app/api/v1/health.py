from fastapi import APIRouter

from app.services.llm_client import current_api_key, current_api_key_source, generate, LlmError

router = APIRouter()


@router.get("/advisor/health")
async def health_check():
    return {"status": "ok", "service": "ai-advisor"}


@router.get("/advisor/health/gemini")
async def gemini_health_check():
    api_key = current_api_key()
    if not api_key:
        return {"ok": False, "reason": "GEMINI_API_KEY is missing in ai-service/.env"}

    try:
        await generate("Reply with exactly: OK", "Reply with one word only.")
        return {
            "ok": True,
            "reason": "Gemini API key works",
            "key_source": current_api_key_source(),
        }
    except LlmError as exc:
        return {
            "ok": False,
            "reason": exc.message,
            "key_source": current_api_key_source(),
        }
