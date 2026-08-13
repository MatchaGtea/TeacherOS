# TeacherOS Prototype v2 — frozen implementation contract

## Scope and invariants

V2 adds a static-first Thai government-document workspace alongside the existing
assessment product. All files under `backend/` and the existing assessment API
contracts remain behaviorally unchanged. The document workspace works with no
server and persists only to versioned `localStorage`.

## Routes and information architecture

- `/` — TeacherOS home: two primary workspaces, recent documents, quick actions.
- `/documents` — searchable template library and recent document workspace.
- `/documents/new/:templateId` — deterministic Thai prompt parser plus editable
  structured fields before document creation.
- `/documents/:documentId` — document overview, pack contents and current state.
- `/documents/:documentId/process` — typed process graph and simulated approvals.
- `/documents/:documentId/print/:partId` — standalone A4 print route for one part.
- `/assessments` — existing exam builder (moved from `/`; behavior unchanged).
- `/quiz`, `/dashboard`, `/students/:id`, `/exports` and existing print routes —
  preserved.

Unknown routes render an explicit not-found surface with a home link.

## Frozen TypeScript contracts

These contracts live under `frontend/src/documents/` and are the only source of
truth for the document workspace.

```ts
type DocumentCategory =
  | "approval" | "correspondence" | "personnel" | "student"
  | "activity" | "finance" | "report" | "academic";

type DocumentStatus =
  | "draft" | "waiting_head" | "waiting_director" | "approved" | "ready";

type FieldKind = "text" | "textarea" | "date" | "number" | "people";

type TemplateField = {
  key: string; label: string; kind: FieldKind; required: boolean;
  placeholder?: string; defaultValue?: string;
};

type TemplatePart = {
  id: string; title: string; shortTitle: string; purpose: string;
};

type DocumentTemplate = {
  id: string; title: string; description: string; category: DocumentCategory;
  keywords: string[]; fields: TemplateField[]; parts: TemplatePart[];
  featured?: boolean;
};

type ProcessNode = {
  id: string; title: string; role: "teacher" | "head" | "director" | "system";
  terminal?: boolean;
};
type ProcessEdge = { from: string; to: string };
type ProcessGraph = { id: string; nodes: ProcessNode[]; edges: ProcessEdge[] };

type ApprovalRecord = {
  stepId: string; actor: string; role: ProcessNode["role"];
  state: "pending" | "approved"; actedAt?: string;
};

type WorkspaceDocument = {
  id: string; templateId: string; title: string;
  createdAt: string; updatedAt: string; status: DocumentStatus;
  fields: Record<string, string | string[]>;
  approvals: ApprovalRecord[];
};

type ParsedIntent = {
  templateId: string; confidence: "high" | "medium" | "low";
  fields: Record<string, string | string[]>; matchedKeywords: string[];
};

type WorkspaceState = { version: 2; documents: WorkspaceDocument[] };
```

Storage key: `teacheros.documents.v2`. Invalid or older payloads recover to a
seeded deterministic demo state without throwing. State actions are pure:
`createDocument`, `updateDocument`, `submitForApproval`, `approveCurrentStep`,
and `resetWorkspace`. The approval sequence is
`draft → waiting_head → waiting_director → approved → ready`; no step can be
skipped. Timestamps may be current ISO strings; fixture IDs/timestamps are fixed.

## Parser contract

`parseThaiDocumentIntent(text)` is deterministic and network-free. It normalizes
Thai digits, whitespace and Thai date separators; scores template keywords with
stable catalog-order tie-breaking; and extracts when present:

- `title` / activity or competition name
- `destination` / venue
- `start_date`, `end_date` (ISO date when resolvable)
- `teacher_names`, `student_names`
- `budget`
- `organizer`

Competition/offsite language (`แข่งขัน`, `นำนักเรียน`, `เดินทาง`, `นอกสถานที่`)
selects `offsite-competition-pack` with high confidence. Missing fields remain
editable blank values; parser output never invents people, amounts or dates.

## Template catalog

The catalog contains at least these 16 typed templates:

1. บันทึกข้อความทั่วไป
2. หนังสือราชการภายนอก
3. ประกาศโรงเรียน
4. คำสั่งโรงเรียน
5. รายงานการประชุม
6. หนังสือรับรองนักเรียน
7. หนังสือขออนุญาตผู้ปกครอง
8. แบบขออนุญาตเดินทางไปราชการ
9. ประมาณการค่าใช้จ่าย
10. บัญชีรายชื่อนักเรียน
11. กำหนดการกิจกรรม
12. รายงานผลกิจกรรม
13. แผนการจัดการเรียนรู้
14. รายงานพัฒนาผู้เรียน
15. บันทึกขอจัดซื้อ/จัดจ้าง
16. ชุดเอกสารนำนักเรียนไปแข่งขันนอกสถานที่

The offsite competition pack has exactly eight printable parts: approval memo,
school order/teacher appointment, parent permission, student roster, itinerary,
travel authorization, expense estimate, and post-event report.

## Process graph

One shared graph is a valid acyclic graph:

`draft → information_check → head_approval → director_approval → print_ready`

Every pack part is visible from the document overview. Simulated approval buttons
are explicit demo actions, update localStorage, and cannot be inert.

## Print contract

Every template part has a standalone Thai A4 route with `@page { size: A4; }`,
black-on-white school/government document hierarchy, school identity, document
title, populated fields, signature blocks, page-break-safe sections and a real
`window.print()` control. Pack routes use the same source document fields and
render each of all eight parts. No external runtime asset is required to print.

## Design system

Extend the accepted TeacherOS concept and current Calm Apple UI; no new ImageGen
is required. Keep true-white canvas, blue primary, teal secondary, semantic
green/amber/red, restrained 1px borders, soft 12–18px radii, strong Thai type,
Lucide outline icons, generous whitespace and open layouts. Desktop retains the
left rail; mobile exposes all primary nav in a horizontally scrollable top bar.
Do not introduce decorative pills, gradients or nested card grids without a
functional reason.

## Ownership

- Terra Domain: `frontend/src/documents/domain/**` and domain unit tests.
- Terra Workspace UI: app routes/shell, home and document workspace/editor/process
  pages/components, document-workspace CSS and routed UI tests. No backend edits.
- Terra Print/Publish (wave 2): A4 renderer/print page, static `/docs` generation,
  README publishing notes and print tests.
- Terra QA (wave 2): browser workflow, responsive/print regression evidence and
  narrowly scoped repairs assigned by Sol.
- Sol: this contract, cross-workstream integration, final review, commits/push.

## Acceptance gates

1. Existing backend 25 tests and assessment UI tests remain green.
2. Catalog has ≥16 templates and the full eight-part offsite pack.
3. Parser, graph transitions, persistence recovery and all approval states have
   deterministic unit coverage.
4. Home → prompt → create → approval chain → every pack print part works with no
   server; refresh restores state.
5. No visible primary control is inert; keyboard labels and focus states exist.
6. Browser/IAB passes at 1440×900, 1024×768 and 390×844 with no relevant console
   errors, framework overlay, body overflow or inaccessible primary action.
7. A4 portrait print pages do not clip Thai text or signatures.
8. `make setup`, `make test`, `make build`, static `/docs` build and public Pages
   URL pass. Final visual comparison uses both the accepted concept and latest
   Browser screenshots through `view_image`.
