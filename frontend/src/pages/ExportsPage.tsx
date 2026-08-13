import { FileSpreadsheet, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { apiUrls } from "../api";
import { PageHeader } from "../components/DesignSystem";
import { fixtureAnalytics, fixtureReport, students } from "../fixtures";

const achievementGroups = [
  { label: "ม.3/2 (ทั้งห้อง)", pre: 52.1, post: 74.8 },
  { label: "กลุ่มเก่ง", pre: 67.3, post: 88.9 },
  { label: "กลุ่มกลาง", pre: 50.2, post: 72.1 },
  { label: "กลุ่มอ่อน", pre: 31.0, post: 54.2 },
];

export default function ExportsPage() {
  const pp5Preview = students
    .slice(0, 5)
    .map((student) => fixtureReport(student.id));
  return (
    <>
      <PageHeader
        title="ส่งออกเอกสารครู"
        description="ส่งออกเอกสารสำหรับงานประเมินและหลักฐาน เพื่อใช้รายงานผล"
      />
      <section className="export-section">
        <div className="number">1</div>
        <div>
          <h2>ปพ.5 พร้อมกรอก (.xlsx)</h2>
          <p>ส่งออกไฟล์ ปพ.5 ที่มีคะแนนและผลการประเมินเบื้องต้น พร้อมใช้งาน</p>
        </div>
        <a className="button outline" href={apiUrls.pp5}>
          <FileSpreadsheet aria-hidden="true" /> ดาวน์โหลด ปพ.5
        </a>
      </section>
      <section className="sheet-preview">
        <div className="formula">
          A1　 fx　 แบบรายงานผู้สำเร็จการศึกษา (ปพ.5)
        </div>
        <table>
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>เลขประจำตัวนักเรียน</th>
              <th>ชื่อ-สกุล</th>
              <th>คะแนนครั้งที่ 1→2</th>
              <th>รวม (ร้อยละ)</th>
              <th>ตัวชี้วัด</th>
              <th>ผลการเรียนเบื้องต้น</th>
            </tr>
          </thead>
          <tbody>
            {pp5Preview.map((report) => (
              <tr key={report.student.id}>
                <td>{report.student.student_number}</td>
                <td>{report.student.student_code}</td>
                <td>{report.student.name}</td>
                <td>
                  {report.attempts[0].score}→{report.attempts[1].score}
                </td>
                <td>{report.latest_percentage}%</td>
                <td>ค 1.1 ม.3/1</td>
                <td>{report.latest_score >= 6 ? "ผ่าน" : "ต้องเสริม"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="export-section">
        <div className="number teal">2</div>
        <div>
          <h2>สรุปหลักฐาน PA / CAR (.pdf)</h2>
          <p>สรุปผลการพัฒนาผู้เรียน พร้อมหลักฐานเชิงประจักษ์</p>
        </div>
        <Link className="button outline" to="/print/pa-car">
          <FileText aria-hidden="true" /> เปิดเอกสารเพื่อพิมพ์ PDF
        </Link>
      </section>
      <section
        className="panel pa-preview"
        aria-label="ตัวอย่างรายงาน PA และ CAR"
      >
        <div>
          <h3>ผลการพัฒนาผู้เรียน: Pre-test vs Post-test</h3>
          <div className="comparison-legend">
            <span>Pre-test</span>
            <span>Post-test</span>
          </div>
          <div
            className="export-comparison"
            aria-label="เปรียบเทียบคะแนนเฉลี่ยก่อนและหลังเรียนแยกตามกลุ่มผู้เรียน"
          >
            {achievementGroups.map((group) => (
              <div className="comparison-group" key={group.label}>
                <div className="bar-pair">
                  <span className="bar pre" style={{ height: `${group.pre}%` }}>
                    <b>{group.pre}</b>
                  </span>
                  <span
                    className="bar post"
                    style={{ height: `${group.post}%` }}
                  >
                    <b>{group.post}</b>
                  </span>
                </div>
                <small>{group.label}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="evidence-summary">
          <h3>สรุปสาระสำคัญ</h3>
          <p>
            คะแนนเฉลี่ยหลังเรียนสูงกว่าก่อนเรียนอย่างชัดเจน
            และมีข้อมูลรายทักษะพร้อมใช้วางแผนซ่อมเสริม
          </p>
          <ul>
            <li>กลุ่มเป้าหมาย: นักเรียน ม.3/2 จำนวน 30 คน</li>
            <li>คะแนนหลังเรียนเฉลี่ย {fixtureAnalytics.class_average}%</li>
            <li>ประเด็นเร่งด่วน: {fixtureAnalytics.insight.headline}</li>
          </ul>
          <p className="export-metadata">
            ช่วงเวลา: 10 มิ.ย. – 15 ก.ค. 2569
            <br />
            ผู้จัดทำ: ครูสมชาย ใจดี
          </p>
        </div>
      </section>
      <section className="panel ready" role="status">
        <b>✓ พร้อมส่งออก!</b>
        <p>
          ไฟล์พร้อมใช้งาน ทั้ง 2 รายการ
          สามารถดาวน์โหลดหรือเปิดเอกสารเพื่อพิมพ์ได้ทันที
        </p>
      </section>
    </>
  );
}
