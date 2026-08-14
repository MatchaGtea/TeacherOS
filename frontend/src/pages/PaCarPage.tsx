import { ExternalLink, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiUrls } from "../api";
import { AsyncStatus } from "../components/AsyncStatus";
import { Button } from "../components/Button";
import { HtmlDocumentFrame } from "../components/HtmlDocumentFrame";
import { fixtureAnalytics } from "../fixtures";

export default function PaCarPage() {
  const [html, setHtml] = useState("");
  const [message, setMessage] = useState<string>();
  useEffect(() => {
    let active = true;
    api.html("/exports/pa-car").then((result) => {
      if (active) {
        setHtml(result.data);
        setMessage(result.message);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const growth =
    Math.round(
      (fixtureAnalytics.class_average - fixtureAnalytics.previous_average) * 10,
    ) / 10;
  return (
    <main className="document-route">
      <header className="document-toolbar no-print">
        <div>
          <h1>แฟ้มหลักฐาน PA / CAR</h1>
          <p>แฟ้มหลักฐานการประเมินพร้อมพิมพ์จากข้อมูลชั้น ม.3/2</p>
        </div>
        <Link to="/evidence">กลับศูนย์หลักฐานการประเมิน</Link>
        <a
          className="button outline"
          href={apiUrls.paCar}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink aria-hidden="true" /> เปิดเอกสารจากระบบ
        </a>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden="true" /> พิมพ์ / บันทึก PDF
        </Button>
      </header>
      <AsyncStatus message={message} kind="warning" />
      {html ? (
        <HtmlDocumentFrame html={html} title="รายงานหลักฐาน PA/CAR" />
      ) : (
        <section className="paper pa-car-paper">
          <div className="school">
            <b>โรงเรียนวัดปัญญา</b>
            <h2>รายงานหลักฐานผลการพัฒนางาน (PA/CAR)</h2>
            <p>กลุ่มสาระการเรียนรู้คณิตศาสตร์ · ชั้น ม.3/2 · 30 คน</p>
          </div>
          <h3>1. ผลการเปรียบเทียบก่อนและหลังเรียน</h3>
          <div className="comparison">
            <section>
              <small>ก่อนเรียน</small>
              <strong>{fixtureAnalytics.previous_average}%</strong>
            </section>
            <section>
              <small>หลังเรียน</small>
              <strong>{fixtureAnalytics.class_average}%</strong>
            </section>
            <section>
              <small>การเปลี่ยนแปลง</small>
              <strong>+{growth} จุด</strong>
            </section>
          </div>
          <h3>2. ผลสัมฤทธิ์ตามตัวชี้วัด</h3>
          {fixtureAnalytics.node_summary.map((item) => (
            <div className="evidence-bar" key={item.node.id}>
              <span>
                {item.node.id} {item.node.short_title}
              </span>
              <div>
                <i style={{ width: `${item.average_percentage}%` }} />
              </div>
              <b>{item.average_percentage}%</b>
            </div>
          ))}
          <h3>3. สรุปและการดำเนินการต่อไป</h3>
          <p>
            <b>ประเด็นเร่งด่วน:</b> {fixtureAnalytics.insight.headline} (
            {fixtureAnalytics.insight.focus_node_id})
          </p>
          <p>
            ครูจะจัดกลุ่มผู้เรียนตามหลักฐานคำตอบผิด ใช้แบบฝึกสั้นทีละขั้น
            และประเมินซ้ำหลังการสอนเสริม
          </p>
        </section>
      )}
    </main>
  );
}
