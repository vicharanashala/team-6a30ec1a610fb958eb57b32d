from fastapi import APIRouter, Query, Body
from typing import Optional
from app.services.rag_service import query_rag, generate_rag_answer
from app.core.database import supabase_post

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/ask")
def ask_ai(
    question: str = Body(..., embed=True),
    category_slug: Optional[str] = Body(None, embed=True),
    force_generation: Optional[bool] = Body(False, embed=True)
):
    if not question.strip():
        return {"error": "Question cannot be empty"}
        
    # Run the core RAG pipeline (Retrieval + Routing)
    rag_result = query_rag(question, category_slug)
    
    # 1. Duplicate detection:
    # If a community thread has a similarity score >= 0.92, flag it as a possible duplicate.
    possible_duplicate = None
    if rag_result["thread_matches"]:
        top_thread = rag_result["thread_matches"][0]
        if top_thread["similarity"] >= 0.92:
            possible_duplicate = {
                "id": top_thread["id"],
                "title": top_thread["title"],
                "similarity": top_thread["similarity"]
            }
            
    # 2. Handle Force Generation:
    # If the user overrides a medium/low confidence match to ask the AI anyway
    ai_answer = rag_result["ai_answer"]
    confidence = rag_result["confidence"]
    
    if force_generation and not ai_answer:
        # Build context from whatever matches we got
        context_parts = []
        for match in rag_result["faq_matches"][:3]:
            context_parts.append(f"FAQ: {match['question']}\nAnswer: {match['answer']}")
        for match in rag_result["thread_matches"][:2]:
            context_parts.append(f"Community Thread: {match['title']}\nContent: {match['content']}")
            
        context_text = "\n\n".join(context_parts) if context_parts else "No relevant context available."
        ai_answer = generate_rag_answer(question, context_text)
        confidence = "forced"
        
    # Log analytics
    try:
        supabase_post("analytics", {
            "event_type": "ai_answering",
            "query_text": question,
            "confidence_score": rag_result["confidence_score"],
            "metadata": {
                "confidence": confidence,
                "has_answer": ai_answer is not None,
                "possible_duplicate": possible_duplicate
            }
        })
    except Exception as e:
        print("Failed to save AI analytics:", e)
        
    return {
        "question": question,
        "confidence": confidence,
        "confidence_score": rag_result["confidence_score"],
        "ai_answer": ai_answer,
        "faq_matches": rag_result["faq_matches"],
        "thread_matches": rag_result["thread_matches"],
        "possible_duplicate": possible_duplicate
    }
