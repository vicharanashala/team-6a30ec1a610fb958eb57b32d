import requests
from fastapi import Header, HTTPException, Depends
from app.core.config import settings


def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        # No login UI exists yet — treat everyone as a guest by default
        return {"id": None, "email": "guest@samagama.ai", "role": "Student", "reputation_points": 0}

    token = authorization.split(" ")[1]
    url = f"{settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {token}"
    }

    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            supabase_user = r.json()
            user_id = supabase_user["id"]
            email = supabase_user["email"]

            from app.core.database import supabase_get, supabase_post
            users = supabase_get("users", {"id": f"eq.{user_id}"})
            if users:
                return users[0]
            else:
                new_user = supabase_post("users", {
                    "id": user_id,
                    "email": email,
                    "role": "Student",
                    "reputation_points": 0
                })
                return new_user[0]
        else:
            # Invalid/expired token — fall back to guest instead of erroring out
            return {"id": None, "email": "guest@samagama.ai", "role": "Student", "reputation_points": 0}
    except Exception as e:
        print(f"Auth verification exception: {e}")
        return {"id": None, "email": "guest@samagama.ai", "role": "Student", "reputation_points": 0}


def require_auth(user: dict = Depends(get_current_user)) -> dict:
    # Auth is not enforced — no login UI exists, so guests are allowed
    # everywhere. Endpoints that need a user_id should handle `id: None`.
    return user


def require_role(allowed_roles: list):
    def dependency(user: dict = Depends(get_current_user)) -> dict:
        # Role checks disabled — everyone (including guests) has access.
        # Roles are kept as display/labels only.
        return user
    return dependency
