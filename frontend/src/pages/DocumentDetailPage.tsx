import { ArrowLeft, CheckCircle2, FileText, Settings2 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getDocumentTemplate, useDocumentWorkspace } from "../documents/domain";
import { statusLabel } from "./HomePage";

export default function DocumentDetailPage() {
  const { documentId = "" } = useParams(); const { state, updateDocument } = useDocumentWorkspace(); const document = state.documents.find((item) => item.id === documentId);
  if (!document) return <Navigate to="/documents" replace />;
  const template = getDocumentTemplate(document.templateId); if (!template) return <Navigate to="/documents" replace />;
  const fieldValue = (key: string) => { const value = document.fields[key]; return Array.isArray(value) ? value.join(", ") : value ?? "—"; };
  return <div className="workspace-page document-detail"><header className="page-header"><div><Link className="back-link" to="/documents"><ArrowLeft aria-hidden="true" />งานเอกสาร</Link><h1>{document.title}</h1><p>{template.title} · อัปเดตล่าสุด {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(document.updatedAt))}</p></div><Link className="button" to={`/documents/${document.id}/process`}><Settings2 aria-hidden="true" />ดำเนินการต่อ</Link></header>
    <section className="document-state"><span className={`document-status ${document.status}`}>{statusLabel(document.status)}</span><div><h2>{document.status === "ready" ? "เอกสารพร้อมพิมพ์" : "เอกสารอยู่ระหว่างดำเนินการ"}</h2><p>{document.status === "draft" ? "ตรวจทานรายละเอียด แล้วส่งเข้ากระบวนการอนุมัติ" : "ติดตามลำดับการอนุมัติและดำเนินการต่อในหน้างาน"}</p></div></section>
    <section className="detail-section"><div className="section-heading"><div><h2>รายละเอียด</h2><p>แก้ไขข้อมูลได้ก่อนเข้าสู่ขั้นตอนอนุมัติ</p></div></div><div className="detail-fields">{template.fields.map((field) => { const currentValue = fieldValue(field.key) === "—" ? "" : fieldValue(field.key); const save = (next: string) => updateDocument(document.id, { ...document.fields, [field.key]: field.kind === "people" ? next.split(",").map((value) => value.trim()).filter(Boolean) : next }); return <label key={field.key}><span>{field.label}</span>{field.kind === "textarea" ? <textarea aria-label={field.label} value={currentValue} disabled={document.status !== "draft"} onChange={(event) => save(event.target.value)} /> : <input aria-label={field.label} type={field.kind === "people" ? "text" : field.kind} value={currentValue} disabled={document.status !== "draft"} onChange={(event) => save(event.target.value)} />}</label>; })}</div></section>
    <section className="detail-section pack-section"><div className="section-heading"><div><h2>เอกสารในชุด</h2><p>{template.parts.length} ส่วนที่พร้อมใช้งานจากข้อมูลชุดเดียวกัน</p></div></div><div className="pack-list">{template.parts.map((part, index) => <Link to={`/documents/${document.id}/print/${part.id}`} className="pack-row" key={part.id}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{part.title}</b><small>{part.purpose}</small></div><FileText aria-hidden="true" /></Link>)}</div></section>
    {document.status === "ready" && <p className="ready-note"><CheckCircle2 aria-hidden="true" />เอกสารทุกส่วนพร้อมสำหรับการพิมพ์และจัดเก็บ</p>}
  </div>;
}
