import { nodes } from "../fixtures";
import type { Report } from "../types";
import { GrowthIndicator } from "./GrowthIndicator";

export function ReportDocument({ report }: { report: Report }) {
  return (
    <section className="paper report-document">
      <div className="school">
        <b>โรงเรียนวัดปัญญา</b>
        <h2>รายงานพัฒนาผู้เรียนรายบุคคล</h2>
      </div>
      <table className="simple identity-table">
        <tbody>
          <tr>
            <th>ชื่อ-สกุล</th>
            <td>{report.student.name}</td>
            <th>เลขที่</th>
            <td>{report.student.student_number}</td>
          </tr>
          <tr>
            <th>ห้อง</th>
            <td>{report.student.room}</td>
            <th>ผลล่าสุด</th>
            <td>
              {report.latest_score}/12 ({report.latest_percentage}%)
            </td>
          </tr>
        </tbody>
      </table>
      <h3>ผลการเรียนรู้</h3>
      <p>
        ระดับ: <b>{report.learning_level}</b> · การเติบโต:{" "}
        <GrowthIndicator value={report.growth} />
      </p>
      <table className="simple mastery-print">
        <thead>
          <tr>
            <th>ทักษะ</th>
            <th>ความชำนาญ</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {report.mastery.map((item) => (
            <tr key={item.node_id}>
              <td>
                {item.node_id}{" "}
                {nodes.find((node) => node.id === item.node_id)?.short_title}
              </td>
              <td>{item.percentage}%</td>
              <td>
                {item.status === "mastered"
                  ? "ชำนาญ"
                  : item.status === "developing"
                    ? "กำลังพัฒนา"
                    : "ต้องเสริม"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>การวินิจฉัย</h3>
      <p>{report.diagnosis}</p>
      <p>
        <b>สาเหตุราก:</b> {report.primary_root_cause ?? "ไม่พบจุดบกพร่องหลัก"}
      </p>
      <h3>ข้อเสนอแนะ</h3>
      <ol>
        {report.recommendations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
