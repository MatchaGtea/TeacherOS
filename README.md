# TeacherOS Prototype v2

TeacherOS combines two local-first teacher workspaces:

- งานเอกสาร: a deterministic Thai document assistant with 16 templates, simulated approval steps, and A4 print views. The featured offsite-competition workflow produces an approval memo, school order, parent permission, student roster, itinerary, travel authorization, expense estimate, and post-event report from one structured record.
- งานประเมิน: the existing 12-question Mathematics M.3 diagnostic assessment, verified quiz, school-style paper exam, classroom misconception heatmap, individual learning reports, and teacher evidence exports.

The prototype works without a database or API key. Document records persist in versioned browser `localStorage`; Thai intent parsing and report text are deterministic. Optional assessment generation uses one OpenAI Responses API request, validates candidates with SymPy, and falls back to verified fixtures without retrying.

## Run locally

Requirements: Python 3.11+ and Node.js 20+.

```bash
make setup
make dev
```

Open <http://127.0.0.1:5173>. The API runs at <http://127.0.0.1:8000> and its interactive docs are at <http://127.0.0.1:8000/docs>.

To enable the optional “สร้างใหม่ด้วย AI” flow, copy `.env.example` to `.env` or export `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to `gpt-5-mini`.

## Publish on GitHub Pages

The repository includes a static GitHub Pages snapshot under `/docs`. The public demo uses local document storage plus the same verified assessment fixtures and static export files, so it works without FastAPI. The assessment AI button falls back to the fixture set on Pages unless an API-backed deployment is configured separately. Pages is configured to serve `main:/docs` directly.

Public demo: <https://matchagtea.github.io/TeacherOS/>

Refresh the checked-in Pages build with:

```bash
make build-pages
```

## Verify

```bash
make test
make build
```

## Demo flow

1. Create or refresh the verified exam on the exam-builder screen.
2. Open the online quiz, select answers, and submit to see the diagnostic result.
3. Open the classroom dashboard to inspect the 30×5 heatmap and next-class recommendation.
4. Select Somchai to show 5→8 growth and N01 root-cause analysis, then open his remedial sheet.
5. Export the school-style PP5 workbook or open the PA/CAR print view.

### Document demo flow

1. Open “งานเอกสาร” and choose the featured offsite-competition pack.
2. Parse the seeded Thai request, review the extracted fields, and create the document.
3. Advance the simulated head/director approvals until the pack is ready.
4. Open and print any of the eight independent A4 parts.

## Prototype boundary

This is a single-teacher, one-class prototype. It deliberately has no authentication, database, multi-user sessions, SIS integration, or production security hardening. Approval actions, school identity, document numbers, indicator codes, grades, and the PP5 workbook are clearly labelled prototype data or placeholders.

See [`V2_ARCHITECTURE.md`](V2_ARCHITECTURE.md) for the document-workspace contract and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the assessment contract.
