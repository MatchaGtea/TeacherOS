import { FilePlus2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DOCUMENT_TEMPLATES, type DocumentCategory, useDocumentWorkspace } from "../documents/domain";
import { statusLabel } from "./HomePage";

const categories: Array<{ value: "all" | DocumentCategory; label: string }> = [{ value: "all", label: "ทุกประเภท" }, { value: "correspondence", label: "หนังสือราชการ" }, { value: "approval", label: "ขออนุมัติ" }, { value: "activity", label: "กิจกรรม" }, { value: "student", label: "นักเรียน" }, { value: "report", label: "รายงาน" }, { value: "finance", label: "การเงิน" }, { value: "academic", label: "วิชาการ" }, { value: "personnel", label: "บุคลากร" }];

export default function DocumentsPage() {
  const { state } = useDocumentWorkspace(); const [query, setQuery] = useState(""); const [category, setCategory] = useState<"all" | DocumentCategory>("all");
  const templates = useMemo(() => DOCUMENT_TEMPLATES.filter((template) => (category === "all" || template.category === category) && `${template.title} ${template.description} ${template.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query, category]);
  return <div className="workspace-page">
    <header className="page-header"><div><h1>เอกสารราชการทั่วไป</h1><p>แบบฟอร์มและแม่แบบงานราชการทั่วไป เป็นพื้นที่รองจากหลักฐานการประเมิน</p></div><div className="page-header-actions"><Link className="button outline" to="/evidence">ไปยังหลักฐานการประเมิน</Link><Link className="button" to="/documents/new/offsite-competition-pack"><FilePlus2 aria-hidden="true" />สร้างเอกสาร</Link></div></header>
    <section className="document-prompt" aria-labelledby="prompt-heading"><div><h2 id="prompt-heading">บอกงานที่ต้องการ</h2><p>เช่น “นำนักเรียนไปแข่งขันที่เชียงใหม่ วันที่ 12–14 สิงหาคม”</p></div><Link className="button outline" to="/documents/new/offsite-competition-pack">เริ่มพิมพ์คำขอ</Link></section>
    <div className="catalog-controls"><label><span className="sr-only">ค้นหาแบบฟอร์ม</span><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาแบบฟอร์ม" /></label><select aria-label="กรองประเภทเอกสาร" value={category} onChange={(event) => setCategory(event.target.value as "all" | DocumentCategory)}>{categories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></div>
    <section className="template-list" aria-live="polite">{templates.map((template) => <Link className="template-row" to={`/documents/new/${template.id}`} key={template.id}><div><h2>{template.title}</h2><p>{template.description}</p><small>{template.parts.length} ส่วนเอกสาร</small></div><FilePlus2 aria-hidden="true" /></Link>)}{!templates.length && <div className="workspace-empty"><Search aria-hidden="true" /><h2>ไม่พบแบบฟอร์มที่ค้นหา</h2><p>ลองใช้คำค้นหรือเลือกประเภทเอกสารอื่น</p></div>}</section>
    <section className="recent-documents compact" aria-labelledby="workspace-heading"><div className="section-heading"><div><h2 id="workspace-heading">พื้นที่ทำงานล่าสุด</h2><p>{state.documents.length ? "เอกสารที่กำลังดำเนินการ" : "เอกสารที่สร้างจะปรากฏที่นี่"}</p></div></div>{state.documents.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4).map((document) => <Link className="document-row" to={`/documents/${document.id}`} key={document.id}><span><b>{document.title}</b><small>อัปเดตล่าสุด</small></span><span className={`document-status ${document.status}`}>{statusLabel(document.status)}</span></Link>)}</section>
  </div>;
}
