import { ArrowRight, FilePlus2, Files, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentWorkspace } from "../documents/domain";

const dateFormat = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

export default function HomePage() {
  const { state } = useDocumentWorkspace();
  const recent = state.documents.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  return (
    <div className="workspace-page home-page">
      <header className="workspace-hero">
        <div>
          <h1>สวัสดี ครูสมชาย</h1>
          <p>จัดการงานสอนและเอกสารราชการได้จากพื้นที่เดียว</p>
        </div>
        <Link className="button" to="/documents/new/offsite-competition-pack"><FilePlus2 aria-hidden="true" />สร้างเอกสาร</Link>
      </header>
      <section className="workspace-choices" aria-label="พื้นที่ทำงาน">
        <Link className="workspace-choice" to="/assessments">
          <span className="workspace-icon blue"><Sparkles aria-hidden="true" /></span>
          <div><h2>สร้างข้อสอบ</h2><p>ออกแบบแบบทดสอบ วิเคราะห์ผล และติดตามผู้เรียน</p></div>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link className="workspace-choice" to="/documents">
          <span className="workspace-icon teal"><Files aria-hidden="true" /></span>
          <div><h2>งานเอกสาร</h2><p>สร้างเอกสารราชการจากแบบฟอร์ม พร้อมลำดับการอนุมัติ</p></div>
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>
      <section className="recent-documents" aria-labelledby="recent-heading">
        <div className="section-heading"><div><h2 id="recent-heading">เอกสารล่าสุด</h2><p>กลับมาทำงานต่อจากจุดเดิม</p></div><Link to="/documents">ดูเอกสารทั้งหมด</Link></div>
        {recent.length ? <div className="document-list">{recent.map((document) => <Link className="document-row" to={`/documents/${document.id}`} key={document.id}><span className="file-glyph"><Files aria-hidden="true" /></span><span><b>{document.title}</b><small>{dateFormat.format(new Date(document.updatedAt))}</small></span><span className={`document-status ${document.status}`}>{statusLabel(document.status)}</span><ArrowRight aria-hidden="true" /></Link>)}</div> : <div className="workspace-empty"><Files aria-hidden="true" /><h2>ยังไม่มีเอกสาร</h2><p>เริ่มต้นจากแบบฟอร์มที่ใช้งานบ่อย หรือบอกงานที่ต้องการด้วยภาษาธรรมชาติ</p><Link className="button outline" to="/documents">เปิดคลังเอกสาร</Link></div>}
      </section>
    </div>
  );
}

export function statusLabel(status: string) {
  return ({ draft: "ฉบับร่าง", waiting_head: "รอหัวหน้า", waiting_director: "รอผู้อำนวยการ", approved: "อนุมัติแล้ว", ready: "พร้อมพิมพ์" } as Record<string, string>)[status] ?? status;
}
