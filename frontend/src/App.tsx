import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ExamProvider } from "./context/ExamContext";
import { DocumentWorkspaceProvider } from "./documents/domain";

const ExamBuilderPage = lazy(() => import("./pages/ExamBuilderPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const StudentReportPage = lazy(() => import("./pages/StudentReportPage"));
const ExportsPage = lazy(() => import("./pages/ExportsPage"));
const PrintExamPage = lazy(() => import("./pages/PrintExamPage"));
const StudentReportPrintPage = lazy(
  () => import("./pages/StudentReportPrintPage"),
);
const RemedialPage = lazy(() => import("./pages/RemedialPage"));
const PaCarPage = lazy(() => import("./pages/PaCarPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const DocumentNewPage = lazy(() => import("./pages/DocumentNewPage"));
const DocumentDetailPage = lazy(() => import("./pages/DocumentDetailPage"));
const DocumentProcessPage = lazy(() => import("./pages/DocumentProcessPage"));
const DocumentPrintPage = lazy(() => import("./pages/DocumentPrintPage"));

export function App() {
  return (
    <ExamProvider>
      <DocumentWorkspaceProvider>
      <Suspense
        fallback={
          <div className="route-loading" role="status">
            กำลังเปิดหน้า…
          </div>
        }
      >
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/assessments" element={<ExamBuilderPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/new/:templateId" element={<DocumentNewPage />} />
            <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
            <Route path="/documents/:documentId/process" element={<DocumentProcessPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students/:id" element={<StudentReportPage />} />
            <Route path="/evidence" element={<ExportsPage />} />
            <Route path="/exports" element={<ExportsPage />} />
          </Route>
          <Route path="/print/exam" element={<PrintExamPage />} />
          <Route
            path="/students/:id/print"
            element={<StudentReportPrintPage />}
          />
          <Route path="/remedial/:id" element={<RemedialPage />} />
          <Route path="/print/pa-car" element={<PaCarPage />} />
          <Route
            path="/documents/:documentId/print/:partId"
            element={<DocumentPrintPage />}
          />
          <Route path="*" element={<main className="document-route not-found"><h1>ไม่พบหน้าที่ต้องการ</h1><Link to="/">กลับหน้าหลัก</Link></main>} />
        </Routes>
      </Suspense>
      </DocumentWorkspaceProvider>
    </ExamProvider>
  );
}
