import re
import uuid
from typing import List, Optional

from app.models.schemas import (
    CourseModule, Chapter, Lesson, Exercise, Quiz, QuizQuestion, Project
)
from app.services.rag_engine import RAGEngine, rag_engine as _default_engine

_LEVEL_CHAPTERS = {"beginner": 3, "intermediate": 5, "advanced": 7}
_LESSONS_PER_CHAPTER = 3


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _short_id() -> str:
    return str(uuid.uuid4())[:8]


class CourseBuilder:
    def __init__(self, engine: Optional[RAGEngine] = None) -> None:
        self._rag = engine or _default_engine

    # ── Public API ────────────────────────────────────────────────────────────

    def build_course(self, topic: str, level: str = "beginner") -> CourseModule:
        level = level.lower()
        num_chapters = _LEVEL_CHAPTERS.get(level, 3)

        docs = self._rag.get_all_documents(topic)
        all_chunks = []
        for doc in docs:
            chunks = [c.strip() for c in re.split(r"\n\s*\n", doc.content) if c.strip()]
            all_chunks.extend(chunks)

        # Fallback: search globally if topic has no docs
        if not all_chunks:
            all_chunks = self._rag.search(topic, topic, top_k=20)

        chapters = []
        chunk_cursor = 0
        for ch_idx in range(num_chapters):
            lessons = []
            for les_idx in range(_LESSONS_PER_CHAPTER):
                chunk = all_chunks[chunk_cursor % len(all_chunks)] if all_chunks else ""
                chunk_cursor += 1
                title = self._extract_title(chunk, f"Lesson {les_idx + 1}")
                lessons.append(Lesson(
                    id=_short_id(),
                    title=title,
                    content=chunk,
                    duration_minutes=10 + les_idx * 5,
                ))

            # One exercise per chapter
            ex_chunk = all_chunks[chunk_cursor % len(all_chunks)] if all_chunks else ""
            chunk_cursor += 1
            exercises = [self._make_exercise(topic, level, ex_chunk, ch_idx)]

            # One quiz per chapter
            quiz_chunks = [
                all_chunks[(chunk_cursor + i) % len(all_chunks)]
                for i in range(3)
            ] if all_chunks else []
            chunk_cursor += 3
            quizzes = [self._make_quiz(topic, level, quiz_chunks, ch_idx)]

            chapters.append(Chapter(
                id=_short_id(),
                title=self._chapter_title(topic, level, ch_idx),
                lessons=lessons,
                exercises=exercises,
                quizzes=quizzes,
            ))

        module_id = f"{_slugify(topic)}-{level}-{_short_id()}"
        estimated_hours = num_chapters * 2
        return CourseModule(
            id=module_id,
            title=f"{topic.replace('-', ' ').title()} – {level.title()} Course",
            description=self._module_description(topic, level, all_chunks),
            topic=topic,
            level=level,
            chapters=chapters,
            estimated_hours=estimated_hours,
        )

    def build_exercises(self, topic: str, count: int = 5) -> List[Exercise]:
        chunks = self._rag.search(topic, topic, top_k=count * 2)
        exercises = []
        difficulties = ["beginner", "intermediate", "advanced"]
        for i in range(min(count, len(chunks))):
            exercises.append(self._make_exercise(
                topic,
                difficulties[i % len(difficulties)],
                chunks[i],
                i,
            ))
        return exercises

    def build_quizzes(self, topic: str, count: int = 3) -> List[Quiz]:
        chunks = self._rag.search(topic, topic, top_k=count * 3)
        quizzes = []
        for i in range(count):
            q_chunks = chunks[i * 3: i * 3 + 3]
            quizzes.append(self._make_quiz(topic, "intermediate", q_chunks, i))
        return quizzes

    def build_projects(self, topic: str) -> List[Project]:
        return _STATIC_PROJECTS.get(topic, _generic_projects(topic))

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _extract_title(chunk: str, fallback: str) -> str:
        """Try to pull a Markdown heading or first sentence as title."""
        for line in chunk.splitlines():
            line = line.strip()
            if line.startswith("#"):
                return line.lstrip("#").strip()
            if line and not line.startswith("-") and len(line) < 80:
                return line
        return fallback

    @staticmethod
    def _chapter_title(topic: str, level: str, idx: int) -> str:
        prefixes = {
            "beginner": ["Foundations of", "Getting Started with", "Core Concepts in"],
            "intermediate": [
                "Intermediate", "Building with", "Practical", "Applying", "Deepening"
            ],
            "advanced": [
                "Advanced", "Expert-level", "Mastering", "Optimising", "Extending",
                "Patterns in", "Production-ready"
            ],
        }
        names = prefixes.get(level, ["Chapter"])
        prefix = names[idx % len(names)]
        return f"{prefix} {topic.replace('-', ' ').title()}"

    @staticmethod
    def _module_description(topic: str, level: str, chunks: List[str]) -> str:
        snippet = chunks[0][:200].replace("\n", " ") if chunks else ""
        return (
            f"A comprehensive {level}-level course on "
            f"{topic.replace('-', ' ')}. {snippet}..."
        )

    def _make_exercise(
        self, topic: str, difficulty: str, chunk: str, idx: int
    ) -> Exercise:
        title = self._extract_title(chunk, f"{topic.title()} Exercise {idx + 1}")
        concept = re.findall(r"\b[A-Za-z]{4,}\b", chunk)[:3]
        concept_str = ", ".join(concept) if concept else topic

        starter = _EXERCISE_STARTERS.get(topic, "# Write your solution here\n\n")
        solution = (
            f"# Solution for: {title}\n"
            f"# Concept(s): {concept_str}\n\n"
            f"# See the lesson content for full implementation details.\n"
        )
        hints = [
            f"Review the section on '{concept_str}' in the knowledge base.",
            "Break the problem into smaller steps.",
            "Check your edge cases.",
        ]
        return Exercise(
            id=_short_id(),
            title=title,
            description=chunk[:400] if chunk else f"Practice exercise on {concept_str}.",
            difficulty=difficulty,
            topic=topic,
            starter_code=starter,
            solution=solution,
            hints=hints,
        )

    def _make_quiz(
        self, topic: str, level: str, chunks: List[str], idx: int
    ) -> Quiz:
        questions = []
        for i, chunk in enumerate(chunks[:3]):
            words = [w for w in re.findall(r"\b[A-Za-z]{5,}\b", chunk) if w.istitle() or w.isupper()]
            answer_word = words[0] if words else topic.title()

            # Build plausible distractors from the chunk
            all_words = list({
                w for w in re.findall(r"\b[A-Za-z]{4,}\b", chunk)
                if w.lower() not in {"with", "from", "that", "this", "have", "been"}
            })
            distractors = [w for w in all_words if w != answer_word][:3]
            while len(distractors) < 3:
                distractors.append(f"Option {len(distractors) + 1}")

            q_text = self._extract_title(chunk, f"Question about {topic}")
            if not q_text.endswith("?"):
                q_text = f"Which of the following best describes: {q_text[:80]}?"

            options = distractors[:3] + [answer_word]
            questions.append(QuizQuestion(
                question=q_text,
                options=options,
                correct_answer=3,  # last option is always the answer word
            ))

        if not questions:
            questions = [_fallback_question(topic)]

        return Quiz(
            id=_short_id(),
            title=f"{topic.replace('-', ' ').title()} Quiz {idx + 1}",
            topic=topic,
            questions=questions,
        )


# ── Static starter code per topic ────────────────────────────────────────────

_EXERCISE_STARTERS: dict = {
    "python": (
        "# Python Exercise\n"
        "# Fill in the function below\n\n"
        "def solve(data):\n"
        "    # Your code here\n"
        "    pass\n\n"
        "# Test your solution\n"
        "print(solve([1, 2, 3]))\n"
    ),
    "javascript": (
        "// JavaScript Exercise\n"
        "// Implement the function below\n\n"
        "function solve(data) {\n"
        "  // Your code here\n"
        "}\n\n"
        "console.log(solve([1, 2, 3]));\n"
    ),
    "machine-learning": (
        "# Machine Learning Exercise\n"
        "import numpy as np\n\n"
        "# Implement the model training function\n"
        "def train_model(X, y):\n"
        "    # Your code here\n"
        "    pass\n"
    ),
    "deep-learning": (
        "# Deep Learning Exercise\n"
        "# Build the neural network layer\n\n"
        "def build_model(input_dim, output_dim):\n"
        "    # Your code here\n"
        "    pass\n"
    ),
    "react": (
        "// React Exercise\n"
        "// Complete the React component below\n\n"
        "import React, { useState } from 'react';\n\n"
        "function MyComponent({ title }) {\n"
        "  // Your code here\n"
        "  return <div>{title}</div>;\n"
        "}\n\n"
        "export default MyComponent;\n"
    ),
    "data-science": (
        "# Data Science Exercise\n"
        "import pandas as pd\n"
        "import numpy as np\n\n"
        "def analyse(df):\n"
        "    # Your code here\n"
        "    pass\n"
    ),
}


def _fallback_question(topic: str) -> QuizQuestion:
    return QuizQuestion(
        question=f"What is a key concept in {topic.replace('-', ' ')}?",
        options=["Syntax only", "No structure needed", "Memorisation", "Understanding fundamentals"],
        correct_answer=3,
    )


def _generic_projects(topic: str) -> List[Project]:
    return [
        Project(
            id=_short_id(),
            title=f"{topic.replace('-', ' ').title()} Starter Project",
            description=f"Build a beginner project demonstrating core {topic} concepts.",
            topic=topic,
            difficulty="beginner",
            requirements=[
                "Implement at least 3 core concepts",
                "Include documentation",
                "Write tests for critical functions",
            ],
        ),
        Project(
            id=_short_id(),
            title=f"Intermediate {topic.replace('-', ' ').title()} App",
            description=f"Create a practical application using intermediate {topic} skills.",
            topic=topic,
            difficulty="intermediate",
            requirements=[
                "Use best practices for the ecosystem",
                "Implement error handling",
                "Deploy or package the application",
            ],
        ),
    ]


_STATIC_PROJECTS: dict = {
    "python": [
        Project(
            id=_short_id(),
            title="CLI Task Manager",
            description="Build a command-line task manager using Python with file persistence.",
            topic="python",
            difficulty="beginner",
            requirements=[
                "Add, remove, and list tasks",
                "Save tasks to a JSON file",
                "Support due dates and priorities",
                "Implement a search feature",
            ],
        ),
        Project(
            id=_short_id(),
            title="REST API with FastAPI",
            description="Create a RESTful API for a bookstore with CRUD operations.",
            topic="python",
            difficulty="intermediate",
            requirements=[
                "FastAPI with Pydantic models",
                "In-memory or SQLite storage",
                "Authentication with JWT",
                "Automated tests with pytest",
            ],
        ),
        Project(
            id=_short_id(),
            title="Async Web Scraper",
            description="Build a high-performance async web scraper using aiohttp and asyncio.",
            topic="python",
            difficulty="advanced",
            requirements=[
                "Async HTTP requests with aiohttp",
                "Rate limiting and retry logic",
                "Export to CSV/JSON/SQLite",
                "Respect robots.txt",
            ],
        ),
    ],
    "javascript": [
        Project(
            id=_short_id(),
            title="Interactive Todo App",
            description="Build a browser-based todo app with vanilla JS and local storage.",
            topic="javascript",
            difficulty="beginner",
            requirements=[
                "Add, edit, delete todos",
                "Persist data in localStorage",
                "Filter by status",
                "Drag-and-drop reordering",
            ],
        ),
        Project(
            id=_short_id(),
            title="Real-time Chat App",
            description="Create a real-time chat application using WebSockets.",
            topic="javascript",
            difficulty="intermediate",
            requirements=[
                "WebSocket server with Node.js",
                "Multiple chat rooms",
                "User presence indicators",
                "Message history",
            ],
        ),
    ],
    "react": [
        Project(
            id=_short_id(),
            title="Personal Finance Tracker",
            description="React app to track income, expenses, and budgets.",
            topic="react",
            difficulty="intermediate",
            requirements=[
                "React hooks (useState, useEffect, useContext)",
                "Chart.js for visualisations",
                "Local storage persistence",
                "Responsive design with CSS modules",
            ],
        ),
        Project(
            id=_short_id(),
            title="E-commerce Storefront",
            description="Full-featured e-commerce UI with cart, checkout, and product search.",
            topic="react",
            difficulty="advanced",
            requirements=[
                "Redux Toolkit for state management",
                "React Router for navigation",
                "Lazy loading and code splitting",
                "TypeScript throughout",
            ],
        ),
    ],
    "machine-learning": [
        Project(
            id=_short_id(),
            title="House Price Predictor",
            description="Predict house prices using regression models and the Boston/Ames dataset.",
            topic="machine-learning",
            difficulty="beginner",
            requirements=[
                "EDA and data cleaning with pandas",
                "Feature engineering",
                "Train/test split and cross-validation",
                "Compare at least 3 algorithms",
            ],
        ),
        Project(
            id=_short_id(),
            title="Customer Churn Classifier",
            description="Classify customer churn using real telco data with full ML pipeline.",
            topic="machine-learning",
            difficulty="intermediate",
            requirements=[
                "Scikit-learn Pipeline",
                "Hyperparameter tuning with GridSearchCV",
                "ROC-AUC, precision-recall evaluation",
                "SHAP for model explainability",
            ],
        ),
    ],
    "data-science": [
        Project(
            id=_short_id(),
            title="COVID-19 Data Analysis",
            description="Analyse and visualise COVID-19 data to discover trends and patterns.",
            topic="data-science",
            difficulty="beginner",
            requirements=[
                "pandas for data wrangling",
                "Matplotlib/Seaborn visualisations",
                "Statistical hypothesis testing",
                "Jupyter notebook with narrative",
            ],
        ),
    ],
    "deep-learning": [
        Project(
            id=_short_id(),
            title="Image Classifier",
            description="Train a CNN to classify images from the CIFAR-10 dataset.",
            topic="deep-learning",
            difficulty="intermediate",
            requirements=[
                "PyTorch or TensorFlow/Keras",
                "Data augmentation",
                "Transfer learning with ResNet",
                "Accuracy ≥ 85%",
            ],
        ),
    ],
}


# Singleton
course_builder = CourseBuilder()
