from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ThreadCreate(BaseModel):
    title: str
    content: str
    category_id: str
    tags: Optional[List[str]] = []

class ThreadResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    title: str
    content: str
    status: str
    upvotes: int
    tags: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime

class ReplyCreate(BaseModel):
    content: str

class ReplyResponse(BaseModel):
    id: str
    thread_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    content: str
    upvotes: int
    is_accepted: bool
    is_verified_mentor: bool
    created_at: datetime
    updated_at: datetime

class VotePayload(BaseModel):
    item_id: str
    item_type: str # 'thread' or 'reply'
    vote_value: int # 1 or -1

class EscalationResponse(BaseModel):
    id: str
    thread_id: str
    thread_title: Optional[str] = None
    priority_score: int
    status: str
    reason: str
    assigned_admin_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
