from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FAQBase(BaseModel):
    original_id: Optional[str] = None
    category_id: Optional[str] = None
    question: str
    answer: str
    is_official: Optional[bool] = True

class FAQCreate(FAQBase):
    pass

class FAQResponse(FAQBase):
    id: str
    created_at: datetime
    updated_at: datetime

class FAQSearchQuery(BaseModel):
    query: str
    category_slug: Optional[str] = None

class FAQSearchResult(BaseModel):
    id: str
    original_id: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    question: str
    answer: str
    similarity: float
