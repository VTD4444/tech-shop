import json
import httpx
from app.core.config import settings
from app.services.llm_client import generate
from app.services.validator_client import validate_build

SYSTEM_PROMPT = """You are a professional PC builder advisor. Your role is to recommend PC components 
that are compatible with each other based on the user's budget and needs.

Available component types: CPU, MAINBOARD, RAM, VGA, STORAGE, PSU, CASE, COOLER

Rules:
1. Stay strictly within the user's budget.
2. Recommend components that are compatible (matching socket, RAM generation, form factor, etc.)
3. Balance the budget: CPU+MB ~30-40%, GPU ~30-40%, RAM+Storage ~15%, PSU+Case+Cooler ~15%.
4. Always include: CPU, MAINBOARD, RAM, STORAGE, PSU, CASE. GPU is optional for office builds.
5. Provide a reason for each recommendation.
6. Output ONLY valid JSON array with no markdown formatting, no code blocks."""

def _build_prompt(budget: float, purpose: str, preferences: list[str], products_text: str) -> str:
    purpose_guide = {
        "gaming": "Prioritize GPU (RTX series), fast CPU (i5/R5 or higher), 16-32GB RAM.",
        "work": "Prioritize CPU with integrated graphics, 16GB RAM, reliable SSD.",
        "graphics": "Prioritize GPU (high VRAM), 32GB+ RAM, fast storage.",
        "development": "Prioritize multi-core CPU, 32GB+ RAM, fast SSD.",
        "general": "Balanced build with good value components.",
    }

    return f"""Budget: {budget:,.0f} VND
Purpose: {purpose}
Guide: {purpose_guide.get(purpose, 'Balanced build')}
Preferences: {', '.join(preferences) if preferences else 'None'}

Available products:
{products_text}

Output a JSON array of recommended components. Each component must have:
- component_type (string): one of CPU, MAINBOARD, RAM, VGA, STORAGE, PSU, CASE, COOLER
- product_id (string): the product ID from the available products
- product_name (string)
- slug (string)
- price (number)
- explanation (string): why this component fits the build

Example:
[
  {{
    "component_type": "CPU",
    "product_id": "1",
    "product_name": "Intel Core i5-14600K",
    "slug": "intel-core-i5-14600k",
    "price": 6900000,
    "explanation": "Great mid-range CPU for gaming with 10 cores"
  }}
]"""

async def recommend_components(budget: float, purpose: str, preferences: list[str]) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.backend_api_url}/pc-builder/components",
            timeout=10.0,
        )
        components = resp.json().get("data", [])

        resp2 = await client.get(
            f"{settings.backend_api_url}/products?limit=50&isPcComponent=true",
            timeout=10.0,
        )
        products_data = resp2.json().get("data", [])

    all_items = []
    product_map = {}
    for p in products_data:
        product_map[str(p["id"])] = p
        comp = next((c for c in components if str(c["productId"]) == str(p["id"])), None)
        if comp and comp.get("componentType"):
            all_items.append({
                "id": str(p["id"]),
                "name": p["name"],
                "slug": p["slug"],
                "price": float(p["price"]),
                "component_type": comp["componentType"],
                "specs": {k: v for k, v in comp.items() if k not in ("id", "productId", "componentType", "product")},
            })

    products_text = json.dumps(all_items, ensure_ascii=False, indent=2)
    prompt = _build_prompt(budget, purpose, preferences, products_text)
    system = SYSTEM_PROMPT + f"\nCurrent date: 2026. The user is in Vietnam. Use VND currency."

    result_text = await generate(prompt, system)

    result_text = result_text.strip()
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
        result_text = result_text.rsplit("```", 1)[0]
    if result_text.startswith("json"):
        result_text = result_text[4:].strip()

    try:
        recommendations = json.loads(result_text)
    except json.JSONDecodeError:
        raise ValueError(f"Failed to parse AI response: {result_text[:500]}")

    total_price = sum(r["price"] for r in recommendations)
    comp_id_map = {str(c["productId"]): str(c["id"]) for c in components if c.get("productId")}
    validate_ids = [comp_id_map[str(r["product_id"])] for r in recommendations if str(r["product_id"]) in comp_id_map]

    compatibility = await validate_build(validate_ids) if validate_ids else {"compatible": True, "issues": []}

    return {
        "recommended_components": recommendations,
        "total_price": total_price,
        "explanation": f"Recommended build for {purpose} within {budget:,.0f} VND budget.",
        "compatibility": compatibility,
    }
