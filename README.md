# Lumina AI – Learning Platform

An AI-powered personalized learning platform that builds structured courses from a knowledge base using a RAG (Retrieval-Augmented Generation) system.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend (React + Vite)         │
│  Pages: Dashboard, Courses, Exercises,       │
│         Quizzes, Projects, Mentor, Analytics │
└──────────────────┬──────────────────────────┘
                   │ /api/v1
┌──────────────────▼──────────────────────────┐
│           Backend (FastAPI)                  │
│  30+ endpoints across Auth, Courses,         │
│  Exercises, Quizzes, Projects, Mentor,       │
│  Progress, Knowledge, Metrics               │
│                                              │
│  RAG Engine ──► storage/knowledge_base/      │
│  Course Builder ──► prompts/                 │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
LearnApp/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── api/routes.py        # All 30+ API endpoints
│   │   ├── core/config.py       # Settings
│   │   ├── models/schemas.py    # Pydantic models
│   │   └── services/
│   │       ├── rag_engine.py    # RAG retrieval system
│   │       ├── course_builder.py # Course generation
│   │       └── user_store.py   # In-memory user data
│   ├── storage/
│   │   └── knowledge_base/     # Topic-scoped knowledge files
│   │       ├── python/
│   │       ├── javascript/
│   │       ├── machine-learning/
│   │       ├── deep-learning/
│   │       ├── react/
│   │       └── data-science/
│   ├── prompts/                # Prompt templates per endpoint
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── exercises/
│   │   ├── quizzes/
│   │   ├── projects/
│   │   ├── mentor/
│   │   ├── analytics/
│   │   └── knowledge/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/              # 9 page components
│   │   ├── components/         # Layout, Sidebar
│   │   └── services/api.js    # Axios API client
│   └── package.json
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── .env.example
```

## 🚀 Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at: http://localhost:5173

### Docker Compose

```bash
cp .env.example .env
# Edit .env if needed
docker-compose up --build
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/metrics` | System metrics |
| GET | `/api/v1/demo/readiness` | Demo readiness |
| POST | `/api/v1/auth/signup` | Register user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/knowledge/topics` | List topics |
| GET | `/api/v1/knowledge/{topic}` | Get topic docs |
| POST | `/api/v1/topics/search` | Search courses |
| POST | `/api/v1/enroll` | Enroll in module |
| GET | `/api/v1/enrollments/{user_id}` | Get enrollments |
| POST | `/api/v1/modules/build` | Build course from KB |
| GET | `/api/v1/modules/{uid}/{mid}` | Get module |
| POST | `/api/v1/modules/lesson/complete` | Mark lesson done |
| POST | `/api/v1/modules/chapter/complete` | Mark chapter done |
| POST | `/api/v1/modules/exercise/submit` | Submit exercise |
| POST | `/api/v1/modules/quiz/submit` | Submit quiz |
| GET | `/api/v1/exercises` | List exercises |
| POST | `/api/v1/exercises/submit` | Submit exercise |
| GET | `/api/v1/quizzes` | List quizzes |
| POST | `/api/v1/quizzes/submit` | Submit quiz |
| GET | `/api/v1/projects` | List projects |
| POST | `/api/v1/mentor/chat` | AI mentor chat |
| POST | `/api/v1/learning-path` | Generate learning path |
| GET | `/api/v1/progress/{user_id}` | Get progress |
| POST | `/api/v1/progress/track` | Track activity |
| GET | `/api/v1/agents` | List AI agents |
| GET | `/api/v1/settings/profile/{uid}` | Get profile |
| POST | `/api/v1/settings/profile` | Save profile |
| POST | `/api/v1/prompts/{name}` | Render prompt template |

## 🧠 RAG System

The RAG (Retrieval-Augmented Generation) engine:
1. **Indexes** Markdown/HTML/text files from `storage/knowledge_base/{topic}/`
2. **Searches** using keyword matching and scoring
3. **Retrieves** relevant chunks for course building, mentor chat, exercises
4. **Renders** prompt templates from `prompts/{category}/{action}.md`

### Adding New Topics

1. Create folder: `backend/storage/knowledge_base/{your-topic}/`
2. Add `.md` files with content
3. The topic is automatically discovered on startup

### Prompt Templates

Each endpoint activity has a corresponding prompt template:
- `prompts/auth/signup.md` – User welcome message
- `prompts/courses/search.md` – Course search results
- `prompts/courses/build.md` – Course generation
- `prompts/mentor/chat.md` – Mentor responses
- etc.

Templates support `{variable}` substitution.

## 📊 Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Authentication |
| Register | `/register` | Sign up |
| Dashboard | `/dashboard` | Stats overview |
| Courses | `/courses` | Search, enroll, learn |
| Exercises | `/exercises` | Practice coding |
| Quizzes | `/quizzes` | Test knowledge |
| Projects | `/projects` | Portfolio projects |
| Mentor | `/mentor` | AI chat assistant |
| Analytics | `/analytics` | Progress tracking |
| Profile | `/profile` | User settings |

## 🔒 Security Notes

- Passwords hashed with SHA-256 (use bcrypt in production)
- Demo tokens (use signed JWT in production)
- CORS configurable via `ALLOWED_ORIGINS` env var
- No secrets committed to repository
