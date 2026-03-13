from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List
import re


@dataclass
class KnowledgeDocument:
    topic: str
    source: str
    text: str


class KnowledgeBase:
    def __init__(self, root: str = "backend/storage/knowledge_base") -> None:
        self.root = Path(root)

    def list_topics(self) -> List[str]:
        if not self.root.exists():
            return []
        return sorted([p.name for p in self.root.iterdir() if p.is_dir()])

    def load_topic_documents(self, topic: str) -> List[KnowledgeDocument]:
        topic_slug = self._slug(topic)
        folder = self.root / topic_slug
        if not folder.exists():
            return []

        docs: List[KnowledgeDocument] = []
        for path in folder.glob("**/*"):
            if path.is_file():
                try:
                    text = path.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    text = ""
                docs.append(KnowledgeDocument(topic=topic_slug, source=path.name, text=self._clean(text)))
        return docs

    def retrieve(self, topic: str, query: str, k: int = 4) -> List[Dict]:
        docs = self.load_topic_documents(topic)
        if not docs:
            return []

        q_tokens = set(self._tokenize(query))
        ranked = []
        for doc in docs:
            tokens = self._tokenize(doc.text)
            score = len(q_tokens.intersection(tokens))
            ranked.append((score, doc))

        ranked.sort(key=lambda x: x[0], reverse=True)
        return [
            {"source": doc.source, "score": score, "snippet": doc.text[:500]}
            for score, doc in ranked[:k]
            if score > 0 or not q_tokens
        ]

    def _slug(self, value: str) -> str:
        return value.strip().lower().replace(" ", "-")

    def _clean(self, text: str) -> str:
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text)).strip()

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"[a-zA-Z0-9_]+", text.lower())
