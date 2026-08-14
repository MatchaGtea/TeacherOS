import { ArrowRight, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { apiUrls } from "../api";
import { fixtureEvidenceSummary } from "../evidence";
import { fixtureReport, students } from "../fixtures";

const achievementGroups = [
  { label: "ม.3/2 (ทั้งห้อง)", pre: 52.1, post: 74.8 },
  { label: "กลุ่มเก่ง", pre: 67.3, post: 88.9 },
  { label: "กลุ่มกลาง", pre: 50.2, post: 72.1 },
  { label: "กลุ่มอ่อน", pre: 31.0, post: 54.2 },
];

export default function ExportsPage() {
  const pp5Preview = students.slice(0, 5).map((student) => fixtureReport(student.id));
  const evidence = fixtureEvidenceSummary;
  return (
    <div className="evidence-page">
      <header className="evidence-hero">
        <div>
          <h1>ศูนย์หลักฐานการประเมิน</h1>
          <p>รวบรวมหลักฐานจาก {evidence.roundCount} รอบการประเมิน เพื่อจัดทำ PA, CAR และ ปพ.5 ได้จากข้อมูลชุดเดียว</p>
        </div>
        <dl className="evidence-context" aria-label="บริบทการประเมินปัจจุบัน">
          <div><dt>ชั้นเรียน</dt><dd>{evidence.room}</dd></div>
          <div><dt>รายวิชา</dt><dd>{evidence.subject}</dd></div>
          <div><dt>รอบปัจจุบัน</dt><dd>{evidence.examTitle}</dd></div>
        </dl>
      </header>

      <section className="evidence-overview" aria-labelledby="outputs-heading">
        <div className="evidence-overview-copy">
          <h2 id="outputs-heading">เอกสารที่พร้อมจัดทำ</h2>
          <p>{evidence.sourceLabel} · {evidence.period}</p>
        </div>
        <dl className="evidence-metrics" aria-label="สรุปข้อมูลการประเมิน">
          <div><dt>ผู้เรียน</dt><dd>{evidence.learnerCount} คน</dd></div>
          <div><dt>คะแนนเฉลี่ยล่าสุด</dt><dd>{evidence.currentAverage}%</dd></div>
          <div><dt>เพิ่มขึ้นจากรอบก่อน</dt><dd>+{evidence.growth} จุด</dd></div>
        </dl>
      </section>

      <section className="evidence-output-grid" aria-label="ผลลัพธ์หลักฐานการประเมิน">
        <article className="evidence-output">
          <FileText aria-hidden="true" />
          <div><h2>PA</h2><p>หลักฐานผลการพัฒนาผู้เรียน พร้อมผลเปรียบเทียบ 2 รอบ</p></div>
          <Link className="button outline" to="/print/pa-car"><Printer aria-hidden="true" />เปิดแฟ้ม PA</Link>
        </article>
        <article className="evidence-output">
          <FileText aria-hidden="true" />
          <div><h2>CAR <span>/ CRA</span></h2><p>รายงานวิจัยในชั้นเรียนจากข้อมูลวิเคราะห์ห้องเรียนและรายบุคคล</p></div>
          <Link className="button outline" to="/print/pa-car"><Printer aria-hidden="true" />เปิดแฟ้ม CAR</Link>
        </article>
        <article className="evidence-output">
          <FileSpreadsheet aria-hidden="true" />
          <div><h2>ปพ.5</h2><p>ตารางผลการเรียนรายคนพร้อมคะแนนจากรอบประเมินปัจจุบัน</p></div>
          <a className="button outline" href={apiUrls.pp5}><FileSpreadsheet aria-hidden="true" />ดาวน์โหลด ปพ.5</a>
        </article>
      </section>

      <section className="evidence-trace" aria-labelledby="trace-heading">
        <div><h2 id="trace-heading">ร่องรอยหลักฐาน</h2><p>เส้นทางข้อมูลที่เชื่อมการประเมินไปยังเอกสารส่งออก</p></div>
        <ol>
          <li><b>2 รอบการประเมิน</b><span>{evidence.previousAverage}% → {evidence.currentAverage}%</span></li>
          <li><b>ข้อสอบที่ตรวจสอบแล้ว</b><span>{evidence.verifiedQuestionCount}/{evidence.questionCount} ข้อ · เชื่อม KG {evidence.knowledgeNodeCount} จุด</span></li>
          <li><b>วิเคราะห์ชั้นเรียนและรายบุคคล</b><span>ผู้เรียน {evidence.learnerCount} คน · ต้องติดตาม {evidence.flaggedCount} คน</span></li>
          <li><b>เอกสารพร้อมใช้</b><span>PA · CAR / CRA · ปพ.5</span></li>
        </ol>
      </section>

      <section className="panel pa-preview" aria-label="ตัวอย่างรายงาน PA และ CAR">
        <div>
          <h2>ผลการพัฒนาผู้เรียน: Pre-test vs Post-test</h2>
          <div className="comparison-legend"><span>Pre-test</span><span>Post-test</span></div>
          <div className="export-comparison" aria-label="เปรียบเทียบคะแนนเฉลี่ยก่อนและหลังเรียนแยกตามกลุ่มผู้เรียน">
            {achievementGroups.map((group) => <div className="comparison-group" key={group.label}><div className="bar-pair"><span className="bar pre" style={{ height: `${group.pre}%` }}><b>{group.pre}</b></span><span className="bar post" style={{ height: `${group.post}%` }}><b>{group.post}</b></span></div><small>{group.label}</small></div>)}
          </div>
        </div>
        <div className="evidence-summary">
          <h2>สรุปสาระสำคัญ</h2>
          <p>คะแนนเฉลี่ยหลังเรียนสูงกว่าก่อนเรียน และมีข้อมูลรายทักษะพร้อมใช้วางแผนซ่อมเสริม</p>
          <ul>
            <li>จุดเน้น: {evidence.focusNodeId} {evidence.focusTitle}</li>
            <li>ตัวชี้วัด: {evidence.indicator}</li>
            <li>ข้อสอบเชื่อม KG แล้ว {evidence.mappedQuestionCount}/{evidence.questionCount} ข้อ</li>
          </ul>
          <p className="export-metadata">ช่วงเวลา: {evidence.period}<br />ผู้จัดทำ: ครูสมชาย ใจดี</p>
        </div>
      </section>

      <section className="sheet-preview" aria-labelledby="pp5-preview-heading">
        <div className="section-heading"><div><h2 id="pp5-preview-heading">ตัวอย่างข้อมูล ปพ.5</h2><p>ตรวจทานรายการก่อนดาวน์โหลดไฟล์</p></div><a href={apiUrls.pp5}>ดาวน์โหลด ปพ.5</a></div>
        <div className="formula">A1　 fx　 แบบรายงานผู้สำเร็จการศึกษา (ปพ.5)</div>
        <table><thead><tr><th>เลขที่</th><th>เลขประจำตัวนักเรียน</th><th>ชื่อ-สกุล</th><th>คะแนนครั้งที่ 1→2</th><th>รวม (ร้อยละ)</th><th>ตัวชี้วัด</th><th>ผลการเรียนเบื้องต้น</th></tr></thead><tbody>{pp5Preview.map((report) => <tr key={report.student.id}><td>{report.student.student_number}</td><td>{report.student.student_code}</td><td>{report.student.name}</td><td>{report.attempts[0].score}→{report.attempts[1].score}</td><td>{report.latest_percentage}%</td><td>{evidence.indicator}</td><td>{report.latest_score >= 6 ? "ผ่าน" : "ต้องเสริม"}</td></tr>)}</tbody></table>
      </section>

      <p className="general-documents-link"><Link to="/documents">เอกสารราชการทั่วไป <ArrowRight aria-hidden="true" /></Link></p>
    </div>
  );
}
