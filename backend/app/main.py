from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router
from app.services.rag_engine import rag_engine
from app.services.user_store import user_store
from app.services.course_builder import course_builder


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: (re)load the knowledge base and prompt templates
    rag_engine.reload()
    yield
    # Shutdown: nothing to clean up for in-memory stores


app = FastAPI(
    title="Lumina AI Learning Platform",
    description="AI-powered learning management system backed by a local knowledge base.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # Set ALLOWED_ORIGINS env var (comma-separated) to restrict origins in production.
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix)
