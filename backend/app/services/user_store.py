"""
SQLite3-backed user store for Lumina AI.

All persistent data (users, progress, enrollments, modules) is stored in
a local SQLite3 database at the path configured by settings.db_path.

NOTE: Passwords are hashed with SHA-256 for demo simplicity.
      In production replace with bcrypt / Argon2 via passlib.
"""
import hashlib
import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.db.database import get_connection


def _hash_password(password: str) -> str:
    # NOTE: SHA-256 is used here for demo simplicity.
    # In production replace with bcrypt / Argon2 via `passlib` or `bcrypt`.
    return hashlib.sha256(password.encode()).hexdigest()


def _now() -> str:
    return datetime.utcnow().isoformat()


class UserStore:
    """SQLite3-backed user/progress/enrollment store."""

    # ── User management ───────────────────────────────────────────────────────

    def create_user(self, email: str, password: str, name: str) -> str:
        user_id = str(uuid.uuid4())
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO users (user_id, email, password_hash, name, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (user_id, email.lower(), _hash_password(password), name, _now()),
            )
        return user_id

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE email = ?", (email.lower(),)
            ).fetchone()
        return dict(row) if row else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE user_id = ?", (user_id,)
            ).fetchone()
        if not row:
            return None
        d = dict(row)
        # Deserialise JSON field
        try:
            d["interests"] = json.loads(d.get("interests") or "[]")
        except (ValueError, TypeError):
            d["interests"] = []
        return d

    def verify_password(self, email: str, password: str) -> bool:
        user = self.get_user_by_email(email)
        if not user:
            return False
        return user["password_hash"] == _hash_password(password)

    def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        allowed = {"name", "bio", "skill_level", "interests"}
        updates = {k: v for k, v in profile_data.items() if k in allowed}
        if not updates:
            return True
        # Serialise interests list to JSON if present
        if "interests" in updates and isinstance(updates["interests"], list):
            updates["interests"] = json.dumps(updates["interests"])
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [user_id]
        with get_connection() as conn:
            conn.execute(
                f"UPDATE users SET {set_clause} WHERE user_id = ?", values
            )
        return True

    # ── Progress ──────────────────────────────────────────────────────────────

    def track_progress(self, user_id: str, activity: Dict[str, Any]) -> bool:
        activity_type = activity.get("activity_type", "unknown")
        topic = activity.get("topic")
        # Store remaining keys as JSON details
        details = {k: v for k, v in activity.items()
                   if k not in {"activity_type", "topic"}}
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO progress (user_id, activity_type, topic, details, timestamp) "
                "VALUES (?, ?, ?, ?, ?)",
                (user_id, activity_type, topic, json.dumps(details), _now()),
            )
        return True

    def get_progress(self, user_id: str) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM progress WHERE user_id = ? ORDER BY id",
                (user_id,),
            ).fetchall()
        result = []
        for row in rows:
            d = dict(row)
            try:
                details = json.loads(d.pop("details", "{}") or "{}")
            except (ValueError, TypeError):
                details = {}
            d.update(details)
            result.append(d)
        return result

    # ── Enrollments ───────────────────────────────────────────────────────────

    def enroll(self, user_id: str, module_id: str, topic: str,
               level: str = "beginner") -> bool:
        with get_connection() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO enrollments "
                "(user_id, module_id, topic, level, enrolled_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, module_id, topic, level, _now()),
            )
        return True

    def get_enrollments(self, user_id: str) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM enrollments WHERE user_id = ? ORDER BY id",
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    # ── Module cache ──────────────────────────────────────────────────────────

    def save_module(self, user_id: str, module_id: str, module_data: Dict) -> None:
        with get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO modules (user_id, module_id, module_data) "
                "VALUES (?, ?, ?)",
                (user_id, module_id, json.dumps(module_data)),
            )

    def get_module(self, user_id: str, module_id: str) -> Optional[Dict]:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT module_data FROM modules WHERE user_id = ? AND module_id = ?",
                (user_id, module_id),
            ).fetchone()
        if not row:
            return None
        try:
            return json.loads(row["module_data"])
        except (ValueError, TypeError):
            return None

    # ── Stats ─────────────────────────────────────────────────────────────────

    def user_count(self) -> int:
        with get_connection() as conn:
            row = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()
        return row["n"] if row else 0

    def total_enrollments(self) -> int:
        with get_connection() as conn:
            row = conn.execute("SELECT COUNT(*) AS n FROM enrollments").fetchone()
        return row["n"] if row else 0


# Singleton instance
user_store = UserStore()
