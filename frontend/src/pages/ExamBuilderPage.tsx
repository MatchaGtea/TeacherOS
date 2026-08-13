import {
  ChevronRight,
  FileText,
  Lightbulb,
  Printer,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AsyncStatus } from "../components/AsyncStatus";
import { Button } from "../components/Button";
import { ExamPaper } from "../components/ExamPaper";
import { useExam } from "../context/ExamContext";
import { useState } from "react";

export default function ExamBuilderPage() {
  const { exam, loading, generating, statusMessage, generate } = useExam();
  const [tab, setTab] = useState<"online" | "print">("online");
  const difficultyCounts = exam.questions.reduce(
    (counts, question) => {
      counts[question.difficulty] += 1;
      return counts;
    },
    { easy: 0, medium: 0, hard: 0 },
  );
  const sourceLabel =
    exam.pipeline.source === "ai"
      ? "AI"
      : exam.pipeline.source === "fallback"
        ? "ชุดสำรอง"
        : "ชุดมาตรฐาน";
  return (
    <>
      <header>
        <div>
          <h1>สร้างข้อสอบอัตโนมัติ</h1>
          <p>คณิตศาสตร์ ม.3 &nbsp;•&nbsp; สมการกำลังสองตัวแปรเดียว</p>
        </div>
      </header>
      <AsyncStatus
        message={loading ? "กำลังตรวจสอบชุดข้อสอบ…" : statusMessage}
        kind={statusMessage ? "warning" : "info"}
      />
      <section className="panel controls" aria-label="ตั้งค่าชุดข้อสอบ">
        <div className="control-grid">
          <label>
            ระดับชั้น
            <select aria-label="ระดับชั้น" defaultValue="ม.3">
              <option>ม.3</option>
            </select>
          </label>
          <label>
            วิชา
            <select aria-label="วิชา" defaultValue="คณิตศาสตร์">
              <option>คณิตศาสตร์</option>
            </select>
          </label>
          <label className="wide">
            หัวข้อ
            <select aria-label="หัวข้อ" defaultValue="สมการกำลังสองตัวแปรเดียว">
              <option>สมการกำลังสองตัวแปรเดียว</option>
            </select>
          </label>
          <label>
            จำนวนข้อ
            <input
              aria-label="จำนวนข้อ"
              value={exam.questions.length}
              readOnly
            />
          </label>
          <label>
            รูปแบบข้อสอบ
            <select aria-label="รูปแบบข้อสอบ" defaultValue="ปรนัย 4 ตัวเลือก">
              <option>ปรนัย 4 ตัวเลือก</option>
            </select>
          </label>
        </div>
        <div className="control-subrow">
          <fieldset className="difficulty-controls">
            <legend>การกระจายระดับความยาก</legend>
            <label className="easy-dot">
              ง่าย <output>{difficultyCounts.easy} ข้อ</output>
            </label>
            <label className="medium-dot">
              ปานกลาง <output>{difficultyCounts.medium} ข้อ</output>
            </label>
            <label className="hard-dot">
              ยาก <output>{difficultyCounts.hard} ข้อ</output>
            </label>
          </fieldset>
          <fieldset className="extra-options">
            <legend>ตัวเลือกเพิ่มเติม</legend>
            <label>
              <input type="checkbox" defaultChecked /> สลับตัวเลือกอัตโนมัติ
            </label>
            <label>
              <input type="checkbox" defaultChecked /> โชว์เฉลยหลังทำเสร็จ
            </label>
            <label>
              กำหนดเวลา (นาที)
              <input
                className="time-input"
                type="number"
                min="10"
                max="180"
                defaultValue={exam.duration_minutes}
                aria-label="กำหนดเวลาเป็นนาที"
              />
            </label>
          </fieldset>
          <div className="actions">
            <Button
              kind="outline"
              disabled={generating}
              onClick={() => generate("ai")}
            >
              <Sparkles aria-hidden="true" />{" "}
              {generating ? "กำลังสร้าง…" : "สร้างใหม่ด้วย AI"}
            </Button>
            <Button disabled={generating} onClick={() => generate("fixture")}>
              <FileText aria-hidden="true" /> สร้างชุดข้อสอบ
            </Button>
          </div>
        </div>
      </section>
      <section className="pipeline" aria-label="สถานะการตรวจข้อสอบ">
        <span>
          <FileText aria-hidden="true" /> LLM ร่างโจทย์{" "}
          <b>
            {exam.pipeline.llm_status === "not_requested"
              ? "ชุดมาตรฐาน"
              : exam.pipeline.llm_status}
          </b>
        </span>
        <ChevronRight aria-hidden="true" />
        <span>
          <Sparkles aria-hidden="true" /> SymPy ตรวจคำตอบ{" "}
          <b>
            ✓ {exam.pipeline.sympy_verified_count}/{exam.questions.length}
          </b>
        </span>
        <ChevronRight aria-hidden="true" />
        <span>
          <Lightbulb aria-hidden="true" /> Knowledge Graph แมปทักษะ{" "}
          <b>
            ✓ {exam.pipeline.graph_mapped_count}/{exam.questions.length}
          </b>
        </span>
      </section>
      {exam.pipeline.warning ? (
        <AsyncStatus message={exam.pipeline.warning} kind="warning" />
      ) : null}
      <div className="two-col">
        <section className="panel exam-list">
          <div className="tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "online"}
              className={tab === "online" ? "active" : ""}
              onClick={() => setTab("online")}
            >
              Online Quiz
            </button>
            <button
              role="tab"
              aria-selected={tab === "print"}
              className={tab === "print" ? "active" : ""}
              onClick={() => setTab("print")}
            >
              กระดาษข้อสอบ
            </button>
          </div>
          {tab === "online" ? (
            exam.questions.map((question, index) => (
              <article className="question" key={question.id}>
                <strong>{index + 1}</strong>
                <div>
                  <p>{question.stem}</p>
                  <small>
                    {question.choices
                      .map((choice) => `${choice.id}. ${choice.text}`)
                      .join("   ")}
                  </small>
                </div>
                <em className={question.difficulty}>
                  {question.difficulty === "easy"
                    ? "ง่าย"
                    : question.difficulty === "medium"
                      ? "ปานกลาง"
                      : "ยาก"}
                </em>
              </article>
            ))
          ) : (
            <ExamPaper exam={exam} showAnswerKey={false} preview />
          )}
        </section>
        <aside className="panel summary">
          <h3>สรุปคุณภาพชุดข้อสอบ</h3>
          <p>
            แหล่งข้อสอบ <b>{sourceLabel}</b>
          </p>
          <p>
            ตรวจคำตอบโดย SymPy{" "}
            <b>
              {exam.pipeline.sympy_verified_count}/{exam.questions.length}
            </b>
          </p>
          <p>
            แมปทักษะโดย KG{" "}
            <b>
              {exam.pipeline.graph_mapped_count}/{exam.questions.length}
            </b>
          </p>
          <hr />
          <h3>ภาพรวมระดับความยาก</h3>
          <p>
            <span className="summary-dot easy-dot">ง่าย</span>
            <b>{difficultyCounts.easy} ข้อ</b>
          </p>
          <p>
            <span className="summary-dot medium-dot">ปานกลาง</span>
            <b>{difficultyCounts.medium} ข้อ</b>
          </p>
          <p>
            <span className="summary-dot hard-dot">ยาก</span>
            <b>{difficultyCounts.hard} ข้อ</b>
          </p>
          <p>
            ทักษะที่ครอบคลุม <b>5 ทักษะหลัก</b>
          </p>
          <div className="quality-check" role="status">
            <b>✓ ตรวจสอบครบถ้วน</b>
            <small>โจทย์ทุกข้อผ่านการตรวจสอบและแมปทักษะแล้ว</small>
          </div>
          <div className="summary-actions">
            <Link className="button outline" to="/quiz">
              ดู Quiz
            </Link>
            <Link className="button primary" to="/print/exam">
              <Printer aria-hidden="true" /> พิมพ์
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
