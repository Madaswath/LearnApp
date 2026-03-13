import json
from pathlib import Path
from typing import Dict, List
from uuid import uuid4

import httpx

from app.core.config import settings


class CurriculumBuilder:
    levels = ["beginner", "intermediate", "advanced"]


    def _topic_context_markdown(self, topic: str) -> str:
        slug = topic.strip().lower().replace(" ", "-")
        root = Path("backend/storage/knowledge_base") / slug
        if not root.exists():
            return ""
        chunks = []
        for md in sorted(root.glob("*.md")):
            text = md.read_text(encoding="utf-8", errors="ignore")[:3000]
            chunks.append(f"## {md.name}\n{text}")
        return "\n\n".join(chunks)[:9000]

    def _topic_prompt(self, topic: str) -> str:
        topic_context = self._topic_context_markdown(topic)
        return f"""You are an expert curriculum designer and educator specializing in technology education.

Create a COMPLETE structured course for this topic: {topic}

Knowledge base context markdown (must use this while designing depth):
{topic_context or "No local context provided."}

Requirements:
- Progression must be beginner -> intermediate -> advanced.
- Produce 3 major modules only (one per difficulty level).
- Each module needs: title, description, learning objectives, and estimated hours.
- Each module should include 3-6 chapters and each chapter should include 3-5 lessons.
- Include practical depth, quizzes, assessments, mini projects, and capstone orientation.

Return STRICT JSON in this format only:
{{
  "topic": "{topic}",
  "modules": [
    {{
      "module_id": "string",
      "title": "string",
      "difficulty": "beginner|intermediate|advanced",
      "estimated_hours": 12,
      "lessons": [{{"lesson_title": "string", "concepts": ["string"]}}],
      "projects": ["string", "string"]
    }}
  ]
}}
"""

    def _groq_generate_topic_modules(self, topic: str) -> Dict | None:
        if not settings.groq_api_key:
            return None
        payload = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": "You create deep curriculum JSON only."},
                {"role": "user", "content": self._topic_prompt(topic)},
            ],
            "temperature": 0.3,
            "max_tokens": 1800,
        }
        headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}
        try:
            resp = httpx.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=25.0)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
            modules = data.get("modules", [])
            if isinstance(modules, list) and modules:
                for m in modules:
                    m.setdefault("module_id", str(uuid4()))
                    m.setdefault("estimated_hours", 12)
                    m.setdefault("lessons", [])
                    m.setdefault("projects", [])
                return {"topic": data.get("topic", topic), "modules": modules[:3]}
            return None
        except Exception:
            return None

    def build_topic_modules(self, topic: str) -> Dict:
        generated = self._groq_generate_topic_modules(topic)
        if generated:
            return generated

        modules: List[Dict] = []
        for idx, level in enumerate(self.levels, start=1):
            modules.append(
                {
                    "module_id": str(uuid4()),
                    "title": f"{topic} {level.title()} Track",
                    "difficulty": level,
                    "estimated_hours": idx * 10,
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

    def _groq_generate_content(self, topic: str, difficulty: str, module_id: str) -> Dict | None:
        if not settings.groq_api_key:
            return None
        schema = {
            "module_id": module_id,
            "topic": topic,
            "difficulty": difficulty,
            "title": f"{topic} {difficulty.title()} Track",
            "chapters": [
                {
                    "chapter_id": "string",
                    "title": "string",
                    "lessons": [{"lesson_id": "string", "title": "string", "concepts": ["string"], "completed": False}],
                    "exercises": [{"exercise_id": "string", "prompt": "string", "completed": False}],
                    "quizzes": [{"quiz_id": "string", "question": "string", "options": ["string"], "answer": "string", "completed": False, "score": 0}],
                    "completed": False,
                }
            ],
            "project": {"project_id": "string", "title": "string", "description": "string", "milestones": ["string"]},
        }
        prompt = (
            "Generate in-depth learning content as STRICT JSON only. "
            "Create exactly 3 chapters with 3 lessons each."
            f" Topic: {topic}. Difficulty: {difficulty}. Module ID: {module_id}."
            f" Follow this shape: {json.dumps(schema)}"
        )
        payload = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": "You create curriculum JSON only. No markdown."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 1800,
        }
        headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}
        try:
            resp = httpx.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=25.0)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
            return data
        except Exception:
            return None


    def _load_topic_notes(self, topic: str, difficulty: str) -> list[str]:
        slug = topic.strip().lower().replace(" ", "-")
        path = Path("backend/storage/knowledge_base") / slug / f"{difficulty}.md"
        if not path.exists():
            return []
        lines = [ln.strip() for ln in path.read_text(encoding="utf-8", errors="ignore").splitlines() if ln.strip()]
        return [ln.lstrip("- ").lstrip("0123456789. ") for ln in lines if ln.startswith("- ") or ln[:2].isdigit()][:12]

    def build_module_content(self, topic: str, difficulty: str, module_id: str) -> Dict:
        generated = self._groq_generate_content(topic, difficulty, module_id)
        if generated:
            return generated

        kb_points = self._load_topic_notes(topic, difficulty)

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
                            kb_points[(chapter_no + lesson_no - 2) % len(kb_points)] if kb_points else f"{topic} concept {chapter_no}.{lesson_no}.A",
                            kb_points[(chapter_no + lesson_no - 1) % len(kb_points)] if kb_points else f"{topic} concept {chapter_no}.{lesson_no}.B",
                            f"{topic} real-world implementation {chapter_no}.{lesson_no}",
                        ],
                        "completed": False,
                    }
                )

            quizzes = [
                {
                    "quiz_id": f"{chapter_id}-qz-1",
                    "question": f"Which statement best explains the core idea in {topic} chapter {chapter_no}?",
                    "options": ["Pipeline design", "Optimization", "Data preparation", "Evaluation strategy"],
                    "answer": "Optimization",
                    "completed": False,
                    "score": 0,
                }
            ]

            exercises = [
                {
                    "exercise_id": f"{chapter_id}-ex-1",
                    "prompt": f"Build a hands-on {difficulty} level task for {topic} chapter {chapter_no}, including implementation notes and validation steps.",
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
                "description": f"Build and present a functional demo project for {topic} at {difficulty} level with measurable outputs.",
                "milestones": [
                    "Define scope and success metrics",
                    "Implement MVP and iterate",
                    "Evaluate quality and performance",
                    "Present architecture and decisions",
                ],
            },
        }
