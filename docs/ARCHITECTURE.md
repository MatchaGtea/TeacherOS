# TeacherOS prototype architecture

## Product boundary

Local, single-teacher prototype for Mathematics M.3, unit “single-variable quadratic equations”. No login, database, deployment, school integration, or production-security work.

Core demo path:

`generate exam -> SymPy verification -> knowledge-node mapping -> quiz / printable exam -> class analytics -> student report -> remedial / PP5 / PA-CAR exports`

The complete demo must work without an API key. AI generation is an optional one-call enhancement and never blocks fixture mode.

## Runtime and ownership

- `backend/app/domain/**`, `backend/data/**`, `backend/tests/test_domain.py`, `backend/tests/test_api.py`: Terra backend builder.
- `frontend/**`: Terra frontend builder.
- `backend/app/exports/**`, export-specific tests: later Terra export builder.
- `backend/app/main.py`, `backend/app/contracts.py`, root tooling/configuration, cross-surface integration and final fixes: Sol lead.
- Builders must not edit another workstream's owned files without an explicit Sol repair instruction.

Runtime:

- Backend: Python 3.11+, FastAPI, Pydantic v2, SymPy, openpyxl, optional OpenAI Python SDK.
- Frontend: React 19, Vite, TypeScript, React Router, Recharts, Lucide React.
- No persistence: fixtures are JSON; any generated-exam cache is process memory only.

## Canonical domain contracts

All API JSON uses snake_case. Dates are ISO `YYYY-MM-DD`. Percentages are numbers from 0 through 100.

### KnowledgeNode

```json
{
  "id": "N01",
  "title": "จำนวนติดลบและเครื่องหมาย",
  "short_title": "จำนวนติดลบ",
  "description": "...",
  "prerequisites": [],
  "indicator": "ค 1.1 ม.3/1"
}
```

Exactly five nodes exist: N01 negative numbers/signs; N02 distribution/polynomials; N03 quadratic factorization; N04 zero-product property; N05 solving quadratic equations. Edges are N01→N02, N02→N03, N02→N04, N03→N05, N04→N05.

### Question and exam

```json
{
  "id": "Q01",
  "stem": "...",
  "equation": "x**2 - 5*x + 6",
  "choices": [
    {"id": "A", "text": "x = 2 หรือ x = 3", "value": ["2", "3"], "root_cause_node": null, "explanation": "..."},
    {"id": "B", "text": "...", "value": ["-2", "-3"], "root_cause_node": "N01", "explanation": "..."}
  ],
  "correct_choice_id": "A",
  "knowledge_node_id": "N05",
  "difficulty": "easy",
  "sympy_verified": true,
  "solution_explanation": "..."
}
```

`ExamSet` has `id`, `title`, `subject`, `grade`, `topic`, `attempt_number`, `duration_minutes`, `total_points`, `questions`, and `pipeline`. Pipeline contains `source` (`fixture|ai|fallback`), `llm_status`, `sympy_verified_count`, `graph_mapped_count`, and optional `warning`.

There are exactly 12 fixture questions. Every question has four unique choices, exactly one correct choice, a valid node, a parseable SymPy polynomial/equation representation, and `sympy_verified=true` only after solving.

### Students, attempts, and mastery

```json
{
  "id": "STU001",
  "student_number": 1,
  "student_code": "2567001",
  "name": "นายสมชาย ใจดี",
  "room": "ม.3/2"
}
```

`Attempt` has `student_id`, `attempt_number` (`1|2`), `exam_id`, `date`, `answers` (`question_id -> choice_id`), `score`, and `total` (12).

`NodeMastery` has `node_id`, `correct`, `evidence_count`, `percentage`, `status` (`mastered|developing|critical`), and `root_cause_hits`. Thresholds are mastered ≥80, developing 50–79.999, critical <50.

Mock invariants: seeded deterministic set of 30 students and two attempts; attempt-2 scores span 2 through 12; Somchai is `STU001`, scores 5→8, with primary root cause N01; Somying is `STU002`, with primary root cause N03; Dekdee is `STU003`, scores 12→12.

### Class analytics

```json
{
  "class_id": "demo",
  "room": "ม.3/2",
  "exam_title": "สอบท้ายหน่วย ครั้งที่ 2",
  "attempt_number": 2,
  "students": [{"student": {}, "score": 8, "total": 12, "growth": 3, "mastery": []}],
  "node_summary": [{"node": {}, "average_percentage": 61.2, "status_distribution": {"mastered": 10, "developing": 11, "critical": 9}}],
  "class_average": 66.7,
  "previous_average": 49.2,
  "insight": {"focus_node_id": "N03", "headline": "...", "recommendation": "..."},
  "flagged_students": [{"student_id": "STU001", "name": "...", "score": 8, "growth": 3, "reason": "..."}]
}
```

Flag a learner if score <50%, at least two critical nodes, or growth <0. The class focus is the node with the lowest average mastery (stable N01–N05 tie-break).

### Individual report and remedial

`StudentReport` contains `student`, `attempts`, `latest_score`, `latest_percentage`, `growth`, `mastery`, `primary_root_cause`, `diagnosis`, `recommendations`, and `learning_level`. Content is deterministic from graph + answer evidence.

`RemedialDocument` contains report identity, focus node, micro lesson, exactly three practice questions, teacher note, and a print-ready HTML representation or data usable by the frontend print route.

## HTTP contract

- `GET /api/health` -> `{ "status": "ok" }`.
- `GET /api/exams/demo` -> `ExamSet` fixture.
- `POST /api/exams/generate` with `{grade, subject, topic, question_count, difficulty, mode}` -> `ExamSet`. `mode=fixture` never calls OpenAI. `mode=ai` calls Responses API once, validates every returned item with SymPy/KG, substitutes invalid/missing items from fixtures, never retries, and reports fallback in `pipeline`.
- `POST /api/attempts/score` with `{student_name, exam_id, answers}` -> ad-hoc `QuizResult` with score, percentage, per-node mastery, and diagnosis. It must not mutate class analytics.
- `GET /api/classes/demo/analytics` -> `ClassAnalytics`.
- `GET /api/students/{id}/report` -> `StudentReport`; unknown id is 404.
- `GET /api/students/{id}/remedial` -> print-ready HTML; unknown id is 404.
- `GET /api/exports/pp5.xlsx` -> downloadable XLSX.
- `GET /api/exports/pa-car` -> print-ready HTML.

## AI generation contract

Use `OpenAI().responses.parse(model=os.getenv("OPENAI_MODEL", "gpt-5-mini"), input=[...], text_format=GeneratedExamPayload)`. The output schema contains question candidates only. One API request per uncached signature, zero retries. Absence of `OPENAI_API_KEY`, refusal, timeout, schema error, or math failure produces a usable fixture-backed result with a Thai warning. Cache successful and fallback results by request signature for the process lifetime.

## Visual system extracted from approved concepts

- True white canvas and surfaces; pale blue selected navigation; light neutral borders; no cream/off-white shift.
- Primary blue `#0757d9`–`#0b5bdd`; teal `#0e9f9a`; semantic green `#15965b`, amber `#f7ad11`, red `#ef4050`.
- Dark ink `#111827`, muted text `#667085`; 1px borders; 4–8px radii; minimal shadow.
- Left navigation is 224–248px on desktop with logo, four main routes, and bottom settings identity. On mobile it becomes a compact top bar / horizontally reachable navigation without hiding primary actions.
- Main screens preserve the accepted structure: dense exam builder, table-first class heatmap with right analytics rail, report grid, and open export document surface.
- Thai UI copy, Noto Sans Thai compatible typography, 14–16px chrome, 26–32px page headings. Lucide outline icons at consistent 18–22px / 1.75–2px stroke.
- Heatmap remains a table with horizontally scrollable/sticky headers at narrower sizes; it must not become a card grid.
- Print documents use A4 CSS, white paper, black text, school header, student fields, two-column questions, and separate teacher answer key where appropriate.

## Acceptance gates

1. Domain gate: exact fixture/mock invariants, SymPy rejection and fallback, graph/root-cause rules, unit/API tests.
2. UI gate: all four approved screens represented, all visible primary controls functional, typed API layer with fixture fallbacks for transient backend startup only.
3. Export gate: XLSX opens with three exact sheets (`ข้อมูลรายวิชา`, `คะแนนและตัวชี้วัด`, `สรุปผล`) and 30 learners; A4 exam, remedial and PA/CAR print views render without clipping.
4. Integration gate: `make setup`, `make dev`, backend tests, frontend tests and production build pass.
5. Visual gate: Browser flow and console at 1440×900, 1024×768 and 390×844; final screenshots compared directly against all four concepts with a written mismatch ledger.
