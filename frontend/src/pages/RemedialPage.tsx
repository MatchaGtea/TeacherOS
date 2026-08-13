import { Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { AsyncStatus } from "../components/AsyncStatus";
import { Button } from "../components/Button";
import { HtmlDocumentFrame } from "../components/HtmlDocumentFrame";
import { fixtureExam, fixtureReport, nodes } from "../fixtures";
import type { Report } from "../types";

export default function RemedialPage() {
  const { id = "STU001" } = useParams();
  const [report, setReport] = useState<Report>(() => fixtureReport(id));
  const [html, setHtml] = useState("");
  const [message, setMessage] = useState<string>();
  useEffect(() => {
    let active = true;
    Promise.all([api.report(id), api.html(`/students/${id}/remedial`)]).then(
      ([reportResult, htmlResult]) => {
        if (active) {
          setReport(reportResult.data);
          setHtml(htmlResult.data);
          setMessage(htmlResult.message ?? reportResult.message);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [id]);
  const focus = report.primary_root_cause ?? "N05";
  const focusNode = nodes.find((node) => node.id === focus)!;
  const exercises = useMemo(() => {
    const focused = fixtureExam.questions.filter(
      (question) => question.knowledge_node_id === focus,
    );
    return [
      ...focused,
      ...fixtureExam.questions.filter(
        (question) => question.knowledge_node_id !== focus,
      ),
    ].slice(0, 3);
  }, [focus]);
  return (
    <main className="document-route">
      <header className="document-toolbar no-print">
        <div>
          <h1>
            {report.primary_root_cause
              ? "ชีทซ่อมเสริมรายบุคคล"
              : "ชีทโจทย์ท้าทายรายบุคคล"}
          </h1>
          <p>
            {report.student.name} · จุดเน้น {focusNode.short_title}
          </p>
        </div>
        <Link to={`/students/${id}`}>กลับไปหน้ารายงาน</Link>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden="true" /> พิมพ์ / บันทึก PDF
        </Button>
      </header>
      <AsyncStatus message={message} kind="warning" />
      {html ? (
        <HtmlDocumentFrame
          html={html}
          title={`ใบงานของ ${report.student.name}`}
        />
      ) : (
        <section className="paper remedial-paper">
          <div className="school">
            <b>โรงเรียนวัดปัญญา</b>
            <h2>
              {report.primary_root_cause
                ? "ใบงานซ่อมเสริมรายบุคคล"
                : "แบบฝึกโจทย์ท้าทาย"}
            </h2>
            <p>
              {report.student.name} เลขที่ {report.student.student_number} ห้อง{" "}
              {report.student.room}
            </p>
          </div>
          <h3>เป้าหมายการเรียนรู้</h3>
          <p>
            จุดเน้น: <b>{focusNode.title}</b> ({focus})
          </p>
          <div className="micro-lesson">
            <h3>
              {report.primary_root_cause
                ? "บทเรียนสั้น 5 นาที"
                : "ภารกิจต่อยอด"}
            </h3>
            <p>{report.diagnosis}</p>
            <ol>
              {report.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <h3>แบบฝึกเน้นจุด (3 ข้อ)</h3>
          {exercises.map((question, index) => (
            <article className="practice" key={question.id}>
              <b>ข้อ {index + 1}.</b> {question.stem}
              <div>
                {question.choices.map((choice) => (
                  <span key={choice.id}>
                    {choice.id}. {choice.text}
                  </span>
                ))}
              </div>
              <p>
                แสดงวิธีทำ:
                _______________________________________________________
              </p>
            </article>
          ))}
          <h3>บันทึกครู</h3>
          <p>
            __________________________________________________________________
          </p>
        </section>
      )}
    </main>
  );
}
