"""
SQLite3 database initialisation for Lumina AI.

The database file is stored at the path configured by settings.db_path
(default: storage/lumina.db relative to the backend directory).

All tables are created on first startup via `init_db()`.
"""
import json
import sqlite3
from pathlib import Path

from app.core.config import settings


def _get_db_path() -> Path:
    p = Path(settings.db_path)
    if not p.is_absolute():
        # Resolve relative paths from the backend package root
        p = Path(__file__).resolve().parent.parent.parent / p
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite3 connection with row_factory set."""
    conn = sqlite3.connect(str(_get_db_path()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


_DDL = """
CREATE TABLE IF NOT EXISTS users (
    user_id     TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name        TEXT NOT NULL,
    bio         TEXT,
    skill_level TEXT NOT NULL DEFAULT 'beginner',
    interests   TEXT NOT NULL DEFAULT '[]',
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT    NOT NULL,
    activity_type TEXT    NOT NULL,
    topic         TEXT,
    details       TEXT    NOT NULL DEFAULT '{}',
    timestamp     TEXT    NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT    NOT NULL,
    module_id    TEXT    NOT NULL,
    topic        TEXT    NOT NULL,
    level        TEXT    NOT NULL DEFAULT 'beginner',
    enrolled_at  TEXT    NOT NULL,
    progress_pct INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modules (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    module_id   TEXT NOT NULL,
    module_data TEXT NOT NULL,
    UNIQUE (user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
"""


def init_db() -> None:
    """Create all tables if they do not exist yet."""
    with get_connection() as conn:
        conn.executescript(_DDL)
