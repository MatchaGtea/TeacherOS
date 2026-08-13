import { ExternalLink, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiUrls } from "../api";
import { AsyncStatus } from "../components/AsyncStatus";
import { Button } from "../components/Button";
import { ExamPaper } from "../components/ExamPaper";
import { HtmlDocumentFrame } from "../components/HtmlDocumentFrame";
import { useExam } from "../context/ExamContext";

export default function PrintExamPage() {
  const { exam } = useExam();
  const [html, setHtml] = useState("");
  const [message, setMessage] = useState<string>();
  useEffect(() => {
    let active = true;
    api.html("/exports/exam").then((result) => {
      if (active) {
        setHtml(result.data);
        setMessage(result.message);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <main className="document-route">
      <header className="document-toolbar no-print">
        <div>
          <h1>พิมพ์กระดาษข้อสอบ</h1>
          <p>ข้อสอบสองคอลัมน์และเฉลยครูแยกหน้า</p>
        </div>
        <Link to="/">กลับหน้าสร้างข้อสอบ</Link>
        <a
          className="button outline"
          href={apiUrls.exam}
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
        <HtmlDocumentFrame html={html} title="ข้อสอบพร้อมเฉลยสำหรับพิมพ์" />
      ) : (
        <ExamPaper exam={exam} />
      )}
    </main>
  );
}
