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
- Signup/login flow with session persistence in frontend local storage.
- Topic search that generates detailed beginner/intermediate/advanced modules (lessons + concepts + projects).
- Enrollment flow and activity-based progress tracking dashboard/analytics.
- Fully wired Exercises, Quizzes, and Projects tabs with API-backed content and submissions.
- Selected learning module now generates chapter-by-chapter content with lessons, quizzes, exercises, and a demo project.
- Module navigation supports lesson/chapter completion and quiz submission tracking.
- Settings page for personal profile data save.
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
- `POST /auth/signup`
- `POST /auth/login`
- `POST /topics/search`
- `POST /enroll`
- `POST /progress/track`
- `GET /progress/{user_id}`
- `POST /settings/profile`
- `GET /settings/profile/{user_id}`
- `GET /enrollments/{user_id}`
- `GET /exercises`
- `POST /exercises/submit`
- `GET /quizzes`
- `POST /quizzes/submit`
- `GET /projects`
- `POST /modules/build`
- `GET /modules/{user_id}/{module_id}`
- `POST /modules/lesson/complete`
- `POST /modules/chapter/complete`
- `POST /modules/quiz/submit`

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


## Run in VS Code (Clone → Run)

1. Clone and open the project:

```bash
git clone <your-repo-url> LuminaAI
cd LuminaAI
code .
```

2. Create local environment file from template:

```bash
cp .env.example .env
```

Then set `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY`.

3. Install dependencies once:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend && npm install
```

4. In VS Code run one of these:

- **Terminal → Run Task → `app: run full stack`** (runs backend + frontend)
- **Run and Debug → `Backend: FastAPI (uvicorn)`** (backend debugger)
- **Terminal → Run Task → `docker: up`** (containerized run)

5. Open:

- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:8000/docs`

> VS Code workspace files are included in `.vscode/` with recommended extensions, tasks, and launch settings.

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
