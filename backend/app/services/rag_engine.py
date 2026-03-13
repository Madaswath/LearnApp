from typing import Dict, List
from app.core.config import settings
from app.services.knowledge_base import KnowledgeBase
from app.services.prompt_library import PromptLibrary


class RAGEngine:
    """RAG engine over local knowledge base + prompt templates."""

    def __init__(self) -> None:
        self.enabled = bool(settings.openai_api_key)
        self.kb = KnowledgeBase()
        self.prompts = PromptLibrary()

    def retrieve(self, topic: str, question: str) -> List[Dict]:
        return self.kb.retrieve(topic=topic, query=question, k=4)

    def answer(self, topic: str, question: str, user_progress: Dict | None = None) -> dict:
        docs = self.retrieve(topic, question)
        progress_hint = ""
        if user_progress:
            progress_hint = (
                f"Progress context: lessons={user_progress.get('completed_lessons',0)}, "
                f"chapters={user_progress.get('completed_chapters',0)}, "
                f"quizzes_passed={user_progress.get('quizzes_passed',0)}. "
            )

        _ = self.prompts.render("mentor", question=question)
        sources = [d["source"] for d in docs]
        context = " ".join(d["snippet"] for d in docs)
        answer = (
            f"{progress_hint}Based on the {topic} knowledge base: {context[:350]} "
            "Recommended next step: finish current chapter lesson, then attempt quiz and demo project milestone."
        )
        return {"answer": answer, "sources": sources}
