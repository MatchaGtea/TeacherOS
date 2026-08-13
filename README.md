# TeacherOS Fast Prototype

TeacherOS turns a 12-question Mathematics M.3 diagnostic assessment into a verified quiz, a school-style paper exam, a classroom misconception heatmap, individual learning reports, and teacher evidence exports.

The prototype is local-first and works without an API key. Optional AI generation uses one OpenAI Responses API request, validates the candidates with SymPy, and falls back to verified fixtures without retrying.

## Run locally

Requirements: Python 3.11+ and Node.js 20+.

```bash
make setup
make dev
```

Open <http://127.0.0.1:5173>. The API runs at <http://127.0.0.1:8000> and its interactive docs are at <http://127.0.0.1:8000/docs>.

To enable the optional “สร้างใหม่ด้วย AI” flow, copy `.env.example` to `.env` or export `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to `gpt-5-mini`.

## Publish on GitHub Pages

The repository includes a GitHub Actions workflow that builds the fixture-backed frontend and deploys it to GitHub Pages. The public demo uses the same verified fixture data and static export files, so it works without a running FastAPI server. The AI button falls back to the fixture set on Pages unless an API-backed deployment is configured separately.

After the first successful workflow run, the site is available at `https://<your-github-user>.github.io/TeacherOS/`.

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

## Prototype boundary

This is a single-teacher, one-class demo for “single-variable quadratic equations”. It deliberately has no authentication, database, multi-user sessions, SIS integration, deployment setup, or production security hardening. Indicator codes, grades, and the PP5 workbook are clearly labelled prototype data and are configurable in the fixture layer.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for contracts and acceptance gates.
