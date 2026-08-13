import { ChevronRight, Lightbulb } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { AsyncStatus } from "../components/AsyncStatus";
import { GrowthIndicator } from "../components/GrowthIndicator";
import { fixtureAnalytics, nodes } from "../fixtures";
import type { Analytics, Mastery } from "../types";

const statusLabel: Record<Mastery["status"], string> = {
  mastered: "ชำนาญ",
  developing: "กำลังพัฒนา",
  critical: "ต้องเสริม",
};
const statusShort: Record<Mastery["status"], string> = {
  mastered: "ดี",
  developing: "พัฒนา",
  critical: "เสริม",
};

type StatusDistribution =
  Analytics["node_summary"][number]["status_distribution"];

export function normalizeStatusDistribution(counts: StatusDistribution) {
  const studentCount =
    counts.mastered + counts.developing + counts.critical || 1;

  return {
    mastered: (counts.mastered / studentCount) * 100,
    developing: (counts.developing / studentCount) * 100,
    critical: (counts.critical / studentCount) * 100,
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<Analytics>(fixtureAnalytics);
  const [message, setMessage] = useState<string | undefined>(
    "กำลังโหลดภาพรวมห้อง…",
  );
  useEffect(() => {
    let active = true;
    api.analytics().then((result) => {
      if (active) {
        setData(result.data);
        setMessage(result.message);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const chartData = useMemo(
    () =>
      data.node_summary.map((item) => {
        const percentages = normalizeStatusDistribution(
          item.status_distribution,
        );
        return {
          node: item.node.id,
          ...percentages,
          counts: item.status_distribution,
        };
      }),
    [data.node_summary],
  );
  return (
    <>
      <header className="rowhead">
        <div>
          <h1>ภาพรวมห้อง {data.room}</h1>
          <p>{data.exam_title}</p>
        </div>
        <select aria-label="เลือกห้อง" defaultValue="ม.3/2">
          <option>ม.3/2</option>
        </select>
      </header>
      <AsyncStatus
        message={message}
        kind={message?.includes("ตัวอย่าง") ? "warning" : "info"}
      />
      <div className="dashboard-grid">
        <section>
          <div className="heatmap-title">
            <h2>แผนที่ความเข้าใจรายทักษะ (Misconception Heatmap)</h2>
            <div className="heat-legend" aria-label="คำอธิบายสถานะ">
              <span className="mastered">ชำนาญ</span>
              <span className="developing">กำลังพัฒนา</span>
              <span className="critical">ต้องเสริม</span>
            </div>
          </div>
          <div className="heatmap">
            <table className="heatmap-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>นักเรียน ({data.students.length} คน)</th>
                  {nodes.map((node) => (
                    <th key={node.id}>{node.id}</th>
                  ))}
                  <th>
                    คะแนน
                    <br />({data.students[0]?.total ?? 12})
                  </th>
                  <th>Growth</th>
                  <th>
                    <span className="sr-only">เปิดรายงาน</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((row, index) => (
                  <tr key={row.student.id}>
                    <td>{index + 1}</td>
                    <td>
                      <Link
                        className="student-link"
                        to={`/students/${row.student.id}`}
                      >
                        {row.student.name}
                      </Link>
                    </td>
                    {row.mastery.map((item) => (
                      <td
                        key={item.node_id}
                        className={`heat ${item.status}`}
                        title={`${item.node_id}: ${statusLabel[item.status]} ${item.percentage}%`}
                      >
                        <span className="heat-short" aria-hidden="true">
                          {statusShort[item.status]}
                        </span>
                        <span className="sr-only">
                          {item.node_id} {statusLabel[item.status]}{" "}
                          {item.percentage}%
                        </span>
                      </td>
                    ))}
                    <td>{row.score}</td>
                    <td>
                      <GrowthIndicator value={row.growth} />
                    </td>
                    <td>
                      <Link
                        className="row-link"
                        aria-label={`เปิดรายงานของ ${row.student.name}`}
                        to={`/students/${row.student.id}`}
                      >
                        <ChevronRight aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">คลิกชื่อนักเรียนเพื่อดูรายงานรายบุคคล</p>
        </section>
        <aside className="rail">
          <section className="panel">
            <h3>ระดับความเข้าใจรายทักษะ</h3>
            <div className="stack-legend" aria-hidden="true">
              <span className="mastered">ชำนาญ</span>
              <span className="developing">กำลังพัฒนา</span>
              <span className="critical">ต้องเสริม</span>
            </div>
            <div
              className="mastery-chart"
              aria-label="กราฟแท่งซ้อนร้อยละ 100 แสดงสถานะความเข้าใจของนักเรียน 30 คนในแต่ละทักษะ"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ left: 0, right: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis dataKey="node" type="category" width={38} />
                  <Tooltip
                    formatter={(value, name, item) => {
                      const status = String(name) as Mastery["status"];
                      const count = item.payload?.counts?.[status] ?? 0;
                      return [
                        `${Number(value).toFixed(0)}% (${count} คน)`,
                        statusLabel[status],
                      ];
                    }}
                  />
                  <Bar dataKey="mastered" stackId="status" fill="#15965b" />
                  <Bar dataKey="developing" stackId="status" fill="#f7ad11" />
                  <Bar dataKey="critical" stackId="status" fill="#ef4050" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="sr-only">
              {chartData.map((item) => (
                <li key={item.node}>
                  {item.node}: ชำนาญ {item.counts.mastered} คน, กำลังพัฒนา{" "}
                  {item.counts.developing} คน, ต้องเสริม {item.counts.critical}{" "}
                  คน
                </li>
              ))}
            </ul>
          </section>
          <section className="panel insight">
            <Lightbulb aria-hidden="true" />
            <h3>ควรเน้นไปสอนอะไร</h3>
            <h2>{data.insight.headline}</h2>
            <p>{data.insight.recommendation}</p>
            <Link
              className="button outline"
              to={`/remedial/${data.flagged_students[0]?.student_id ?? "STU001"}`}
            >
              ดูรายละเอียดแผนสอน
            </Link>
          </section>
          <section className="panel">
            <h3>นักเรียนที่ควรติดตาม</h3>
            {data.flagged_students.slice(0, 5).map((student) => (
              <article className="flag" key={student.student_id}>
                <div>
                  <Link to={`/students/${student.student_id}`}>
                    {student.name}
                  </Link>
                  <small>{student.reason}</small>
                </div>
                <span>
                  {student.score}/12
                  <br />
                  <GrowthIndicator value={student.growth} />
                </span>
              </article>
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}
