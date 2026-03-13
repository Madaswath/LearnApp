from typing import Dict, List


EXERCISES: List[Dict] = [
    {
        "id": "ex-1",
        "title": "Implement Gradient Descent",
        "difficulty": "beginner",
        "prompt": "Write a Python function that performs one step of gradient descent for linear regression.",
    },
    {
        "id": "ex-2",
        "title": "Build a Tiny MLP",
        "difficulty": "intermediate",
        "prompt": "Implement a 2-layer neural network and train it on a small dataset.",
    },
]

QUIZZES: List[Dict] = [
    {
        "id": "qz-1",
        "title": "Neural Network Basics",
        "difficulty": "beginner",
        "questions": [
            {
                "id": "q1",
                "question": "What does a learning rate control?",
                "options": ["Data size", "Step size", "Activation output", "Loss function type"],
                "answer": "Step size",
            },
            {
                "id": "q2",
                "question": "Which function introduces non-linearity?",
                "options": ["Activation", "Optimizer", "Batch size", "Epoch"],
                "answer": "Activation",
            },
        ],
    }
]

PROJECTS: List[Dict] = [
    {
        "id": "pr-1",
        "title": "Student Performance Predictor",
        "level": "beginner",
        "brief": "Train and evaluate a model that predicts student performance from study habits.",
        "milestones": [
            "Load and clean dataset",
            "Train baseline model",
            "Evaluate with MAE and R2",
            "Write final report",
        ],
    },
    {
        "id": "pr-2",
        "title": "RAG Tutor Assistant",
        "level": "advanced",
        "brief": "Build a retrieval-augmented chatbot over technical documentation.",
        "milestones": [
            "Chunk docs and create embeddings",
            "Build retriever",
            "Implement prompt template",
            "Deploy API endpoint",
        ],
    },
]


def list_exercises() -> List[Dict]:
    return EXERCISES


def list_quizzes() -> List[Dict]:
    return QUIZZES


def list_projects() -> List[Dict]:
    return PROJECTS
