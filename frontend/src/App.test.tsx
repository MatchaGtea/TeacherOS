import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { fixtureAnalytics } from "./fixtures";
import {
  formatPercentTick,
  normalizeStatusDistribution,
} from "./pages/DashboardPage";

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("core routed workflows", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("backend offline")),
    );
  });

  it("generates a verified fallback exam and exposes its status", async () => {
    renderRoute("/assessments");
    expect(
      await screen.findByRole("heading", { name: "สร้างข้อสอบอัตโนมัติ" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Demo data")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /สร้างใหม่ด้วย AI/ }));
    expect(await screen.findByText(/AI ยังไม่พร้อม/)).toBeInTheDocument();
    expect(
      screen.queryByText("EXAM-DEMO-02", { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/12\/12/).length).toBeGreaterThan(0);
  });

  it("shows the two TeacherOS workspaces on home", async () => {
    renderRoute("/");
    expect(await screen.findByRole("heading", { name: "สวัสดี ครูสมชาย" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /งานเอกสาร/ }).some((link) => link.getAttribute("href") === "/documents")).toBe(true);
    expect(screen.getAllByRole("link", { name: /สร้างข้อสอบ/ }).some((link) => link.getAttribute("href") === "/assessments")).toBe(true);
  });

  it("searches the document catalog and parses a prompt into an editable document", async () => {
    renderRoute("/documents");
    expect(await screen.findByRole("heading", { name: "งานเอกสาร" })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("ค้นหาแบบฟอร์ม"), { target: { value: "แข่งขัน" } });
    expect(screen.getByText("ชุดเอกสารนำนักเรียนไปแข่งขันนอกสถานที่")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: /ชุดเอกสารนำนักเรียนไปแข่งขันนอกสถานที่/ }));
    expect(await screen.findByLabelText("อธิบายงานที่ต้องการ")).toBeInTheDocument();
    expect(screen.getByLabelText("ชื่อกิจกรรม/การแข่งขัน")).toHaveValue("แข่งขันทักษะวิชาการ");
    expect(screen.getByLabelText("สถานที่")).toHaveValue("จังหวัดเชียงใหม่");
    expect(screen.getByLabelText("ครูผู้ควบคุม")).toHaveValue("นายสมชาย ใจดี, นางสาวสุดา พร้อมดี");
    expect(screen.getByLabelText("รายชื่อนักเรียน")).toHaveValue("เด็กหญิงมานี ดีใจ, เด็กชายมานะ ตั้งใจ");
    expect(screen.getByLabelText("งบประมาณ")).toHaveValue(5000);
    expect(screen.getByRole("button", { name: "สร้างเอกสาร" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "วิเคราะห์คำขอ" }));
    expect(screen.getByText(/ความมั่นใจ สูง/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "สร้างเอกสาร" }));
    expect(await screen.findByRole("heading", { name: "เอกสารในชุด" })).toBeInTheDocument();
  });

  it("persists the simulated approval chain through ready state", async () => {
    renderRoute("/documents/new/general-memo");
    expect(await screen.findByRole("heading", { name: "บันทึกข้อความทั่วไป" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "สร้างเอกสาร" })).toBeDisabled();
    expect(screen.getByText(/กรอกข้อมูลที่จำเป็น: เรื่อง/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("เรื่อง"), { target: { value: "ขออนุมัติทดสอบ" } });
    expect(screen.getByRole("button", { name: "สร้างเอกสาร" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "สร้างเอกสาร" }));
    const continueLink = await screen.findByRole("link", { name: "ดำเนินการต่อ" });
    fireEvent.click(continueLink);
    fireEvent.click(await screen.findByRole("button", { name: "ส่งตรวจสอบข้อมูล" }));
    fireEvent.click(await screen.findByRole("button", { name: "จำลองการอนุมัติหัวหน้ากลุ่มสาระ" }));
    fireEvent.click(await screen.findByRole("button", { name: "จำลองการอนุมัติผู้อำนวยการ" }));
    fireEvent.click(await screen.findByRole("button", { name: "เตรียมเอกสารให้พร้อมพิมพ์" }));
    expect(await screen.findByText("เอกสารพร้อมพิมพ์แล้ว")).toBeInTheDocument();
  });

  it("preserves the request when opening the parser-recommended template", async () => {
    renderRoute("/documents/new/general-memo");
    await screen.findByRole("heading", { name: "บันทึกข้อความทั่วไป" });
    const request = "เรื่อง: แข่งขันหุ่นยนต์, ณ โรงเรียนสาธิต, ระหว่างวันที่ 10–12 ก.ย. 2569";
    fireEvent.change(screen.getByLabelText("อธิบายงานที่ต้องการ"), { target: { value: request } });
    fireEvent.click(screen.getByRole("button", { name: "วิเคราะห์คำขอ" }));
    fireEvent.click(await screen.findByRole("link", { name: "เปิดแบบฟอร์มที่แนะนำ" }));
    expect(await screen.findByRole("heading", { name: "ชุดเอกสารนำนักเรียนไปแข่งขันนอกสถานที่" })).toBeInTheDocument();
    expect(screen.getByLabelText("อธิบายงานที่ต้องการ")).toHaveValue(request);
    expect(screen.getByLabelText("ชื่อกิจกรรม/การแข่งขัน")).toHaveValue("แข่งขันหุ่นยนต์");
    expect(screen.getByLabelText("สถานที่")).toHaveValue("โรงเรียนสาธิต");
  });

  it("keeps chart tick labels human-readable and marks the active route", async () => {
    renderRoute("/dashboard");
    expect(formatPercentTick(100.00000000000001)).toBe("100%");
    expect(formatPercentTick(30)).toBe("30%");
    expect(
      await screen.findByRole("link", { name: "ภาพรวมห้อง" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("validates quiz identity/completion, scores it, and allows retry", async () => {
    renderRoute("/quiz");
    expect(await screen.findByText("ยังไม่ได้ตอบ 12 ข้อ")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "ส่งคำตอบ" });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("ชื่อผู้ทำแบบทดสอบ"), {
      target: { value: "ผู้เรียนทดสอบ" },
    });
    screen.getAllByRole("radio").forEach((radio, index) => {
      if (index % 4 === 0) fireEvent.click(radio);
    });
    expect(screen.getByText("ตอบครบทุกข้อแล้ว")).toBeInTheDocument();
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(
      await screen.findByRole("heading", { name: /ผลการทำแบบทดสอบ: 12\/12/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ผลรายทักษะ/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ทำแบบทดสอบอีกครั้ง" }),
    ).toBeInTheDocument();
  });

  it("links student names from the heatmap to individual reports", async () => {
    renderRoute("/dashboard");
    const link = await screen.findByRole("link", { name: "นายสมชาย ใจดี" });
    expect(link).toHaveAttribute("href", "/students/STU001");
    expect(screen.getByLabelText(/กราฟแท่งซ้อนร้อยละ 100/)).toBeInTheDocument();
    expect(document.querySelectorAll("td.heat")).toHaveLength(150);
    expect(
      document.querySelectorAll(".heatmap-table tbody tr"),
    ).toHaveLength(30);
    expect(screen.getAllByText("คะแนนต่ำกว่า 50%").length).toBeGreaterThan(0);
  });

  it("normalizes every mastery status distribution to a 100% stack", () => {
    expect(fixtureAnalytics.students).toHaveLength(30);
    fixtureAnalytics.node_summary.forEach(({ status_distribution }) => {
      const studentCount = Object.values(status_distribution).reduce(
        (sum, count) => sum + count,
        0,
      );
      const percentages = normalizeStatusDistribution(status_distribution);
      const total =
        percentages.mastered + percentages.developing + percentages.critical;

      expect(studentCount).toBe(30);
      expect(total).toBeCloseTo(100, 8);
    });
  });

  it("renders a perfect learner without inventing a root cause", async () => {
    renderRoute("/students/STU003");
    expect(await screen.findByText("ไม่พบจุดบกพร่องหลัก")).toBeInTheDocument();
    expect(screen.getByText("ก้าวหน้า")).toBeInTheDocument();
    expect(screen.getByText(/ทำได้ครบทุกทักษะ/)).toBeInTheDocument();
    expect(screen.getByLabelText("คะแนนไม่เปลี่ยนแปลง")).toHaveTextContent("—");
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /ดาวน์โหลด \/ พิมพ์ PDF/ }),
      ).toHaveAttribute("href", "/students/STU003/print"),
    );
  });

  it("renders three concrete report actions for a learner who needs support", async () => {
    renderRoute("/students/STU001");
    expect(
      await screen.findByText("ทบทวนพื้นฐานของสาเหตุราก"),
    ).toBeInTheDocument();
    expect(screen.getByText("ฝึกแบบเจาะจง")).toBeInTheDocument();
    expect(screen.getByText("ตรวจความเข้าใจครั้งถัดไป")).toBeInTheDocument();
    expect(screen.getByText(/Quick Check 6 ข้อ/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /สร้างชีทซ่อมเสริมรายบุคคล/ }),
    ).toHaveAttribute("href", "/remedial/STU001");
  });

  it("renders canonical export evidence and the PA/CAR preview", async () => {
    renderRoute("/exports");
    expect(
      await screen.findByRole("heading", { name: "ส่งออกเอกสารครู" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5→8")).toBeInTheDocument();
    expect(screen.getAllByText("66.7%").length).toBeGreaterThan(0);
    expect(screen.getByText("12→12")).toBeInTheDocument();
    expect(
      screen.getByText("ผลการพัฒนาผู้เรียน: Pre-test vs Post-test"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("ค 1.1 ม.3/1").length).toBeGreaterThan(0);
  });
});
