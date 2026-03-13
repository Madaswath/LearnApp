import re

from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.models.schemas import (
    ActivityTrackRequest,
    AuthResponse,
    ChapterCompleteRequest,
    EnrollRequest,
    EnrollResponse,
    ExerciseItem,
    ExerciseSubmitRequest,
    ExerciseSubmitResponse,
    HealthResponse,
    KnowledgeSearchResponse,
    LearningPathRequest,
    LearningPathResponse,
    LessonCompleteRequest,
    LoginRequest,
    MentorMessageRequest,
    MentorMessageResponse,
    ModuleBuildRequest,
    ModuleContentResponse,
    ModuleEvaluationResponse,
    ModuleExerciseSubmitRequest,
    ModuleQuizSubmitRequest,
    ProjectItem,
    PromptRenderRequest,
    PromptRenderResponse,
    QuizItem,
    QuizSubmitRequest,
    QuizSubmitResponse,
    SignupRequest,
    TopicSearchRequest,
    TopicSearchResponse,
    UserProfile,
    UserProgressResponse,
)
from app.services.agent_orchestrator import AgentOrchestrator
from app.services.content_bank import list_exercises, list_projects, list_quizzes
from app.services.curriculum_builder import CurriculumBuilder
from app.services.knowledge_base import KnowledgeBase
from app.services.prompt_library import PromptLibrary
from app.services.rag_engine import RAGEngine
from app.services.sqlite_repository import SQLiteRepository
from app.services.sqlite_tracker import SQLiteTracker
from app.services.user_store import user_store


router = APIRouter()
orchestrator = AgentOrchestrator()
rag_engine = RAGEngine()
curriculum_builder = CurriculumBuilder()
kb = KnowledgeBase()
prompts = PromptLibrary()
tracker = SQLiteTracker()
repo = SQLiteRepository()


def _is_strong_password(password: str) -> bool:
    return (
        len(password) >= 8
        and bool(re.search(r"[A-Z]", password))
        and bool(re.search(r"[a-z]", password))
        and bool(re.search(r"\d", password))
        and bool(re.search(r"[^A-Za-z0-9]", password))
    )

@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", app=settings.app_name)


@router.post("/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest) -> AuthResponse:
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Password and re-entered password do not match")
    if not _is_strong_password(payload.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 chars and include uppercase, lowercase, number, and special character",
        )
    try:
        user = user_store.signup(payload.name, payload.email, payload.password)
        repo.create_or_update_user(user.id, user.name, user.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AuthResponse(user_id=user.id, name=user.name, email=user.email)


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    try:
        user = user_store.login(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return AuthResponse(user_id=user.id, name=user.name, email=user.email)


@router.get("/knowledge/topics")
def knowledge_topics() -> dict:
    return {"topics": kb.list_topics()}


@router.get("/knowledge/{topic}", response_model=KnowledgeSearchResponse)
def knowledge_topic(topic: str, q: str = "") -> KnowledgeSearchResponse:
    documents = kb.retrieve(topic=topic, query=q or topic, k=8)
    return KnowledgeSearchResponse(topic=topic, documents=documents)


@router.post("/prompts/{prompt_name}", response_model=PromptRenderResponse)
def render_prompt(prompt_name: str, payload: PromptRenderRequest) -> PromptRenderResponse:
    try:
        rendered = prompts.render(prompt_name, topic=payload.topic, difficulty=payload.difficulty)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return PromptRenderResponse(prompt_name=prompt_name, rendered_prompt=rendered)


@router.get("/settings/profile/{user_id}", response_model=UserProfile)
def get_profile(user_id: str) -> UserProfile:
    try:
        profile = user_store.get_profile(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return UserProfile(**profile)


@router.post("/settings/profile", response_model=UserProfile)
def save_profile(payload: UserProfile) -> UserProfile:
    try:
        profile = user_store.save_profile(payload.user_id, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return UserProfile(**profile)


@router.post("/topics/search", response_model=TopicSearchResponse)
def search_topic(payload: TopicSearchRequest) -> TopicSearchResponse:
    module_data = curriculum_builder.build_topic_modules(payload.topic)
    return TopicSearchResponse(**module_data)


@router.post("/enroll", response_model=EnrollResponse)
def enroll(payload: EnrollRequest) -> EnrollResponse:
    try:
        rec = user_store.enroll(payload.user_id, payload.model_dump())
        repo.save_enrollment(rec)
        tracker.record_enrollment(payload.user_id, payload.module_id, payload.topic, payload.difficulty)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return EnrollResponse(**rec)


@router.get("/enrollments/{user_id}")
def list_enrollments(user_id: str) -> dict:
    try:
        enrollments = user_store.list_enrollments(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"user_id": user_id, "enrollments": enrollments}


@router.post("/modules/build", response_model=ModuleContentResponse)
def build_module(payload: ModuleBuildRequest) -> ModuleContentResponse:
    module_data = curriculum_builder.build_module_content(payload.topic, payload.difficulty, payload.module_id)
    try:
        stored = user_store.set_module_instance(payload.user_id, payload.module_id, module_data)
        repo.save_module_instance(payload.user_id, payload.module_id, stored)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ModuleContentResponse(**stored)


@router.get("/modules/{user_id}/{module_id}", response_model=ModuleContentResponse)
def get_module(user_id: str, module_id: str) -> ModuleContentResponse:
    try:
        module = user_store.get_module_instance(user_id, module_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ModuleContentResponse(**module)


@router.post("/modules/lesson/complete")
def complete_lesson(payload: LessonCompleteRequest) -> dict:
    try:
        lesson = user_store.complete_lesson(payload.user_id, payload.module_id, payload.chapter_id, payload.lesson_id)
        progress = user_store._progress_bucket(payload.user_id, payload.module_id)
        repo.save_module_progress(payload.user_id, payload.module_id, progress)
        tracker.record_progress(payload.user_id, payload.module_id, progress)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"lesson": lesson}


@router.post("/modules/exercise/submit", response_model=ExerciseSubmitResponse)
def submit_module_exercise(payload: ModuleExerciseSubmitRequest) -> ExerciseSubmitResponse:
    try:
        result = user_store.submit_module_exercise(
            payload.user_id,
            payload.module_id,
            payload.chapter_id,
            payload.exercise_id,
            payload.solution,
        )
        repo.save_exercise_submission(payload.user_id, payload.module_id, payload.exercise_id, result["score"])
        progress = user_store._progress_bucket(payload.user_id, payload.module_id)
        repo.save_module_progress(payload.user_id, payload.module_id, progress)
        tracker.record_progress(payload.user_id, payload.module_id, progress)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ExerciseSubmitResponse(**result)


@router.post("/modules/chapter/complete")
def complete_chapter(payload: ChapterCompleteRequest) -> dict:
    try:
        chapter = user_store.complete_chapter(payload.user_id, payload.module_id, payload.chapter_id)
        progress = user_store._progress_bucket(payload.user_id, payload.module_id)
        repo.save_module_progress(payload.user_id, payload.module_id, progress)
        tracker.record_progress(payload.user_id, payload.module_id, progress)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"chapter": chapter}


@router.post("/modules/quiz/submit", response_model=QuizSubmitResponse)
def submit_module_quiz(payload: ModuleQuizSubmitRequest) -> QuizSubmitResponse:
    try:
        result = user_store.submit_module_quiz(
            payload.user_id,
            payload.module_id,
            payload.chapter_id,
            payload.quiz_id,
            payload.answer,
        )
        repo.save_quiz_submission(payload.user_id, payload.module_id, payload.quiz_id, result["score"], result["total"])
        tracker.record_quiz_performance(payload.user_id, payload.quiz_id, result["score"], result["total"])
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return QuizSubmitResponse(**result)


@router.get("/modules/{user_id}/{module_id}/evaluation", response_model=ModuleEvaluationResponse)
def module_evaluation(user_id: str, module_id: str) -> ModuleEvaluationResponse:
    try:
        evaluation = user_store.evaluate_next_steps(user_id, module_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ModuleEvaluationResponse(**evaluation)


@router.post("/progress/track")
def track_progress(payload: ActivityTrackRequest) -> dict:
    try:
        progress = user_store.track_activity(
            payload.user_id,
            payload.module_id,
            payload.lessons_completed,
            payload.concepts_completed,
            payload.minutes_spent,
        )
        tracker.record_progress(payload.user_id, payload.module_id, progress)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"module_id": payload.module_id, "progress": progress}


@router.get("/progress/{user_id}", response_model=UserProgressResponse)
def get_progress(user_id: str) -> UserProgressResponse:
    user = user_store.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    snapshots = [{"module_id": mid, **vals} for mid, vals in user.progress.items()]
    return UserProgressResponse(user_id=user_id, progress=snapshots)


@router.get("/exercises", response_model=list[ExerciseItem])
def exercises() -> list[ExerciseItem]:
    return [ExerciseItem(**item) for item in list_exercises()]


@router.post("/exercises/submit", response_model=ExerciseSubmitResponse)
def submit_exercise(payload: ExerciseSubmitRequest) -> ExerciseSubmitResponse:
    score = 85 if len(payload.solution.strip()) > 30 else 65
    feedback = "Good approach. Add more edge-case handling." if score < 80 else "Great work with clear logic."
    try:
        user_store.save_exercise_submission(payload.user_id, payload.exercise_id, score, feedback)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ExerciseSubmitResponse(exercise_id=payload.exercise_id, score=score, feedback=feedback)


@router.get("/quizzes", response_model=list[QuizItem])
def quizzes() -> list[QuizItem]:
    return [QuizItem(**item) for item in list_quizzes()]


@router.post("/quizzes/submit", response_model=QuizSubmitResponse)
def submit_quiz(payload: QuizSubmitRequest) -> QuizSubmitResponse:
    quiz = next((q for q in list_quizzes() if q["id"] == payload.quiz_id), None)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    total = len(quiz["questions"])
    score = sum(1 for q in quiz["questions"] if payload.answers.get(q["id"]) == q["answer"])
    try:
        user_store.save_quiz_submission(payload.user_id, payload.quiz_id, score, total)
        repo.save_quiz_submission(payload.user_id, "global", payload.quiz_id, score, total)
        tracker.record_quiz_performance(payload.user_id, payload.quiz_id, score, total)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return QuizSubmitResponse(quiz_id=payload.quiz_id, score=score, total=total)


@router.get("/projects", response_model=list[ProjectItem])
def projects() -> list[ProjectItem]:
    return [ProjectItem(**item) for item in list_projects()]



@router.get("/demo/readiness")
def demo_readiness() -> dict:
    checks = {
        "knowledge_topics": len(kb.list_topics()),
        "prompt_templates": len(prompts.names()),
        "sqlite_tracker_enabled": tracker.enabled,
        "sqlite_repo_enabled": repo.enabled,
    }
    actions = []
    if not repo.enabled:
        actions.append("Set SQLITE_DB_PATH (optional) to customize where persistent multi-user demo data is stored.")
    actions.append("SQLite tables are auto-created on startup when the backend imports the persistence layer.")
    actions.append("Use /docs to validate signup -> enroll -> start module -> lesson/exercise/quiz/chapter completion -> evaluation flow.")
    return {"checks": checks, "actions": actions}


@router.get("/agents")
def list_agents() -> dict:
    return {"count": len(orchestrator.agents), "agents": [a.__dict__ for a in orchestrator.agents]}


@router.post("/learning-path", response_model=LearningPathResponse)
def create_learning_path(payload: LearningPathRequest) -> LearningPathResponse:
    generated = orchestrator.generate_path(payload.topic, payload.skill_level, payload.target_duration_weeks)
    return LearningPathResponse(
        topic=generated["topic"],
        chapters=generated["chapters"],
        recommendations=generated["recommendations"],
    )


@router.post("/mentor/chat", response_model=MentorMessageResponse)
def mentor_chat(payload: MentorMessageRequest) -> MentorMessageResponse:
    user = user_store.get_user(payload.user_id)
    progress = None
    if user:
        progress = user.progress.get(payload.learning_path_id) or {}
    response = rag_engine.answer(topic=payload.topic, question=payload.question, user_progress=progress)
    repo.save_mentor_message(payload.user_id, payload.learning_path_id, payload.question, response["answer"], response["sources"])
    return MentorMessageResponse(answer=response["answer"], sources=response["sources"])
