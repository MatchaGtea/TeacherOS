import { ArrowLeft, Check, Circle, FileCheck2 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { DOCUMENT_PROCESS_GRAPH, getAvailableWorkflowAction, getDocumentTemplate, useDocumentWorkspace } from "../documents/domain";
import { statusLabel } from "./HomePage";

const stateStep: Record<string, number> = { draft: 0, waiting_head: 2, waiting_director: 3, approved: 4, ready: 4 };
const approverLabel = (role: "head" | "director" | "teacher" | "system") => role === "head" ? "หัวหน้ากลุ่มสาระ" : role === "director" ? "ผู้อำนวยการ" : role === "teacher" ? "ครูผู้จัดทำ" : "ระบบ";
export default function DocumentProcessPage() {
  const { documentId = "" } = useParams(); const { state, submitForApproval, approveCurrentStep, markReady } = useDocumentWorkspace(); const document = state.documents.find((item) => item.id === documentId);
  if (!document) return <Navigate to="/documents" replace />;
  const template = getDocumentTemplate(document.templateId); const action = getAvailableWorkflowAction(document.status); const step = stateStep[document.status] ?? 0;
  const execute = () => { if (document.status === "draft") submitForApproval(document.id); else if (document.status === "approved") markReady(document.id); else approveCurrentStep(document.id); };
  const actionLabel = document.status === "draft" ? "ส่งตรวจสอบข้อมูล" : document.status === "waiting_head" ? "จำลองการอนุมัติหัวหน้ากลุ่มสาระ" : document.status === "waiting_director" ? "จำลองการอนุมัติผู้อำนวยการ" : document.status === "approved" ? "เตรียมเอกสารให้พร้อมพิมพ์" : "เอกสารพร้อมพิมพ์แล้ว";
  return <div className="workspace-page process-page"><header className="page-header"><div><Link className="back-link" to={`/documents/${document.id}`}><ArrowLeft aria-hidden="true" />ภาพรวมเอกสาร</Link><h1>ลำดับการดำเนินงาน</h1><p>{document.title}{template ? ` · ${template.title}` : ""}</p></div></header>
    <section className="process-summary"><span className={`document-status ${document.status}`}>{statusLabel(document.status)}</span><div><h2>ติดตามสถานะเอกสาร</h2><p>นี่คือการจำลองขั้นตอนอนุมัติสำหรับสาธิตการทำงาน</p></div></section>
    <ol className="process-steps">{DOCUMENT_PROCESS_GRAPH.nodes.map((node, index) => { const complete = index < step || (index === 4 && document.status === "ready"); const current = index === step && document.status !== "ready"; return <li className={complete ? "complete" : current ? "current" : ""} key={node.id}><span>{complete ? <Check aria-label="เสร็จสิ้น" /> : <Circle aria-hidden="true" />}</span><div><b>{node.title}</b><small>{node.role === "teacher" ? "ครูผู้จัดทำ" : node.role === "head" ? "หัวหน้ากลุ่มสาระ" : node.role === "director" ? "ผู้อำนวยการ" : "ระบบ"}</small></div></li>; })}</ol>
    {action ? <button type="button" className="button process-action" onClick={execute}><FileCheck2 aria-hidden="true" />{actionLabel}</button> : <Link className="button" to={`/documents/${document.id}`}><FileCheck2 aria-hidden="true" />เอกสารพร้อมพิมพ์แล้ว</Link>}
    {document.approvals.length ? <section className="approval-history"><h2>ประวัติการดำเนินการ</h2>{document.approvals.map((approval) => <p key={approval.stepId}><b>{approverLabel(approval.role)}</b><span>{approval.state === "approved" ? "อนุมัติแล้ว" : "รอดำเนินการ"}</span></p>)}</section> : null}
  </div>;
}
