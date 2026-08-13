from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class KnowledgeNode(BaseModel):
    id: str
    title: str
    short_title: str
    description: str
    prerequisites: list[str]
    indicator: str


class KnowledgeEdge(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")


class Choice(BaseModel):
    id: str
    text: str
    value: list[str]
    root_cause_node: str | None = None
    explanation: str


class Question(BaseModel):
    id: str
    stem: str
    equation: str
    choices: list[Choice]
    correct_choice_id: str
    knowledge_node_id: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    sympy_verified: bool = False
    solution_explanation: str


class ExamPipeline(BaseModel):
    source: Literal["fixture", "ai", "fallback"]
    llm_status: str
    sympy_verified_count: int
    graph_mapped_count: int
    warning: str | None = None


class ExamSet(BaseModel):
    id: str
    title: str
    subject: str = "คณิตศาสตร์"
    grade: str = "ม.3"
    topic: str = "สมการกำลังสองตัวแปรเดียว"
    attempt_number: int = 2
    duration_minutes: int = 40
    total_points: int
    questions: list[Question]
    pipeline: ExamPipeline


class Student(BaseModel):
    id: str
    student_number: int
    student_code: str
    name: str
    room: str = "ม.3/2"


class Attempt(BaseModel):
    student_id: str
    attempt_number: Literal[1, 2]
    exam_id: str
    date: str
    answers: dict[str, str]
    score: int
    total: int = 12


class NodeMastery(BaseModel):
    node_id: str
    correct: int
    evidence_count: int
    percentage: float
    status: Literal["mastered", "developing", "critical"]
    root_cause_hits: int = 0


class GeneratedChoice(BaseModel):
    id: str
    text: str
    value: list[str]
    root_cause_node: str | None = None
    explanation: str = ""


class GeneratedQuestion(BaseModel):
    stem: str
    equation: str
    choices: list[GeneratedChoice]
    correct_choice_id: str
    knowledge_node_id: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    solution_explanation: str = ""


class GeneratedExamPayload(BaseModel):
    questions: list[GeneratedQuestion] = Field(default_factory=list)


class QuizResult(BaseModel):
    student_name: str
    exam_id: str
    score: int
    total: int
    percentage: float
    mastery: list[NodeMastery]
    primary_root_cause: str | None = None
    diagnosis: str
