from __future__ import annotations

from types import SimpleNamespace

import pytest

from backend.app.domain import services
from backend.app.domain.models import GeneratedExamPayload, GeneratedQuestion
from backend.app.domain.services import (
    class_analytics,
    clear_generation_cache,
    fixture_exam,
    generate_exam,
    knowledge_edges,
    knowledge_nodes,
    mastery_for_answers,
    mastery_status,
    prerequisite_path,
    remedial_document,
    score_attempt,
    seeded_attempts,
    seeded_students,
    student_report,
    verify_question,
)


@pytest.fixture(autouse=True)
def empty_generation_cache():
    clear_generation_cache()
    yield
    clear_generation_cache()


def _candidate(index: int) -> GeneratedQuestion:
    question = fixture_exam().questions[index]
    return GeneratedQuestion.model_validate(
        question.model_dump(exclude={"id", "sympy_verified"})
    )


class FakeResponses:
    def __init__(self, payload: GeneratedExamPayload | None = None, error: Exception | None = None):
        self.payload = payload
        self.error = error
        self.calls: list[dict] = []

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return SimpleNamespace(output_parsed=self.payload)


class FakeOpenAI:
    def __init__(self, responses: FakeResponses):
        self.responses = responses


def test_canonical_knowledge_graph_and_transitive_traversal():
    nodes = knowledge_nodes()
    assert [node.id for node in nodes] == ["N01", "N02", "N03", "N04", "N05"]
    assert knowledge_edges() == [
        ("N01", "N02"),
        ("N02", "N03"),
        ("N02", "N04"),
        ("N03", "N05"),
        ("N04", "N05"),
    ]
    assert {node.id: node.prerequisites for node in nodes} == {
        "N01": [],
        "N02": ["N01"],
        "N03": ["N02"],
        "N04": ["N02"],
        "N05": ["N03", "N04"],
    }
    assert prerequisite_path("N01") == []
    assert prerequisite_path("N03") == ["N01", "N02"]
    assert prerequisite_path("N05") == ["N01", "N02", "N03", "N04"]
    with pytest.raises(KeyError):
        prerequisite_path("N99")


def test_fixture_bank_is_polished_and_fully_sympy_verified():
    exam = fixture_exam()
    assert len(exam.questions) == exam.total_points == 12
    assert exam.pipeline.sympy_verified_count == 12
    assert exam.pipeline.graph_mapped_count == 12
    for question in exam.questions:
        assert question.sympy_verified
        assert "**" not in question.stem
        assert len(question.choices) == 4
        assert {choice.id for choice in question.choices} == {"A", "B", "C", "D"}
        assert all(
            choice.root_cause_node in {"N01", "N02", "N03", "N04", "N05"}
            for choice in question.choices
            if choice.id != question.correct_choice_id
        )


def test_sympy_rejects_wrong_answer_duplicate_choice_and_invalid_graph_mapping():
    wrong = fixture_exam().questions[0].model_copy(deep=True)
    wrong.choices[0].value = ["99"]
    with pytest.raises(ValueError, match="SymPy verification failed"):
        verify_question(wrong)

    duplicate = fixture_exam().questions[0].model_copy(deep=True)
    duplicate.choices[1].value = list(reversed(duplicate.choices[0].value))
    with pytest.raises(ValueError, match="mathematically unique"):
        verify_question(duplicate)

    invalid_question_node = fixture_exam().questions[0].model_copy(
        update={"knowledge_node_id": "N99"}
    )
    with pytest.raises(ValueError, match="invalid knowledge node"):
        verify_question(invalid_question_node)

    invalid_root_cause = fixture_exam().questions[0].model_copy(deep=True)
    invalid_root_cause.choices[1].root_cause_node = "N99"
    with pytest.raises(ValueError, match="root-cause node"):
        verify_question(invalid_root_cause)


def test_mastery_threshold_boundaries_are_exact():
    assert mastery_status(100) == "mastered"
    assert mastery_status(80) == "mastered"
    assert mastery_status(79.999) == "developing"
    assert mastery_status(50) == "developing"
    assert mastery_status(49.999) == "critical"
    assert mastery_status(0) == "critical"


def test_seeded_students_scores_and_varied_answers_are_deterministic():
    students = seeded_students()
    attempts = seeded_attempts()
    assert len(students) == 30
    assert len(attempts) == 60
    assert len({student.name for student in students}) == 30
    assert all("นักเรียนตัวอย่าง" not in student.name for student in students)
    assert seeded_attempts() == attempts

    second_scores = [attempt.score for attempt in attempts if attempt.attempt_number == 2]
    assert min(second_scores) == 2
    assert max(second_scores) == 12
    assert len({tuple(attempt.answers.items()) for attempt in attempts}) > 40
    for attempt in attempts:
        computed = sum(
            attempt.answers[question.id] == question.correct_choice_id
            for question in fixture_exam().questions
        )
        assert computed == attempt.score


def test_personas_and_combined_root_cause_mastery():
    somchai = student_report("STU001")
    assert somchai["student"].name == "นายสมชาย ใจดี"
    assert [attempt.score for attempt in somchai["attempts"]] == [5, 8]
    assert somchai["growth"] == 3
    assert somchai["primary_root_cause"] == "N01"
    n01 = next(item for item in somchai["mastery"] if item.node_id == "N01")
    assert n01.root_cause_hits == 4
    assert n01.evidence_count > 2
    assert n01.status == "critical"

    somying = student_report("STU002")
    assert somying["primary_root_cause"] == "N03"


def test_perfect_student_has_no_root_cause_and_gets_advanced_challenge_guidance():
    report = student_report("STU003")
    assert [attempt.score for attempt in report["attempts"]] == [12, 12]
    assert report["primary_root_cause"] is None
    assert report["learning_level"] == "ก้าวหน้า"
    assert "โจทย์ท้าทาย" in report["diagnosis"]
    assert any("โจทย์ท้าทาย" in item for item in report["recommendations"])
    assert all(item.status == "mastered" for item in report["mastery"])


def test_class_focus_is_n03_heatmap_varies_and_negative_growth_is_flagged():
    analytics = class_analytics()
    assert analytics["insight"]["focus_node_id"] == "N03"
    assert len(analytics["students"]) == 30
    heatmap_rows = {
        tuple(item.percentage for item in row["mastery"])
        for row in analytics["students"]
    }
    assert len(heatmap_rows) >= 12
    negative_growth = {
        row["student"].id for row in analytics["students"] if row["growth"] < 0
    }
    assert {"STU008", "STU014", "STU016", "STU021", "STU026", "STU027"} <= negative_growth
    flagged = {item["student_id"]: item for item in analytics["flagged_students"]}
    assert negative_growth <= set(flagged)
    assert all("ผลคะแนนลดลง" in flagged[student_id]["reason"] for student_id in negative_growth)


def test_unknown_student_and_quiz_scoring_do_not_mutate_class_fixtures():
    assert student_report("MISSING") is None
    assert remedial_document("MISSING") is None
    analytics_before = class_analytics()
    attempts_before = seeded_attempts()
    answers = {question.id: "A" for question in fixture_exam().questions[:4]}
    result = score_attempt("ผู้เรียนทดลอง", fixture_exam().id, answers)
    assert result["score"] == 4
    assert result["total"] == 12
    assert class_analytics() == analytics_before
    assert seeded_attempts() == attempts_before


def test_fixture_mode_never_creates_openai_client(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(
        services,
        "_create_openai_client",
        lambda: pytest.fail("fixture mode must not create an OpenAI client"),
    )
    result = generate_exam("ม.3", "คณิตศาสตร์", "สมการกำลังสอง", 3, "mixed", "fixture")
    assert result.pipeline.source == "fixture"


def test_openai_success_is_exactly_one_parse_call_and_cached(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    responses = FakeResponses(GeneratedExamPayload(questions=[_candidate(0), _candidate(1)]))
    monkeypatch.setattr(services, "_create_openai_client", lambda: FakeOpenAI(responses))

    first = generate_exam("ม.3", "คณิตศาสตร์", "AI-success", 2, "medium", "ai")
    second = generate_exam("ม.3", "คณิตศาสตร์", "AI-success", 2, "medium", "ai")
    assert first is second
    assert first.pipeline.source == "ai"
    assert first.pipeline.llm_status == "success"
    assert [question.id for question in first.questions] == ["AI01", "AI02"]
    assert len(responses.calls) == 1
    assert responses.calls[0]["model"] == "gpt-5-mini"
    assert responses.calls[0]["text_format"] is GeneratedExamPayload


def test_openai_invalid_item_is_substituted_individually_without_retry(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    valid = _candidate(0)
    invalid = _candidate(1).model_copy(deep=True)
    invalid.choices[1].value = list(reversed(invalid.choices[0].value))
    responses = FakeResponses(GeneratedExamPayload(questions=[valid, invalid]))
    monkeypatch.setattr(services, "_create_openai_client", lambda: FakeOpenAI(responses))

    result = generate_exam("ม.3", "คณิตศาสตร์", "AI-partial", 2, "medium", "ai")
    assert len(responses.calls) == 1
    assert result.pipeline.source == "fallback"
    assert result.pipeline.llm_status == "partial_fallback"
    assert "1 ข้อ" in result.pipeline.warning
    assert result.questions[0].id == "AI01"
    assert result.questions[1].id == "Q02"
    assert all(question.sympy_verified for question in result.questions)


def test_openai_failure_falls_back_completely_and_failure_is_cached(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    responses = FakeResponses(error=TimeoutError("simulated timeout"))
    monkeypatch.setattr(services, "_create_openai_client", lambda: FakeOpenAI(responses))

    first = generate_exam("ม.3", "คณิตศาสตร์", "AI-timeout", 3, "hard", "ai")
    second = generate_exam("ม.3", "คณิตศาสตร์", "AI-timeout", 3, "hard", "ai")
    assert first is second
    assert len(responses.calls) == 1
    assert first.pipeline.source == "fallback"
    assert first.pipeline.llm_status == "fallback"
    assert [question.id for question in first.questions] == ["Q01", "Q02", "Q03"]
    assert first.pipeline.warning


def test_ai_without_key_uses_complete_fallback_without_importing_openai(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(
        services,
        "_create_openai_client",
        lambda: pytest.fail("missing-key path must not create an OpenAI client"),
    )
    result = generate_exam("ม.3", "คณิตศาสตร์", "AI-no-key", 3, "medium", "ai")
    assert result.pipeline.source == "fallback"
    assert result.pipeline.llm_status == "fallback"
    assert len(result.questions) == 3
