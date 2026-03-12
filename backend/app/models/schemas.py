from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr


class UserProfile(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    learning_style: Optional[str] = None
    pace: Optional[str] = None
    goals: List[str] = Field(default_factory=list)


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user_id: str
    name: str
    email: EmailStr


class TopicSearchRequest(BaseModel):
    topic: str


class LessonPlan(BaseModel):
    lesson_title: str
    concepts: List[str]


class TopicModule(BaseModel):
    module_id: str
    title: str
    difficulty: str
    estimated_hours: int
    lessons: List[LessonPlan]
    projects: List[str]


class TopicSearchResponse(BaseModel):
    topic: str
    modules: List[TopicModule]


class EnrollRequest(BaseModel):
    user_id: str
    topic: str
    module_id: str
    module_title: str
    difficulty: str


class EnrollResponse(BaseModel):
    id: str
    user_id: str
    topic: str
    module_id: str
    module_title: str
    difficulty: str
    created_at: str


class ActivityTrackRequest(BaseModel):
    user_id: str
    module_id: str
    lessons_completed: int = 0
    concepts_completed: int = 0
    minutes_spent: int = 0


class ProgressSnapshot(BaseModel):
    module_id: str
    completed_lessons: int
    completed_concepts: int
    time_spent_minutes: int
    last_activity: Optional[str] = None


class UserProgressResponse(BaseModel):
    user_id: str
    progress: List[ProgressSnapshot]


class ExerciseItem(BaseModel):
    id: str
    title: str
    difficulty: str
    prompt: str


class ExerciseSubmitRequest(BaseModel):
    user_id: str
    exercise_id: str
    solution: str


class ExerciseSubmitResponse(BaseModel):
    exercise_id: str
    score: int
    feedback: str


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    answer: str


class QuizItem(BaseModel):
    id: str
    title: str
    difficulty: str
    questions: List[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    user_id: str
    quiz_id: str
    answers: Dict[str, str]


class QuizSubmitResponse(BaseModel):
    quiz_id: str
    score: int
    total: int


class ProjectItem(BaseModel):
    id: str
    title: str
    level: str
    brief: str
    milestones: List[str]


class LearningPathRequest(BaseModel):
    user_id: str
    topic: str
    skill_level: str = "beginner"
    target_duration_weeks: int = 12


class Chapter(BaseModel):
    title: str
    level: str
    objectives: List[str]


class LearningPathResponse(BaseModel):
    topic: str
    chapters: List[Chapter]
    recommendations: List[str]


class MentorMessageRequest(BaseModel):
    user_id: str
    learning_path_id: str
    question: str


class MentorMessageResponse(BaseModel):
    answer: str
    sources: List[str] = Field(default_factory=list)


class ProgressEvent(BaseModel):
    user_id: str
    learning_path_id: str
    lesson_id: Optional[str] = None
    exercise_id: Optional[str] = None
    quiz_id: Optional[str] = None
    score: Optional[float] = None
    completed: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    status: str
    app: str
