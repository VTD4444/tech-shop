from pydantic import BaseModel
from typing import Optional

class ComponentRecommendation(BaseModel):
    component_type: str
    product_name: str
    product_id: str
    slug: str
    price: float
    image_url: Optional[str] = None
    explanation: str
    specs: dict = {}

class RecommendResponse(BaseModel):
    recommended_components: list[ComponentRecommendation]
    total_price: float
    explanation: str

class ChatResponse(BaseModel):
    reply: str
    suggested_products: list[dict] = []
