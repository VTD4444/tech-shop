import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.core.limiter import limiter
from app.schemas.request import RecommendRequest, ChatRequest
from app.schemas.response import ChatResponse
from app.services.rag_engine import recommend_components
from app.services.llm_client import generate, generate_stream, LlmError

router = APIRouter()

CHAT_SYSTEM_PROMPT = """You are a friendly PC building advisor for TechShop.
Answer questions about PC components, compatibility, and build recommendations.
Use markdown for lists and emphasis when helpful. Keep answers concise and helpful."""


def _extract_chunk_text(chunk) -> str:
    """Extract incremental text from a Gemini stream chunk."""
    text = getattr(chunk, "text", None)
    if text:
        return text
    candidates = getattr(chunk, "candidates", None) or []
    parts: list[str] = []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", None) or []:
            part_text = getattr(part, "text", None)
            if part_text:
                parts.append(part_text)
    return "".join(parts)


def _build_chat_prompt(body: ChatRequest) -> str:
    history_text = "\n".join(
        [
            f"{'User' if m.get('role') == 'user' else 'Assistant'}: {m.get('content', '')}"
            for m in body.history[-6:]
        ]
    )
    return f"{history_text}\nUser: {body.message}\nAssistant:"


@router.post("/advisor/recommend", response_model=dict)
@limiter.limit("10/minute")
async def recommend(request: Request, body: RecommendRequest):
    try:
        result = await recommend_components(
            budget=body.budget_total,
            purpose=body.purpose,
            preferences=body.preferences,
        )
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LlmError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/advisor/chat", response_model=dict)
@limiter.limit("20/minute")
async def chat(request: Request, body: ChatRequest):
    prompt = _build_chat_prompt(body)

    try:
        reply = await generate(prompt, CHAT_SYSTEM_PROMPT)
        return {
            "success": True,
            "data": ChatResponse(reply=reply, suggested_products=[]),
        }
    except LlmError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/advisor/chat/stream")
@limiter.limit("20/minute")
async def chat_stream(request: Request, body: ChatRequest):
    prompt = _build_chat_prompt(body)

    async def event_stream():
        try:
            async for token in generate_stream(prompt, CHAT_SYSTEM_PROMPT):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except LlmError as e:
            yield f"data: {json.dumps({'error': e.message})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
