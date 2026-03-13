from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict

from app.db.sqlite_client import sqlite_client


class SQLiteRepository:
    """SQLite persistence layer for local multi-user demo data."""

    def __init__(self) -> None:
        self.enabled = True

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _hash(self, raw: str) -> str:
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def create_or_update_user(self, user_id: str, name: str, email: str, password: str) -> None:
        with sqlite_client.connection() as conn:
            conn.execute(
                """
                INSERT INTO app_users (id, email, full_name, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    email=excluded.email,
                    full_name=excluded.full_name,
                    password_hash=excluded.password_hash,
                    created_at=excluded.created_at
                """,
                (user_id, email, name, self._hash(password), self._now()),
            )
            conn.execute(
                """
                INSERT INTO users (id, email, full_name, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    email=excluded.email,
                    full_name=excluded.full_name,
                    created_at=excluded.created_at
                """,
                (user_id, email, name, self._now()),
            )

    def save_enrollment(self, enrollment: Dict[str, Any]) -> None:
        with sqlite_client.connection() as conn:
            conn.execute(
                """
                INSERT INTO enrollments (id, user_id, topic, difficulty, module_id, module_title, enrolled_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    user_id=excluded.user_id,
                    topic=excluded.topic,
                    difficulty=excluded.difficulty,
                    module_id=excluded.module_id,
                    module_title=excluded.module_title,
                    enrolled_at=excluded.enrolled_at
                """,
                (
                    enrollment.get("id"),
                    enrollment.get("user_id"),
                    enrollment.get("topic"),
                    enrollment.get("difficulty"),
                    enrollment.get("module_id"),
                    enrollment.get("module_title"),
                    enrollment.get("enrolled_at", self._now()),
                ),
            )

    def save_module_instance(self, user_id: str, module_id: str, payload: Dict[str, Any]) -> None:
        with sqlite_client.connection() as conn:
            conn.execute(
                """
                INSERT INTO module_instances (user_id, module_id, payload, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, module_id) DO UPDATE SET
                    payload=excluded.payload,
                    updated_at=excluded.updated_at
                """,
                (user_id, module_id, json.dumps(payload), self._now()),
            )

    def save_module_progress(self, user_id: str, module_id: str, progress: Dict[str, Any]) -> None:
        with sqlite_client.connection() as conn:
            conn.execute(
                """
                INSERT INTO module_progress (
                    user_id, module_id, completed_lessons, completed_concepts,
                    completed_chapters, quizzes_passed, streak_days, course_completed, time_spent_minutes, last_activity
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, module_id) DO UPDATE SET
                    completed_lessons=excluded.completed_lessons,
                    completed_concepts=excluded.completed_concepts,
                    completed_chapters=excluded.completed_chapters,
                    quizzes_passed=excluded.quizzes_passed,
                    streak_days=excluded.streak_days,
                    course_completed=excluded.course_completed,
                    time_spent_minutes=excluded.time_spent_minutes,
                    last_activity=excluded.last_activity
                """,
                (
                    user_id,
                    module_id,
                    progress.get("completed_lessons", 0),
                    progress.get("completed_concepts", 0),
                    progress.get("completed_chapters", 0),
                    progress.get("quizzes_passed", 0),
                    progress.get("streak_days", 0),
                    1 if progress.get("course_completed") else 0,
                    progress.get("time_spent_minutes", 0),
                    progress.get("last_activity", self._now()),
                ),
            )

    def save_exercise_submission(self, user_id: str, module_id: str, exercise_id: str, score: int) -> None:
        with sqlite_client.connection() as conn:
            conn.execute(
                """
                INSERT INTO exercise_submissions (user_id, module_id, exercise_id, score, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, module_id, exercise_id, score, self._now()),
            )

    def save_quiz_submission(self, user_id: str, module_id: str, quiz_id: str, score: int, total: int) -> None:
        with sqlite_client.connection() as conn:
            conn.execute(
                """
                INSERT INTO quiz_submissions (user_id, module_id, quiz_id, score, total, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, module_id, quiz_id, score, total, self._now()),
            )

    def save_mentor_message(self, user_id: str, module_id: str, question: str, answer: str, sources: list[str]) -> None:
        with sqlite_client.connection() as conn:
            conn.execute(
                """
                INSERT INTO mentor_conversations (
                    user_id, learning_path_id, module_id, question, answer, context_sources, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, None, module_id, question, answer, json.dumps(sources), self._now()),
            )
