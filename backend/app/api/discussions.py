from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional
from app.core.security import get_current_user, require_auth
from app.core.database import supabase_get, supabase_post, supabase_patch, supabase_delete
from app.services.embedding_service import get_embedding
from app.models.thread import ThreadCreate, ReplyCreate, VotePayload

router = APIRouter(prefix="/threads", tags=["threads"])


# List threads with filters and sorting
@router.get("")
def list_threads(
    category: Optional[str] = Query(None),
    sort: str = Query("recent", description="recent, popular, unresolved"),
    q: Optional[str] = Query(None)
):
    params = {"select": "*,users(email,role),categories(name,slug)"}

    if category:
        categories = supabase_get("categories", {"slug": f"eq.{category}"})
        if categories:
            params["category_id"] = f"eq.{categories[0]['id']}"

    if sort == "popular":
        params["order"] = "upvotes.desc"
    elif sort == "unresolved":
        params["status"] = "eq.unresolved"
        params["order"] = "created_at.desc"
    else:
        params["order"] = "created_at.desc"

    if q:
        params["title"] = f"ilike.*{q}*"

    threads = supabase_get("threads", params)

    formatted_threads = []
    for t in threads:
        user_info = t.get("users") or {}
        cat_info = t.get("categories") or {}
        formatted_threads.append({
            "id": t["id"],
            "title": t["title"],
            "content": t["content"],
            "status": t["status"],
            "upvotes": t["upvotes"],
            "created_at": t["created_at"],
            "updated_at": t["updated_at"],
            "user_id": t["user_id"],
            "user_email": user_info.get("email"),
            "user_role": user_info.get("role"),
            "category_id": t["category_id"],
            "category_name": cat_info.get("name"),
            "category_slug": cat_info.get("slug")
        })

    return formatted_threads


# Fetch a single thread and all its replies
@router.get("/{id}")
def get_thread(id: str):
    threads = supabase_get("threads", {
        "id": f"eq.{id}",
        "select": "*,users(email,role),categories(name)"
    })

    if not threads:
        raise HTTPException(status_code=404, detail="Thread not found")

    thread = threads[0]

    replies = supabase_get("replies", {
        "thread_id": f"eq.{id}",
        "select": "*,users(email,role)",
        "order": "created_at.asc"
    })

    formatted_replies = []
    for r in replies:
        user_info = r.get("users") or {}
        formatted_replies.append({
            "id": r["id"],
            "thread_id": r["thread_id"],
            "user_id": r["user_id"],
            "user_email": user_info.get("email"),
            "user_role": user_info.get("role"),
            "content": r["content"],
            "upvotes": r["upvotes"],
            "is_accepted": r["is_accepted"],
            "is_verified_mentor": r["is_verified_mentor"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"]
        })

    user_info = thread.get("users") or {}
    cat_info = thread.get("categories") or {}

    return {
        "id": thread["id"],
        "title": thread["title"],
        "content": thread["content"],
        "status": thread["status"],
        "upvotes": thread["upvotes"],
        "created_at": thread["created_at"],
        "updated_at": thread["updated_at"],
        "user_id": thread["user_id"],
        "user_email": user_info.get("email"),
        "user_role": user_info.get("role"),
        "category_id": thread["category_id"],
        "category_name": cat_info.get("name"),
        "replies": formatted_replies
    }


# Create a new thread
@router.post("")
def create_thread(payload: ThreadCreate, user: dict = Depends(require_auth)):
    thread_data = {
        "user_id": user["id"],
        "category_id": payload.category_id,
        "title": payload.title,
        "content": payload.content,
        "status": "unresolved",
        "upvotes": 0
    }

    try:
        inserted = supabase_post("threads", thread_data)
        if not inserted:
            raise HTTPException(status_code=500, detail="Failed to create thread record")

        thread_id = inserted[0]["id"]

        # Generate Thread Embedding (best-effort — don't fail thread creation if this fails)
        try:
            combined_text = f"{payload.title} \n {payload.content}"
            embedding = get_embedding(combined_text)
            supabase_post("thread_embeddings", {
                "thread_id": thread_id,
                "embedding": embedding
            })
        except Exception as emb_err:
            print("Embedding generation skipped (likely missing API key):", emb_err)

        # Auto-generate AI RAG response (best-effort)
        try:
            from app.services.rag_service import query_rag
            rag_res = query_rag(payload.title + " " + payload.content)

            ai_text = None
            if rag_res.get("ai_answer"):
                ai_text = rag_res["ai_answer"]
            elif rag_res.get("faq_matches"):
                top_faq = rag_res["faq_matches"][0]
                ai_text = (
                    f"Hi! I searched our official guidelines and found this related topic:\n\n"
                    f"**{top_faq['question']}**\n{top_faq['answer']}\n\n"
                    f"*If this does not answer your question, click the 'Escalate to Staff' button "
                    f"in the sidebar to summon a human mentor.*"
                )

            if ai_text:
                supabase_post("replies", {
                    "thread_id": thread_id,
                    "user_id": None,
                    "content": ai_text,
                    "upvotes": 0,
                    "is_accepted": False,
                    "is_verified_mentor": False
                })
        except Exception as ae:
            print("Failed to auto-generate thread reply:", ae)

        return inserted[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Reply to a thread
@router.post("/{id}/replies")
def reply_to_thread(id: str, payload: ReplyCreate, user: dict = Depends(require_auth)):
    threads = supabase_get("threads", {"id": f"eq.{id}"})
    if not threads:
        raise HTTPException(status_code=404, detail="Thread not found")

    is_mentor = user["role"] in ["Mentor", "Admin"]

    reply_data = {
        "thread_id": id,
        "user_id": user["id"],
        "content": payload.content,
        "upvotes": 0,
        "is_accepted": False,
        "is_verified_mentor": is_mentor
    }

    try:
        inserted = supabase_post("replies", reply_data)

        if is_mentor:
            current_points = user.get("reputation_points", 0)
            supabase_patch("users", {"id": f"eq.{user['id']}"}, {
                "reputation_points": current_points + 25
            })

        return inserted[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Vote on a thread or reply
@router.post("/vote")
def vote_item(payload: VotePayload, user: dict = Depends(require_auth)):
    vote_data = {
        "user_id": user["id"],
        "item_id": payload.item_id,
        "item_type": payload.item_type,
        "vote_value": payload.vote_value
    }

    try:
        existing = supabase_get("votes", {
            "user_id": f"eq.{user['id']}",
            "item_id": f"eq.{payload.item_id}",
            "item_type": f"eq.{payload.item_type}"
        })

        if existing:
            old_vote = existing[0]
            if old_vote["vote_value"] == payload.vote_value:
                supabase_delete("votes", {"id": f"eq.{old_vote['id']}"})
                diff = -payload.vote_value
            else:
                supabase_patch("votes", {"id": f"eq.{old_vote['id']}"}, {"vote_value": payload.vote_value})
                diff = payload.vote_value * 2
        else:
            supabase_post("votes", vote_data)
            diff = payload.vote_value

        # Update upvote count on target item
        target_table = "threads" if payload.item_type == "thread" else "replies"
        target_item = supabase_get(target_table, {"id": f"eq.{payload.item_id}"})

        new_upvotes = 0  # safe default — fixes potential NameError if target_item is empty
        if target_item:
            current_upvotes = target_item[0]["upvotes"]
            new_upvotes = current_upvotes + diff
            supabase_patch(target_table, {"id": f"eq.{payload.item_id}"}, {"upvotes": new_upvotes})

            # Update author reputation
            author_id = target_item[0]["user_id"]
            if author_id:
                author = supabase_get("users", {"id": f"eq.{author_id}"})
                if author:
                    points_diff = diff * 5
                    new_points = max(0, author[0].get("reputation_points", 0) + points_diff)

                    new_role = author[0]["role"]
                    if new_points >= 100 and author[0]["role"] == "Student":
                        new_role = "Trusted Contributor"
                    elif new_points < 100 and author[0]["role"] == "Trusted Contributor":
                        new_role = "Student"

                    supabase_patch("users", {"id": f"eq.{author_id}"}, {
                        "reputation_points": new_points,
                        "role": new_role
                    })

        return {"status": "success", "new_upvotes": new_upvotes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Accept a reply
@router.post("/{id}/accept-reply")
def accept_reply(id: str, reply_id: str = Query(...), user: dict = Depends(require_auth)):
    threads = supabase_get("threads", {"id": f"eq.{id}"})
    if not threads:
        raise HTTPException(status_code=404, detail="Thread not found")

    thread = threads[0]

    if thread["user_id"] != user["id"] and user["role"] not in ["Mentor", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to accept answer")

    try:
        replies = supabase_get("replies", {"thread_id": f"eq.{id}"})
        for r in replies:
            if r["is_accepted"]:
                supabase_patch("replies", {"id": f"eq.{r['id']}"}, {"is_accepted": False})
                author_id = r["user_id"]
                if author_id:
                    auth_profile = supabase_get("users", {"id": f"eq.{author_id}"})
                    if auth_profile:
                        new_pts = max(0, auth_profile[0].get("reputation_points", 0) - 15)
                        supabase_patch("users", {"id": f"eq.{author_id}"}, {"reputation_points": new_pts})

        supabase_patch("replies", {"id": f"eq.{reply_id}"}, {"is_accepted": True})

        target_replies = supabase_get("replies", {"id": f"eq.{reply_id}"})
        if target_replies:
            helper_id = target_replies[0]["user_id"]
            if helper_id:
                helper_profile = supabase_get("users", {"id": f"eq.{helper_id}"})
                if helper_profile:
                    new_pts = helper_profile[0].get("reputation_points", 0) + 15
                    new_role = helper_profile[0]["role"]
                    if new_pts >= 100 and helper_profile[0]["role"] == "Student":
                        new_role = "Trusted Contributor"
                    supabase_patch("users", {"id": f"eq.{helper_id}"}, {
                        "reputation_points": new_pts,
                        "role": new_role
                    })

        supabase_patch("threads", {"id": f"eq.{id}"}, {"status": "resolved"})

        return {"status": "success", "message": "Reply accepted and thread resolved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
