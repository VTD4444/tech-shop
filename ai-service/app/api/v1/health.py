from fastapi import APIRouter

router = APIRouter()

@router.get("/advisor/health")
async def health_check():
    return {"status": "ok", "service": "ai-advisor"}
