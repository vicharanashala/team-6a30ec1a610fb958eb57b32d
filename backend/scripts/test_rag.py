import sys
import os

# Add parent directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.rag_service import query_rag

def test_question(q):
    print("\n" + "="*50)
    print(f"Testing Question: '{q}'")
    print("="*50)
    
    res = query_rag(q)
    print(f"Confidence Level: {res['confidence'].upper()} (Score: {res['confidence_score']:.3f})")
    
    if res.get("possible_duplicate"):
        print(f"⚠️ Possible Duplicate Detected! Thread ID: {res['possible_duplicate']['id']}, Title: '{res['possible_duplicate']['title']}'")
        
    print("\nTop FAQ Matches:")
    for idx, match in enumerate(res["faq_matches"][:3]):
        print(f"  {idx+1}. [{match['similarity']:.3f}] (ID: {match['original_id']}) {match['question']}")
        
    print("\nTop Thread Matches:")
    for idx, match in enumerate(res["thread_matches"][:3]):
        print(f"  {idx+1}. [{match['similarity']:.3f}] {match['title']}")
        
    if res["ai_answer"]:
        print("\nAI Generated Answer (RAG):")
        print(res["ai_answer"])
    else:
        print("\nAI Generated Answer: [SKIPPED - Low/Medium Confidence]")

if __name__ == "__main__":
    # Test queries mapping to different confidence bands
    test_question("What is the Vicharanashala internship?") # Expected: High confidence (FAQ exists)
    test_question("Can I start the internship in August because of my college exams?") # Expected: High/Medium
    test_question("How do I make a chocolate cake?") # Expected: Low confidence (Irrelevant query)
