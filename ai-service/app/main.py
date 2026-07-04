import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import load_settings
from app.core.limiter import limiter
from app.api.v1 import advisor, health

settings = load_settings()

def _normalize_origin(url: str) -> str:
    return url.strip().rstrip("/")

def _cors_origins() -> list[str]:
    origins = {
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3000",
    }
    if settings.frontend_url:
        origins.add(_normalize_origin(settings.frontend_url))
    extra = os.getenv("CORS_ORIGINS", "")
    for item in extra.split(","):
        item = item.strip()
        if item:
            origins.add(_normalize_origin(item))
    return sorted(origins)

app = FastAPI(title="TechShop AI Advisor", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(advisor.router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    from app.core.config import gemini_key_override_warning, load_settings
    from app.services.llm_client import current_api_key, current_api_key_source

    settings = load_settings()
    api_key = current_api_key()
    source = current_api_key_source()
    override_warning = gemini_key_override_warning()
    if override_warning:
        print(f"WARNING: {override_warning}")

    if not api_key:
        print("WARNING: GEMINI_API_KEY is empty")
    elif api_key.startswith("AQ."):
        print(f"AI Service started. Gemini model: {settings.gemini_model} (auth key from {source})")
    elif api_key.startswith("AIza"):
        print(f"AI Service started. Gemini model: {settings.gemini_model} (standard key from {source})")
    else:
        print(f"AI Service started. Gemini model: {settings.gemini_model} (key from {source})")
