from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4


@dataclass
class UserRecord:
    id: str
    name: str
    email: str
    password: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    profile: Dict = field(default_factory=dict)
    enrollments: List[Dict] = field(default_factory=list)
    progress: Dict[str, Dict] = field(default_factory=dict)
    module_instances: Dict[str, Dict] = field(default_factory=dict)
    exercise_submissions: List[Dict] = field(default_factory=list)
    quiz_submissions: List[Dict] = field(default_factory=list)


class InMemoryUserStore:
    def __init__(self) -> None:
        self.users_by_email: Dict[str, UserRecord] = {}
        self.users_by_id: Dict[str, UserRecord] = {}

    def signup(self, name: str, email: str, password: str) -> UserRecord:
        if email in self.users_by_email:
            raise ValueError("User already exists")
        record = UserRecord(id=str(uuid4()), name=name, email=email, password=password)
        self.users_by_email[email] = record
        self.users_by_id[record.id] = record
        return record

    def login(self, email: str, password: str) -> UserRecord:
        user = self.users_by_email.get(email)
        if not user or user.password != password:
            raise ValueError("Invalid credentials")
        return user

    def get_user(self, user_id: str) -> Optional[UserRecord]:
        return self.users_by_id.get(user_id)

    def save_profile(self, user_id: str, profile: Dict) -> Dict:
        user = self._require_user(user_id)
        user.profile = profile
        return user.profile

    def get_profile(self, user_id: str) -> Dict:
        user = self._require_user(user_id)
        if user.profile:
            return user.profile
        return {
            "user_id": user.id,
            "full_name": user.name,
            "bio": "",
            "location": "",
            "learning_style": "",
            "pace": "",
            "goals": [],
        }

    def enroll(self, user_id: str, enrollment: Dict) -> Dict:
        user = self._require_user(user_id)
        enrollment["id"] = str(uuid4())
        enrollment["created_at"] = datetime.utcnow().isoformat()
        user.enrollments.append(enrollment)
        if enrollment.get("module_id"):
            user.progress.setdefault(
                enrollment["module_id"],
                {
                    "completed_lessons": 0,
                    "completed_concepts": 0,
                    "time_spent_minutes": 0,
                    "completed_chapters": 0,
                    "quizzes_passed": 0,
                    "last_activity": datetime.utcnow().isoformat(),
                },
            )
        return enrollment

    def list_enrollments(self, user_id: str) -> List[Dict]:
        user = self._require_user(user_id)
        return user.enrollments

    def set_module_instance(self, user_id: str, module_id: str, module_payload: Dict) -> Dict:
        user = self._require_user(user_id)
        user.module_instances[module_id] = module_payload
        return module_payload

    def get_module_instance(self, user_id: str, module_id: str) -> Dict:
        user = self._require_user(user_id)
        module = user.module_instances.get(module_id)
        if not module:
            raise ValueError("Module content not found. Build/open module first.")
        return module

    def complete_lesson(self, user_id: str, module_id: str, chapter_id: str, lesson_id: str) -> Dict:
        module = self.get_module_instance(user_id, module_id)
        for ch in module["chapters"]:
            if ch["chapter_id"] != chapter_id:
                continue
            for lesson in ch["lessons"]:
                if lesson["lesson_id"] == lesson_id:
                    if not lesson.get("completed"):
                        lesson["completed"] = True
                        self.track_activity(user_id, module_id, lessons=1, concepts=len(lesson.get("concepts", [])), minutes=15)
                    return lesson
        raise ValueError("Lesson not found")

    def complete_chapter(self, user_id: str, module_id: str, chapter_id: str) -> Dict:
        module = self.get_module_instance(user_id, module_id)
        for ch in module["chapters"]:
            if ch["chapter_id"] == chapter_id:
                if not ch.get("completed"):
                    ch["completed"] = True
                    bucket = self._progress_bucket(user_id, module_id)
                    bucket["completed_chapters"] += 1
                    bucket["last_activity"] = datetime.utcnow().isoformat()
                return ch
        raise ValueError("Chapter not found")

    def submit_module_quiz(self, user_id: str, module_id: str, chapter_id: str, quiz_id: str, answer: str) -> Dict:
        module = self.get_module_instance(user_id, module_id)
        for ch in module["chapters"]:
            if ch["chapter_id"] != chapter_id:
                continue
            for quiz in ch["quizzes"]:
                if quiz["quiz_id"] == quiz_id:
                    score = 1 if answer == quiz["answer"] else 0
                    quiz["completed"] = True
                    quiz["score"] = score
                    self.save_quiz_submission(user_id, quiz_id, score, 1)
                    if score == 1:
                        bucket = self._progress_bucket(user_id, module_id)
                        bucket["quizzes_passed"] += 1
                        bucket["last_activity"] = datetime.utcnow().isoformat()
                    return {"quiz_id": quiz_id, "score": score, "total": 1}
        raise ValueError("Quiz not found")

    def track_activity(self, user_id: str, module_id: str, lessons: int, concepts: int, minutes: int) -> Dict:
        bucket = self._progress_bucket(user_id, module_id)
        bucket["completed_lessons"] += max(0, lessons)
        bucket["completed_concepts"] += max(0, concepts)
        bucket["time_spent_minutes"] += max(0, minutes)
        bucket["last_activity"] = datetime.utcnow().isoformat()
        return bucket

    def save_exercise_submission(self, user_id: str, exercise_id: str, score: int, feedback: str) -> Dict:
        user = self._require_user(user_id)
        submission = {
            "id": str(uuid4()),
            "exercise_id": exercise_id,
            "score": score,
            "feedback": feedback,
            "created_at": datetime.utcnow().isoformat(),
        }
        user.exercise_submissions.append(submission)
        return submission

    def save_quiz_submission(self, user_id: str, quiz_id: str, score: int, total: int) -> Dict:
        user = self._require_user(user_id)
        submission = {
            "id": str(uuid4()),
            "quiz_id": quiz_id,
            "score": score,
            "total": total,
            "created_at": datetime.utcnow().isoformat(),
        }
        user.quiz_submissions.append(submission)
        return submission

    def _require_user(self, user_id: str) -> UserRecord:
        user = self.get_user(user_id)
        if not user:
            raise ValueError("User not found")
        return user

    def _progress_bucket(self, user_id: str, module_id: str) -> Dict:
        user = self._require_user(user_id)
        return user.progress.setdefault(
            module_id,
            {
                "completed_lessons": 0,
                "completed_concepts": 0,
                "time_spent_minutes": 0,
                "completed_chapters": 0,
                "quizzes_passed": 0,
                "last_activity": datetime.utcnow().isoformat(),
            },
        )


user_store = InMemoryUserStore()
