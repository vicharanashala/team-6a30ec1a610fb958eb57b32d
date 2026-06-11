from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserSync(BaseModel):
    id: str # UUID from Supabase Auth
    email: str
    role: Optional[str] = "Student"

class UserProfile(BaseModel):
    id: str
    email: str
    role: str
    reputation_points: int
    created_at: datetime
    updated_at: datetime
