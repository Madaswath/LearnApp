from pathlib import Path
from typing import Dict


class PromptLibrary:
    def __init__(self, root: str = "backend/prompts") -> None:
        self.root = Path(root)

    def names(self) -> list[str]:
        if not self.root.exists():
            return []
        return sorted([p.stem for p in self.root.glob("*.md")])

    def render(self, name: str, **kwargs: Dict) -> str:
        path = self.root / f"{name}.md"
        if not path.exists():
            raise ValueError(f"Prompt template not found: {name}")
        template = path.read_text(encoding="utf-8")
        return template.format(**kwargs)
