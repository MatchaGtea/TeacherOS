import { ArrowLeft, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getDocumentTemplate, useDocumentWorkspace } from "../documents/domain";
import { DocumentRenderer } from "../documents/rendering";
import "../document-print.css";

export default function DocumentPrintPage() {
  const { documentId = "", partId = "" } = useParams();
  const { state } = useDocumentWorkspace();
  const document = state.documents.find((item) => item.id === documentId);
  const template = document && getDocumentTemplate(document.templateId);
  const part = template?.parts.find((item) => item.id === partId);
  if (!document || !template || !part) return <Navigate to="/documents" replace />;
  const index = template.parts.findIndex((item) => item.id === part.id);
  const previous = template.parts[index - 1]; const next = template.parts[index + 1];
  return <main className="document-print-route"><nav className="print-toolbar" aria-label="เครื่องมือเอกสาร"><Link to={`/documents/${document.id}`}><ArrowLeft aria-hidden="true" />กลับเอกสาร</Link><span>{part.title} · {index + 1}/{template.parts.length}</span><div>{previous && <Link aria-label={`เอกสารก่อนหน้า ${previous.title}`} to={`/documents/${document.id}/print/${previous.id}`}><ChevronLeft aria-hidden="true" /></Link>}{next && <Link aria-label={`เอกสารถัดไป ${next.title}`} to={`/documents/${document.id}/print/${next.id}`}><ChevronRight aria-hidden="true" /></Link>}<button type="button" onClick={() => window.print()}><Printer aria-hidden="true" />พิมพ์เอกสาร</button></div></nav><DocumentRenderer document={document} template={template} part={part} /></main>;
}
