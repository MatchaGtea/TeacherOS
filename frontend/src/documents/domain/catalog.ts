import type { DocumentCategory, DocumentTemplate, TemplateField, TemplatePart } from "./types";

const commonFields: TemplateField[] = [
  { key: "title", label: "เรื่อง", kind: "text", required: true },
  { key: "date", label: "วันที่", kind: "date", required: false },
  { key: "organizer", label: "หน่วยงาน/ผู้จัด", kind: "text", required: false },
];
const onePart = (id: string, title: string): TemplatePart[] => [
  { id, title, shortTitle: title, purpose: `จัดทำ${title}` },
];
const template = (id: string, title: string, category: DocumentCategory, keywords: string[], fields = commonFields, featured = false): DocumentTemplate => ({
  id, title, description: `แบบฟอร์ม${title}`, category, keywords, fields, parts: onePart("document", title), featured,
});

const offsiteFields: TemplateField[] = [
  { key: "title", label: "ชื่อกิจกรรม/การแข่งขัน", kind: "text", required: true },
  { key: "destination", label: "สถานที่", kind: "text", required: true },
  { key: "start_date", label: "วันเริ่ม", kind: "date", required: false },
  { key: "end_date", label: "วันสิ้นสุด", kind: "date", required: false },
  { key: "teacher_names", label: "ครูผู้ควบคุม", kind: "people", required: false },
  { key: "student_names", label: "รายชื่อนักเรียน", kind: "people", required: false },
  { key: "budget", label: "งบประมาณ", kind: "number", required: false },
  { key: "organizer", label: "หน่วยงานผู้จัด", kind: "text", required: false },
];

export const offsiteCompetitionParts: TemplatePart[] = [
  ["approval-memo", "บันทึกขออนุมัติ", "ขออนุมัติ", "ขออนุมัตินำนักเรียนเข้าร่วมกิจกรรม"],
  ["school-order", "คำสั่งแต่งตั้งครูผู้ควบคุม", "คำสั่ง", "แต่งตั้งครูควบคุมดูแล"],
  ["parent-permission", "หนังสือขออนุญาตผู้ปกครอง", "ผู้ปกครอง", "ขอความยินยอมจากผู้ปกครอง"],
  ["student-roster", "บัญชีรายชื่อนักเรียน", "รายชื่อนักเรียน", "รายชื่อนักเรียนผู้เข้าร่วม"],
  ["itinerary", "กำหนดการเดินทาง", "กำหนดการ", "แผนการเดินทางและกิจกรรม"],
  ["travel-authorization", "แบบขออนุญาตเดินทาง", "อนุญาตเดินทาง", "ขออนุญาตเดินทางนอกสถานที่"],
  ["expense-estimate", "ประมาณการค่าใช้จ่าย", "ค่าใช้จ่าย", "ประมาณการงบประมาณ"],
  ["post-event-report", "รายงานผลหลังเข้าร่วมกิจกรรม", "รายงานผล", "สรุปผลหลังเสร็จกิจกรรม"],
].map(([id, title, shortTitle, purpose]) => ({ id, title, shortTitle, purpose }));

export const documentTemplates: DocumentTemplate[] = [
  template("general-memo", "บันทึกข้อความทั่วไป", "correspondence", ["บันทึกข้อความ", "บันทึก", "เสนอ"]),
  template("external-letter", "หนังสือราชการภายนอก", "correspondence", ["หนังสือราชการ", "ภายนอก", "เรียน"]),
  template("school-announcement", "ประกาศโรงเรียน", "correspondence", ["ประกาศ", "แจ้งให้ทราบ"]),
  template("school-order", "คำสั่งโรงเรียน", "personnel", ["คำสั่ง", "แต่งตั้ง"]),
  template("meeting-report", "รายงานการประชุม", "report", ["รายงานการประชุม", "ประชุม"]),
  template("student-certificate", "หนังสือรับรองนักเรียน", "student", ["รับรองนักเรียน", "หนังสือรับรอง"]),
  template("parent-permission", "หนังสือขออนุญาตผู้ปกครอง", "student", ["ผู้ปกครอง", "ยินยอม"]),
  template("official-travel", "แบบขออนุญาตเดินทางไปราชการ", "approval", ["ไปราชการ", "เดินทาง"]),
  template("expense-estimate", "ประมาณการค่าใช้จ่าย", "finance", ["ประมาณการ", "ค่าใช้จ่าย", "งบประมาณ"]),
  template("student-roster", "บัญชีรายชื่อนักเรียน", "student", ["บัญชีรายชื่อ", "รายชื่อนักเรียน"]),
  template("activity-schedule", "กำหนดการกิจกรรม", "activity", ["กำหนดการ", "กิจกรรม"]),
  template("activity-report", "รายงานผลกิจกรรม", "report", ["รายงานผล", "กิจกรรม"]),
  template("lesson-plan", "แผนการจัดการเรียนรู้", "academic", ["แผนการจัดการเรียนรู้", "แผนการสอน"]),
  template("student-development-report", "รายงานพัฒนาผู้เรียน", "report", ["พัฒนาผู้เรียน", "รายงานผู้เรียน"]),
  template("procurement-memo", "บันทึกขอจัดซื้อ/จัดจ้าง", "finance", ["จัดซื้อ", "จัดจ้าง"]),
  { id: "offsite-competition-pack", title: "ชุดเอกสารนำนักเรียนไปแข่งขันนอกสถานที่", description: "เอกสารครบชุดสำหรับการแข่งขันนอกสถานที่", category: "activity", keywords: ["แข่งขัน", "นำนักเรียน", "เดินทาง", "นอกสถานที่", "ประกวด"], fields: offsiteFields, parts: offsiteCompetitionParts, featured: true },
];

export const getTemplate = (id: string) => documentTemplates.find((item) => item.id === id);
