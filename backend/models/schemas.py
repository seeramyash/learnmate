from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class LearnRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=2000)
    user_id: str = Field(..., min_length=1, max_length=128)

    @field_validator("topic", "user_id")
    @classmethod
    def strip_nonempty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("must not be empty")
        return s


class LearnResponse(BaseModel):
    explanation: str
    adaptation_level: Literal["very_simple", "moderate", "advanced"]
    user_id: str
    topic: str
    resources_summary: str | None = None
    model_used: Literal["gemini", "ollama", "fallback"]


class QuizRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=2000)
    user_id: str = Field(..., min_length=1, max_length=128)
    difficulty: Literal["easy", "medium", "hard"] | None = None
    num_questions: int = Field(default=5, ge=1, le=15)

    @field_validator("topic", "user_id")
    @classmethod
    def strip_nonempty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("must not be empty")
        return s


class QuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(..., min_length=2, max_length=8)
    answer: str
    explanation: str


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]
    topic: str
    user_id: str
    difficulty: str
    model_used: Literal["gemini", "ollama", "fallback"]


class QuizSubmitRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=128)
    topic: str | None = Field(default=None, max_length=2000)
    questions: list[QuizQuestion]
    answers: dict[str, str] = Field(
        ...,
        description="Map question index (as string) to selected option text",
    )

    @field_validator("user_id")
    @classmethod
    def strip_nonempty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("must not be empty")
        return s

    @field_validator("topic")
    @classmethod
    def strip_topic_if_present(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        return s or None


class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    accuracy_percentage: float
    results: list[dict[str, Any]]
    correct_answers: int
    wrong_answers: int


class ProgressRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=128)

    @field_validator("user_id")
    @classmethod
    def strip_nonempty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("must not be empty")
        return s


class ProgressReport(BaseModel):
    user_id: str
    topics_covered: list[str]
    weak_areas: list[str]
    strong_areas: list[str] = Field(default_factory=list)
    total_questions: int
    correct_answers: int
    accuracy_percentage: float
    improvement_trend: Literal["up", "down", "stable", "insufficient_data"]
    learning_style: str
    study_streak: int
    quiz_sessions: int
    by_topic: dict[str, Any] = Field(default_factory=dict)


class ResourcesRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=2000)
    user_id: str = Field(..., min_length=1, max_length=128)

    @field_validator("topic", "user_id")
    @classmethod
    def strip_nonempty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("must not be empty")
        return s


class ResourcesResponse(BaseModel):
    topic: str
    user_id: str
    summary: str
    sources: list[dict[str, str]]
