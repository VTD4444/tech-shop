import httpx
from app.core.config import settings

async def validate_build(component_ids: list[str]) -> dict:
    if not component_ids:
        return {"compatible": True, "issues": [], "totalWattage": 0, "totalPrice": 0, "psuWattage": None}

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.backend_api_url}/pc-builder/validate",
            json={"componentIds": component_ids},
            timeout=15.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        return payload.get("data", payload)
