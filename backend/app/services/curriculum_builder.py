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

    def build_module_content(self, topic: str, difficulty: str, module_id: str) -> Dict:
        chapters = []
        for chapter_no in range(1, 4):
            chapter_id = f"{module_id}-ch-{chapter_no}"
            lessons = []
            for lesson_no in range(1, 4):
                lesson_id = f"{chapter_id}-ls-{lesson_no}"
                lessons.append(
                    {
                        "lesson_id": lesson_id,
                        "title": f"{topic} {difficulty.title()} Chapter {chapter_no} Lesson {lesson_no}",
                        "concepts": [
                            f"{topic} concept {chapter_no}.{lesson_no}.A",
                            f"{topic} concept {chapter_no}.{lesson_no}.B",
                        ],
                        "completed": False,
                    }
                )

            quizzes = [
                {
                    "quiz_id": f"{chapter_id}-qz-1",
                    "question": f"What is the key idea in {topic} chapter {chapter_no}?",
                    "options": ["Optimization", "Architecture", "Data", "Evaluation"],
                    "answer": "Optimization",
                    "completed": False,
                    "score": 0,
                }
            ]

            exercises = [
                {
                    "exercise_id": f"{chapter_id}-ex-1",
                    "prompt": f"Implement a short coding task for {topic} chapter {chapter_no}.",
                    "completed": False,
                }
            ]

            chapters.append(
                {
                    "chapter_id": chapter_id,
                    "title": f"{topic} {difficulty.title()} Chapter {chapter_no}",
                    "lessons": lessons,
                    "exercises": exercises,
                    "quizzes": quizzes,
                    "completed": False,
                }
            )

        return {
            "module_id": module_id,
            "topic": topic,
            "difficulty": difficulty,
            "title": f"{topic} {difficulty.title()} Track",
            "chapters": chapters,
            "project": {
                "project_id": f"{module_id}-project",
                "title": f"{topic} {difficulty.title()} Demo Project",
                "description": f"Build and present a functional demo project for {topic} at {difficulty} level.",
                "milestones": [
                    "Plan architecture",
                    "Implement MVP",
                    "Run tests",
                    "Present demo",
                ],
            },
        }
