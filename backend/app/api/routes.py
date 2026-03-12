from fastapi import APIRouter
from app.core.config import HealthResponse, settings
from app.models.schemas import (
    LearningPathRequest,
    LearningPathResponse,
    MentorMessageRequest,
    MentorMessageResponse,
)
from app.services.agent_orchestrator import AgentOrchestrator
from app.services.rag_engine import RAGEngine


router = APIRouter()
orchestrator = AgentOrchestrator()
rag_engine = RAGEngine()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", app=settings.app_name)


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
