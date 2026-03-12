from typing import List
from app.core.config import settings


class RAGEngine:
    """Minimal RAG façade. Swap internals with pgvector/Pinecone in production."""

    def __init__(self) -> None:
        self.enabled = bool(settings.openai_api_key and settings.supabase_url)

    def retrieve(self, question: str) -> List[str]:
        # Stub retrieval demonstrating grounded context handoff
        return [
            "Lesson: Neural network fundamentals and backpropagation",
            "Exercise: Build a feed-forward network in PyTorch",
            "Quiz: Bias-variance tradeoff",
        ]

    def answer(self, question: str) -> dict:
        sources = self.retrieve(question)
        answer = (
            "Grounded mentor response: based on your active path, start by reviewing "
            "the fundamentals lesson, then complete the feed-forward exercise before the quiz."
        )
        return {"answer": answer, "sources": sources}
