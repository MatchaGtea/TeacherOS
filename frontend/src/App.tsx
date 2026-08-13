import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ExamProvider } from "./context/ExamContext";

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

export function App() {
  return (
    <ExamProvider>
      <Suspense
        fallback={
          <div className="route-loading" role="status">
            กำลังเปิดหน้า…
          </div>
        }
      >
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<ExamBuilderPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students/:id" element={<StudentReportPage />} />
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
            path="*"
            element={
              <main className="document-route">
                <h1>ไม่พบหน้าที่ต้องการ</h1>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </ExamProvider>
  );
}
