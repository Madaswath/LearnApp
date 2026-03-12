from typing import Dict


class AdaptiveCurriculumEngine:
    def adjust(self, progress: Dict) -> Dict:
        score = progress.get("avg_quiz_score", 0)
        completion = progress.get("completion_rate", 0)
        engagement = progress.get("engagement", 0)

        if score < 70:
            return {
                "action": "revise",
                "reason": "Skill gap detected by low quiz score",
                "recommendations": ["Add revision lessons", "Decrease difficulty by one level"],
            }
        if engagement < 40:
            return {
                "action": "re-engage",
                "reason": "Low engagement risk",
                "recommendations": ["Shorter sessions", "Project-based module next"],
            }
        if completion > 80:
            return {
                "action": "accelerate",
                "reason": "Learner is progressing quickly",
                "recommendations": ["Unlock advanced track", "Add capstone project"],
            }

        return {
            "action": "maintain",
            "reason": "Current trajectory is healthy",
            "recommendations": ["Continue planned roadmap"],
        }
