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

    def _safe_upsert(self, table: str, payload: Dict, on_conflict: str | None = None) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        query = sb.table(table).upsert(payload, on_conflict=on_conflict) if on_conflict else sb.table(table).upsert(payload)
        try:
            query.execute()
        except Exception:
            # Keep app usable during demos even if optional alignment tables are not migrated yet.
            return

    def _safe_insert(self, table: str, payload: Dict) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        try:
            sb.table(table).insert(payload).execute()
        except Exception:
            return

    def create_or_update_user(self, user_id: str, name: str, email: str, password: str) -> None:
        if not self.enabled:
            return
        payload = {
            "id": user_id,
            "email": email,
            "full_name": name,
            "password_hash": self._hash(password),
            "created_at": self._now(),
        }
        self._safe_upsert("app_users", payload, on_conflict="id")
        # Backward-compatible fallback to baseline users table
        self._safe_upsert("users", {k: payload[k] for k in ["id", "email", "full_name", "created_at"]}, on_conflict="id")

    def save_enrollment(self, enrollment: Dict) -> None:
        self._safe_upsert("enrollments", enrollment, on_conflict="id")

    def save_module_instance(self, user_id: str, module_id: str, payload: Dict) -> None:
        self._safe_upsert(
            "module_instances",
            {
                "user_id": user_id,
                "module_id": module_id,
                "payload": payload,
                "updated_at": self._now(),
            },
            on_conflict="user_id,module_id",
        )

    def save_module_progress(self, user_id: str, module_id: str, progress: Dict) -> None:
        self._safe_upsert(
            "module_progress",
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
        )

    def save_exercise_submission(self, user_id: str, module_id: str, exercise_id: str, score: int) -> None:
        self._safe_insert(
            "exercise_submissions",
            {
                "user_id": user_id,
                "module_id": module_id,
                "exercise_id": exercise_id,
                "score": score,
                "created_at": self._now(),
            },
        )

    def save_quiz_submission(self, user_id: str, module_id: str, quiz_id: str, score: int, total: int) -> None:
        self._safe_insert(
            "quiz_submissions",
            {
                "user_id": user_id,
                "module_id": module_id,
                "quiz_id": quiz_id,
                "score": score,
                "total": total,
                "created_at": self._now(),
            },
        )

    def save_mentor_message(self, user_id: str, module_id: str, question: str, answer: str, sources: list[str]) -> None:
        self._safe_insert(
            "mentor_conversations",
            {
                "user_id": user_id,
                "learning_path_id": None,
                "module_id": module_id,
                "question": question,
                "answer": answer,
                "context_sources": sources,
                "created_at": self._now(),
            },
        )
