import { Download, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { AsyncStatus } from "../components/AsyncStatus";
import { PageHeader } from "../components/DesignSystem";
import { GrowthIndicator } from "../components/GrowthIndicator";
import { fixtureReport, nodes, students } from "../fixtures";
import type { Report } from "../types";

export default function StudentReportPage() {
  const { id = "STU001" } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report>(() => fixtureReport(id));
  const [message, setMessage] = useState<string | undefined>(
    "กำลังโหลดรายงาน…",
  );
  useEffect(() => {
    let active = true;
    api.report(id).then((result) => {
      if (active) {
        setReport(result.data);
        setMessage(result.message);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);
  const chart = useMemo(
    () =>
      report.attempts.map((item) => ({
        name: `ครั้งที่ ${item.attempt_number}`,
        score: item.score,
      })),
    [report.attempts],
  );
  const focusTitle = report.primary_root_cause
    ? nodes.find((node) => node.id === report.primary_root_cause)?.title
    : "โจทย์ประยุกต์กำลังสอง";
  const actionRecommendations = report.primary_root_cause
    ? [
        {
          title: "ทบทวนพื้นฐานของสาเหตุราก",
          detail:
            report.recommendations[0] ??
            `ทบทวน ${focusTitle} จากตัวอย่างที่แก้ทีละขั้น`,
        },
        {
          title: "ฝึกแบบเจาะจง",
          detail: `ทำโจทย์ ${focusTitle} 8–10 ข้อ พร้อมเขียนเหตุผลในแต่ละขั้น`,
        },
        {
          title: "ตรวจความเข้าใจครั้งถัดไป",
          detail: "ทำ Quick Check 6 ข้อในคาบถัดไป โดยตั้งเป้าผ่านอย่างน้อย 80%",
        },
      ]
    : [
        {
          title: "ต่อยอดโจทย์ท้าทาย",
          detail:
            report.recommendations[0] ??
            "ลองโจทย์ประยุกต์หลายขั้นตอนที่มีรากเป็นเศษส่วน",
        },
        {
          title: "สื่อสารวิธีคิด",
          detail:
            report.recommendations[1] ??
            "อธิบายเปรียบเทียบวิธีแยกตัวประกอบกับสูตรกำลังสอง",
        },
        {
          title: "Quick Check ระดับก้าวหน้า",
          detail: "ทำโจทย์ท้าทาย 6 ข้อในคาบถัดไปและอธิบายเหตุผลครบทุกข้อ",
        },
      ];
  return (
    <>
      <PageHeader
        className="rowhead"
        title="รายงานพัฒนาผู้เรียนรายบุคคล"
        description={`${report.student.name} · เลขที่ ${report.student.student_number} · ${report.student.room}`}
        actions={
          <>
            <select
              aria-label="เลือกนักเรียน"
              value={id}
              onChange={(event) => navigate(`/students/${event.target.value}`)}
            >
              {students.map((student) => (
                <option value={student.id} key={student.id}>
                  {student.student_number}. {student.name}
                </option>
              ))}
            </select>
            <Link className="button outline" to={`/students/${id}/print`}>
              <Download aria-hidden="true" /> ดาวน์โหลด / พิมพ์ PDF
            </Link>
          </>
        }
      />
      <AsyncStatus
        message={message}
        kind={message?.includes("ตัวอย่าง") ? "warning" : "info"}
      />
      <div className="report-grid">
        <section className="panel">
          <h3>ประวัติการสอบ</h3>
          <table className="simple">
            <thead>
              <tr>
                <th>ครั้งที่</th>
                <th>วันที่สอบ</th>
                <th>คะแนน</th>
                <th>ร้อยละ</th>
              </tr>
            </thead>
            <tbody>
              {report.attempts.map((item) => (
                <tr key={item.attempt_number}>
                  <td>ครั้งที่ {item.attempt_number}</td>
                  <td>{item.date}</td>
                  <td>
                    {item.score}/{item.total}
                  </td>
                  <td>{((item.score / item.total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="growth">
            การเติบโต <GrowthIndicator value={report.growth} withLabel />
          </h3>
        </section>
        <section className="panel">
          <h3>แนวโน้มคะแนน</h3>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={chart}>
              <CartesianGrid />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 12]} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0757d9"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="panel score">
          <h3>ภาพรวมผลการเรียนรู้</h3>
          <b>
            {report.latest_score}
            <small>/12</small>
          </b>
          <strong>{report.latest_percentage}%</strong>
          <p>
            ระดับผลการเรียนรู้ <em>{report.learning_level}</em>
          </p>
        </section>
        <section className="panel mastery">
          <h3>ความชำนาญรายตัวชี้วัด (Mastery)</h3>
          {report.mastery.map((item) => (
            <div className="mastery-row" key={item.node_id}>
              <b>{item.node_id}</b>
              <span>
                {nodes.find((node) => node.id === item.node_id)?.title}
              </span>
              <div aria-label={`${item.percentage}%`}>
                <i
                  className={item.status}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <small>{item.percentage}%</small>
            </div>
          ))}
        </section>
        <section className="panel diagnosis">
          <h3>การวินิจฉัยสาเหตุราก (Root Cause)</h3>
          <h2>{report.diagnosis}</h2>
          <p>
            เชื่อมโยงกับตัวชี้วัดพื้นฐาน:{" "}
            <b>{report.primary_root_cause ?? "ไม่พบจุดบกพร่องหลัก"}</b>
          </p>
        </section>
        <section className="panel recommendations">
          <h3>ข้อเสนอแนะการดำเนินการ</h3>
          <div className="recommendation-list">
            {actionRecommendations.map((item, index) => (
              <article key={item.title}>
                <strong aria-hidden="true">{index + 1}</strong>
                <div>
                  <b>{item.title}</b>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <Link className="button primary" to={`/remedial/${id}`}>
            <FileText aria-hidden="true" />{" "}
            {report.primary_root_cause
              ? "สร้างชีทซ่อมเสริมรายบุคคล"
              : "สร้างชีทโจทย์ท้าทาย"}
          </Link>
        </section>
      </div>
    </>
  );
}
