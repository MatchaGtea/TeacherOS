import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { AsyncStatus } from "../components/AsyncStatus";
import { Button } from "../components/Button";
import { ReportDocument } from "../components/ReportDocument";
import { fixtureReport } from "../fixtures";
import type { Report } from "../types";

export default function StudentReportPrintPage() {
  const { id = "STU001" } = useParams();
  const [report, setReport] = useState<Report>(() => fixtureReport(id));
  const [message, setMessage] = useState<string>();
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
  return (
    <main className="document-route">
      <header className="document-toolbar no-print">
        <div>
          <h1>รายงานรายบุคคลสำหรับพิมพ์</h1>
          <p>{report.student.name}</p>
        </div>
        <Link to={`/students/${id}`}>กลับไปหน้ารายงาน</Link>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden="true" /> พิมพ์ / บันทึก PDF
        </Button>
      </header>
      <AsyncStatus message={message} kind="warning" />
      <ReportDocument report={report} />
    </main>
  );
}
