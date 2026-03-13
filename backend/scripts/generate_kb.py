from __future__ import annotations

from pathlib import Path

TOPICS = [
    "python",
    "sql",
    "statistics-for-data-science",
    "machine-learning",
    "deep-learning",
    "nlp",
]
LEVELS = ["beginner", "intermediate", "advanced"]

CONTENT_TEMPLATE = """# {topic_title} — {level_title}

## Learning Goals
- Build strong conceptual clarity in {topic_title} for {level_title} learners.
- Apply concepts through practical workflows and mini implementation tasks.
- Evaluate and improve solutions with quality metrics and debugging practices.

## Core Concepts
1. Foundations and terminology
2. Data/workflow lifecycle and tooling
3. Modeling/analysis patterns
4. Evaluation, troubleshooting, and optimization

## In-Depth Learning Content
### Conceptual Deep Dive
{topic_title} at {level_title} level focuses on understanding why each step exists, common failure modes, and practical decision tradeoffs.

### Practical Workflow
- Define problem and success criteria.
- Build baseline approach.
- Validate with measurable checks.
- Optimize based on error analysis.

### Common Pitfalls
- Overfitting to toy examples.
- Skipping validation and reproducibility.
- Lack of feature/error tracing.

## Practice Tasks
- Implement one end-to-end notebook/project for {topic_title}.
- Add tests or sanity checks for key assumptions.
- Document design decisions and tradeoffs.

## Evaluation Rubric
- Correctness and reliability
- Code/query clarity
- Performance and efficiency
- Communication and explainability
"""


def main() -> None:
    root = Path("backend/storage/knowledge_base")
    root.mkdir(parents=True, exist_ok=True)

    for topic in TOPICS:
        tdir = root / topic
        tdir.mkdir(parents=True, exist_ok=True)
        for level in LEVELS:
            path = tdir / f"{level}.md"
            path.write_text(
                CONTENT_TEMPLATE.format(
                    topic_title=topic.replace("-", " ").title(),
                    level_title=level.title(),
                ),
                encoding="utf-8",
            )


if __name__ == "__main__":
    main()
