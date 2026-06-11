import requests
import difflib
from app.core.config import settings
from app.core.database import supabase_rpc, supabase_get
from app.services.embedding_service import get_embedding


def local_match_faqs(query: str, category_slug: str = None) -> list:
    all_faqs = []
    try:
        if category_slug:
            categories = supabase_get("categories", {"slug": f"eq.{category_slug}"})
            if categories:
                all_faqs = supabase_get("faqs", {"category_id": f"eq.{categories[0]['id']}"})
        else:
            all_faqs = supabase_get("faqs")
    except Exception as e:
        print("Failed to fetch FAQs for local match:", e)
        return []

    results = []
    query_lower = query.lower()
    for faq in all_faqs:
        ratio = difflib.SequenceMatcher(None, query_lower, faq["question"].lower()).ratio()

        q_words = set(query_lower.split())
        faq_words = set(faq["question"].lower().split())
        overlap = len(q_words.intersection(faq_words)) / max(1, len(q_words))

        similarity = max(ratio, overlap)

        results.append({
            "id": faq["id"],
            "original_id": faq.get("original_id"),
            "category_name": "FAQ",
            "category_slug": category_slug,
            "question": faq["question"],
            "answer": faq["answer"],
            "similarity": similarity
        })

    results = sorted(results, key=lambda x: x["similarity"], reverse=True)
    return results[:8]


def local_match_threads(query: str, category_slug: str = None) -> list:
    all_threads = []
    try:
        if category_slug:
            categories = supabase_get("categories", {"slug": f"eq.{category_slug}"})
            if categories:
                all_threads = supabase_get("threads", {"category_id": f"eq.{categories[0]['id']}"})
        else:
            all_threads = supabase_get("threads")
    except Exception as e:
        print("Failed to fetch threads for local match:", e)
        return []

    results = []
    query_lower = query.lower()
    for t in all_threads:
        ratio = difflib.SequenceMatcher(None, query_lower, t["title"].lower()).ratio()
        results.append({
            "id": t["id"],
            "title": t["title"],
            "content": t["content"],
            "category_slug": category_slug,
            "similarity": ratio
        })

    results = sorted(results, key=lambda x: x["similarity"], reverse=True)
    return results[:8]


def query_rag(question: str, category_slug: str = None) -> dict:
    faq_matches = []
    thread_matches = []

    # Try vector search first, fall back to string matching
    try:
        query_emb = get_embedding(question)

        faq_matches = supabase_rpc("match_faqs", {
            "query_embedding": query_emb,
            "match_threshold": 0.4,
            "match_count": 5,
            "filter_category_slug": category_slug
        })
        thread_matches = supabase_rpc("match_threads", {
            "query_embedding": query_emb,
            "match_threshold": 0.4,
            "match_count": 5,
            "filter_category_slug": category_slug
        })
    except Exception as e:
        print(f"Vector search failed ({e}), falling back to local string matching...")
        faq_matches = local_match_faqs(question, category_slug)
        thread_matches = local_match_threads(question, category_slug)

    max_faq_similarity = max((item["similarity"] for item in faq_matches), default=0.0)
    max_thread_similarity = max((item["similarity"] for item in thread_matches), default=0.0)
    best_similarity = max(max_faq_similarity, max_thread_similarity)

    if best_similarity >= 0.70:
        confidence = "high"
    elif best_similarity >= 0.40:
        confidence = "medium"
    else:
        confidence = "low"

    ai_answer = None
    if confidence == "high":
        context_parts = []
        for match in faq_matches[:3]:
            context_parts.append(f"FAQ: {match['question']}\nAnswer: {match['answer']}")
        for match in thread_matches[:2]:
            context_parts.append(f"Community Thread: {match['title']}\nContent: {match['content']}")

        context_text = "\n\n".join(context_parts)
        ai_answer = generate_rag_answer(question, context_text)

    return {
        "question": question,
        "confidence": confidence,
        "confidence_score": best_similarity,
        "ai_answer": ai_answer,
        "faq_matches": faq_matches,
        "thread_matches": thread_matches
    }


def generate_rag_answer(question: str, context: str) -> str:
    if not settings.GEMINI_API_KEY:
        # Graceful fallback: extract first FAQ answer from context
        if "Answer: " in context:
            parts = context.split("Answer: ")
            if len(parts) > 1:
                ans_clean = parts[1].split("FAQ:")[0].split("Community Thread:")[0].strip()
                return f"Official Guideline:\n\n{ans_clean}"
        return "I found matching FAQs below that should resolve your doubt."

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    )

    prompt = f"""You are the Vicharanashala (IIT Ropar) Internship Assistant.
Your job is to answer the intern's question using ONLY the provided verified context.

Context:
---
{context}
---

Question: {question}

Instructions:
- Answer the question accurately using ONLY information from the context above.
- If the answer cannot be fully deduced from the context, state: "I cannot find a verified answer to this question in the official FAQ or discussions. Would you like to ask the community?"
- Do NOT assume, speculate, or extrapolate.
- Cite the source (e.g., "[FAQ: What is VINS?]") when answering.
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        r = requests.post(url, json=payload, timeout=15)
        if r.status_code == 200:
            return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        else:
            print(f"RAG LLM error ({r.status_code}): {r.text}")
    except Exception as e:
        print(f"RAG LLM exception: {e}")

    # Fallback: extract first answer from context
    if "Answer: " in context:
        parts = context.split("Answer: ")
        if len(parts) > 1:
            ans_clean = parts[1].split("FAQ:")[0].split("Community Thread:")[0].strip()
            return f"Official Guideline:\n\n{ans_clean}"

    return "I found matching FAQs below that should resolve your doubt."
