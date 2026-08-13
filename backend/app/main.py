"""FastAPI assembly for the TeacherOS local prototype."""

from io import BytesIO

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse

from .contracts import GenerateExamRequest, ScoreAttemptRequest
from .domain.models import ExamSet
from .domain.services import (
    class_analytics,
    fixture_exam,
    generate_exam,
    score_attempt,
    student_report,
)
from .exports import (
    build_exam_html,
    build_pa_car_html,
    build_pp5_workbook,
    build_remedial_html,
)

app = FastAPI(
    title="TeacherOS Prototype API",
    version="0.1.0",
    description="Assessment-to-action demo for Mathematics M.3.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/exams/demo", response_model=ExamSet)
def get_demo_exam() -> ExamSet:
    return fixture_exam()


@app.post("/api/exams/generate", response_model=ExamSet)
def post_generate_exam(request: GenerateExamRequest) -> ExamSet:
    return generate_exam(
        grade=request.grade,
        subject=request.subject,
        topic=request.topic,
        question_count=request.question_count,
        difficulty=request.difficulty,
        mode=request.mode,
    )


@app.post("/api/attempts/score")
def post_score_attempt(request: ScoreAttemptRequest) -> dict:
    return score_attempt(request.student_name, request.exam_id, request.answers)


@app.get("/api/classes/demo/analytics")
def get_class_analytics() -> dict:
    return class_analytics()


@app.get("/api/students/{student_id}/report")
def get_student_report(student_id: str) -> dict:
    report = student_report(student_id)
    if report is None:
        raise HTTPException(status_code=404, detail="ไม่พบนักเรียน")
    return report


@app.get("/api/students/{student_id}/remedial", response_class=HTMLResponse)
def get_student_remedial(student_id: str) -> HTMLResponse:
    document = build_remedial_html(student_id)
    if document is None:
        raise HTTPException(status_code=404, detail="ไม่พบนักเรียน")
    return HTMLResponse(document)


@app.get("/api/exports/exam", response_class=HTMLResponse)
def get_printable_exam() -> HTMLResponse:
    return HTMLResponse(build_exam_html())


@app.get("/api/exports/pp5.xlsx")
def get_pp5_workbook() -> StreamingResponse:
    headers = {"Content-Disposition": 'attachment; filename="teacheros-pp5-demo.xlsx"'}
    return StreamingResponse(
        BytesIO(build_pp5_workbook()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@app.get("/api/exports/pa-car", response_class=HTMLResponse)
def get_pa_car_report() -> HTMLResponse:
    return HTMLResponse(build_pa_car_html())
