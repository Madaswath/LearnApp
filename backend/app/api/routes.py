from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.models.schemas import (
    ActivityTrackRequest,
    AuthResponse,
    EnrollRequest,
    EnrollResponse,
    HealthResponse,
    LearningPathRequest,
    LearningPathResponse,
    LoginRequest,
    MentorMessageRequest,
    MentorMessageResponse,
    SignupRequest,
    TopicSearchRequest,
    TopicSearchResponse,
    UserProfile,
    UserProgressResponse,
)
from app.services.agent_orchestrator import AgentOrchestrator
from app.services.curriculum_builder import CurriculumBuilder
from app.services.rag_engine import RAGEngine
from app.services.user_store import user_store


router = APIRouter()
orchestrator = AgentOrchestrator()
rag_engine = RAGEngine()
curriculum_builder = CurriculumBuilder()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", app=settings.app_name)


@router.post("/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest) -> AuthResponse:
    try:
        user = user_store.signup(payload.name, payload.email, payload.password)
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
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return EnrollResponse(**rec)


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
    response = rag_engine.answer(payload.question)
    return MentorMessageResponse(answer=response["answer"], sources=response["sources"])
