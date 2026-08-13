import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { AsyncStatus } from "../components/AsyncStatus";
import { Button } from "../components/Button";
import { useExam } from "../context/ExamContext";
import { nodes } from "../fixtures";
import type { QuizResult } from "../types";

export default function QuizPage() {
  const { exam, loading, statusMessage } = useExam();
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>();
  const unanswered = useMemo(
    () => exam.questions.filter((question) => !answers[question.id]).length,
    [answers, exam.questions],
  );
  const valid = name.trim().length > 0 && unanswered === 0 && !submitting;
  const submit = async () => {
    if (!valid) {
      setSubmitMessage(`กรอกชื่อและตอบให้ครบ ยังเหลือ ${unanswered} ข้อ`);
      return;
    }
    setSubmitting(true);
    const response = await api.score(name.trim(), exam, answers);
    setResult(response.data);
    setSubmitMessage(response.message);
    setSubmitting(false);
  };
  const retry = () => {
    setAnswers({});
    setResult(null);
    setSubmitMessage(undefined);
  };
  return (
    <>
      <header>
        <div>
          <h1>Online Quiz</h1>
          <p>
            {exam.title} · {exam.questions.length} ข้อ
          </p>
        </div>
      </header>
      <AsyncStatus
        message={loading ? "กำลังโหลดข้อสอบ…" : statusMessage}
        kind={statusMessage ? "warning" : "info"}
      />
      {result ? (
        <section className="panel result" aria-live="polite">
          <h2>
            ผลการทำแบบทดสอบ: {result.score}/{result.total} ({result.percentage}
            %)
          </h2>
          <p>
            <b>{result.student_name}</b> · {result.diagnosis}
          </p>
          <h3>ผลรายทักษะ</h3>
          <div className="result-mastery">
            {result.mastery.map((item) => (
              <div key={item.node_id}>
                <span>
                  {item.node_id}{" "}
                  {nodes.find((node) => node.id === item.node_id)?.short_title}
                </span>
                <b>{item.percentage}%</b>
                <small>
                  {item.status === "mastered"
                    ? "ชำนาญ"
                    : item.status === "developing"
                      ? "กำลังพัฒนา"
                      : "ต้องเสริม"}
                </small>
              </div>
            ))}
          </div>
          <AsyncStatus message={submitMessage} kind="warning" />
          <div className="result-actions">
            <Button kind="outline" onClick={retry}>
              ทำแบบทดสอบอีกครั้ง
            </Button>
            <Link className="button primary" to="/dashboard">
              ดูภาพรวมห้อง
            </Link>
          </div>
        </section>
      ) : (
        <form
          className="quiz"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="quiz-name">
            ชื่อผู้ทำแบบทดสอบ
            <input
              aria-label="ชื่อผู้ทำแบบทดสอบ"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="กรอกชื่อ-สกุล"
            />
          </label>
          <p className={unanswered ? "unanswered" : "complete"} role="status">
            {unanswered ? `ยังไม่ได้ตอบ ${unanswered} ข้อ` : "ตอบครบทุกข้อแล้ว"}
          </p>
          {exam.questions.map((question, index) => (
            <fieldset className="panel quiz-question" key={question.id}>
              <legend>
                ข้อ {index + 1}. {question.stem}
              </legend>
              <div className="choices">
                {question.choices.map((choice) => (
                  <label
                    className={
                      answers[question.id] === choice.id ? "chosen" : ""
                    }
                    key={choice.id}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={choice.id}
                      checked={answers[question.id] === choice.id}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: choice.id,
                        }))
                      }
                    />
                    {choice.id}. {choice.text}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <AsyncStatus message={submitMessage} kind="warning" />
          <Button type="submit" disabled={!valid}>
            {submitting ? "กำลังตรวจคำตอบ…" : "ส่งคำตอบ"}
          </Button>
        </form>
      )}
    </>
  );
}
