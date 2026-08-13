"""Deterministic domain services for the TeacherOS quadratic-equation demo.

All fixture-backed functions are pure from a caller's perspective. The only
process state is the generated-exam cache required by the AI generation
contract.
"""

from __future__ import annotations

import hashlib
import json
import os
import random
from collections import Counter
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import sympy as sp

from .models import (
    Attempt,
    Choice,
    ExamPipeline,
    ExamSet,
    GeneratedExamPayload,
    GeneratedQuestion,
    KnowledgeEdge,
    KnowledgeNode,
    NodeMastery,
    Question,
    QuizResult,
    Student,
)

_DATA_DIR = Path(__file__).resolve().parents[2] / "data"
_GRAPH_PATH = _DATA_DIR / "knowledge_graph.json"
_QUESTIONS_PATH = _DATA_DIR / "questions_bank.json"
_STUDENTS_PATH = _DATA_DIR / "students_mock.json"
_NODE_ORDER = ("N01", "N02", "N03", "N04", "N05")
_EXPECTED_EDGES = (
    ("N01", "N02"),
    ("N02", "N03"),
    ("N02", "N04"),
    ("N03", "N05"),
    ("N04", "N05"),
)
_AI_CACHE: dict[str, ExamSet] = {}


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _graph_fixture() -> tuple[tuple[KnowledgeNode, ...], tuple[KnowledgeEdge, ...]]:
    payload = _read_json(_GRAPH_PATH)
    nodes = tuple(KnowledgeNode.model_validate(item) for item in payload["nodes"])
    edges = tuple(KnowledgeEdge.model_validate(item) for item in payload["edges"])
    if tuple(node.id for node in nodes) != _NODE_ORDER:
        raise ValueError("knowledge graph must contain N01 through N05 in canonical order")
    edge_pairs = tuple((edge.from_node, edge.to_node) for edge in edges)
    if edge_pairs != _EXPECTED_EDGES:
        raise ValueError("knowledge graph edges do not match the canonical contract")
    derived = tuple(
        (prerequisite, node.id)
        for node in nodes
        for prerequisite in node.prerequisites
    )
    if set(derived) != set(_EXPECTED_EDGES):
        raise ValueError("node prerequisites and graph edges are inconsistent")
    return nodes, edges


def knowledge_nodes() -> list[KnowledgeNode]:
    return list(_graph_fixture()[0])


def knowledge_edges() -> list[tuple[str, str]]:
    return [(edge.from_node, edge.to_node) for edge in _graph_fixture()[1]]


def prerequisite_path(node_id: str) -> list[str]:
    """Return all transitive prerequisites in dependency-first stable order."""
    node_map = {node.id: node for node in knowledge_nodes()}
    if node_id not in node_map:
        raise KeyError(node_id)
    discovered: set[str] = set()

    def visit(current: str) -> None:
        for prerequisite in node_map[current].prerequisites:
            if prerequisite not in discovered:
                visit(prerequisite)
                discovered.add(prerequisite)

    visit(node_id)
    return [node_id for node_id in _NODE_ORDER if node_id in discovered]


def _parse_equation(equation: str) -> tuple[sp.Symbol, sp.Expr]:
    x = sp.Symbol("x")
    if equation.count("=") > 1:
        raise ValueError("equation contains more than one equals sign")
    if "=" in equation:
        left, right = equation.split("=", maxsplit=1)
        expression = sp.sympify(left, locals={"x": x}) - sp.sympify(right, locals={"x": x})
    else:
        expression = sp.sympify(equation, locals={"x": x})
    expression = sp.expand(expression)
    if expression.free_symbols - {x}:
        raise ValueError("equation contains an unsupported symbol")
    polynomial = sp.Poly(expression, x)
    if polynomial.degree() != 2:
        raise ValueError("equation must be quadratic")
    return x, expression


def _normalise_values(values: list[str]) -> tuple[sp.Expr, ...]:
    if not values:
        raise ValueError("an answer choice must contain at least one value")
    normalised: list[sp.Expr] = []
    for value in values:
        parsed = sp.simplify(sp.sympify(value))
        if parsed.free_symbols:
            raise ValueError("answer values must be constants")
        normalised.append(parsed)
    if len(set(normalised)) != len(normalised):
        raise ValueError("a choice cannot repeat the same root")
    return tuple(sorted(normalised, key=sp.default_sort_key))


def _solutions(equation: str) -> tuple[sp.Expr, ...]:
    x, expression = _parse_equation(equation)
    roots = [sp.simplify(root) for root in sp.solve(sp.Eq(expression, 0), x)]
    if not roots:
        raise ValueError("quadratic must expose answer roots")
    return tuple(sorted(set(roots), key=sp.default_sort_key))


def verify_question(question: Question) -> Question:
    """Verify mathematical correctness, unique choices, and graph mappings."""
    try:
        valid_nodes = set(_NODE_ORDER)
        if question.knowledge_node_id not in valid_nodes:
            raise ValueError("question has an invalid knowledge node")
        if len(question.choices) != 4:
            raise ValueError("question must have exactly four choices")
        choice_ids = [choice.id for choice in question.choices]
        if set(choice_ids) != {"A", "B", "C", "D"} or len(choice_ids) != len(set(choice_ids)):
            raise ValueError("choice IDs must be the unique values A through D")
        if choice_ids.count(question.correct_choice_id) != 1:
            raise ValueError("correct choice ID is missing or ambiguous")
        for choice in question.choices:
            if choice.id == question.correct_choice_id and choice.root_cause_node is not None:
                raise ValueError("the correct answer cannot declare a root cause")
            if choice.id != question.correct_choice_id and choice.root_cause_node not in valid_nodes:
                raise ValueError("every distractor must map to a valid root-cause node")

        expected = _solutions(question.equation)
        normalised = [_normalise_values(choice.value) for choice in question.choices]
        if len(set(normalised)) != 4:
            raise ValueError("choices must be mathematically unique")
        matches = [choice.id for choice, values in zip(question.choices, normalised) if values == expected]
        if matches != [question.correct_choice_id]:
            raise ValueError("exactly the declared correct choice must match the SymPy solution")
        return question.model_copy(update={"sympy_verified": True})
    except Exception as exc:
        raise ValueError(f"SymPy verification failed for {question.id}: {exc}") from exc


@lru_cache(maxsize=1)
def fixture_exam() -> ExamSet:
    payload = _read_json(_QUESTIONS_PATH)
    questions = [verify_question(Question.model_validate(item)) for item in payload["questions"]]
    if len(questions) != 12:
        raise ValueError("the canonical fixture exam must have exactly 12 questions")
    exam = payload["exam"]
    return ExamSet(
        **exam,
        total_points=len(questions),
        questions=questions,
        pipeline=ExamPipeline(
            source="fixture",
            llm_status="not_requested",
            sympy_verified_count=len(questions),
            graph_mapped_count=len(questions),
        ),
    )


@lru_cache(maxsize=1)
def _student_rows() -> tuple[dict[str, Any], ...]:
    rows = tuple(_read_json(_STUDENTS_PATH)["students"])
    if len(rows) != 30 or len({row["name"] for row in rows}) != 30:
        raise ValueError("student fixtures must contain 30 unique learners")
    return rows


def seeded_students() -> list[Student]:
    return [
        Student.model_validate(
            {
                "id": row["id"],
                "student_number": row["student_number"],
                "student_code": row["student_code"],
                "name": row["name"],
                "room": row["room"],
            }
        )
        for row in _student_rows()
    ]


def _random_for(student_id: str, attempt_number: int) -> random.Random:
    digest = hashlib.sha256(f"teacheros:{student_id}:{attempt_number}".encode()).digest()
    return random.Random(int.from_bytes(digest[:8], "big"))


def _answers_for(row: dict[str, Any], attempt_number: int, score: int) -> dict[str, str]:
    questions = fixture_exam().questions
    rng = _random_for(row["id"], attempt_number)
    correct_indexes = set(rng.sample(range(len(questions)), score))
    answers: dict[str, str] = {}
    for index, question in enumerate(questions):
        if index in correct_indexes:
            answers[question.id] = question.correct_choice_id
            continue
        profile = row["answer_profile"]
        if profile == "N01":
            answers[question.id] = "B"
        elif profile in {"N03", "perfect"}:
            answers[question.id] = "C"
        else:
            # Most class errors are factorisation errors; the minority provides
            # realistic variation in the heatmap and root-cause counts.
            draw = rng.random()
            answers[question.id] = "C" if draw < 0.82 else "D" if draw < 0.94 else "B"
    return answers


@lru_cache(maxsize=1)
def _seeded_attempts_cached() -> tuple[Attempt, ...]:
    attempts: list[Attempt] = []
    for row in _student_rows():
        for attempt_number, score, date in (
            (1, row["attempt_1_score"], "2026-06-10"),
            (2, row["attempt_2_score"], "2026-07-15"),
        ):
            answers = _answers_for(row, attempt_number, score)
            computed_score = sum(
                answers[question.id] == question.correct_choice_id
                for question in fixture_exam().questions
            )
            if computed_score != score:
                raise AssertionError("seeded answer selection did not preserve the configured score")
            attempts.append(
                Attempt(
                    student_id=row["id"],
                    attempt_number=attempt_number,
                    exam_id=f"EXAM-DEMO-0{attempt_number}",
                    date=date,
                    answers=answers,
                    score=score,
                )
            )
    return tuple(attempts)


def seeded_attempts() -> list[Attempt]:
    return list(_seeded_attempts_cached())


def mastery_status(percentage: float) -> Literal["mastered", "developing", "critical"]:
    if percentage >= 80:
        return "mastered"
    if percentage >= 50:
        return "developing"
    return "critical"


def mastery_for_answers(answers: dict[str, str], exam: ExamSet | None = None) -> list[NodeMastery]:
    """Combine direct-node outcomes with selected distractor root-cause evidence.

    Each direct question is one evidence item. Every selected distractor adds a
    failure evidence item to its mapped root-cause node. This lets a sign error
    on a later quadratic question update foundational N01 mastery as well.
    """
    exam = exam or fixture_exam()
    selected_choices = {
        question.id: next(
            (choice for choice in question.choices if choice.id == answers.get(question.id)),
            None,
        )
        for question in exam.questions
    }
    mastery: list[NodeMastery] = []
    for node_id in _NODE_ORDER:
        direct_questions = [q for q in exam.questions if q.knowledge_node_id == node_id]
        direct_correct = sum(
            answers.get(question.id) == question.correct_choice_id
            for question in direct_questions
        )
        root_cause_hits = sum(
            choice is not None
            and choice.id != question.correct_choice_id
            and choice.root_cause_node == node_id
            for question, choice in (
                (question, selected_choices[question.id]) for question in exam.questions
            )
        )
        evidence_count = len(direct_questions) + root_cause_hits
        percentage = round(100 * direct_correct / evidence_count, 1) if evidence_count else 0.0
        mastery.append(
            NodeMastery(
                node_id=node_id,
                correct=direct_correct,
                evidence_count=evidence_count,
                percentage=percentage,
                status=mastery_status(percentage),
                root_cause_hits=root_cause_hits,
            )
        )
    return mastery


def _primary_root_cause(mastery: list[NodeMastery]) -> str | None:
    if mastery and all(item.percentage == 100 for item in mastery):
        return None
    with_hits = [item for item in mastery if item.root_cause_hits]
    if with_hits:
        return max(
            with_hits,
            key=lambda item: (
                item.root_cause_hits,
                -item.percentage,
                -_NODE_ORDER.index(item.node_id),
            ),
        ).node_id
    return min(mastery, key=lambda item: (item.percentage, _NODE_ORDER.index(item.node_id))).node_id


def diagnosis_for(mastery: list[NodeMastery], primary_root_cause: str | None) -> str:
    if primary_root_cause is None and mastery and all(item.percentage == 100 for item in mastery):
        return "มีความชำนาญครบทุกทักษะ พร้อมต่อยอดด้วยโจทย์ท้าทายและอธิบายเหตุผลหลายวิธี"
    if primary_root_cause is None:
        return "ควรเก็บหลักฐานคำตอบเพิ่มเติมเพื่อระบุทักษะที่ต้องพัฒนา"
    node = next(node for node in knowledge_nodes() if node.id == primary_root_cause)
    prerequisites = prerequisite_path(primary_root_cause)
    path = " → ".join(prerequisites + [primary_root_cause])
    return f"หลักฐานชี้ว่าควรทบทวนเรื่อง{node.title} ตามเส้นทางความรู้ {path}"


def score_attempt(student_name: str, exam_id: str, answers: dict[str, str]) -> dict[str, Any]:
    """Score an ad-hoc quiz without writing to the seeded class fixtures."""
    exam = fixture_exam()
    score = sum(answers.get(question.id) == question.correct_choice_id for question in exam.questions)
    mastery = mastery_for_answers(answers, exam)
    primary = _primary_root_cause(mastery)
    result = QuizResult(
        student_name=student_name,
        exam_id=exam_id,
        score=score,
        total=len(exam.questions),
        percentage=round(score * 100 / len(exam.questions), 1),
        mastery=mastery,
        primary_root_cause=primary,
        diagnosis=diagnosis_for(mastery, primary),
    )
    return result.model_dump()


def student_report(student_id: str) -> dict[str, Any] | None:
    student = next((student for student in seeded_students() if student.id == student_id), None)
    if student is None:
        return None
    attempts = sorted(
        (attempt for attempt in seeded_attempts() if attempt.student_id == student_id),
        key=lambda attempt: attempt.attempt_number,
    )
    previous, latest = attempts
    mastery = mastery_for_answers(latest.answers)
    primary = _primary_root_cause(mastery)
    perfect = latest.score == latest.total
    if perfect:
        recommendations = [
            "ลองโจทย์ท้าทายที่มีพารามิเตอร์หรือรากเป็นเศษส่วน",
            "อธิบายเปรียบเทียบวิธีแยกตัวประกอบกับสูตรกำลังสอง",
        ]
        learning_level = "ก้าวหน้า"
    else:
        path = prerequisite_path(primary) + [primary] if primary else []
        recommendations = [
            f"ทบทวน {node.title}"
            for node in knowledge_nodes()
            if node.id in path
        ]
        percentage = latest.score / latest.total * 100
        learning_level = (
            "เชี่ยวชาญ" if percentage >= 80 else
            "กำลังพัฒนา" if percentage >= 50 else
            "ต้องเสริมเร่งด่วน"
        )
    return {
        "student": student,
        "attempts": attempts,
        "latest_score": latest.score,
        "latest_percentage": round(latest.score / latest.total * 100, 1),
        "growth": latest.score - previous.score,
        "mastery": mastery,
        "primary_root_cause": primary,
        "diagnosis": diagnosis_for(mastery, primary),
        "recommendations": recommendations,
        "learning_level": learning_level,
    }


def class_analytics() -> dict[str, Any]:
    current = {
        attempt.student_id: attempt
        for attempt in seeded_attempts()
        if attempt.attempt_number == 2
    }
    previous = {
        attempt.student_id: attempt
        for attempt in seeded_attempts()
        if attempt.attempt_number == 1
    }
    rows: list[dict[str, Any]] = []
    for student in seeded_students():
        latest = current[student.id]
        mastery = mastery_for_answers(latest.answers)
        rows.append(
            {
                "student": student,
                "score": latest.score,
                "total": latest.total,
                "growth": latest.score - previous[student.id].score,
                "mastery": mastery,
            }
        )

    node_summary: list[dict[str, Any]] = []
    for node in knowledge_nodes():
        node_mastery = [
            next(item for item in row["mastery"] if item.node_id == node.id)
            for row in rows
        ]
        distribution = Counter(item.status for item in node_mastery)
        node_summary.append(
            {
                "node": node,
                "average_percentage": round(
                    sum(item.percentage for item in node_mastery) / len(node_mastery),
                    1,
                ),
                "status_distribution": {
                    status: distribution.get(status, 0)
                    for status in ("mastered", "developing", "critical")
                },
            }
        )
    focus = min(
        node_summary,
        key=lambda item: (
            item["average_percentage"],
            _NODE_ORDER.index(item["node"].id),
        ),
    )["node"]

    flagged: list[dict[str, Any]] = []
    for row in rows:
        reasons: list[str] = []
        if row["score"] / row["total"] * 100 < 50:
            reasons.append("คะแนนต่ำกว่า 50%")
        if sum(item.status == "critical" for item in row["mastery"]) >= 2:
            reasons.append("มีอย่างน้อย 2 ทักษะวิกฤต")
        if row["growth"] < 0:
            reasons.append("ผลคะแนนลดลง")
        if reasons:
            flagged.append(
                {
                    "student_id": row["student"].id,
                    "name": row["student"].name,
                    "score": row["score"],
                    "growth": row["growth"],
                    "reason": " · ".join(reasons),
                }
            )
    return {
        "class_id": "demo",
        "room": "ม.3/2",
        "exam_title": fixture_exam().title,
        "attempt_number": 2,
        "students": rows,
        "node_summary": node_summary,
        "class_average": round(sum(row["score"] for row in rows) / len(rows) / 12 * 100, 1),
        "previous_average": round(sum(item.score for item in previous.values()) / 30 / 12 * 100, 1),
        "insight": {
            "focus_node_id": focus.id,
            "headline": f"ควรเร่งเสริม {focus.short_title}",
            "recommendation": f"จัดกลุ่มฝึก {focus.title} จากรูปแบบคำตอบผิดรายบุคคล",
        },
        "flagged_students": flagged,
    }


def remedial_document(student_id: str) -> dict[str, Any] | None:
    report = student_report(student_id)
    if report is None:
        return None
    focus = report["primary_root_cause"] or "N05"
    practices = [
        question
        for question in fixture_exam().questions
        if question.knowledge_node_id == focus
    ]
    for question in fixture_exam().questions:
        if question not in practices and len(practices) < 3:
            practices.append(question)
    html = (
        "<!doctype html><html lang='th'><head><meta charset='utf-8'>"
        "<style>@page{size:A4;margin:12mm}body{font-family:'Noto Sans Thai',sans-serif}</style>"
        f"</head><body><article><h1>ใบซ่อมเสริมคณิตศาสตร์</h1>"
        f"<p>นักเรียน: {report['student'].name}</p><h2>จุดเน้น: {focus}</h2>"
        f"<p>{report['diagnosis']}</p></article></body></html>"
    )
    return {
        "student": report["student"],
        "focus_node_id": focus,
        "micro_lesson": report["diagnosis"],
        "practice_questions": practices[:3],
        "teacher_note": "ติดตามผลหลังทำแบบฝึกและบันทึกหลักฐานรายทักษะ",
        "html": html,
    }


def _candidate_to_question(candidate: GeneratedQuestion, index: int) -> Question:
    return Question(
        id=f"AI{index:02d}",
        stem=candidate.stem,
        equation=candidate.equation,
        choices=[Choice.model_validate(choice.model_dump()) for choice in candidate.choices],
        correct_choice_id=candidate.correct_choice_id,
        knowledge_node_id=candidate.knowledge_node_id,
        difficulty=candidate.difficulty,
        solution_explanation=candidate.solution_explanation,
    )


def _create_openai_client() -> Any:
    # Kept lazy so fixture mode has no OpenAI package/key runtime dependency.
    from openai import OpenAI

    return OpenAI()


def clear_generation_cache() -> None:
    """Clear process cache; intended for deterministic tests and local demos."""
    _AI_CACHE.clear()


def _generation_signature(
    grade: str,
    subject: str,
    topic: str,
    question_count: int,
    difficulty: str,
    mode: str,
) -> str:
    return json.dumps(
        {
            "grade": grade,
            "subject": subject,
            "topic": topic,
            "question_count": question_count,
            "difficulty": difficulty,
            "mode": mode,
            "model": os.getenv("OPENAI_MODEL", "gpt-5-mini") if mode == "ai" else None,
        },
        ensure_ascii=False,
        sort_keys=True,
    )


def generate_exam(
    grade: str,
    subject: str,
    topic: str,
    question_count: int = 12,
    difficulty: str = "medium",
    mode: str = "fixture",
) -> ExamSet:
    if not 1 <= question_count <= 12:
        raise ValueError("question_count must be between 1 and 12")
    if mode not in {"fixture", "ai"}:
        raise ValueError("mode must be fixture or ai")
    signature = _generation_signature(
        grade, subject, topic, question_count, difficulty, mode
    )
    if signature in _AI_CACHE:
        return _AI_CACHE[signature]

    fixture = fixture_exam()
    selected = fixture.questions[:question_count]
    if mode == "fixture":
        result = fixture.model_copy(
            update={
                "grade": grade,
                "subject": subject,
                "topic": topic,
                "questions": selected,
                "total_points": question_count,
                "pipeline": ExamPipeline(
                    source="fixture",
                    llm_status="not_requested",
                    sympy_verified_count=question_count,
                    graph_mapped_count=question_count,
                ),
            }
        )
        _AI_CACHE[signature] = result
        return result

    candidates: list[GeneratedQuestion] = []
    request_error: Exception | None = None
    try:
        if not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("ไม่พบ OPENAI_API_KEY")
        response = _create_openai_client().responses.parse(
            model=os.getenv("OPENAI_MODEL", "gpt-5-mini"),
            input=[
                {
                    "role": "system",
                    "content": "สร้างข้อสอบคณิตศาสตร์ภาษาไทยตาม schema เท่านั้น โดยตัวเลือกผิดต้องระบุสาเหตุจาก N01-N05",
                },
                {
                    "role": "user",
                    "content": f"สร้างข้อสอบ {subject} {grade} เรื่อง {topic} ระดับ {difficulty} จำนวน {question_count} ข้อ",
                },
            ],
            text_format=GeneratedExamPayload,
        )
        parsed = getattr(response, "output_parsed", None)
        if parsed is None:
            raise ValueError("โมเดลไม่ส่งข้อมูลตาม schema")
        candidates = GeneratedExamPayload.model_validate(parsed).questions
    except Exception as exc:  # One call, deliberately zero retries.
        request_error = exc

    verified: list[Question] = []
    substitutions = 0
    for index in range(question_count):
        try:
            verified.append(
                verify_question(_candidate_to_question(candidates[index], index + 1))
            )
        except (IndexError, ValueError, TypeError):
            verified.append(selected[index])
            substitutions += 1

    if request_error is not None:
        warning = (
            "ไม่พบคีย์สำหรับ AI จึงใช้ชุดข้อสอบสำรองครบถ้วน"
            if isinstance(request_error, RuntimeError) and "OPENAI_API_KEY" in str(request_error)
            else "AI ไม่พร้อมใช้งาน จึงใช้ชุดข้อสอบสำรองครบถ้วน"
        )
        llm_status = "fallback"
        source: Literal["ai", "fallback"] = "fallback"
    elif substitutions:
        warning = f"แทนข้อสอบ AI ที่ไม่ผ่านการตรวจ {substitutions} ข้อด้วยข้อสอบสำรอง"
        llm_status = "partial_fallback"
        source = "fallback"
    else:
        warning = None
        llm_status = "success"
        source = "ai"

    result = fixture.model_copy(
        update={
            "id": "EXAM-GENERATED",
            "title": "ชุดข้อสอบที่สร้าง",
            "subject": subject,
            "grade": grade,
            "topic": topic,
            "questions": verified,
            "total_points": question_count,
            "pipeline": ExamPipeline(
                source=source,
                llm_status=llm_status,
                sympy_verified_count=len(verified),
                graph_mapped_count=len(verified),
                warning=warning,
            ),
        }
    )
    _AI_CACHE[signature] = result
    return result
