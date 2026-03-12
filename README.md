# Lumina AI

Lumina AI is a production-oriented personalized learning platform combining a React SaaS frontend, FastAPI backend, multi-agent curriculum generation, and RAG-powered mentoring.

## Architecture

- **Frontend SaaS UI**: React + Vite + Tailwind + Recharts.
- **Backend API**: FastAPI + Pydantic.
- **AI Agent Mesh**: 23-role agent registry compatible with CrewAI orchestration patterns.
- **RAG Engine**: Retrieval façade for lesson/exercise/project context grounding.
- **Supabase**: Auth + PostgreSQL + pgvector schema.
- **Analytics/Adaptation**: Adaptive curriculum engine adjusts based on performance and engagement.

## Key Features

- Personalized learning path generation (Beginner → Intermediate → Advanced).
- AI mentor chat endpoint with grounded source context.
- Curriculum/exercise/quiz/project orchestration pipeline.
- Adaptive recommendations driven by progress metrics.
- SaaS dashboard pages: Login, Register, Dashboard, Courses, Exercises, Quizzes, Projects, Mentor, Analytics, Profile.
- Dockerized local startup.

## Multi-Agent Ecosystem

Implemented in `backend/app/agents/registry.py` with these groups:

- Curriculum Generation (7)
- Personalization (4)
- Mentor System (4)
- Content Quality (3)
- Analytics (3)
- Research (2)

Total: **23 agents**.

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API base URL: `http://localhost:8000/api/v1`

Key endpoints:

- `GET /health`
- `GET /agents`
- `POST /learning-path`
- `POST /mentor/chat`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App URL: `http://localhost:5173`

## Database + RLS

Apply `backend/migrations/001_init.sql` to Supabase SQL editor.

Includes required tables:

- users, topics, learning_paths, chapters, lessons, exercises, quizzes, projects, resources
- mentor_conversations, user_progress, analytics, skill_gaps, recommendations, learning_sessions

Also enables Row Level Security policies for user-owned records.

## Environment Variables

Copy `.env.example` to `.env`:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Production Notes

- Swap stub RAG retrieval with pgvector similarity search queries.
- Replace stub orchestration calls with CrewAI crews/tasks per pathway stage.
- Add JWT verification middleware wired to Supabase Auth JWKS.
- Add background workers for analytics and recommendation updates.
- Add CI/CD pipeline with unit/integration/e2e tests.
