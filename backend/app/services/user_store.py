import hashlib
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any


def _hash_password(password: str) -> str:
    # NOTE: SHA-256 is used here for demo simplicity.
    # In production replace with bcrypt / Argon2 via `passlib` or `bcrypt`.
    return hashlib.sha256(password.encode()).hexdigest()


class UserStore:
    """Thread-safe in-memory user store."""

    def __init__(self) -> None:
        self._users: Dict[str, Dict[str, Any]] = {}          # user_id -> user
        self._email_index: Dict[str, str] = {}               # email -> user_id
        self._progress: Dict[str, List[Dict]] = {}           # user_id -> activities
        self._enrollments: Dict[str, List[Dict]] = {}        # user_id -> enrollments
        self._modules: Dict[str, Dict] = {}                  # f"{user_id}:{module_id}" -> module

    # ── User management ───────────────────────────────────────────────────────

    def create_user(self, email: str, password: str, name: str) -> str:
        user_id = str(uuid.uuid4())
        user = {
            "user_id": user_id,
            "email": email,
            "password_hash": _hash_password(password),
            "name": name,
            "bio": None,
            "skill_level": "beginner",
            "interests": [],
            "created_at": datetime.utcnow().isoformat(),
        }
        self._users[user_id] = user
        self._email_index[email.lower()] = user_id
        self._progress[user_id] = []
        self._enrollments[user_id] = []
        return user_id

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        user_id = self._email_index.get(email.lower())
        return self._users.get(user_id) if user_id else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self._users.get(user_id)

    def verify_password(self, email: str, password: str) -> bool:
        user = self.get_user_by_email(email)
        if not user:
            return False
        return user["password_hash"] == _hash_password(password)

    def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        user = self._users.get(user_id)
        if not user:
            return False
        allowed = {"name", "bio", "skill_level", "interests"}
        for key, value in profile_data.items():
            if key in allowed:
                user[key] = value
        return True

    # ── Progress ──────────────────────────────────────────────────────────────

    def track_progress(self, user_id: str, activity: Dict[str, Any]) -> bool:
        if user_id not in self._progress:
            self._progress[user_id] = []
        activity["timestamp"] = datetime.utcnow().isoformat()
        self._progress[user_id].append(activity)
        return True

    def get_progress(self, user_id: str) -> List[Dict[str, Any]]:
        return self._progress.get(user_id, [])

    # ── Enrollments ───────────────────────────────────────────────────────────

    def enroll(self, user_id: str, module_id: str, topic: str) -> bool:
        if user_id not in self._enrollments:
            self._enrollments[user_id] = []
        # Prevent duplicate enrollments
        for e in self._enrollments[user_id]:
            if e["module_id"] == module_id:
                return True
        self._enrollments[user_id].append({
            "module_id": module_id,
            "topic": topic,
            "enrolled_at": datetime.utcnow().isoformat(),
            "progress_pct": 0,
        })
        return True

    def get_enrollments(self, user_id: str) -> List[Dict[str, Any]]:
        return self._enrollments.get(user_id, [])

    # ── Module cache ──────────────────────────────────────────────────────────

    def save_module(self, user_id: str, module_id: str, module_data: Dict) -> None:
        self._modules[f"{user_id}:{module_id}"] = module_data

    def get_module(self, user_id: str, module_id: str) -> Optional[Dict]:
        return self._modules.get(f"{user_id}:{module_id}")

    # ── Stats ─────────────────────────────────────────────────────────────────

    def user_count(self) -> int:
        return len(self._users)

    def total_enrollments(self) -> int:
        return sum(len(v) for v in self._enrollments.values())


# Singleton instance
user_store = UserStore()
