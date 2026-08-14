import { ArrowRight, FilePlus2, Files, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentWorkspace } from "../documents/domain";
import { fixtureEvidenceSummary } from "../evidence";

const dateFormat = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

export default function HomePage() {
  const { state } = useDocumentWorkspace();
  const recent = state.documents.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const evidence = fixtureEvidenceSummary;
  return (
    <div className="workspace-page home-page evidence-home">
      <header className="workspace-hero evidence-home-hero">
        <div>
          <h1>หลักฐานการประเมิน พร้อมใช้</h1>
          <p>เชื่อมผลประเมินเป็นหลักฐานสำหรับ PA, CAR และ ปพ.5 จากข้อมูลชั้นเรียนเดียวกัน</p>
          <p className="evidence-source">{evidence.sourceLabel} · {evidence.period}</p>
        </div>
        <Link className="button" to="/evidence">เปิดศูนย์หลักฐาน<ArrowRight aria-hidden="true" /></Link>
      </header>

      <section className="home-round-summary" aria-labelledby="round-heading">
        <div><h2 id="round-heading">สรุปรอบปัจจุบัน</h2><p>{evidence.room} · {evidence.subject} · {evidence.examTitle}</p></div>
        <dl>
          <div><dt>ผู้เรียน</dt><dd>{evidence.learnerCount} คน</dd></div>
          <div><dt>คะแนนเฉลี่ย</dt><dd>{evidence.currentAverage}%</dd></div>
          <div><dt>เพิ่มขึ้น</dt><dd>+{evidence.growth} จุด</dd></div>
          <div><dt>ข้อสอบตรวจสอบแล้ว</dt><dd>{evidence.verifiedQuestionCount}/{evidence.questionCount}</dd></div>
        </dl>
      </section>

      <section className="evidence-workflows" aria-label="ทางลัดการทำงานหลักฐาน">
        <Link className="workspace-choice" to="/assessments"><span className="workspace-icon blue"><Sparkles aria-hidden="true" /></span><div><h2>สร้างการประเมิน</h2><p>ออกแบบข้อสอบและตรวจสอบการเชื่อมโยงกับ KG</p></div><ArrowRight aria-hidden="true" /></Link>
        <Link className="workspace-choice" to="/dashboard"><span className="workspace-icon teal"><Files aria-hidden="true" /></span><div><h2>วิเคราะห์หลักฐานชั้นเรียน</h2><p>ดูข้อมูลทั้งห้องและรายบุคคลเพื่อหาเรื่องที่ต้องเสริม</p></div><ArrowRight aria-hidden="true" /></Link>
        <Link className="workspace-choice" to="/evidence"><span className="workspace-icon blue"><FilePlus2 aria-hidden="true" /></span><div><h2>เตรียม PA / CAR / ปพ.5</h2><p>เปิดแฟ้มหลักฐานและส่งออกเอกสารจากข้อมูลรอบปัจจุบัน</p></div><ArrowRight aria-hidden="true" /></Link>
      </section>

      <section className="recent-documents secondary-documents" aria-labelledby="recent-heading">
        <div className="section-heading"><div><h2 id="recent-heading">เอกสารราชการทั่วไป</h2><p>งานแบบฟอร์มและเอกสารล่าสุด เป็นพื้นที่ทำงานรอง</p></div><Link to="/documents">ดูเอกสารทั้งหมด</Link></div>
        {recent.length ? <div className="document-list">{recent.map((document) => <Link className="document-row" to={`/documents/${document.id}`} key={document.id}><span className="file-glyph"><Files aria-hidden="true" /></span><span><b>{document.title}</b><small>{dateFormat.format(new Date(document.updatedAt))}</small></span><span className={`document-status ${document.status}`}>{statusLabel(document.status)}</span><ArrowRight aria-hidden="true" /></Link>)}</div> : <div className="workspace-empty"><Files aria-hidden="true" /><h2>ยังไม่มีเอกสารราชการทั่วไป</h2><p>เริ่มจากแบบฟอร์มที่ใช้งานบ่อย หรือบอกงานที่ต้องการด้วยภาษาธรรมชาติ</p><Link className="button outline" to="/documents">เปิดคลังเอกสาร</Link></div>}
      </section>
    </div>
  );
}

export function statusLabel(status: string) {
  return ({ draft: "ฉบับร่าง", waiting_head: "รอหัวหน้า", waiting_director: "รอผู้อำนวยการ", approved: "อนุมัติแล้ว", ready: "พร้อมพิมพ์" } as Record<string, string>)[status] ?? status;
}
