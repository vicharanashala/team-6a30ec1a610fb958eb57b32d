from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.core.security import require_auth, require_role
from app.core.database import supabase_get, supabase_post, supabase_patch, supabase_delete
from app.services.embedding_service import get_embedding

router = APIRouter(prefix="/escalations", tags=["escalations"])

# Get escalation queue (restricted to Mentor or Admin roles)
@router.get("")
def list_escalations(
    status: str = Query("pending", description="pending, reviewing, resolved"),
    user: dict = Depends(require_role(["Mentor", "Admin"]))
):
    params = {
        "status": f"eq.{status}",
        "select": "*,threads(title,content,user_id,users(email))",
        "order": "priority_score.desc,created_at.asc"
    }
    
    escalations = supabase_get("escalations", params)
    
    formatted = []
    for esc in escalations:
        thread_info = esc.get("threads") or {}
        user_info = thread_info.get("users") or {}
        formatted.append({
            "id": esc["id"],
            "thread_id": esc["thread_id"],
            "thread_title": thread_info.get("title"),
            "thread_content": thread_info.get("content"),
            "thread_author_email": user_info.get("email"),
            "priority_score": esc["priority_score"],
            "status": esc["status"],
            "reason": esc["reason"],
            "assigned_admin_id": esc["assigned_admin_id"],
            "created_at": esc["created_at"],
            "updated_at": esc["updated_at"]
        })
        
    return formatted

# Escalate a thread (Student or Trusted Contributor)
@router.post("")
def create_escalation(
    thread_id: str = Body(..., embed=True),
    reason: str = Body(..., embed=True),
    user: dict = Depends(require_auth)
):
    # Check if thread exists
    threads = supabase_get("threads", {"id": f"eq.{thread_id}"})
    if not threads:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    # Check if thread is already escalated
    existing = supabase_get("escalations", {"thread_id": f"eq.{thread_id}", "status": "neq.resolved"})
    if existing:
        return {"status": "already_escalated", "escalation": existing[0]}
        
    # Calculate a simple priority score based on upvotes or user role
    priority = 10
    if user["role"] == "Trusted Contributor":
        priority = 30
    elif user["role"] in ["Mentor", "Admin"]:
        priority = 50
        
    # If thread has upvotes, add to priority
    upvotes = threads[0].get("upvotes", 0)
    priority += min(50, upvotes * 5)
    
    esc_data = {
        "thread_id": thread_id,
        "priority_score": priority,
        "status": "pending",
        "reason": reason
    }
    
    try:
        inserted = supabase_post("escalations", esc_data)
        # Update thread status to 'escalated'
        supabase_patch("threads", {"id": f"eq.{thread_id}"}, {"status": "escalated"})
        
        # Log analytics event
        try:
            supabase_post("analytics", {
                "event_type": "escalation_triggered",
                "query_text": threads[0]["title"],
                "metadata": {"thread_id": thread_id, "reason": reason, "priority_score": priority}
            })
        except Exception:
            pass
            
        return inserted[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Assign or resolve an escalation
@router.post("/{id}/resolve")
def resolve_escalation(
    id: str,
    resolution_status: str = Body("resolved", description="reviewing, resolved", embed=True),
    convert_to_faq: bool = Body(False, embed=True),
    faq_category_slug: str = Body("general", embed=True),
    user: dict = Depends(require_role(["Mentor", "Admin"]))
):
    escalations = supabase_get("escalations", {"id": f"eq.{id}"})
    if not escalations:
        raise HTTPException(status_code=404, detail="Escalation record not found")
        
    esc = escalations[0]
    thread_id = esc["thread_id"]
    
    update_data = {
        "status": resolution_status,
        "assigned_admin_id": user["id"]
    }
    
    try:
        supabase_patch("escalations", {"id": f"eq.{id}"}, update_data)
        
        if resolution_status == "resolved":
            # Set thread back to resolved status
            supabase_patch("threads", {"id": f"eq.{thread_id}"}, {"status": "resolved"})
            
            # If convert_to_faq is requested, generate a new FAQ entry from the thread
            if convert_to_faq:
                thread = supabase_get("threads", {"id": f"eq.{thread_id}"})[0]
                # Get the accepted reply or the highest upvoted reply
                replies = supabase_get("replies", {"thread_id": f"eq.{thread_id}"})
                best_answer = "Please refer to the discussion thread for details."
                
                accepted = [r for r in replies if r["is_accepted"]]
                if accepted:
                    best_answer = accepted[0]["content"]
                elif replies:
                    sorted_replies = sorted(replies, key=lambda x: x["upvotes"], reverse=True)
                    best_answer = sorted_replies[0]["content"]
                    
                # Create the FAQ
                categories = supabase_get("categories", {"slug": f"eq.{faq_category_slug}"})
                category_id = categories[0]["id"] if categories else None
                
                faq_data = {
                    "question": thread["title"],
                    "answer": best_answer,
                    "category_id": category_id,
                    "is_official": True
                }
                
                faq_inserted = supabase_post("faqs", faq_data)[0]
                
                # Generate embedding
                faq_embedding = get_embedding(thread["title"])
                supabase_post("faq_embeddings", {
                    "faq_id": faq_inserted["id"],
                    "embedding": faq_embedding
                })
                
                # Log knowledge base promotion
                supabase_post("knowledge_base", {
                    "faq_id": faq_inserted["id"],
                    "thread_id": thread_id,
                    "title": thread["title"],
                    "content": best_answer,
                    "approved_by": user["id"]
                })
                
        return {"status": "success", "message": f"Escalation status updated to {resolution_status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
