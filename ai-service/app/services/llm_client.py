from google import genai
from google.genai import types
from app.core.config import settings

_client = None

def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client

async def generate(prompt: str, system_instruction: str | None = None) -> str:
    client = get_client()
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]

    config = types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=2048,
        system_instruction=system_instruction,
    )

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=contents,
        config=config,
    )
    return response.text
