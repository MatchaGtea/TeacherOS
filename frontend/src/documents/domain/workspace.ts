import { getTemplate } from "./catalog";
import type { ApprovalRecord, DocumentStatus, WorkspaceDocument, WorkspaceState } from "./types";

export const WORKSPACE_STORAGE_KEY = "teacheros.documents.v2";
const issuedDocumentIds = new Set<string>();
let fallbackIdSequence = 0;

export function generateDocumentId(existingIds: Iterable<string> = []): string {
  const unavailableIds = new Set(existingIds);
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const candidate = `DOC-${globalThis.crypto.randomUUID()}`;
        if (!unavailableIds.has(candidate) && !issuedDocumentIds.has(candidate)) {
          issuedDocumentIds.add(candidate);
          return candidate;
        }
      }
    }
  } catch {
    // Some restricted browser contexts expose crypto but disallow randomUUID.
  }
  let candidate: string;
  do {
    fallbackIdSequence += 1;
    candidate = `DOC-${Date.now().toString(36)}-${fallbackIdSequence.toString(36)}`;
  } while (unavailableIds.has(candidate) || issuedDocumentIds.has(candidate));
  issuedDocumentIds.add(candidate);
  return candidate;
}

const demoTime = "2026-01-15T09:00:00.000Z";
export const seededWorkspaceState: WorkspaceState = {
  version: 2,
  documents: [{
    id: "DOC-DEMO-001", templateId: "offsite-competition-pack", title: "นำนักเรียนเข้าร่วมการแข่งขันทักษะวิชาการ",
    createdAt: demoTime, updatedAt: demoTime, status: "draft",
    fields: { title: "นำนักเรียนเข้าร่วมการแข่งขันทักษะวิชาการ", destination: "โรงเรียนสาธิต", start_date: "2026-02-10", end_date: "2026-02-10", teacher_names: ["นายสมชาย ใจดี"], student_names: ["เด็กชายกิตติพงศ์ ดีพร้อม"], budget: "2500", organizer: "สำนักงานเขตพื้นที่การศึกษา" }, approvals: [],
  }],
};
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const isDocument = (value: unknown): value is WorkspaceDocument => {
  const doc = value as WorkspaceDocument;
  return !!doc && typeof doc.id === "string" && typeof doc.templateId === "string" && typeof doc.title === "string" &&
    typeof doc.createdAt === "string" && typeof doc.updatedAt === "string" && ["draft", "waiting_head", "waiting_director", "approved", "ready"].includes(doc.status) &&
    !!doc.fields && Array.isArray(doc.approvals);
};
export const isWorkspaceState = (value: unknown): value is WorkspaceState => {
  const state = value as WorkspaceState;
  return !!state && state.version === 2 && Array.isArray(state.documents) && state.documents.every(isDocument);
};
export function loadWorkspace(storage: Pick<Storage, "getItem"> | undefined = typeof localStorage === "undefined" ? undefined : localStorage): WorkspaceState {
  try { const raw = storage?.getItem(WORKSPACE_STORAGE_KEY); return raw && isWorkspaceState(JSON.parse(raw)) ? JSON.parse(raw) : clone(seededWorkspaceState); }
  catch { return clone(seededWorkspaceState); }
}
export function saveWorkspace(state: WorkspaceState, storage: Pick<Storage, "setItem"> | undefined = typeof localStorage === "undefined" ? undefined : localStorage): void {
  try { storage?.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state)); } catch { /* persistence is best-effort */ }
}
const replace = (state: WorkspaceState, document: WorkspaceDocument): WorkspaceState => ({ ...state, documents: state.documents.map((item) => item.id === document.id ? document : item) });
const stamp = (document: WorkspaceDocument, now: string, change: Partial<WorkspaceDocument>): WorkspaceDocument => ({ ...document, ...change, updatedAt: now });
export function createDocument(state: WorkspaceState, templateId: string, fields: WorkspaceDocument["fields"], now = new Date().toISOString(), id = generateDocumentId(state.documents.map((document) => document.id))): WorkspaceState {
  const template = getTemplate(templateId); if (!template) return state;
  const title = typeof fields.title === "string" && fields.title.trim() ? fields.title : template.title;
  return { ...state, documents: [...state.documents, { id, templateId, title, createdAt: now, updatedAt: now, status: "draft", fields: clone(fields), approvals: [] }] };
}
export function updateDocument(state: WorkspaceState, id: string, fields: WorkspaceDocument["fields"], now = new Date().toISOString()): WorkspaceState {
  const document = state.documents.find((item) => item.id === id); if (!document || document.status !== "draft") return state;
  const merged = { ...document.fields, ...clone(fields) }; const title = typeof merged.title === "string" && merged.title.trim() ? merged.title : document.title;
  return replace(state, stamp(document, now, { fields: merged, title }));
}
export function submitForApproval(state: WorkspaceState, id: string, now = new Date().toISOString()): WorkspaceState {
  const document = state.documents.find((item) => item.id === id); if (!document || document.status !== "draft") return state;
  const approvals: ApprovalRecord[] = [{ stepId: "head_approval", actor: "", role: "head", state: "pending" }];
  return replace(state, stamp(document, now, { status: "waiting_head", approvals }));
}
export function approveCurrentStep(state: WorkspaceState, id: string, actor = "ผู้อนุมัติ", now = new Date().toISOString()): WorkspaceState {
  const document = state.documents.find((item) => item.id === id); if (!document) return state;
  if (document.status === "waiting_head") {
    const approvals: ApprovalRecord[] = [...document.approvals.slice(0, -1), { stepId: "head_approval", actor, role: "head", state: "approved", actedAt: now }, { stepId: "director_approval", actor: "", role: "director", state: "pending" }];
    return replace(state, stamp(document, now, { status: "waiting_director", approvals }));
  }
  if (document.status === "waiting_director") {
    const approvals: ApprovalRecord[] = [...document.approvals.slice(0, -1), { stepId: "director_approval", actor, role: "director", state: "approved", actedAt: now }];
    return replace(state, stamp(document, now, { status: "approved", approvals }));
  }
  return state;
}
export function markReady(state: WorkspaceState, id: string, now = new Date().toISOString()): WorkspaceState {
  const document = state.documents.find((item) => item.id === id); return !document || document.status !== "approved" ? state : replace(state, stamp(document, now, { status: "ready" }));
}
export const resetWorkspace = (): WorkspaceState => clone(seededWorkspaceState);
export function getAvailableWorkflowAction(status: DocumentStatus): "submit" | "approve" | "ready" | null {
  return status === "draft" ? "submit" : status === "waiting_head" || status === "waiting_director" ? "approve" : status === "approved" ? "ready" : null;
}
