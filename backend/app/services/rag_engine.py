from typing import Dict, List

import httpx

from app.core.config import settings
from app.services.knowledge_base import KnowledgeBase
from app.services.prompt_library import PromptLibrary


class RAGEngine:
    """RAG engine over local knowledge base + prompt templates + optional Groq Llama response."""

    def __init__(self) -> None:
        self.enabled = bool(settings.openai_api_key or settings.groq_api_key)
        self.kb = KnowledgeBase()
        self.prompts = PromptLibrary()

    def retrieve(self, topic: str, question: str) -> List[Dict]:
        return self.kb.retrieve(topic=topic, query=question, k=4)

    def _maybe_groq_answer(self, question: str, context: str, progress_hint: str) -> str | None:
        if not settings.groq_api_key:
            return None

        system_prompt = (
            "You are Lumina AI Mentor, a helpful support assistant for learning guidance and app navigation. "
            "Be concise, actionable, and grounded in the provided context."
        )
        user_prompt = (
            f"User question: {question}\n\n"
            f"Learner progress context: {progress_hint or 'No progress yet.'}\n\n"
            f"Knowledge context:\n{context[:3000]}\n\n"
            "Respond with: 1) direct answer, 2) practical next step."
        )

        payload = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 500,
        }
        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }

        try:
            resp = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=20.0,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception:
            return None

    def answer(self, topic: str, question: str, user_progress: Dict | None = None) -> dict:
        question_l = question.lower()
        if any(k in question_l for k in ["where", "navigate", "how to use", "which tab", "settings", "enroll", "start module"]):
            app_help = (
                "App navigation help: Use 'Topics & Modules' to search and enroll. "
                "Use sidebar Dashboard/Analytics tabs any time. "
                "From enrollments, click 'Start Learning' to open module chapters. "
                "Complete lessons, submit chapter exercise and quiz, then mark chapter complete."
            )
            return {"answer": app_help, "sources": ["app-navigation-guide"]}

        docs = self.retrieve(topic, question)
        progress_hint = ""
        if user_progress:
            progress_hint = (
                f"lessons={user_progress.get('completed_lessons',0)}, "
                f"chapters={user_progress.get('completed_chapters',0)}, "
                f"quizzes_passed={user_progress.get('quizzes_passed',0)}"
            )

        _ = self.prompts.render("mentor", question=question)
        sources = [d["source"] for d in docs]
        context = " ".join(d["snippet"] for d in docs)

        llm_answer = self._maybe_groq_answer(question=question, context=context, progress_hint=progress_hint)
        if llm_answer:
            return {"answer": llm_answer, "sources": sources}

        answer = (
            f"Progress context ({progress_hint or 'new learner'}). "
            f"Based on {topic} context: {context[:320]} ... "
            "Recommended next step: finish current lesson, complete chapter exercise/quiz, then evaluate next module."
        )
        return {"answer": answer, "sources": sources}
