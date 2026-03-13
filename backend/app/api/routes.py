"""
Lumina AI – all API routes.
Mounted at /api/v1 in main.py.
"""
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends

from app.core.config import settings
from app.models.schemas import (
    AnalyticsData,
    AuthResponse,
    ChapterCompleteRequest,
    CourseModule,
    DemoReadinessResponse,
    EnrollRequest,
    ExerciseSubmitRequest,
    HealthResponse,
    KnowledgeDocument,
    LearningPathRequest,
    LessonCompleteRequest,
    LoginRequest,
    MentorChatRequest,
    MentorChatResponse,
    ModuleBuildRequest,
    ProgressTrackRequest,
    QuizSubmitRequest,
    SignupRequest,
    TopicSearchRequest,
    UserProfile,
)
from app.services.course_builder import CourseBuilder, course_builder as _cb
from app.services.rag_engine import RAGEngine, rag_engine as _re
from app.services.user_store import UserStore, user_store as _us
from app.agents.registry import get_all_agents, get_group_summary

router = APIRouter()

# ── Dependency providers ──────────────────────────────────────────────────────

def get_user_store() -> UserStore:
    return _us

def get_rag_engine() -> RAGEngine:
    return _re

def get_course_builder() -> CourseBuilder:
    return _cb


# ── Helpers ───────────────────────────────────────────────────────────────────

_PASSWORD_RE = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?]).{8,}$"
)

def _fake_token(user_id: str) -> str:
    # NOTE: This is a demo token only (user_id embedded, no signing).
    # In production, replace with a signed JWT (e.g. python-jose / PyJWT).
    return f"lm_{user_id.replace('-', '')}_{uuid.uuid4().hex[:8]}"


def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"


# ── 1. Health ─────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["System"])
def health(rag: RAGEngine = Depends(get_rag_engine)):
    topics = rag.list_topics()
    return HealthResponse(
        status="ok",
        version="1.0.0",
        timestamp=_now(),
        services={
            "rag_engine": "ok" if topics else "warn",
            "user_store": "ok",
            "course_builder": "ok",
            "knowledge_base": f"{len(topics)} topics loaded",
        },
    )


# ── 2. Demo readiness ─────────────────────────────────────────────────────────

@router.get("/demo/readiness", response_model=DemoReadinessResponse, tags=["System"])
def demo_readiness(rag: RAGEngine = Depends(get_rag_engine)):
    topics = rag.list_topics()
    return DemoReadinessResponse(
        ready=len(topics) > 0,
        services={
            "rag_engine": True,
            "user_store": True,
            "course_builder": True,
            "knowledge_base": len(topics) > 0,
        },
        topics_available=topics,
        message="All systems operational." if topics else "Knowledge base empty.",
    )


# ── 3. Auth – signup ──────────────────────────────────────────────────────────

@router.post("/auth/signup", response_model=AuthResponse, tags=["Auth"])
def signup(
    body: SignupRequest,
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
):
    if us.get_user_by_email(body.email):
        raise HTTPException(400, "Email already registered.")
    if not body.name.strip():
        raise HTTPException(400, "Name must not be empty.")
    if not _PASSWORD_RE.match(body.password):
        raise HTTPException(
            400,
            "Password must be at least 8 characters and include uppercase, "
            "lowercase, digit, and special character.",
        )
    user_id = us.create_user(body.email, body.password, body.name)
    _prompt = rag.get_prompt("auth", "signup", email=body.email, name=body.name)
    return AuthResponse(
        token=_fake_token(user_id),
        user_id=user_id,
        email=body.email,
        name=body.name,
        message=f"Welcome to Lumina AI, {body.name}! Your journey starts now.",
    )


# ── 4. Auth – login ───────────────────────────────────────────────────────────

@router.post("/auth/login", response_model=AuthResponse, tags=["Auth"])
def login(
    body: LoginRequest,
    us: UserStore = Depends(get_user_store),
):
    if not us.verify_password(body.email, body.password):
        raise HTTPException(401, "Invalid email or password.")
    user = us.get_user_by_email(body.email)
    return AuthResponse(
        token=_fake_token(user["user_id"]),
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        message=f"Welcome back, {user['name']}!",
    )


# ── 5. Knowledge – list topics ────────────────────────────────────────────────

@router.get("/knowledge/topics", tags=["Knowledge"])
def list_topics(rag: RAGEngine = Depends(get_rag_engine)):
    topics = rag.list_topics()
    return {"topics": topics, "count": len(topics)}


# ── 6. Knowledge – get documents for topic ────────────────────────────────────

@router.get("/knowledge/{topic}", tags=["Knowledge"])
def get_knowledge(
    topic: str,
    q: Optional[str] = Query(None, description="Search query"),
    rag: RAGEngine = Depends(get_rag_engine),
):
    if q:
        _prompt = rag.get_prompt("knowledge", "retrieve", topic=topic, query=q)
        chunks = rag.search(topic, q)
        return {"topic": topic, "query": q, "results": chunks, "count": len(chunks)}
    docs = rag.get_all_documents(topic)
    if not docs:
        raise HTTPException(404, f"No knowledge base found for topic '{topic}'.")
    return {
        "topic": topic,
        "documents": [d.model_dump() for d in docs],
        "count": len(docs),
    }


# ── 7. Prompts – render a template ───────────────────────────────────────────

@router.post("/prompts/{prompt_name}", tags=["Prompts"])
def render_prompt(
    prompt_name: str,
    variables: Dict[str, Any] = {},
    rag: RAGEngine = Depends(get_rag_engine),
):
    parts = prompt_name.split("__", 1)
    if len(parts) != 2:
        raise HTTPException(
            400,
            "prompt_name must be in format 'category__action' (use double underscore).",
        )
    category, action = parts
    rendered = rag.get_prompt(category, action, **variables)
    return {"prompt_name": prompt_name, "rendered": rendered}


# ── 8. Profile – get ─────────────────────────────────────────────────────────

@router.get("/settings/profile/{user_id}", response_model=UserProfile, tags=["Settings"])
def get_profile(user_id: str, us: UserStore = Depends(get_user_store)):
    user = us.get_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found.")
    return UserProfile(**{k: user[k] for k in UserProfile.model_fields if k in user})


# ── 9. Profile – save ────────────────────────────────────────────────────────

@router.post("/settings/profile", response_model=UserProfile, tags=["Settings"])
def save_profile(
    body: UserProfile,
    us: UserStore = Depends(get_user_store),
):
    user = us.get_user_by_id(body.user_id)
    if not user:
        raise HTTPException(404, "User not found.")
    us.update_profile(body.user_id, body.model_dump(exclude={"user_id", "email", "created_at"}))
    updated = us.get_user_by_id(body.user_id)
    return UserProfile(**{k: updated[k] for k in UserProfile.model_fields if k in updated})


# ── 10. Topics – search ───────────────────────────────────────────────────────

@router.post("/topics/search", tags=["Topics"])
def search_topics(
    body: TopicSearchRequest,
    rag: RAGEngine = Depends(get_rag_engine),
):
    topic = body.topic or _infer_topic(body.query, rag.list_topics())
    _prompt = rag.get_prompt(
        "courses", "search", query=body.query, level=body.level, topic=topic
    )
    chunks = rag.search(topic, body.query, top_k=3)

    def _module_stub(level: str, idx: int) -> Dict:
        level_labels = {"beginner": "Beginner", "intermediate": "Intermediate", "advanced": "Advanced"}
        hours = {"beginner": 4, "intermediate": 8, "advanced": 14}
        prereqs = {
            "beginner": "None",
            "intermediate": "Basic understanding of " + topic.replace("-", " "),
            "advanced": "Solid intermediate knowledge of " + topic.replace("-", " "),
        }
        snippet = chunks[idx % len(chunks)][:120] if chunks else ""
        return {
            "id": f"{topic}-{level}-{uuid.uuid4().hex[:6]}",
            "title": f"{topic.replace('-', ' ').title()} – {level_labels[level]}",
            "level": level,
            "description": snippet + "..." if snippet else f"Explore {topic} at the {level} level.",
            "estimated_hours": hours[level],
            "prerequisites": prereqs[level],
            "topics_covered": _extract_headings(chunks),
        }

    modules = [
        _module_stub("beginner", 0),
        _module_stub("intermediate", 1),
        _module_stub("advanced", 2),
    ]
    return {"topic": topic, "query": body.query, "modules": modules}


def _infer_topic(query: str, available: List[str]) -> str:
    q = query.lower()
    for t in available:
        if t in q or t.replace("-", " ") in q:
            return t
    return available[0] if available else "python"


def _extract_headings(chunks: List[str]) -> List[str]:
    headings = []
    for chunk in chunks:
        for line in chunk.splitlines():
            if line.startswith("#"):
                headings.append(line.lstrip("#").strip())
    return headings[:6] or ["Core concepts", "Practical examples", "Best practices"]


# ── 11. Enroll ────────────────────────────────────────────────────────────────

@router.post("/enroll", tags=["Enrollment"])
def enroll(
    body: EnrollRequest,
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
):
    us.enroll(body.user_id, body.module_id, body.topic)
    us.track_progress(body.user_id, {
        "activity_type": "enrollment",
        "topic": body.topic,
        "module_id": body.module_id,
    })
    _prompt = rag.get_prompt(
        "courses", "enroll",
        user_id=body.user_id,
        module_title=body.module_id,
        topic=body.topic,
        level=body.level,
    )
    return {
        "success": True,
        "message": f"Successfully enrolled in {body.module_id}.",
        "enrollment": {"module_id": body.module_id, "topic": body.topic, "level": body.level},
    }


# ── 12. Enrollments – list ────────────────────────────────────────────────────

@router.get("/enrollments/{user_id}", tags=["Enrollment"])
def get_enrollments(user_id: str, us: UserStore = Depends(get_user_store)):
    if not us.get_user_by_id(user_id):
        raise HTTPException(404, "User not found.")
    return {"user_id": user_id, "enrollments": us.get_enrollments(user_id)}


# ── 13. Modules – build ───────────────────────────────────────────────────────

@router.post("/modules/build", response_model=CourseModule, tags=["Modules"])
def build_module(
    body: ModuleBuildRequest,
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
    cb: CourseBuilder = Depends(get_course_builder),
):
    docs = rag.get_all_documents(body.topic)
    doc_titles = [d.filename for d in docs]
    _prompt = rag.get_prompt(
        "courses", "build",
        topic=body.topic,
        level=body.level,
        documents=", ".join(doc_titles),
        num_chapters={"beginner": 3, "intermediate": 5, "advanced": 7}.get(body.level, 3),
    )
    module = cb.build_course(body.topic, body.level)
    if body.user_id:
        us.save_module(body.user_id, module.id, module.model_dump())
        us.track_progress(body.user_id, {
            "activity_type": "module_build",
            "topic": body.topic,
            "module_id": module.id,
            "level": body.level,
        })
    return module


# ── 14. Modules – get ────────────────────────────────────────────────────────

@router.get("/modules/{user_id}/{module_id}", tags=["Modules"])
def get_module(
    user_id: str,
    module_id: str,
    us: UserStore = Depends(get_user_store),
):
    module = us.get_module(user_id, module_id)
    if not module:
        raise HTTPException(404, "Module not found. Build it first via POST /modules/build.")
    return module


# ── 15. Modules – evaluation ──────────────────────────────────────────────────

@router.get("/modules/{user_id}/{module_id}/evaluation", tags=["Modules"])
def get_evaluation(
    user_id: str,
    module_id: str,
    us: UserStore = Depends(get_user_store),
):
    module = us.get_module(user_id, module_id)
    progress = us.get_progress(user_id)
    completed = [
        p for p in progress
        if p.get("module_id") == module_id and p.get("activity_type") in ("lesson_complete", "chapter_complete")
    ]
    return {
        "user_id": user_id,
        "module_id": module_id,
        "module_title": module["title"] if module else module_id,
        "completed_activities": len(completed),
        "evaluation": "Keep going – you're making great progress!",
        "next_steps": [
            "Complete all chapter exercises",
            "Take the chapter quizzes",
            "Work on the capstone project",
        ],
    }


# ── 16. Lesson complete ───────────────────────────────────────────────────────

@router.post("/modules/lesson/complete", tags=["Modules"])
def lesson_complete(
    body: LessonCompleteRequest,
    us: UserStore = Depends(get_user_store),
):
    us.track_progress(body.user_id, {
        "activity_type": "lesson_complete",
        "module_id": body.module_id,
        "chapter_id": body.chapter_id,
        "lesson_id": body.lesson_id,
    })
    return {"success": True, "message": "Lesson marked as complete.", "xp_earned": 10}


# ── 17. Chapter complete ──────────────────────────────────────────────────────

@router.post("/modules/chapter/complete", tags=["Modules"])
def chapter_complete(
    body: ChapterCompleteRequest,
    us: UserStore = Depends(get_user_store),
):
    us.track_progress(body.user_id, {
        "activity_type": "chapter_complete",
        "module_id": body.module_id,
        "chapter_id": body.chapter_id,
    })
    return {"success": True, "message": "Chapter completed! Well done.", "xp_earned": 50}


# ── 18. Exercise submit (module) ──────────────────────────────────────────────

@router.post("/modules/exercise/submit", tags=["Modules"])
def module_exercise_submit(
    body: ExerciseSubmitRequest,
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
):
    score = _score_exercise(body.answer, body.topic)
    _prompt = rag.get_prompt(
        "exercises", "submit",
        topic=body.topic,
        exercise_title=body.exercise_title or body.exercise_id,
        user_answer=body.answer[:200],
        expected_answer="See knowledge base.",
    )
    if body.user_id:
        us.track_progress(body.user_id, {
            "activity_type": "exercise_submit",
            "exercise_id": body.exercise_id,
            "topic": body.topic,
            "score": score,
        })
    return {"exercise_id": body.exercise_id, "score": score, "feedback": _exercise_feedback(score)}


# ── 19. Quiz submit (module) ──────────────────────────────────────────────────

@router.post("/modules/quiz/submit", tags=["Modules"])
def module_quiz_submit(
    body: QuizSubmitRequest,
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
    cb: CourseBuilder = Depends(get_course_builder),
):
    quiz_list = cb.build_quizzes(body.topic, count=1)
    quiz = quiz_list[0] if quiz_list else None
    total = len(quiz.questions) if quiz else max(len(body.answers), 1)
    correct = _grade_quiz(body.answers, quiz)
    score_pct = round(correct / total * 100)

    _prompt = rag.get_prompt(
        "quizzes", "submit",
        topic=body.topic,
        quiz_title=body.quiz_title or body.quiz_id,
        score=score_pct,
        total=total,
        correct_count=correct,
        incorrect_count=total - correct,
    )
    if body.user_id:
        us.track_progress(body.user_id, {
            "activity_type": "quiz_submit",
            "quiz_id": body.quiz_id,
            "topic": body.topic,
            "score": score_pct,
            "correct": correct,
            "total": total,
        })
    return {
        "quiz_id": body.quiz_id,
        "correct": correct,
        "total": total,
        "score_pct": score_pct,
        "feedback": _quiz_feedback(score_pct),
    }


# ── 20. Progress – track ──────────────────────────────────────────────────────

@router.post("/progress/track", tags=["Progress"])
def track_progress(
    body: ProgressTrackRequest,
    us: UserStore = Depends(get_user_store),
):
    us.track_progress(body.user_id, {
        "activity_type": body.activity_type,
        "topic": body.topic,
        **(body.details or {}),
    })
    return {"success": True, "message": "Activity tracked."}


# ── 21. Progress – get ────────────────────────────────────────────────────────

@router.get("/progress/{user_id}", response_model=AnalyticsData, tags=["Progress"])
def get_progress(
    user_id: str,
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
):
    activities = us.get_progress(user_id)
    topics = list({a.get("topic") for a in activities if a.get("topic")})
    quiz_acts = [a for a in activities if a.get("activity_type") == "quiz_submit"]
    ex_acts = [a for a in activities if a.get("activity_type") == "exercise_submit"]
    avg_score = (
        round(sum(a.get("score", 0) for a in quiz_acts) / len(quiz_acts), 1)
        if quiz_acts
        else 0.0
    )
    _prompt = rag.get_prompt(
        "analytics", "progress",
        user_id=user_id,
        activity_count=len(activities),
        topics=", ".join(topics) or "none yet",
        quiz_count=len(quiz_acts),
        exercise_count=len(ex_acts),
        avg_score=avg_score,
    )
    insights = _generate_insights(activities, topics, avg_score)
    return AnalyticsData(
        user_id=user_id,
        activity_count=len(activities),
        topics_studied=topics,
        quiz_count=len(quiz_acts),
        exercise_count=len(ex_acts),
        avg_quiz_score=avg_score,
        enrollments=len(us.get_enrollments(user_id)),
        insights=insights,
    )


# ── 22. Exercises – list ──────────────────────────────────────────────────────

@router.get("/exercises", tags=["Exercises"])
def list_exercises(
    topic: Optional[str] = Query(None),
    rag: RAGEngine = Depends(get_rag_engine),
    cb: CourseBuilder = Depends(get_course_builder),
):
    t = topic or (rag.list_topics()[0] if rag.list_topics() else "python")
    _prompt = rag.get_prompt("exercises", "list", topic=t)
    exercises = cb.build_exercises(t, count=5)
    return {"topic": t, "exercises": [e.model_dump() for e in exercises]}


# ── 23. Exercises – submit ────────────────────────────────────────────────────

@router.post("/exercises/submit", tags=["Exercises"])
def submit_exercise(
    body: ExerciseSubmitRequest,
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
):
    score = _score_exercise(body.answer, body.topic)
    _prompt = rag.get_prompt(
        "exercises", "submit",
        topic=body.topic,
        exercise_title=body.exercise_title or body.exercise_id,
        user_answer=body.answer[:200],
        expected_answer="See knowledge base.",
    )
    if body.user_id:
        us.track_progress(body.user_id, {
            "activity_type": "exercise_submit",
            "exercise_id": body.exercise_id,
            "topic": body.topic,
            "score": score,
        })
    return {
        "exercise_id": body.exercise_id,
        "score": score,
        "feedback": _exercise_feedback(score),
        "next_exercises": [f"Practice more {body.topic} exercises"],
    }


# ── 24. Quizzes – list ───────────────────────────────────────────────────────

@router.get("/quizzes", tags=["Quizzes"])
def list_quizzes(
    topic: Optional[str] = Query(None),
    rag: RAGEngine = Depends(get_rag_engine),
    cb: CourseBuilder = Depends(get_course_builder),
):
    t = topic or (rag.list_topics()[0] if rag.list_topics() else "python")
    _prompt = rag.get_prompt(
        "quizzes", "list", topic=t, num_questions=3, difficulty="intermediate"
    )
    quizzes = cb.build_quizzes(t, count=3)
    return {"topic": t, "quizzes": [q.model_dump() for q in quizzes]}


# ── 25. Quizzes – submit ──────────────────────────────────────────────────────

@router.post("/quizzes/submit", tags=["Quizzes"])
def submit_quiz(
    body: QuizSubmitRequest,
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
    cb: CourseBuilder = Depends(get_course_builder),
):
    quizzes = cb.build_quizzes(body.topic, count=1)
    quiz = quizzes[0] if quizzes else None
    total = len(quiz.questions) if quiz else max(len(body.answers), 1)
    correct = _grade_quiz(body.answers, quiz)
    score_pct = round(correct / total * 100)

    _prompt = rag.get_prompt(
        "quizzes", "submit",
        topic=body.topic,
        quiz_title=body.quiz_title or body.quiz_id,
        score=score_pct,
        total=total,
        correct_count=correct,
        incorrect_count=total - correct,
    )
    if body.user_id:
        us.track_progress(body.user_id, {
            "activity_type": "quiz_submit",
            "quiz_id": body.quiz_id,
            "topic": body.topic,
            "score": score_pct,
        })
    return {
        "quiz_id": body.quiz_id,
        "correct": correct,
        "total": total,
        "score_pct": score_pct,
        "feedback": _quiz_feedback(score_pct),
    }


# ── 26. Projects – list ───────────────────────────────────────────────────────

@router.get("/projects", tags=["Projects"])
def list_projects(
    topic: Optional[str] = Query(None),
    rag: RAGEngine = Depends(get_rag_engine),
    cb: CourseBuilder = Depends(get_course_builder),
):
    t = topic or (rag.list_topics()[0] if rag.list_topics() else "python")
    _prompt = rag.get_prompt("projects", "list", topic=t, level="all")
    projects = cb.build_projects(t)
    return {"topic": t, "projects": [p.model_dump() for p in projects]}


# ── 27. Mentor – chat ────────────────────────────────────────────────────────

@router.post("/mentor/chat", response_model=MentorChatResponse, tags=["Mentor"])
def mentor_chat(
    body: MentorChatRequest,
    rag: RAGEngine = Depends(get_rag_engine),
):
    topic = body.topic or _infer_topic(body.question, rag.list_topics())
    chunks = rag.search(topic, body.question, top_k=4)
    context = "\n\n".join(chunks[:3])
    _prompt = rag.get_prompt(
        "mentor", "chat",
        question=body.question,
        topic=topic,
        context=context[:600],
    )

    # Build a structured answer from retrieved context
    answer_parts = [f"**Topic: {topic.replace('-', ' ').title()}**\n"]
    if chunks:
        answer_parts.append(chunks[0][:500])
        if len(chunks) > 1:
            answer_parts.append("\n\n**Related concept:**\n" + chunks[1][:300])
    else:
        answer_parts.append(
            f"I couldn't find specific information about that in the {topic} knowledge base. "
            "Try rephrasing or exploring the knowledge base directly."
        )

    sources = [topic + "/overview.md", topic + "/advanced.md"]
    follow_ups = [
        f"Can you explain more about {topic}?",
        f"What are the best practices for {topic}?",
        f"Show me an example of {topic} in action.",
    ]
    return MentorChatResponse(
        answer="\n".join(answer_parts),
        sources=sources,
        topic=topic,
        follow_up_questions=follow_ups,
    )


# ── 28. Learning path ────────────────────────────────────────────────────────

@router.post("/learning-path", tags=["Learning Path"])
def generate_learning_path(
    body: LearningPathRequest,
    rag: RAGEngine = Depends(get_rag_engine),
):
    topics = rag.list_topics()
    goal_lower = body.goal.lower()
    relevant = [t for t in topics if t.replace("-", " ") in goal_lower or t in goal_lower]
    if not relevant:
        relevant = topics[:3]

    weeks_per_topic = max(1, (body.available_hours_per_week or 5) // 5)
    path = []
    for i, topic in enumerate(relevant[:4]):
        path.append({
            "step": i + 1,
            "topic": topic,
            "level": body.current_level,
            "duration_weeks": weeks_per_topic,
            "hours_per_week": body.available_hours_per_week,
            "resources": [f"{topic}/overview.md", f"{topic}/advanced.md"],
        })
    return {
        "goal": body.goal,
        "current_level": body.current_level,
        "total_steps": len(path),
        "estimated_weeks": len(path) * weeks_per_topic,
        "path": path,
    }


# ── 29. Agents – list ────────────────────────────────────────────────────────

@router.get("/agents", tags=["Agents"])
def list_agents(group: Optional[str] = Query(None, description="Filter by group name")):
    agents = get_all_agents()
    if group:
        agents = [a for a in agents if a["group"].lower() == group.lower()]
    return {
        "agents": agents,
        "total": len(agents),
        "groups": get_group_summary(),
    }


# ── 30. Metrics ───────────────────────────────────────────────────────────────

@router.get("/metrics", tags=["System"])
def get_metrics(
    us: UserStore = Depends(get_user_store),
    rag: RAGEngine = Depends(get_rag_engine),
):
    topics = rag.list_topics()
    total_docs = sum(len(rag.get_all_documents(t)) for t in topics)
    return {
        "users": us.user_count(),
        "total_enrollments": us.total_enrollments(),
        "topics_available": len(topics),
        "knowledge_documents": total_docs,
        "agents_active": len(get_all_agents()),
        "api_version": "1.0.0",
        "timestamp": _now(),
    }


# ── Scoring helpers ───────────────────────────────────────────────────────────

_TOPIC_CODE_KEYWORDS: dict = {
    "python":           {"def ", "return ", "for ", "if ", "class ", "import ", "lambda ", "yield "},
    "javascript":       {"function", "const ", "let ", "return ", "=>", "async ", "await ", "class "},
    "react":            {"function", "const ", "useState", "useEffect", "return ", "jsx", "import "},
    "machine-learning": {"def ", "fit", "predict", "import ", "return ", "model", "train", "score"},
    "deep-learning":    {"def ", "class ", "forward", "nn.", "torch", "import ", "model", "layer"},
    "data-science":     {"df", "pd.", "np.", "import ", "groupby", "merge", "plot", "return "},
}
_DEFAULT_CODE_KEYWORDS = {"def ", "return ", "for ", "if ", "function", "class ", "import "}


def _score_exercise(answer: str, topic: str = "") -> int:
    """Heuristic score based on answer length and topic-relevant code keywords."""
    if not answer or len(answer) < 5:
        return 10
    length_score = min(40, len(answer) // 5)
    keywords = _TOPIC_CODE_KEYWORDS.get(topic, _DEFAULT_CODE_KEYWORDS)
    kw_score = sum(10 for kw in keywords if kw in answer)
    return min(100, 30 + length_score + kw_score)


def _grade_quiz(answers: List[int], quiz) -> int:
    if quiz is None or not answers:
        return 0
    correct = 0
    for i, ans in enumerate(answers):
        if i < len(quiz.questions) and ans == quiz.questions[i].correct_answer:
            correct += 1
    return correct


def _exercise_feedback(score: int) -> str:
    if score >= 80:
        return "Excellent work! Your solution demonstrates strong understanding."
    if score >= 60:
        return "Good effort! Review the hints and try to improve your solution."
    return "Keep practising! Check the knowledge base for relevant concepts."


def _quiz_feedback(score_pct: int) -> str:
    if score_pct >= 80:
        return "Outstanding! You have a strong grasp of this topic."
    if score_pct >= 60:
        return "Good job! Review the topics you missed and try again."
    return "Keep studying the material – you'll get there with practice."


def _generate_insights(activities: List[Dict], topics: List[str], avg_score: float) -> List[str]:
    insights = []
    if len(activities) == 0:
        insights.append("Start your first lesson to begin tracking your progress!")
    elif len(activities) < 5:
        insights.append("Great start! You've begun your learning journey.")
    else:
        insights.append(f"You've completed {len(activities)} learning activities – keep it up!")
    if avg_score >= 80:
        insights.append("Your quiz scores are excellent. Consider advancing to the next level.")
    elif avg_score > 0:
        insights.append("Review quiz topics where you scored below 70% for better retention.")
    if len(topics) > 1:
        insights.append(f"You're exploring {len(topics)} topics. Breadth of knowledge is valuable!")
    return insights
