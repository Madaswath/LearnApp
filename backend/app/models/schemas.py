from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str
    name: str
    message: str


class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    bio: Optional[str] = None
    skill_level: Optional[str] = "beginner"
    interests: List[str] = []
    created_at: Optional[str] = None


# ── Courses ───────────────────────────────────────────────────────────────────

class TopicSearchRequest(BaseModel):
    query: str
    level: Optional[str] = "beginner"
    topic: Optional[str] = None


class EnrollRequest(BaseModel):
    user_id: str
    module_id: str
    topic: str
    level: Optional[str] = "beginner"


class ModuleBuildRequest(BaseModel):
    topic: str
    level: str = "beginner"
    user_id: Optional[str] = None


class LessonCompleteRequest(BaseModel):
    user_id: str
    module_id: str
    chapter_id: str
    lesson_id: str


class ChapterCompleteRequest(BaseModel):
    user_id: str
    module_id: str
    chapter_id: str


# ── Exercises ─────────────────────────────────────────────────────────────────

class ExerciseSubmitRequest(BaseModel):
    user_id: Optional[str] = None
    exercise_id: str
    topic: str
    answer: str
    exercise_title: Optional[str] = ""


# ── Quizzes ───────────────────────────────────────────────────────────────────

class QuizSubmitRequest(BaseModel):
    user_id: Optional[str] = None
    quiz_id: str
    topic: str
    answers: List[int]
    quiz_title: Optional[str] = ""


# ── Mentor ────────────────────────────────────────────────────────────────────

class MentorChatRequest(BaseModel):
    question: str
    topic: Optional[str] = None
    user_id: Optional[str] = None


class MentorChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    topic: Optional[str] = None
    follow_up_questions: List[str] = []


# ── Learning Path ─────────────────────────────────────────────────────────────

class LearningPathRequest(BaseModel):
    user_id: Optional[str] = None
    goal: str
    current_level: Optional[str] = "beginner"
    available_hours_per_week: Optional[int] = 5


# ── Progress ──────────────────────────────────────────────────────────────────

class ProgressTrackRequest(BaseModel):
    user_id: str
    activity_type: str
    topic: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


# ── Knowledge ─────────────────────────────────────────────────────────────────

class KnowledgeDocument(BaseModel):
    topic: str
    filename: str
    content: str


# ── Course structure ──────────────────────────────────────────────────────────

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int  # index into options


class Quiz(BaseModel):
    id: str
    title: str
    topic: str
    questions: List[QuizQuestion]


class Exercise(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    topic: str
    starter_code: str
    solution: str
    hints: List[str]


class Lesson(BaseModel):
    id: str
    title: str
    content: str
    duration_minutes: int = 10


class Chapter(BaseModel):
    id: str
    title: str
    lessons: List[Lesson]
    exercises: List[Exercise]
    quizzes: List[Quiz]


class CourseModule(BaseModel):
    id: str
    title: str
    description: str
    topic: str
    level: str
    chapters: List[Chapter]
    estimated_hours: int = 0


class Project(BaseModel):
    id: str
    title: str
    description: str
    topic: str
    difficulty: str
    requirements: List[str]


# ── System ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    services: Dict[str, str]


class DemoReadinessResponse(BaseModel):
    ready: bool
    services: Dict[str, bool]
    topics_available: List[str]
    message: str


class AnalyticsData(BaseModel):
    user_id: str
    activity_count: int
    topics_studied: List[str]
    quiz_count: int
    exercise_count: int
    avg_quiz_score: float
    enrollments: int
    insights: List[str]
