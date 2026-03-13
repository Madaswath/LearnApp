import os
import re
from pathlib import Path
from typing import List, Dict, Optional, Any

from app.models.schemas import KnowledgeDocument

# Resolve paths relative to this file so the app works from any cwd
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
KNOWLEDGE_BASE_DIR = _BASE_DIR / "storage" / "knowledge_base"
PROMPTS_DIR = _BASE_DIR / "prompts"


class RAGEngine:
    """
    Keyword-based retrieval engine backed by local Markdown files.
    No vector DB or LLM calls – pure text search.
    """

    def __init__(self) -> None:
        # topic -> list of {"filename": str, "chunks": [str]}
        self._index: Dict[str, List[Dict[str, Any]]] = {}
        self._prompts: Dict[str, str] = {}
        self._load_all()

    # ── Indexing ──────────────────────────────────────────────────────────────

    def _load_all(self) -> None:
        self._index = {}
        if KNOWLEDGE_BASE_DIR.exists():
            for topic_dir in sorted(KNOWLEDGE_BASE_DIR.iterdir()):
                if topic_dir.is_dir():
                    self._index_topic(topic_dir.name, topic_dir)

    def _index_topic(self, topic: str, topic_dir: Path) -> None:
        docs: List[Dict[str, Any]] = []
        for fp in sorted(topic_dir.iterdir()):
            if fp.suffix in {".md", ".txt", ".html"} and fp.is_file():
                raw = fp.read_text(encoding="utf-8", errors="replace")
                # Split on blank lines to get paragraphs / sections
                chunks = [c.strip() for c in re.split(r"\n\s*\n", raw) if c.strip()]
                docs.append({"filename": fp.name, "chunks": chunks, "raw": raw})
        self._index[topic] = docs

    def _load_prompts(self) -> None:
        if not PROMPTS_DIR.exists():
            return
        for cat_dir in PROMPTS_DIR.iterdir():
            if cat_dir.is_dir():
                for fp in cat_dir.iterdir():
                    if fp.suffix == ".md":
                        key = f"{cat_dir.name}/{fp.stem}"
                        self._prompts[key] = fp.read_text(encoding="utf-8", errors="replace")

    # ── Public API ────────────────────────────────────────────────────────────

    def list_topics(self) -> List[str]:
        return sorted(self._index.keys())

    def get_all_documents(self, topic: str) -> List[KnowledgeDocument]:
        docs = []
        for entry in self._index.get(topic, []):
            docs.append(KnowledgeDocument(
                topic=topic,
                filename=entry["filename"],
                content=entry["raw"],
            ))
        return docs

    def search(self, topic: str, query: str, top_k: int = 6) -> List[str]:
        """Return the top-k most relevant chunks for *query* in *topic*."""
        entries = self._index.get(topic)
        if not entries:
            # Fall back: search all topics
            all_chunks = []
            for t_entries in self._index.values():
                for e in t_entries:
                    all_chunks.extend(e["chunks"])
        else:
            all_chunks = []
            for e in entries:
                all_chunks.extend(e["chunks"])

        if not all_chunks:
            return []

        query_words = set(re.findall(r"\w+", query.lower()))

        def score(chunk: str) -> int:
            chunk_words = set(re.findall(r"\w+", chunk.lower()))
            return len(query_words & chunk_words)

        ranked = sorted(all_chunks, key=score, reverse=True)
        # Always return at least a few chunks even with zero overlap
        return [c for c in ranked[:top_k] if c]

    def get_prompt(self, category: str, action: str, **variables: Any) -> str:
        """Load a prompt template and substitute {variable} placeholders."""
        # Lazy-load prompts on first call
        if not self._prompts:
            self._load_prompts()

        key = f"{category}/{action}"
        template = self._prompts.get(key, "")
        if not template:
            fp = PROMPTS_DIR / category / f"{action}.md"
            if fp.exists():
                template = fp.read_text(encoding="utf-8", errors="replace")
                self._prompts[key] = template

        if not template:
            return f"[Prompt '{key}' not found]"

        for var, val in variables.items():
            template = template.replace(f"{{{var}}}", str(val))
        return template

    def reload(self) -> None:
        self._load_all()
        self._prompts = {}


# Singleton instance
rag_engine = RAGEngine()
