from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict

from app.core.config import settings
from app.db.supabase_client import get_supabase


class SupabaseTracker:
    def __init__(self) -> None:
        self.enabled = bool(settings.supabase_url and settings.supabase_anon_key)

    def record_enrollment(self, user_id: str, module_id: str, topic: str, difficulty: str) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("recommendations").insert(
            {
                "user_id": user_id,
                "learning_path_id": None,
                "recommendation": f"Enrolled in {topic}/{difficulty} ({module_id})",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()

    def record_progress(self, user_id: str, module_id: str, metrics: Dict) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        sb.table("analytics").insert(
            {
                "user_id": user_id,
                "learning_path_id": None,
                "metric_name": f"module:{module_id}",
                "metric_value": float(metrics.get("completed_lessons", 0)),
                "captured_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()

    def record_quiz_performance(self, user_id: str, quiz_id: str, score: int, total: int) -> None:
        if not self.enabled:
            return
        sb = get_supabase()
        value = float(score / max(1, total))
        sb.table("analytics").insert(
            {
                "user_id": user_id,
                "learning_path_id": None,
                "metric_name": f"quiz:{quiz_id}",
                "metric_value": value,
                "captured_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()
