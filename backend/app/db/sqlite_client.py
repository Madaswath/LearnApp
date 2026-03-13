from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from app.core.config import settings


class SQLiteClient:
    def __init__(self) -> None:
        self.db_path = Path(settings.sqlite_db_path)
        if not self.db_path.is_absolute():
            self.db_path = Path(__file__).resolve().parents[2] / self.db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_schema(self) -> None:
        with self.connection() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS app_users (
                    id TEXT PRIMARY KEY,
                    email TEXT,
                    full_name TEXT,
                    password_hash TEXT,
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT,
                    full_name TEXT,
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS enrollments (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    topic TEXT,
                    difficulty TEXT,
                    module_id TEXT,
                    module_title TEXT,
                    enrolled_at TEXT
                );

                CREATE TABLE IF NOT EXISTS module_instances (
                    user_id TEXT,
                    module_id TEXT,
                    payload TEXT,
                    updated_at TEXT,
                    PRIMARY KEY (user_id, module_id)
                );

                CREATE TABLE IF NOT EXISTS module_progress (
                    user_id TEXT,
                    module_id TEXT,
                    completed_lessons INTEGER,
                    completed_concepts INTEGER,
                    completed_chapters INTEGER,
                    quizzes_passed INTEGER,
                    streak_days INTEGER,
                    course_completed INTEGER DEFAULT 0,
                    time_spent_minutes INTEGER,
                    last_activity TEXT,
                    PRIMARY KEY (user_id, module_id)
                );


                CREATE TABLE IF NOT EXISTS exercise_submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    module_id TEXT,
                    exercise_id TEXT,
                    score INTEGER,
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS quiz_submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    module_id TEXT,
                    quiz_id TEXT,
                    score INTEGER,
                    total INTEGER,
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS mentor_conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    learning_path_id TEXT,
                    module_id TEXT,
                    question TEXT,
                    answer TEXT,
                    context_sources TEXT,
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS recommendations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    learning_path_id TEXT,
                    recommendation TEXT,
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    learning_path_id TEXT,
                    metric_name TEXT,
                    metric_value REAL,
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS skill_gaps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    learning_path_id TEXT,
                    gap_name TEXT,
                    severity TEXT,
                    created_at TEXT
                );
                """
            )
            cols = [row[1] for row in conn.execute("PRAGMA table_info(module_progress)").fetchall()]
            if "course_completed" not in cols:
                conn.execute("ALTER TABLE module_progress ADD COLUMN course_completed INTEGER DEFAULT 0")


sqlite_client = SQLiteClient()
