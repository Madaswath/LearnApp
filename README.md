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
- After enrollment, users can start module directly from My Enrollments, complete chapter-end exercises/quizzes, and unlock chapter completion.
- Module evaluation endpoint returns performance summary + personalized next learning steps.
- Settings page for personal profile data save.
- Curriculum/exercise/quiz/project orchestration pipeline.
- Adaptive recommendations driven by progress metrics.
- SaaS dashboard pages: Login, Register, Dashboard, Courses, Exercises, Quizzes, Projects, Mentor, Analytics, Profile.
- Dockerized local startup.
- Knowledge base storage by topic folders with markdown/html/pdf-extracted files.
- Prompt template library for generating course materials, chapters, lessons, quizzes, practice tasks, and projects.
- Supabase-ready tracker hooks for multi-user enrollment, progress analytics, streak/performance signals.

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
- `POST /modules/exercise/submit`
- `GET /modules/{user_id}/{module_id}/evaluation`
- `GET /knowledge/topics`
- `GET /knowledge/{topic}?q=...`
- `POST /prompts/{prompt_name}`
- `GET /demo/readiness`


## Knowledge Base & Prompt Library

Local knowledge base lives under `backend/storage/knowledge_base/` with per-topic folders (for example `deep-learning/`, `langchain/`) containing mixed source files like markdown, html, and pdf-extracted text.

Prompt templates live under `backend/prompts/` and are used to build:
- course materials
- chapters/lessons
- quizzes
- practice problems
- projects
- mentor guidance prompts

RAG retrieval is implemented in `backend/app/services/knowledge_base.py` + `rag_engine.py` using topic-scoped retrieval and context-grounded mentor responses.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App URL: `http://localhost:5173`

## Database + RLS

Apply `backend/migrations/001_init.sql` and `backend/migrations/002_app_alignment.sql` to Supabase SQL editor.

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


## Demo Readiness

Use `GET /api/v1/demo/readiness` to quickly inspect investor-demo alignment checks and required actions.

Expected flow for live demo:
1. Signup/Login
2. Search topic and enroll module
3. Start learning from enrollments
4. Complete lesson + chapter-end exercise + chapter-end quiz
5. Mark chapter complete
6. Review module evaluation and next steps
7. Ask AI mentor concept/app-navigation questions

Detailed execution tracker: see `docs/implementation-roadmap.md` for phase-by-phase status and next actions.
