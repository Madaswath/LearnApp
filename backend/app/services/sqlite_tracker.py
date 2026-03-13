from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from app.db.sqlite_client import sqlite_client


class SQLiteTracker:
    def __init__(self) -> None:
        self.enabled = True

    def _safe_insert(self, table: str, payload: Dict[str, Any]) -> None:
        keys = ", ".join(payload.keys())
        placeholders = ", ".join(["?" for _ in payload])
        values = tuple(payload.values())
        with sqlite_client.connection() as conn:
            conn.execute(f"INSERT INTO {table} ({keys}) VALUES ({placeholders})", values)

    def record_enrollment(self, user_id: str, module_id: str, topic: str, difficulty: str) -> None:
        self._safe_insert(
            "recommendations",
            {
                "user_id": user_id,
                "learning_path_id": None,
                "recommendation": f"Enrolled in {topic}/{difficulty} ({module_id})",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    def record_progress(self, user_id: str, module_id: str, metrics: Dict[str, Any]) -> None:
        self._safe_insert(
            "analytics",
            {
                "user_id": user_id,
                "learning_path_id": module_id,
                "metric_name": "progress_snapshot",
                "metric_value": float(metrics.get("completed_lessons", 0)),
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    def record_quiz_performance(self, user_id: str, quiz_id: str, score: int, total: int) -> None:
        pct = (score / total * 100.0) if total else 0.0
        self._safe_insert(
            "analytics",
            {
                "user_id": user_id,
                "learning_path_id": quiz_id,
                "metric_name": "quiz_score_pct",
                "metric_value": pct,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        if pct < 70:
            self._safe_insert(
                "skill_gaps",
                {
                    "user_id": user_id,
                    "learning_path_id": quiz_id,
                    "gap_name": f"Quiz {quiz_id} score below threshold",
                    "severity": "medium",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            )
