from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    user_id: str
    learning_style: Optional[str] = None
    pace: Optional[str] = None
    goals: List[str] = Field(default_factory=list)


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
