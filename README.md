# AI-Powered Internship Help Platform — Full MVP Build Prompt


- Samagama FAQ Maps Version : [Samagama FAQ]([https://samagama-faq-alpha.vercel.app/]

  
You are a senior staff-level AI architect, full-stack engineer, product designer, database architect, and scalable systems engineer.
Your task is to help me build a production-grade MVP for an AI-powered internship help platform for the Vicharanashala Internship (IIT Ropar).
The system should reduce admin workload by combining:

* Semantic FAQ search
* AI-assisted retrieval
* Community-driven support
* Verified knowledge moderation
* Smart escalation workflows
* Continuous knowledge evolution

The goal is NOT to build a generic chatbot.

The goal is to build:
“A self-evolving AI + community-powered knowledge operating system.”

---

## PROJECT CONTEXT

Currently the system has:

1. A static FAQ website
2. A basic FAQ-only chatbot
3. Manual escalation using #escalate

Problem:

* Repeated questions
* Duplicate escalations
* Heavy admin workload
* Poor scalability
* No reusable community knowledge
* No continuous improvement

The system must:

* Prevent duplicate escalations
* Answer questions using semantic retrieval
* Convert unresolved questions into community discussions
* Allow verified answers to evolve into official knowledge
* Continuously improve retrieval quality

---

## TECH STACK (STRICT)

Frontend:

* Next.js 14 App Router
* React
* TailwindCSS
* shadcn/ui

Backend:

* FastAPI (Python)

Database:

* Supabase PostgreSQL

Vector Search:

* pgvector extension in Supabase

Authentication:

* Supabase Auth

AI:

* OpenAI embeddings OR Gemini embeddings
* RAG-based retrieval ONLY
* NO fine-tuning initially

Deployment:

* Vercel (frontend)
* Railway or Render (backend)

---

## VERY IMPORTANT ARCHITECTURE RULES

1. DO NOT overengineer.
2. DO NOT use multi-agent systems.
3. DO NOT use LangGraph initially.
4. DO NOT use autonomous workflows.
5. Build MVP-first.
6. Prioritize retrieval quality over AI complexity.
7. Keep the frontend modern but simple.
8. Use clean architecture.
9. Everything should be modular.
10. Write production-quality code.

---

## MAIN SYSTEM FLOW

User asks question
↓
Semantic search over:

* FAQ database
* Verified community answers
* Approved discussions
  ↓
  Confidence scoring
  ↓

IF confidence > 85%
→ AI answers directly

IF confidence between 60–85%
→ Show related FAQs + related discussions

IF confidence < 60%
→ Create community discussion thread

IF unresolved for long time
→ Escalation queue

Verified answers:
→ become part of knowledge base
→ become searchable
→ improve future retrieval

---

## PAGES TO BUILD

PAGE 1 — SMART FAQ

Features:

* Semantic FAQ search
* Category filtering
* Popular questions
* Related question suggestions
* Helpful / not helpful buttons
* Mobile responsive UI

FAQ categories:

* NOC
* Internship
* Offer Letter
* ViBe
* Technical Issues
* Certificates
* General

---

PAGE 2 — ASK AI

Features:

* Ask question input
* Semantic similarity detection
* Duplicate question prevention
* AI-generated answers using RAG
* Similar discussions recommendation
* Confidence-aware responses

IMPORTANT:
The chatbot must NEVER hallucinate.
The chatbot must answer ONLY using retrieved context.

---

PAGE 3 — COMMUNITY DISCUSSIONS

Features:

* Reddit/StackOverflow-like threads
* Replies
* Upvotes
* Accepted answers
* Verified mentor answers
* Tags
* Thread search
* Sort by:

  * Recent
  * Popular
  * Unresolved
  * Most discussed

---

PAGE 4 — ADMIN DASHBOARD

Features:

* Moderate threads
* Approve answers
* Escalation queue
* Analytics
* FAQ generation suggestions
* Most repeated questions
* Most escalated topics
* User reports
* Community health metrics

---

## DATABASE DESIGN

Generate full PostgreSQL schema for:

users
faqs
faq_embeddings
threads
thread_embeddings
replies
votes
accepted_answers
escalations
notifications
categories
tags
thread_tags
analytics
moderation_logs
knowledge_base

Use:

* UUID primary keys
* timestamps
* indexing
* pgvector embeddings
* proper foreign keys

---

## AI / RAG PIPELINE

Build:

1. Embedding pipeline
2. Semantic retrieval
3. Similarity scoring
4. Confidence routing
5. RAG answer generation
6. Duplicate detection
7. FAQ auto-suggestion pipeline

The AI should:

* retrieve context first
* answer ONLY from verified knowledge
* cite source thread/FAQ
* avoid hallucinations

Use:

* cosine similarity
* hybrid search if possible
* metadata filtering

---

## JSON FAQ INGESTION

I already have a JSON FAQ dataset.

Build:

* FAQ ingestion script
* embedding generation pipeline
* Supabase vector storage
* automatic category mapping

The ingestion should:

* clean text
* generate embeddings
* insert into PostgreSQL
* store vectors in pgvector

---

## COMMUNITY TRUST SYSTEM

Build a reputation system.

Users gain points for:

* accepted answers
* upvotes
* verified responses

Roles:

* Student
* Trusted Contributor
* Mentor
* Admin

ONLY:

* mentor-approved answers
* admin-approved answers

can enter official knowledge base.

---

## ESCALATION SYSTEM

Escalation should be LAST RESORT.

Escalation triggers:

* low confidence
* unresolved thread
* no community response
* repeated failed answers

Escalated questions:

* enter admin queue
* get priority scoring
* become FAQ suggestions later

---

## API DESIGN

Generate REST API structure for:

* auth
* FAQ retrieval
* semantic search
* AI answers
* discussions
* replies
* voting
* moderation
* escalation
* analytics

Use:

* FastAPI routers
* service layer
* repository pattern

---

## FOLDER STRUCTURE

Generate:

* frontend folder structure
* backend folder structure
* API architecture
* reusable component structure
* hooks/services organization

---

## UI/UX REQUIREMENTS

Design style:

* modern
* minimal
* fast
* clean
* Discord + StackOverflow + Linear inspired

Use:

* dark mode support
* responsive layout
* sticky sidebar
* category chips
* thread cards
* clean typography

---

## ANALYTICS

Track:

* most searched questions
* failed searches
* escalation rates
* duplicate question frequency
* community response time
* unanswered questions
* helpfulness score
* AI confidence metrics

---

## SECURITY

Implement:

* row-level security
* JWT auth
* rate limiting
* spam prevention
* XSS prevention
* SQL injection prevention
* moderation controls

---

## MVP PRIORITY (VERY IMPORTANT)

Build ONLY in this order:

PHASE 1:

* FAQ ingestion
* semantic search
* vector retrieval

PHASE 2:

* AI RAG answers
* confidence routing
* related questions

PHASE 3:

* community threads
* replies
* voting

PHASE 4:

* moderation
* escalation dashboard

PHASE 5:

* analytics
* FAQ auto-generation

DO NOT skip phases.

---

## IMPORTANT FINAL RULES

1. Keep architecture production-grade.
2. Keep implementation MVP-focused.
3. Avoid unnecessary complexity.
4. Prioritize maintainability.
5. Generate scalable clean code.
6. Think like a senior engineer.
7. Think long-term scalability.
8. Use modular reusable design.
9. Focus on retrieval quality.
10. Build with real users in mind.

Now:

1. Generate the complete architecture
2. Generate the database schema
3. Generate folder structure
4. Generate implementation roadmap
5. Generate API routes
6. Generate backend architecture
7. Generate frontend architecture
8. Generate RAG pipeline
9. Generate ingestion pipeline
10. Generate deployment plan
11. Generate MVP sprint plan
12. Generate code structure step-by-step

Then begin implementation phase-by-phase.
