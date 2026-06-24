from fastapi import APIRouter, HTTPException, Request
from app.core.limiter import limiter
from app.schemas.request import RecommendRequest, ChatRequest
from app.schemas.response import ChatResponse
from app.services.rag_engine import recommend_components
from app.services.llm_client import generate, LlmError

router = APIRouter()

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
    system_prompt = """You are a friendly PC building advisor. Answer questions about PC components, 
compatibility, and build recommendations. Keep answers concise (under 200 words) and helpful."""

    history_text = "\n".join(
        [f"{'User' if m.get('role') == 'user' else 'Assistant'}: {m.get('content', '')}"
         for m in body.history[-6:]]
    )
    prompt = f"{history_text}\nUser: {body.message}\nAssistant:"

    try:
        reply = await generate(prompt, system_prompt)
        return {
            "success": True,
            "data": ChatResponse(reply=reply, suggested_products=[]),
        }
    except LlmError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
