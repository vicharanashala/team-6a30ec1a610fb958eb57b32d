import os
import json
import time
import requests

# Configuration
SUPABASE_URL = "https://jsdzssxyromeqtpyvhmw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZHpzc3h5cm9tZXF0cHl2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTEwMjYsImV4cCI6MjA5NTE4NzAyNn0.T2mCOw-sgZt-Znpri8sEvF_mtSF3IuiSN4QitYi9Bw8"
GEMINI_API_KEY = "AIzaSyDqGpwcG3ozB_o5c7mizojDwpz3COAZbvo"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Fetch categories from Supabase to match IDs
def get_categories():
    r = requests.get(f"{SUPABASE_URL}/rest/v1/categories", headers=HEADERS)
    if r.status_code != 200:
        raise Exception(f"Failed to fetch categories: {r.status_code} {r.text}")
    return {c["slug"]: c["id"] for c in r.json()}

def map_section_to_slug(section, question, answer):
    section_lower = section.lower()
    question_lower = question.lower()
    answer_lower = answer.lower()
    
    if "noc" in section_lower or "no objection" in section_lower:
        return "noc"
    elif "offer letter" in section_lower or "offer-letter" in section_lower or "opt in" in question_lower or "accepting" in question_lower:
        return "offer-letter"
    elif "certificate" in section_lower:
        return "certificates"
    elif "vibe" in section_lower:
        return "vibe"
    elif "technical" in section_lower or "software" in section_lower or "laptop" in question_lower or "terminal" in question_lower or "ssh" in question_lower:
        return "technical-issues"
    elif "work" in section_lower or "mentor" in section_lower or "project" in section_lower or "about the internship" in section_lower or "stipend" in question_lower:
        return "internship"
    else:
        return "general"

def generate_embedding(text):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {
            "parts": [{"text": text}]
        },
        "outputDimensionality": 768
    }
    
    # Simple retry mechanism for safety
    for attempt in range(5):
        try:
            r = requests.post(url, json=payload, timeout=10)
            if r.status_code == 200:
                return r.json()["embedding"]["values"]
            else:
                print(f"Gemini API returned error ({r.status_code}): {r.text}. Retrying...")
        except Exception as e:
            print(f"Network error on attempt {attempt+1}: {e}. Retrying...")
        time.sleep(2 ** attempt)
    
    raise Exception(f"Failed to generate embedding for: {text[:50]}...")

def main():
    print("Fetching categories from database...")
    categories_map = get_categories()
    print("Categories mapped:", categories_map)
    
    faq_file_path = os.path.join(os.path.dirname(__file__), "..", "..", "faq.json")
    print(f"Loading FAQs from {faq_file_path}...")
    with open(faq_file_path, "r", encoding="utf-8") as f:
        faqs_data = json.load(f)
        
    print(f"Found {len(faqs_data)} FAQ items.")
    
    count = 0
    for idx, item in enumerate(faqs_data):
        original_id = item.get("id")
        section = item.get("section", "General")
        question = item.get("question", "").strip()
        answer = item.get("answer", "").strip()
        
        if not question or not answer:
            print(f"Skipping empty question/answer at index {idx}")
            continue
            
        slug = map_section_to_slug(section, question, answer)
        category_id = categories_map.get(slug)
        
        print(f"[{idx+1}/{len(faqs_data)}] Ingesting ID {original_id}: '{question[:50]}...' mapped to category '{slug}'")
        
        # 1. Generate Embedding
        try:
            embedding = generate_embedding(question)
        except Exception as e:
            print(f"Skipping due to embedding failure: {e}")
            continue
            
        # 2. Insert FAQ
        faq_payload = {
            "original_id": original_id,
            "category_id": category_id,
            "question": question,
            "answer": answer,
            "is_official": True
        }
        
        try:
            r_faq = requests.post(f"{SUPABASE_URL}/rest/v1/faqs", headers=HEADERS, json=faq_payload)
            if r_faq.status_code != 201:
                print(f"Failed to insert FAQ: {r_faq.status_code} {r_faq.text}")
                continue
                
            inserted_faq = r_faq.json()[0]
            faq_id = inserted_faq["id"]
            
            # 3. Insert FAQ Embedding
            emb_payload = {
                "faq_id": faq_id,
                "embedding": embedding
            }
            r_emb = requests.post(f"{SUPABASE_URL}/rest/v1/faq_embeddings", headers=HEADERS, json=emb_payload)
            if r_emb.status_code != 201:
                print(f"Failed to insert embedding for FAQ {faq_id}: {r_emb.status_code} {r_emb.text}")
                # Clean up FAQ to avoid orphan records
                requests.delete(f"{SUPABASE_URL}/rest/v1/faqs?id=eq.{faq_id}", headers=HEADERS)
                continue
                
            count += 1
            # Prevent hitting rate limit too hard
            time.sleep(0.5)
        except Exception as e:
            print(f"Error during ingestion of index {idx}: {e}")
            
    print(f"Ingestion complete. Successfully ingested {count}/{len(faqs_data)} FAQs.")

if __name__ == "__main__":
    main()
