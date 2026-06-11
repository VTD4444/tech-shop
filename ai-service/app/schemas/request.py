from pydantic import BaseModel, Field
from typing import Optional

class RecommendRequest(BaseModel):
    budget_total: float = Field(..., description="Total budget in VND")
    purpose: str = Field("gaming", description="gaming|work|graphics|development|general")
    preferences: list[str] = Field(default_factory=list)
    current_cart_ids: Optional[list[str]] = None

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = Field(default_factory=list)
