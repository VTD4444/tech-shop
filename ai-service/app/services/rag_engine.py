import json
import httpx
from app.core.config import settings
from app.services.llm_client import RECOMMENDATION_JSON_SCHEMA, generate, LlmError
from app.services.validator_client import validate_build

BUDGET_SPLITS: dict[str, dict[str, float]] = {
    "gaming": {"CPU": 0.15, "MAINBOARD": 0.12, "RAM": 0.08, "VGA": 0.35, "STORAGE": 0.10, "PSU": 0.08, "CASE": 0.07, "COOLER": 0.05},
    "work": {"CPU": 0.25, "MAINBOARD": 0.15, "RAM": 0.15, "STORAGE": 0.20, "PSU": 0.10, "CASE": 0.10, "COOLER": 0.05},
    "graphics": {"CPU": 0.12, "MAINBOARD": 0.10, "RAM": 0.12, "VGA": 0.40, "STORAGE": 0.12, "PSU": 0.08, "CASE": 0.04, "COOLER": 0.02},
    "development": {"CPU": 0.22, "MAINBOARD": 0.12, "RAM": 0.18, "STORAGE": 0.18, "PSU": 0.10, "CASE": 0.10, "COOLER": 0.10},
    "general": {"CPU": 0.18, "MAINBOARD": 0.12, "RAM": 0.10, "VGA": 0.22, "STORAGE": 0.15, "PSU": 0.10, "CASE": 0.08, "COOLER": 0.05},
}

DEFAULT_SPLIT = {"CPU": 0.20, "MAINBOARD": 0.15, "RAM": 0.10, "STORAGE": 0.15, "PSU": 0.10, "CASE": 0.10, "COOLER": 0.05, "VGA": 0.15}
MIN_BUDGET_VND = 5_000_000

SYSTEM_PROMPT = """You are a professional PC builder advisor for a Vietnamese tech shop.
Recommend compatible PC components from the provided catalog only.
Use product_id values exactly as listed. Stay within budget when possible.
If the budget is too low for a full build, return an empty recommended_components array
and explain why in summary.
Return JSON matching the required schema only."""

def _compact_catalog(all_items: list[dict]) -> str:
    compact = [
        {
            "id": item["id"],
            "name": item["name"],
            "slug": item["slug"],
            "price": item["price"],
            "component_type": item["component_type"],
        }
        for item in all_items
    ]
    return json.dumps(compact, ensure_ascii=False, separators=(",", ":"))

def _build_prompt(budget: float, purpose: str, preferences: list[str], products_text: str) -> str:
    purpose_guide = {
        "gaming": "Prioritize GPU, fast CPU, 16-32GB RAM.",
        "work": "Prioritize CPU with iGPU if possible, 16GB RAM, reliable SSD.",
        "graphics": "Prioritize high VRAM GPU, 32GB+ RAM.",
        "development": "Prioritize multi-core CPU, 32GB+ RAM, fast SSD.",
        "general": "Balanced value build.",
    }

    return f"""Budget: {budget:,.0f} VND
Purpose: {purpose}
Guide: {purpose_guide.get(purpose, "Balanced build")}
Preferences: {", ".join(preferences) if preferences else "None"}

Catalog (use these product ids only):
{products_text}"""

def _clean_json_response(result_text: str) -> str:
    result_text = result_text.strip()
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
        result_text = result_text.rsplit("```", 1)[0]
    if result_text.startswith("json"):
        result_text = result_text[4:].strip()
    return result_text

def _parse_recommendations(result_text: str) -> tuple[list[dict], str]:
    cleaned = _clean_json_response(result_text)
    summary = ""

    for payload in _json_candidates(cleaned):
        if isinstance(payload, list):
            return payload, summary
        if isinstance(payload, dict):
            summary = str(payload.get("summary") or payload.get("explanation") or "")
            items = payload.get("recommended_components") or payload.get("components") or []
            if isinstance(items, list):
                return items, summary

    raise ValueError("Gemini returned text instead of JSON.")

def _json_candidates(cleaned: str):
    try:
        yield json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end > start:
        try:
            yield json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError:
            pass

    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start != -1 and end > start:
        try:
            yield json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError:
            pass

def _pick_for_budget(candidates: list[dict], target_price: float) -> dict:
    affordable = [c for c in candidates if c["price"] <= target_price * 1.25]
    pool = affordable or candidates
    return min(pool, key=lambda item: abs(item["price"] - target_price))

def _rule_based_recommend(all_items: list[dict], budget: float, purpose: str) -> list[dict]:
    splits = BUDGET_SPLITS.get(purpose, DEFAULT_SPLIT)
    types_needed = ["CPU", "MAINBOARD", "RAM", "STORAGE", "PSU", "CASE"]
    if purpose in ("gaming", "graphics", "general"):
        types_needed.insert(3, "VGA")
    if purpose != "work":
        types_needed.append("COOLER")

    by_type: dict[str, list[dict]] = {}
    for item in all_items:
        by_type.setdefault(item["component_type"], []).append(item)

    recommendations: list[dict] = []
    for component_type in types_needed:
        candidates = by_type.get(component_type, [])
        if not candidates:
            continue
        target = budget * splits.get(component_type, 0.1)
        picked = _pick_for_budget(candidates, target)
        recommendations.append({
            "component_type": component_type,
            "product_id": picked["id"],
            "product_name": picked["name"],
            "slug": picked["slug"],
            "price": picked["price"],
            "explanation": f"Rule-based pick for {purpose} within budget.",
        })
    return recommendations

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
    for p in products_data:
        comp = next((c for c in components if str(c["productId"]) == str(p["id"])), None)
        if comp and comp.get("componentType"):
            all_items.append({
                "id": str(p["id"]),
                "name": p["name"],
                "slug": p["slug"],
                "price": float(p["price"]),
                "component_type": comp["componentType"],
            })

    if not all_items:
        raise ValueError("No PC components found in catalog.")

    products_text = _compact_catalog(all_items)
    prompt = _build_prompt(budget, purpose, preferences, products_text)
    system = SYSTEM_PROMPT + "\nCurrent date: 2026. User is in Vietnam. Prices are VND."

    source = "gemini"
    fallback_used = False
    fallback_reason = ""
    ai_summary = ""
    result_text = ""

    try:
        result_text = await generate(
            prompt,
            system,
            json_mode=True,
            json_schema=RECOMMENDATION_JSON_SCHEMA,
        )
        recommendations, ai_summary = _parse_recommendations(result_text)
    except LlmError as exc:
        if exc.status_code not in (429, 503):
            raise
        recommendations = _rule_based_recommend(all_items, budget, purpose)
        source = "rule_based"
        fallback_used = True
        fallback_reason = exc.message
        ai_summary = fallback_reason
        if not recommendations:
            raise ValueError("No PC components in catalog for recommendations.") from exc
    except ValueError as exc:
        if str(exc) == "Gemini returned text instead of JSON.":
            raise ValueError(f"Failed to parse AI response: {result_text[:500]}") from exc
        raise

    if budget < MIN_BUDGET_VND and not recommendations and not ai_summary:
        ai_summary = (
            f"Budget {budget:,.0f} VND is too low for a PC build. "
            f"Try at least {MIN_BUDGET_VND:,.0f} VND."
        )

    total_price = sum(float(r.get("price") or 0) for r in recommendations)
    comp_id_map = {str(c["productId"]): str(c["id"]) for c in components if c.get("productId")}
    validate_ids = [
        comp_id_map[str(r["product_id"])]
        for r in recommendations
        if str(r.get("product_id")) in comp_id_map
    ]

    compatibility = await validate_build(validate_ids) if validate_ids else {"compatible": True, "issues": []}

    explanation = ai_summary or f"Recommended {purpose} build within {budget:,.0f} VND budget."
    if fallback_used:
        explanation = (
            f"{fallback_reason} Showing rule-based {purpose} build within {budget:,.0f} VND instead."
        )

    return {
        "recommended_components": recommendations,
        "total_price": total_price,
        "explanation": explanation,
        "ai_summary": ai_summary,
        "compatibility": compatibility,
        "source": source,
        "fallback_used": fallback_used,
    }
