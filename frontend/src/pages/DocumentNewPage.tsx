import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { getDocumentTemplate, parseThaiDocumentIntent, useDocumentWorkspace, type ParsedIntent } from "../documents/domain";

const starter = "เรื่อง: แข่งขันทักษะวิชาการ, ณ จังหวัดเชียงใหม่, ระหว่างวันที่ 12–14 สิงหาคม 2569, ครูผู้ควบคุม: นายสมชาย ใจดี และ นางสาวสุดา พร้อมดี, รายชื่อนักเรียน: เด็กหญิงมานี ดีใจ และ เด็กชายมานะ ตั้งใจ, งบประมาณ: 5,000 บาท, ผู้จัด: สพฐ.";

export default function DocumentNewPage() {
  const location = useLocation();
  const carriedPrompt = typeof (location.state as { prompt?: unknown } | null)?.prompt === "string"
    ? (location.state as { prompt: string }).prompt
    : undefined;
  return <DocumentNewEditor key={location.key} carriedPrompt={carriedPrompt} />;
}

function DocumentNewEditor({ carriedPrompt }: { carriedPrompt?: string }) {
  const { templateId = "" } = useParams(); const template = getDocumentTemplate(templateId); const navigate = useNavigate(); const { createDocument, state } = useDocumentWorkspace();
  const initialPrompt = carriedPrompt ?? (templateId === "offsite-competition-pack" ? starter : "");
  const [prompt, setPrompt] = useState(initialPrompt); const [intent, setIntent] = useState<ParsedIntent | null>(() => initialPrompt ? parseThaiDocumentIntent(initialPrompt) : null); const [fields, setFields] = useState<Record<string, string | string[]>>(() => intent?.templateId === templateId ? intent.fields : {}); const [createdId, setCreatedId] = useState<string | null>(null);
  if (!template) return <Navigate to="/documents" replace />;
  const parsed = () => { const next = parseThaiDocumentIntent(prompt); setIntent(next); setFields(next.templateId === templateId ? next.fields : {}); };
  const value = (key: string) => { const field = fields[key]; return Array.isArray(field) ? field.join(", ") : field ?? ""; };
  const update = (key: string, text: string, people: boolean) => setFields((current) => ({ ...current, [key]: people ? text.split(",").map((item) => item.trim()).filter(Boolean) : text }));
  useEffect(() => { if (createdId && state.documents.some((document) => document.id === createdId)) navigate(`/documents/${createdId}`); }, [createdId, navigate, state.documents]);
  const create = () => setCreatedId(createDocument(template.id, fields));
  const missingRequired = template.fields.filter((field) => field.required && (Array.isArray(fields[field.key]) ? !fields[field.key].length : !String(fields[field.key] ?? "").trim()));
  return <div className="workspace-page document-editor"><header className="page-header"><div><Link className="back-link" to="/documents"><ArrowLeft aria-hidden="true" />คลังเอกสาร</Link><h1>{template.title}</h1><p>ตรวจทานข้อมูลก่อนสร้างเอกสาร</p></div></header>
    <section className="prompt-editor"><label htmlFor="document-prompt"><span>อธิบายงานที่ต้องการ</span><textarea id="document-prompt" rows={4} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="พิมพ์รายละเอียด เช่น ชื่อกิจกรรม สถานที่ วันเดินทาง ผู้เกี่ยวข้อง" /></label><button type="button" className="button outline" onClick={parsed}><Sparkles aria-hidden="true" />วิเคราะห์คำขอ</button>{intent && <p className="parse-feedback">พบแบบฟอร์มที่เกี่ยวข้อง: <b>{intent.templateId === templateId ? template.title : "แบบฟอร์มอื่น"}</b> · ความมั่นใจ {intent.confidence === "high" ? "สูง" : intent.confidence === "medium" ? "ปานกลาง" : "ต่ำ"}{intent.templateId !== templateId ? <> · <Link to={`/documents/new/${intent.templateId}`} state={{ prompt }}>เปิดแบบฟอร์มที่แนะนำ</Link></> : null}</p>}</section>
    <section className="field-editor" aria-labelledby="fields-heading"><h2 id="fields-heading">รายละเอียดเอกสาร</h2><div className="field-grid">{template.fields.map((field) => <label key={field.key}>{field.label}{field.required ? <em>จำเป็น</em> : null}{field.kind === "textarea" ? <textarea aria-label={field.label} value={value(field.key)} placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value, false)} /> : <input aria-label={field.label} type={field.kind === "people" ? "text" : field.kind} value={value(field.key)} placeholder={field.placeholder ?? (field.kind === "people" ? "คั่นรายชื่อด้วยเครื่องหมายจุลภาค" : undefined)} onChange={(event) => update(field.key, event.target.value, field.kind === "people")} />}</label>)}</div></section>
    <div className="editor-actions"><Link className="button outline" to="/documents">ยกเลิก</Link><div><button className="button" type="button" onClick={create} disabled={missingRequired.length > 0}>สร้างเอกสาร</button>{missingRequired.length ? <p className="required-guidance" role="status">กรอกข้อมูลที่จำเป็น: {missingRequired.map((field) => field.label).join(", ")}</p> : null}</div></div>
  </div>;
}
