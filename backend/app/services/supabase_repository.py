from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Dict

from app.core.config import settings
from app.db.supabase_client import get_supabase


class SupabaseRepository:
    """Best-effort persistence layer for demo alignment with SQL schema."""

    def __init__(self) -> None:
        self.enabled = bool(settings.supabase_url and settings.supabase_anon_key)

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _hash(self, raw: str) -> str:
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def create_or_update_user(self, user_id: str, name: str, email: str, password: str) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("app_users").upsert(
            {
                "id": user_id,
                "email": email,
                "full_name": name,
                "password_hash": self._hash(password),
                "created_at": self._now(),
            },
            on_conflict="id",
        ).execute()

    def save_enrollment(self, enrollment: Dict) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("enrollments").upsert(enrollment, on_conflict="id").execute()

    def save_module_instance(self, user_id: str, module_id: str, payload: Dict) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("module_instances").upsert(
            {
                "user_id": user_id,
                "module_id": module_id,
                "payload": payload,
                "updated_at": self._now(),
            },
            on_conflict="user_id,module_id",
        ).execute()

    def save_module_progress(self, user_id: str, module_id: str, progress: Dict) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("module_progress").upsert(
            {
                "user_id": user_id,
                "module_id": module_id,
                "completed_lessons": progress.get("completed_lessons", 0),
                "completed_concepts": progress.get("completed_concepts", 0),
                "completed_chapters": progress.get("completed_chapters", 0),
                "quizzes_passed": progress.get("quizzes_passed", 0),
                "streak_days": progress.get("streak_days", 0),
                "time_spent_minutes": progress.get("time_spent_minutes", 0),
                "last_activity": progress.get("last_activity", self._now()),
            },
            on_conflict="user_id,module_id",
        ).execute()

    def save_exercise_submission(self, user_id: str, module_id: str, exercise_id: str, score: int) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("exercise_submissions").insert(
            {
                "user_id": user_id,
                "module_id": module_id,
                "exercise_id": exercise_id,
                "score": score,
                "created_at": self._now(),
            }
        ).execute()

    def save_quiz_submission(self, user_id: str, module_id: str, quiz_id: str, score: int, total: int) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("quiz_submissions").insert(
            {
                "user_id": user_id,
                "module_id": module_id,
                "quiz_id": quiz_id,
                "score": score,
                "total": total,
                "created_at": self._now(),
            }
        ).execute()

    def save_mentor_message(self, user_id: str, module_id: str, question: str, answer: str, sources: list[str]) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("mentor_conversations").insert(
            {
                "user_id": user_id,
                "learning_path_id": None,
                "module_id": module_id,
                "question": question,
                "answer": answer,
                "context_sources": sources,
                "created_at": self._now(),
            }
        ).execute()
