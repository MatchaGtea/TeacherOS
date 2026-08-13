import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentWorkspaceProvider, WORKSPACE_STORAGE_KEY, seededWorkspaceState, type WorkspaceDocument } from "../documents/domain";
import DocumentPrintPage from "./DocumentPrintPage";

const document = {
  ...seededWorkspaceState.documents.find((item) => item.templateId === "offsite-competition-pack")!,
  id: "DOC-PRINT",
  title: "การแข่งขันทักษะคณิตศาสตร์",
  fields: {
    title: "การแข่งขันทักษะคณิตศาสตร์", destination: "จังหวัดเชียงใหม่", start_date: "2026-08-12", end_date: "2026-08-14",
    teacher_names: ["นายสมชาย ใจดี", "นางสาวสุดา พร้อมดี"], student_names: ["เด็กหญิงมานี ดีใจ", "เด็กชายมานะ ตั้งใจ"], budget: "5000", organizer: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน",
  },
};

function renderPrint(partId: string, id = "DOC-PRINT", source: WorkspaceDocument = document) {
  localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({ version: 2, documents: [source] }));
  return render(<MemoryRouter initialEntries={[`/documents/${id}/print/${partId}`]}><DocumentWorkspaceProvider><Routes><Route path="/documents/:documentId/print/:partId" element={<DocumentPrintPage />} /><Route path="/documents" element={<p>documents fallback</p>} /></Routes></DocumentWorkspaceProvider></MemoryRouter>);
}

describe("DocumentPrintPage", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("print", vi.fn());
  });

  it("renders the approval memo with source activity and field data", () => {
    renderPrint("approval-memo");
    expect(screen.getByRole("heading", { name: "บันทึกข้อความ" })).toBeInTheDocument();
    expect(screen.getAllByText("การแข่งขันทักษะคณิตศาสตร์", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("จังหวัดเชียงใหม่", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("เรื่อง", { exact: true, selector: "b" })).toHaveLength(1);
    expect(screen.queryByText("วันที่จัดทำ", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "บัญชีรายชื่อนักเรียน" })).not.toBeInTheDocument();
  });

  it("renders a roster only with student rows", () => {
    renderPrint("student-roster");
    expect(screen.getByRole("heading", { name: "บัญชีรายชื่อนักเรียน" })).toBeInTheDocument();
    expect(screen.getByText("เด็กหญิงมานี ดีใจ")).toBeInTheDocument();
    expect(screen.getByText("เด็กชายมานะ ตั้งใจ")).toBeInTheDocument();
    expect(screen.queryByText("รวมวงเงินที่ขออนุมัติ")).not.toBeInTheDocument();
  });

  it("renders the expense estimate table and invokes native printing", () => {
    renderPrint("expense-estimate");
    expect(screen.getByRole("heading", { name: "ประมาณการค่าใช้จ่าย" })).toBeInTheDocument();
    expect(screen.getByText("รวมวงเงินที่ขออนุมัติ (ไม่เกิน)")).toBeInTheDocument();
    screen.getByRole("button", { name: "พิมพ์เอกสาร" }).click();
    expect(window.print).toHaveBeenCalledOnce();
  });

  it.each([
    ["approval-memo", "บันทึกข้อความ"],
    ["school-order", "คำสั่งโรงเรียนตัวอย่างวิทยา"],
    ["parent-permission", "หนังสือขออนุญาตผู้ปกครอง"],
    ["student-roster", "บัญชีรายชื่อนักเรียน"],
    ["itinerary", "กำหนดการเดินทางและกิจกรรม"],
    ["travel-authorization", "แบบขออนุญาตเดินทางนอกสถานที่"],
    ["expense-estimate", "ประมาณการค่าใช้จ่าย"],
    ["post-event-report", "รายงานผลหลังเข้าร่วมกิจกรรม"],
  ])("smoke-renders the pack part %s", (partId, heading) => {
    renderPrint(partId);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("renders a generic catalog template as its own official document", () => {
    const generic = { ...document, id: "DOC-GENERIC", templateId: "general-memo", title: "ขอใช้ห้องประชุม", fields: { title: "ขอใช้ห้องประชุม", date: "2026-08-13", organizer: "กลุ่มสาระคณิตศาสตร์" } };
    renderPrint("document", "DOC-GENERIC", generic);
    expect(screen.getByRole("heading", { name: "บันทึกข้อความทั่วไป" })).toBeInTheDocument();
    expect(screen.getByText("ขอใช้ห้องประชุม")).toBeInTheDocument();
  });

  it("redirects unknown document and part ids safely", () => {
    renderPrint("not-a-part", "MISSING");
    expect(screen.getByText("documents fallback")).toBeInTheDocument();
  });
});
