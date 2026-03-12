from typing import Dict, List
from uuid import uuid4


class CurriculumBuilder:
    levels = ["beginner", "intermediate", "advanced"]

    def build_topic_modules(self, topic: str) -> Dict:
        modules: List[Dict] = []
        for idx, level in enumerate(self.levels, start=1):
            modules.append(
                {
                    "module_id": str(uuid4()),
                    "title": f"{topic} {level.title()} Track",
                    "difficulty": level,
                    "estimated_hours": idx * 8,
                    "lessons": [
                        {
                            "lesson_title": f"{topic} {level.title()} Lesson {i}",
                            "concepts": [
                                f"Core {topic} concept {i}.{j}",
                                f"Applied {topic} pattern {i}.{j}",
                            ],
                        }
                        for i, j in [(1, 1), (2, 2), (3, 3)]
                    ],
                    "projects": [
                        f"{level.title()} {topic} project",
                        f"{level.title()} capstone for {topic}",
                    ],
                }
            )
        return {"topic": topic, "modules": modules}
