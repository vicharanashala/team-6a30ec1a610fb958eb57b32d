import requests
from app.core.config import settings

HEADERS = {
    "apikey": settings.SUPABASE_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def supabase_get(table: str, query_params: dict = None) -> list:
    url = f"{settings.SUPABASE_URL}/rest/v1/{table}"
    # Default to all columns if not specified
    params = {"select": "*"}
    if query_params:
        params.update(query_params)
        
    r = requests.get(url, headers=HEADERS, params=params)
    if r.status_code == 200:
        return r.json()
    else:
        raise Exception(f"Supabase GET /{table} failed ({r.status_code}): {r.text}")

def supabase_post(table: str, json_data: dict) -> list:
    url = f"{settings.SUPABASE_URL}/rest/v1/{table}"
    r = requests.post(url, headers=HEADERS, json=json_data)
    if r.status_code in [200, 201]:
        return r.json()
    else:
        raise Exception(f"Supabase POST /{table} failed ({r.status_code}): {r.text}")

def supabase_patch(table: str, filters: dict, json_data: dict) -> list:
    url = f"{settings.SUPABASE_URL}/rest/v1/{table}"
    r = requests.patch(url, headers=HEADERS, params=filters, json=json_data)
    if r.status_code in [200, 204]:
        return r.json() if r.text else []
    else:
        raise Exception(f"Supabase PATCH /{table} failed ({r.status_code}): {r.text}")

def supabase_delete(table: str, filters: dict) -> list:
    url = f"{settings.SUPABASE_URL}/rest/v1/{table}"
    r = requests.delete(url, headers=HEADERS, params=filters)
    if r.status_code in [200, 204]:
        return r.json() if r.text else []
    else:
        raise Exception(f"Supabase DELETE /{table} failed ({r.status_code}): {r.text}")

def supabase_rpc(func_name: str, json_data: dict) -> list:
    url = f"{settings.SUPABASE_URL}/rest/v1/rpc/{func_name}"
    r = requests.post(url, headers=HEADERS, json=json_data)
    if r.status_code in [200, 201]:
        return r.json()
    else:
        raise Exception(f"Supabase RPC {func_name} failed ({r.status_code}): {r.text}")
