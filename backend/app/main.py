from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, faqs, ai, discussions, escalations, analytics

app = FastAPI(
    title="Samagama AI FAQ & Community Platform API",
    description="Backend API for IIT Ropar Internship Knowledge OS",
    version="1.0.0"
)

# Set up CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(faqs.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(discussions.router, prefix="/api")
app.include_router(escalations.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": "Samagama AI FAQ Platform API",
        "version": "1.0.0"
    }
