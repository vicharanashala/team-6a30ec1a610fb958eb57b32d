from fastapi import APIRouter, Depends
from app.core.security import get_current_user, require_auth
from app.models.user import UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/profile", response_model=UserProfile)
def get_profile(user: dict = Depends(require_auth)):
    return UserProfile(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        reputation_points=user.get("reputation_points", 0),
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )

@router.post("/sync")
def sync_profile(user: dict = Depends(require_auth)):
    return {"status": "success", "user": user}
