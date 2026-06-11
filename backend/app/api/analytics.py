from fastapi import APIRouter, Depends
from app.core.security import require_role
from app.core.database import supabase_get

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
def get_analytics(user: dict = Depends(require_role(["Mentor", "Admin"]))):
    try:
        # Supabase REST uses Range header for pagination — use order + select,
        # and cap via the PostgREST range header by passing limit as a param key
        all_analytics = supabase_get("analytics", {"select": "*", "order": "created_at.desc", "limit": "1000"})

        searches = [a for a in all_analytics if a["event_type"] == "search_query"]
        ai_queries = [a for a in all_analytics if a["event_type"] == "ai_answering"]

        total_searches = len(searches)

        search_similarities = [
            s.get("confidence_score") for s in searches
            if s.get("confidence_score") is not None
        ]
        avg_search_similarity = (
            sum(search_similarities) / len(search_similarities)
            if search_similarities else 0.0
        )

        failed_searches_count = len([s for s in search_similarities if s < 0.5])

        total_ai_queries = len(ai_queries)
        high_conf_answers = len([
            a for a in ai_queries
            if (a.get("metadata") or {}).get("confidence") == "high"
        ])
        deflected_queries = high_conf_answers

        threads = supabase_get("threads", {"select": "id,status"})
        total_threads = len(threads)
        resolved_threads = len([t for t in threads if t["status"] == "resolved"])
        escalated_threads = len([t for t in threads if t["status"] == "escalated"])
        unresolved_threads = len([t for t in threads if t["status"] == "unresolved"])

        escalations = supabase_get("escalations", {"select": "id,status"})
        total_escalations = len(escalations)
        pending_escalations = len([e for e in escalations if e["status"] == "pending"])

        users = supabase_get("users", {"select": "id,role"})
        total_users = len(users)
        mentors_admins = len([u for u in users if u["role"] in ["Mentor", "Admin"]])

        search_terms: dict = {}
        for s in searches:
            query = s.get("query_text")
            if query:
                query_clean = query.strip().lower()
                search_terms[query_clean] = search_terms.get(query_clean, 0) + 1

        top_queries = sorted(
            [{"query": k, "count": v} for k, v in search_terms.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:5]

        return {
            "total_searches": total_searches,
            "avg_search_similarity": round(avg_search_similarity, 3),
            "failed_searches_count": failed_searches_count,
            "total_ai_queries": total_ai_queries,
            "deflected_queries": deflected_queries,
            "total_threads": total_threads,
            "resolved_threads": resolved_threads,
            "escalated_threads": escalated_threads,
            "unresolved_threads": unresolved_threads,
            "total_escalations": total_escalations,
            "pending_escalations": pending_escalations,
            "total_users": total_users,
            "mentors_count": mentors_admins,
            "top_queries": top_queries
        }

    except Exception as e:
        print(f"Error compiling analytics: {e}")
        # Return zero-state fallback so the dashboard never breaks
        return {
            "total_searches": 0,
            "avg_search_similarity": 0.0,
            "failed_searches_count": 0,
            "total_ai_queries": 0,
            "deflected_queries": 0,
            "total_threads": 0,
            "resolved_threads": 0,
            "escalated_threads": 0,
            "unresolved_threads": 0,
            "total_escalations": 0,
            "pending_escalations": 0,
            "total_users": 0,
            "mentors_count": 0,
            "top_queries": []
        }
