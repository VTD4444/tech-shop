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
PC_COMPONENT_TYPES = {"CPU", "MAINBOARD", "RAM", "VGA", "STORAGE", "PSU", "CASE", "COOLER"}
MIN_BUDGET_VND = 5_000_000

SYSTEM_PROMPT = """You are a professional product advisor for a Vietnamese tech shop (TechShop).
Recommend products from the provided catalog only — including PC components, laptops,
peripherals (headphones, keyboards, mice, monitors), and other listed items.
Use product_id values exactly as listed. Stay within budget when possible.
Match recommendations to the user's purpose and preferences.
If the budget is too low for a useful recommendation, return an empty recommended_components array
and explain why in summary.
Return JSON matching the required schema only.
For component_type, use the catalog value (e.g. CPU, RAM, laptop, headphone) as provided."""


def _ai_headers() -> dict[str, str]:
    key = (settings.ai_internal_api_key or "").strip()
    if not key:
        return {}
    return {"X-AI-Internal-Key": key}


def _compact_catalog(all_items: list[dict]) -> str:
    compact = [
        {
            "id": item["id"],
            "name": item["name"],
            "slug": item["slug"],
            "price": item["price"],
            "component_type": item["component_type"],
            "category": item.get("category"),
            "brand": item.get("brand"),
        }
        for item in all_items
    ]
    return json.dumps(compact, ensure_ascii=False, separators=(",", ":"))


def _build_prompt(budget: float, purpose: str, preferences: list[str], products_text: str) -> str:
    purpose_guide = {
        "gaming": "Prioritize gaming PC parts or gaming laptop/peripherals as needed.",
        "work": "Prioritize office laptop or reliable work PC parts; quiet peripherals OK.",
        "graphics": "Prioritize high VRAM GPU / creative laptop / color-accurate monitor.",
        "development": "Prioritize multi-core CPU / laptop with enough RAM and fast SSD.",
        "general": "Balanced value picks across relevant product types.",
    }

    return f"""Budget: {budget:,.0f} VND
Purpose: {purpose}
Guide: {purpose_guide.get(purpose, "Balanced recommendations")}
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


def _rule_based_pc_build(all_items: list[dict], budget: float, purpose: str) -> list[dict]:
    splits = BUDGET_SPLITS.get(purpose, DEFAULT_SPLIT)
    types_needed = ["CPU", "MAINBOARD", "RAM", "STORAGE", "PSU", "CASE"]
    if purpose in ("gaming", "graphics", "general"):
        types_needed.insert(3, "VGA")
    if purpose != "work":
        types_needed.append("COOLER")

    by_type: dict[str, list[dict]] = {}
    for item in all_items:
        ctype = item["component_type"]
        if ctype in PC_COMPONENT_TYPES:
            by_type.setdefault(ctype, []).append(item)

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


def _rule_based_general(all_items: list[dict], budget: float, purpose: str) -> list[dict]:
    """Fallback when catalog has few/no PC parts: pick affordable items by category."""
    affordable = [i for i in all_items if i["price"] <= budget]
    pool = affordable or sorted(all_items, key=lambda i: i["price"])
    by_type: dict[str, list[dict]] = {}
    for item in pool:
        by_type.setdefault(item["component_type"], []).append(item)

    recommendations: list[dict] = []
    remaining = budget
    for component_type, candidates in by_type.items():
        if remaining <= 0:
            break
        picked = _pick_for_budget(candidates, remaining * 0.4)
        if picked["price"] > remaining * 1.1 and recommendations:
            continue
        recommendations.append({
            "component_type": component_type,
            "product_id": picked["id"],
            "product_name": picked["name"],
            "slug": picked["slug"],
            "price": picked["price"],
            "explanation": f"Rule-based pick for {purpose} within budget.",
        })
        remaining -= picked["price"]
        if len(recommendations) >= 8:
            break
    return recommendations


def _rule_based_recommend(all_items: list[dict], budget: float, purpose: str) -> list[dict]:
    pc_recs = _rule_based_pc_build(all_items, budget, purpose)
    if pc_recs:
        return pc_recs
    return _rule_based_general(all_items, budget, purpose)


async def _fetch_ai_catalog(client: httpx.AsyncClient) -> list[dict]:
    """Load compact active catalog from NestJS internal AI endpoint."""
    resp = await client.get(
        f"{settings.backend_api_url}/internal/ai/catalog",
        headers=_ai_headers(),
        timeout=20.0,
    )
    resp.raise_for_status()
    payload = resp.json()
    return payload.get("data") or []


def _map_catalog_items(rows: list[dict]) -> list[dict]:
    items: list[dict] = []
    for row in rows:
        component_type = row.get("componentType") or row.get("category") or "PRODUCT"
        items.append({
            "id": str(row["id"]),
            "name": row["name"],
            "slug": row.get("slug") or "",
            "price": float(row["price"]),
            "component_type": str(component_type),
            "category": row.get("category"),
            "brand": row.get("brand"),
            "pc_component_id": (
                str(row["pcComponentId"]) if row.get("pcComponentId") is not None else None
            ),
            "is_pc_component": bool(row.get("componentType")),
        })
    return items


async def recommend_components(budget: float, purpose: str, preferences: list[str]) -> dict:
    async with httpx.AsyncClient() as client:
        catalog_rows = await _fetch_ai_catalog(client)

    all_items = _map_catalog_items(catalog_rows)

    if not all_items:
        raise ValueError("No products found in catalog.")

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
            raise ValueError("No products in catalog for recommendations.") from exc
    except ValueError as exc:
        if str(exc) == "Gemini returned text instead of JSON.":
            raise ValueError(f"Failed to parse AI response: {result_text[:500]}") from exc
        raise

    if budget < MIN_BUDGET_VND and not recommendations and not ai_summary:
        ai_summary = (
            f"Budget {budget:,.0f} VND may be too low for a full PC build. "
            f"Try at least {MIN_BUDGET_VND:,.0f} VND, or ask for a laptop/peripheral instead."
        )

    total_price = sum(float(r.get("price") or 0) for r in recommendations)
    by_product_id = {item["id"]: item for item in all_items}
    validate_ids = [
        by_product_id[str(r["product_id"])]["pc_component_id"]
        for r in recommendations
        if str(r.get("product_id")) in by_product_id
        and by_product_id[str(r["product_id"])].get("pc_component_id")
    ]

    compatibility = await validate_build(validate_ids) if validate_ids else {"compatible": True, "issues": []}

    explanation = ai_summary or f"Recommended {purpose} picks within {budget:,.0f} VND budget."
    if fallback_used:
        explanation = (
            f"{fallback_reason} Showing rule-based {purpose} picks within {budget:,.0f} VND instead."
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
