from google import genai
from google.genai import types

from app.core.config import load_settings, resolve_gemini_api_key

_client: genai.Client | None = None
_cached_api_key: str | None = None


class LlmError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def current_api_key() -> str:
    api_key, _source = resolve_gemini_api_key()
    return api_key


def current_api_key_source() -> str:
    _api_key, source = resolve_gemini_api_key()
    return source


def get_client() -> genai.Client:
    global _client, _cached_api_key
    api_key = current_api_key()
    if not api_key:
        raise LlmError("GEMINI_API_KEY is missing. Add it to ai-service/.env and restart uvicorn.", 503)

    if _client is None or _cached_api_key != api_key:
        _client = genai.Client(api_key=api_key)
        _cached_api_key = api_key
    return _client


def _map_gemini_error(exc: Exception) -> LlmError:
    msg = str(exc)
    lower = msg.lower()
    if "429" in msg or "resource_exhausted" in lower or "quota" in lower:
        return LlmError(
            "Gemini API quota exceeded. Enable billing at https://ai.google.dev or wait before retrying.",
            429,
        )
    if "expired" in lower or "api_key_invalid" in lower:
        return LlmError(
            "Gemini rejected the configured API key. Create a new key in AI Studio, "
            "update ai-service/.env, then restart uvicorn.",
            503,
        )
    if "401" in msg or "403" in msg or "unauthorized" in lower:
        return LlmError(
            "Gemini rejected the API key. Verify ai-service/.env and restart uvicorn.",
            503,
        )
    return LlmError(f"Gemini error: {msg}", 502)


RECOMMENDATION_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "Short explanation of the build in Vietnamese or English",
        },
        "recommended_components": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "component_type": {"type": "string"},
                    "product_id": {"type": "string"},
                    "product_name": {"type": "string"},
                    "slug": {"type": "string"},
                    "price": {"type": "number"},
                    "explanation": {"type": "string"},
                },
                "required": [
                    "component_type",
                    "product_id",
                    "product_name",
                    "slug",
                    "price",
                    "explanation",
                ],
            },
        },
    },
    "required": ["summary", "recommended_components"],
}

async def generate(
    prompt: str,
    system_instruction: str | None = None,
    *,
    json_mode: bool = False,
    json_schema: dict | None = None,
) -> str:
    settings = load_settings()
    client = get_client()
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]

    config_kwargs: dict = {
        "temperature": 0.2,
        "max_output_tokens": 8192,
        "system_instruction": system_instruction,
    }
    if json_mode:
        config_kwargs["response_mime_type"] = "application/json"
        if json_schema:
            config_kwargs["response_schema"] = json_schema

    config = types.GenerateContentConfig(**config_kwargs)

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=config,
        )
        return response.text
    except LlmError:
        raise
    except Exception as exc:
        raise _map_gemini_error(exc) from exc


async def generate_stream(
    prompt: str,
    system_instruction: str | None = None,
):
    """Yield text chunks from Gemini streaming API."""
    settings = load_settings()
    client = get_client()
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]
    config = types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=8192,
        system_instruction=system_instruction,
    )

    try:
        stream = client.models.generate_content_stream(
            model=settings.gemini_model,
            contents=contents,
            config=config,
        )
        for chunk in stream:
            text = _extract_stream_chunk_text(chunk)
            if text:
                yield text
    except LlmError:
        raise
    except Exception as exc:
        raise _map_gemini_error(exc) from exc


def _extract_stream_chunk_text(chunk) -> str:
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
