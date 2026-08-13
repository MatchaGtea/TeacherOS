import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createElement, type ReactNode } from "react";
import {
  DOCUMENT_PROCESS_GRAPH, DOCUMENT_TEMPLATES, OFFSITE_COMPETITION_TEMPLATE_ID, approveCurrentStep,
  createDocument, getAvailableWorkflowAction, isValidProcessGraph, loadWorkspace, markReady,
  parseThaiDocumentIntent, resetWorkspace, seededWorkspaceState, submitForApproval, updateDocument,
  WORKSPACE_STORAGE_KEY,
  DocumentWorkspaceProvider, useDocumentWorkspace,
} from "./index";

describe("document catalog", () => {
  it("contains the frozen catalog and exactly eight offsite printable parts", () => {
    expect(DOCUMENT_TEMPLATES).toHaveLength(16);
    const pack = DOCUMENT_TEMPLATES.find((template) => template.id === OFFSITE_COMPETITION_TEMPLATE_ID)!;
    expect(pack.parts.map((part) => part.id)).toEqual(["approval-memo", "school-order", "parent-permission", "student-roster", "itinerary", "travel-authorization", "expense-estimate", "post-event-report"]);
  });
});
describe("Thai intent parser", () => {
  it("normalizes Thai digits and extracts offsite facts without invention", () => {
    const intent = parseThaiDocumentIntent("นำนักเรียนไปแข่งขันหุ่นยนต์ ณ โรงเรียนสาธิต วันที่ ๑๐/๐๒/๒๕๖๙ ถึง ๑๑/๐๒/๒๕๖๙ งบประมาณ ๒,๕๐๐ บาท");
    expect(intent.templateId).toBe(OFFSITE_COMPETITION_TEMPLATE_ID); expect(intent.confidence).toBe("high");
    expect(intent.fields.destination).toBe("โรงเรียนสาธิต"); expect(intent.fields.start_date).toBe("2026-02-10"); expect(intent.fields.end_date).toBe("2026-02-11"); expect(intent.fields.budget).toBe("2500"); expect(intent.fields.teacher_names).toEqual([]);
  });
  it("preserves decimal budgets and resolves a shared Thai-month date range", () => {
    const intent = parseThaiDocumentIntent("นำนักเรียนแข่งขัน ระหว่างวันที่ 10–12 ก.ย. 2569 งบประมาณ 2,500.50 บาท");
    expect(intent.fields.start_date).toBe("2026-09-10"); expect(intent.fields.end_date).toBe("2026-09-12"); expect(intent.fields.budget).toBe("2500.50");
  });
  it("does not treat a generic official trip as the competition pack", () => {
    expect(parseThaiDocumentIntent("ขออนุญาตเดินทางไปราชการ").templateId).toBe("official-travel");
  });
  it("uses stable catalog order when no template keyword matches", () => {
    expect(parseThaiDocumentIntent("ข้อความทั่วไป").templateId).toBe(DOCUMENT_TEMPLATES[0].id);
  });
  it("provider retains sequential batched mutations", () => {
    let workspace: ReturnType<typeof useDocumentWorkspace> | undefined;
    function Probe(): ReactNode { workspace = useDocumentWorkspace(); return createElement("output", null, workspace.state.documents.length); }
    render(createElement(DocumentWorkspaceProvider, null, createElement(Probe)));
    const returnedIds: string[] = [];
    act(() => {
      returnedIds.push(workspace!.createDocument("general-memo", { title: "หนึ่ง" }));
      returnedIds.push(workspace!.createDocument("general-memo", { title: "สอง" }));
    });
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(new Set(returnedIds).size).toBe(2);
    const documentIds = workspace!.state.documents.map((document) => document.id);
    expect(new Set(documentIds).size).toBe(documentIds.length);
    expect(documentIds).toEqual(expect.arrayContaining(returnedIds));
  });
});
describe("workflow and persistence", () => {
  it("is a valid DAG", () => expect(isValidProcessGraph(DOCUMENT_PROCESS_GRAPH)).toBe(true));
  it("recovers from corrupt or old storage", () => {
    const storage = { getItem: () => "{bad", setItem: () => undefined };
    expect(loadWorkspace(storage).documents[0].id).toBe("DOC-DEMO-001");
    expect(loadWorkspace({ ...storage, getItem: () => JSON.stringify({ version: 1, documents: [] }) })).toEqual(seededWorkspaceState);
    expect(WORKSPACE_STORAGE_KEY).toBe("teacheros.documents.v2");
  });
  it("supports CRUD and cannot skip approval states", () => {
    let state = resetWorkspace(); state = createDocument(state, "general-memo", { title: "ทดสอบ" }, "2026-02-01T00:00:00.000Z", "DOC-TEST");
    state = updateDocument(state, "DOC-TEST", { organizer: "โรงเรียน" }, "2026-02-02T00:00:00.000Z");
    expect(state.documents.at(-1)?.fields.organizer).toBe("โรงเรียน");
    expect(markReady(state, "DOC-TEST").documents.at(-1)?.status).toBe("draft");
    state = submitForApproval(state, "DOC-TEST", "2026-02-03T00:00:00.000Z"); expect(state.documents.at(-1)?.status).toBe("waiting_head");
    state = approveCurrentStep(state, "DOC-TEST", "หัวหน้า", "2026-02-04T00:00:00.000Z"); expect(state.documents.at(-1)?.status).toBe("waiting_director");
    state = approveCurrentStep(state, "DOC-TEST", "ผู้อำนวยการ", "2026-02-05T00:00:00.000Z"); state = markReady(state, "DOC-TEST", "2026-02-06T00:00:00.000Z");
    expect(state.documents.at(-1)?.status).toBe("ready"); expect(getAvailableWorkflowAction("ready")).toBeNull();
  });
});
