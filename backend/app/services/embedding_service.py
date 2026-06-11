import requests
import time
from app.core.config import settings

def get_embedding(text: str) -> list:
    if not settings.GEMINI_API_KEY:
        raise Exception(
            "GEMINI_API_KEY is not set. Add it to your .env file to enable semantic search."
        )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-embedding-001:embedContent?key={settings.GEMINI_API_KEY}"
    )
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {
            "parts": [{"text": text}]
        },
        "outputDimensionality": 768
    }

    for attempt in range(3):
        try:
            r = requests.post(url, json=payload, timeout=15)
            if r.status_code == 200:
                return r.json()["embedding"]["values"]
            else:
                print(f"Embedding API error ({r.status_code}): {r.text}")
        except Exception as e:
            print(f"Embedding exception (attempt {attempt + 1}): {e}")
        time.sleep(1)

    raise Exception("Failed to generate embedding from Gemini API after 3 attempts.")
