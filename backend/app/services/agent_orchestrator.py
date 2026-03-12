from typing import List
from app.agents.registry import AGENT_SPECS


class AgentOrchestrator:
    """Production-friendly abstraction around CrewAI orchestration."""

    def __init__(self) -> None:
        self.agents = AGENT_SPECS

    def pipeline_order(self) -> List[str]:
        return [
            "learning_roadmap_architect",
            "curriculum_architect",
            "lesson_generator",
            "exercise_generator",
            "quiz_generator",
            "project_generator",
            "curriculum_evaluator",
            "skill_gap_analyzer",
            "improvement_agent",
        ]

    def generate_path(self, topic: str, level: str, duration_weeks: int) -> dict:
        sections = ["Beginner", "Intermediate", "Advanced"]
        return {
            "topic": topic,
            "chapters": [
                {
                    "title": f"{topic} {section} Module {idx + 1}",
                    "level": section.lower(),
                    "objectives": [
                        f"Understand {topic} concepts for {section.lower()} learners",
                        "Practice hands-on implementation",
                        "Validate with quiz and mini-project",
                    ],
                }
                for idx, section in enumerate(sections)
            ],
            "recommendations": [
                f"Duration target: {duration_weeks} weeks",
                f"Initial difficulty profile: {level}",
                "Use mentor chat whenever score < 70%",
            ],
            "orchestration": self.pipeline_order(),
        }
