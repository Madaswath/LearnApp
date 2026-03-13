"""
Lumina AI – 23-Agent Registry

Defines metadata for all 23 specialised agents across 6 functional groups.
Each agent record includes: id, name, group, description, capabilities.

Groups
------
1. Curriculum Generation  (7 agents)
2. Personalisation        (4 agents)
3. Mentor System          (4 agents)
4. Content Quality        (3 agents)
5. Analytics              (3 agents)
6. Research               (2 agents)
"""
from typing import Any, Dict, List

AGENTS: List[Dict[str, Any]] = [
    # ── 1. Curriculum Generation ──────────────────────────────────────────────
    {
        "id": "curriculum-roadmap",
        "name": "Roadmap Architect",
        "group": "Curriculum Generation",
        "description": (
            "Plans end-to-end learning roadmaps for a given topic and target level, "
            "mapping prerequisite chains and milestone checkpoints."
        ),
        "capabilities": ["roadmap_plan", "prerequisite_mapping", "milestone_setting"],
    },
    {
        "id": "curriculum-builder",
        "name": "Curriculum Builder",
        "group": "Curriculum Generation",
        "description": (
            "Assembles a full curriculum from a roadmap by selecting and ordering "
            "modules, chapters, and learning objectives."
        ),
        "capabilities": ["curriculum_assemble", "module_ordering", "objective_alignment"],
    },
    {
        "id": "lesson-writer",
        "name": "Lesson Writer",
        "group": "Curriculum Generation",
        "description": (
            "Authors lesson content from knowledge-base chunks, producing clear "
            "explanations, examples, and code snippets."
        ),
        "capabilities": ["lesson_write", "example_generate", "code_snippet_create"],
    },
    {
        "id": "exercise-generator",
        "name": "Exercise Generator",
        "group": "Curriculum Generation",
        "description": (
            "Creates practical coding and conceptual exercises with starter code, "
            "hints, and reference solutions grounded in the knowledge base."
        ),
        "capabilities": ["exercise_create", "hint_generate", "solution_write"],
    },
    {
        "id": "quiz-generator",
        "name": "Quiz Generator",
        "group": "Curriculum Generation",
        "description": (
            "Generates multiple-choice quizzes with distractors and explanations, "
            "calibrated to the target difficulty level."
        ),
        "capabilities": ["quiz_create", "distractor_generate", "explanation_write"],
    },
    {
        "id": "project-ideator",
        "name": "Project Ideator",
        "group": "Curriculum Generation",
        "description": (
            "Proposes portfolio-ready capstone projects with requirements, tech-stack "
            "recommendations, and evaluation rubrics."
        ),
        "capabilities": ["project_propose", "rubric_design", "stack_recommend"],
    },
    {
        "id": "resource-curator",
        "name": "Resource Curator",
        "group": "Curriculum Generation",
        "description": (
            "Curates supplementary reading materials, documentation links, and "
            "reference guides from the knowledge base."
        ),
        "capabilities": ["resource_curate", "doc_link", "reference_rank"],
    },

    # ── 2. Personalisation ────────────────────────────────────────────────────
    {
        "id": "skill-gap-analyst",
        "name": "Skill Gap Analyst",
        "group": "Personalisation",
        "description": (
            "Analyses a learner's current knowledge against target competencies to "
            "identify specific skill gaps and priority areas."
        ),
        "capabilities": ["gap_identify", "priority_rank", "competency_map"],
    },
    {
        "id": "difficulty-adjuster",
        "name": "Difficulty Adjuster",
        "group": "Personalisation",
        "description": (
            "Dynamically adjusts the difficulty of exercises and quizzes based on "
            "recent performance history."
        ),
        "capabilities": ["difficulty_tune", "performance_read", "challenge_scale"],
    },
    {
        "id": "learning-style-detector",
        "name": "Learning Style Detector",
        "group": "Personalisation",
        "description": (
            "Infers a learner's preferred modality (visual, reading, practice-based) "
            "from engagement patterns and explicit preferences."
        ),
        "capabilities": ["style_infer", "preference_record", "content_adapt"],
    },
    {
        "id": "pace-optimizer",
        "name": "Pace Optimizer",
        "group": "Personalisation",
        "description": (
            "Recommends an optimal study schedule and daily time allocation based on "
            "the learner's availability and target completion date."
        ),
        "capabilities": ["pace_recommend", "schedule_build", "deadline_project"],
    },

    # ── 3. Mentor System ──────────────────────────────────────────────────────
    {
        "id": "ai-mentor",
        "name": "AI Mentor",
        "group": "Mentor System",
        "description": (
            "Primary conversational agent that answers learner questions using "
            "RAG-retrieved context from the knowledge base."
        ),
        "capabilities": ["answer", "rag_retrieve", "followup_suggest"],
    },
    {
        "id": "concept-explainer",
        "name": "Concept Explainer",
        "group": "Mentor System",
        "description": (
            "Provides detailed, multi-layered explanations of technical concepts "
            "using analogies, diagrams descriptions, and worked examples."
        ),
        "capabilities": ["explain_concept", "analogy_create", "example_elaborate"],
    },
    {
        "id": "hint-provider",
        "name": "Hint Provider",
        "group": "Mentor System",
        "description": (
            "Delivers progressive hints for stuck learners without giving away the "
            "full solution, encouraging independent problem-solving."
        ),
        "capabilities": ["hint_progressive", "nudge_guide", "solution_withhold"],
    },
    {
        "id": "concept-simplifier",
        "name": "Concept Simplifier",
        "group": "Mentor System",
        "description": (
            "Re-explains complex topics in simpler language, breaking them into "
            "smaller digestible steps for beginners."
        ),
        "capabilities": ["simplify", "step_decompose", "jargon_reduce"],
    },

    # ── 4. Content Quality ────────────────────────────────────────────────────
    {
        "id": "content-evaluator",
        "name": "Content Evaluator",
        "group": "Content Quality",
        "description": (
            "Scores generated lessons, exercises, and quizzes against quality "
            "rubrics covering accuracy, clarity, and pedagogical soundness."
        ),
        "capabilities": ["quality_score", "rubric_apply", "flag_issues"],
    },
    {
        "id": "content-improver",
        "name": "Content Improver",
        "group": "Content Quality",
        "description": (
            "Rewrites or augments low-scoring content based on evaluator feedback, "
            "improving clarity, examples, and coverage."
        ),
        "capabilities": ["content_rewrite", "example_add", "coverage_expand"],
    },
    {
        "id": "knowledge-updater",
        "name": "Knowledge Updater",
        "group": "Content Quality",
        "description": (
            "Monitors the knowledge base for outdated information and flags or "
            "updates entries to reflect current best practices."
        ),
        "capabilities": ["freshness_check", "update_flag", "kb_patch"],
    },

    # ── 5. Analytics ──────────────────────────────────────────────────────────
    {
        "id": "progress-analyst",
        "name": "Progress Analyst",
        "group": "Analytics",
        "description": (
            "Analyses completed activities, quiz scores, and time-on-task to "
            "generate actionable progress insights and recommendations."
        ),
        "capabilities": ["analyse_progress", "insight_generate", "recommend_next"],
    },
    {
        "id": "engagement-tracker",
        "name": "Engagement Tracker",
        "group": "Analytics",
        "description": (
            "Tracks session length, page views, and interaction patterns to "
            "identify disengagement and trigger re-engagement nudges."
        ),
        "capabilities": ["session_track", "pattern_detect", "nudge_trigger"],
    },
    {
        "id": "outcome-predictor",
        "name": "Outcome Predictor",
        "group": "Analytics",
        "description": (
            "Predicts learner completion likelihood and final assessment scores "
            "based on historical engagement and performance trends."
        ),
        "capabilities": ["completion_predict", "score_forecast", "risk_flag"],
    },

    # ── 6. Research ───────────────────────────────────────────────────────────
    {
        "id": "web-researcher",
        "name": "Web Researcher",
        "group": "Research",
        "description": (
            "Searches the web for up-to-date tutorials, blog posts, and official "
            "documentation to supplement the local knowledge base."
        ),
        "capabilities": ["web_search", "content_fetch", "relevance_rank"],
    },
    {
        "id": "doc-scraper",
        "name": "Documentation Scraper",
        "group": "Research",
        "description": (
            "Scrapes and indexes official API documentation and technical references, "
            "converting them into knowledge-base-compatible Markdown."
        ),
        "capabilities": ["doc_scrape", "html_to_md", "kb_ingest"],
    },
]

# ── Convenience helpers ───────────────────────────────────────────────────────

def get_all_agents() -> List[Dict[str, Any]]:
    return AGENTS


def get_agent_by_id(agent_id: str) -> Dict[str, Any] | None:
    for agent in AGENTS:
        if agent["id"] == agent_id:
            return agent
    return None


def get_agents_by_group(group: str) -> List[Dict[str, Any]]:
    return [a for a in AGENTS if a["group"].lower() == group.lower()]


def get_group_summary() -> Dict[str, int]:
    summary: Dict[str, int] = {}
    for a in AGENTS:
        summary[a["group"]] = summary.get(a["group"], 0) + 1
    return summary
