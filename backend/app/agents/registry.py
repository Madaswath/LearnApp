from dataclasses import dataclass
from typing import Dict, List


@dataclass
class AgentSpec:
    name: str
    role: str
    goal: str


AGENT_SPECS: List[AgentSpec] = [
    AgentSpec("learning_roadmap_architect", "Roadmap Designer", "Build end-to-end learning journey."),
    AgentSpec("curriculum_architect", "Curriculum Planner", "Organize chapters and module dependencies."),
    AgentSpec("lesson_generator", "Lesson Author", "Generate concept-rich lessons with examples."),
    AgentSpec("exercise_generator", "Exercise Designer", "Generate coding and practice exercises."),
    AgentSpec("quiz_generator", "Assessment Builder", "Generate quizzes and scoring rubrics."),
    AgentSpec("project_generator", "Project Designer", "Create portfolio-ready projects."),
    AgentSpec("resource_curator", "Resource Curator", "Attach high-quality docs/videos."),
    AgentSpec("skill_gap_analyzer", "Gap Analyst", "Detect missing prerequisites and weak skills."),
    AgentSpec("difficulty_adapter", "Difficulty Optimizer", "Adjust challenge level dynamically."),
    AgentSpec("learning_style_analyzer", "Style Analyst", "Tailor format to user preferences."),
    AgentSpec("pace_optimizer", "Pace Planner", "Adapt weekly load to available time."),
    AgentSpec("mentor_agent", "AI Mentor", "Guide the student in conversation."),
    AgentSpec("explanation_agent", "Concept Explainer", "Answer with clarity and depth."),
    AgentSpec("hint_generator", "Hint Assistant", "Give progressive hints without spoilers."),
    AgentSpec("concept_simplifier", "Simplifier", "Convert hard concepts into analogies."),
    AgentSpec("curriculum_evaluator", "Quality Evaluator", "Evaluate relevance and structure."),
    AgentSpec("improvement_agent", "Curriculum Improver", "Apply iterative refinements."),
    AgentSpec("knowledge_updater", "Knowledge Maintainer", "Refresh outdated content."),
    AgentSpec("progress_analyzer", "Progress Analyst", "Compute mastery and completion."),
    AgentSpec("engagement_predictor", "Engagement Predictor", "Predict churn and motivation drops."),
    AgentSpec("learning_outcome_predictor", "Outcome Predictor", "Forecast exam/project success."),
    AgentSpec("web_research_agent", "Researcher", "Pull latest industry references."),
    AgentSpec("documentation_scraper", "Doc Scraper", "Parse API docs into knowledge chunks."),
]


def agent_map() -> Dict[str, AgentSpec]:
    return {agent.name: agent for agent in AGENT_SPECS}
