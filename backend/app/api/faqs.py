from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.core.database import supabase_get, supabase_rpc
from app.services.embedding_service import get_embedding

router = APIRouter(prefix="/faqs", tags=["faqs"])

@router.get("")
def list_faqs(category: Optional[str] = Query(None, description="Category slug to filter by")):
    if category:
        categories = supabase_get("categories", {"slug": f"eq.{category}"})
        if not categories:
            return []
        category_id = categories[0]["id"]
        return supabase_get("faqs", {"category_id": f"eq.{category_id}", "order": "original_id.asc"})
    
    return supabase_get("faqs", {"order": "original_id.asc"})

@router.get("/categories")
def list_categories():
    return supabase_get("categories")

@router.get("/search")
def search_faqs(q: str = Query(..., min_length=1), category: Optional[str] = Query(None)):
    try:
        # Generate search query embedding
        query_emb = get_embedding(q)
        
        # Invoke vector similarity RPC in Supabase
        params = {
            "query_embedding": query_emb,
            "match_threshold": 0.4,
            "match_count": 8,
            "filter_category_slug": category
        }
        
        results = supabase_rpc("match_faqs", params)
        
        # Also track search analytics
        try:
            from app.core.database import supabase_post
            supabase_post("analytics", {
                "event_type": "search_query",
                "query_text": q,
                "confidence_score": results[0]["similarity"] if results else 0.0,
                "metadata": {"results_count": len(results), "category_filter": category}
            })
        except Exception as ae:
            print("Failed to save search analytics:", ae)
            
        return results
    except Exception as e:
        print(f"Error during semantic search: {e}. Using local string matching fallback...")
        try:
            from app.services.rag_service import local_match_faqs
            return local_match_faqs(q, category)
        except Exception as fe:
            raise HTTPException(status_code=500, detail=f"Database query failure: {str(fe)}")
