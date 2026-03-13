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
            "You are LearnApp Mentor. Respond in concise structured format with sections: "
            "Summary, Key Points, Next Steps, References. Keep each section short and actionable."
        )
        user_prompt = (
            f"User question: {question}\n\n"
            f"Learner progress context: {progress_hint or 'No progress yet.'}\n\n"
            f"Knowledge context:\n{context[:3000]}\n\n"
            "Return plain text only, with this exact structure:\n"
            "Summary:\n- ...\n"
            "Key Points:\n- ...\n"
            "Next Steps:\n1. ...\n2. ...\n"
            "References:\n- ..."
        )

        payload = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 450,
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
                "Summary:\n- Use Topics & Modules to search and enroll.\n"
                "Key Points:\n- Open enrolled course from Dashboard Active Learning.\n- Complete lessons, then exercise, then quiz, then mark chapter complete.\n"
                "Next Steps:\n1. Go to Courses.\n2. Click Start Learning on your enrollment.\n"
                "References:\n- app-navigation-guide"
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
            "Summary:\n"
            f"- {topic} question addressed with available learning context.\n"
            "Key Points:\n"
            f"- Learner status: {progress_hint or 'new learner'}.\n"
            f"- Context match: {context[:220] or 'No topic documents found yet.'}\n"
            "Next Steps:\n"
            "1. Complete the next lesson in your active chapter.\n"
            "2. Submit the chapter exercise and quiz, then evaluate module progress.\n"
            "References:\n"
            f"- {', '.join(sources) if sources else 'local-guide'}"
        )
        return {"answer": answer, "sources": sources}
