import type { Exam } from "../types";

export function ExamPaper({
  exam,
  showAnswerKey = true,
  preview = false,
}: {
  exam: Exam;
  showAnswerKey?: boolean;
  preview?: boolean;
}) {
  return (
    <div className={preview ? "paper-preview" : ""}>
      <section className="paper exam-paper">
        <div className="school">
          <b>โรงเรียนวัดปัญญา</b>
          <h2>{exam.title}</h2>
          <p>
            {exam.subject} {exam.grade} · เรื่อง {exam.topic} · เวลา{" "}
            {exam.duration_minutes} นาที · {exam.total_points} คะแนน
          </p>
        </div>
        <div className="student-fields">
          ชื่อ-สกุล ______________________________ เลขที่ ______ ห้อง ______
        </div>
        <div className="instructions">
          <b>คำชี้แจง</b>
          <ol>
            <li>เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว</li>
            <li>แสดงวิธีคิดเมื่อครูกำหนด และตรวจชื่อ เลขที่ ห้องก่อนส่ง</li>
          </ol>
        </div>
        <div className="print-questions">
          {exam.questions.map((question, index) => (
            <article key={question.id}>
              <b>{index + 1}.</b> {question.stem}
              <div>
                {question.choices.map((choice) => (
                  <span key={choice.id}>
                    {choice.id}. {choice.text}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      {showAnswerKey ? (
        <section className="paper answer-key-page">
          <div className="school">
            <b>เฉลยสำหรับครู</b>
            <h2>{exam.title}</h2>
            <p>เอกสารหน้านี้ไม่แจกนักเรียน</p>
          </div>
          <table className="simple">
            <thead>
              <tr>
                <th>ข้อ</th>
                <th>คำตอบ</th>
                <th>แนวคิด</th>
              </tr>
            </thead>
            <tbody>
              {exam.questions.map((question, index) => (
                <tr key={question.id}>
                  <td>{index + 1}</td>
                  <td>{question.correct_choice_id}</td>
                  <td>{question.solution_explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
