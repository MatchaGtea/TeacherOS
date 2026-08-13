"""HTTP request contracts owned by the integration layer."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class GenerateExamRequest(BaseModel):
    grade: str = "ม.3"
    subject: str = "คณิตศาสตร์"
    topic: str = "สมการกำลังสองตัวแปรเดียว"
    question_count: int = Field(default=12, ge=1, le=12)
    difficulty: Literal["mixed", "easy", "medium", "hard"] = "mixed"
    mode: Literal["fixture", "ai"] = "fixture"


class ScoreAttemptRequest(BaseModel):
    student_name: str = Field(min_length=1, max_length=120)
    exam_id: str = "quadratic-m3-demo"
    answers: dict[str, str]

    @field_validator("answers")
    @classmethod
    def normalize_answers(cls, answers: dict[str, str]) -> dict[str, str]:
        return {
            str(question_id).strip(): str(choice_id).strip().upper()
            for question_id, choice_id in answers.items()
        }
