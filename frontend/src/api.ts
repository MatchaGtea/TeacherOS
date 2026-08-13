import {
  fixtureAnalytics,
  fixtureExam,
  fixtureReport,
  scoreFixtureQuiz,
} from "./fixtures";
import type { Analytics, ApiResult, Exam, QuizResult, Report } from "./types";

const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const staticDemo = import.meta.env.VITE_STATIC_DEMO === "true";
const fallbackMessage =
  "Demo data · ใช้ข้อมูลตัวอย่างที่ตรวจสอบแล้ว";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, init);
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

async function safe<T>(
  path: string,
  fallback: T,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  if (staticDemo)
    return { data: fallback, source: "fallback", message: fallbackMessage };
  try {
    return { data: await request<T>(path, init), source: "live" };
  } catch {
    return { data: fallback, source: "fallback", message: fallbackMessage };
  }
}

export const api = {
  exam: () => safe<Exam>("/exams/demo", fixtureExam),
  generate: (mode: "fixture" | "ai") =>
    safe<Exam>(
      "/exams/generate",
      {
        ...fixtureExam,
        pipeline: {
          ...fixtureExam.pipeline,
          source: mode === "ai" ? "fallback" : "fixture",
          llm_status: mode === "ai" ? "fallback" : "not_requested",
          warning:
            mode === "ai"
              ? "AI ยังไม่พร้อม จึงใช้ชุดข้อสอบสำรองที่ตรวจสอบแล้ว"
              : undefined,
        },
      },
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grade: "ม.3",
          subject: "คณิตศาสตร์",
          topic: "สมการกำลังสองตัวแปรเดียว",
          question_count: 12,
          difficulty: "medium",
          mode,
        }),
      },
    ),
  analytics: () => safe<Analytics>("/classes/demo/analytics", fixtureAnalytics),
  report: (id: string) =>
    safe<Report>(`/students/${id}/report`, fixtureReport(id)),
  score: (studentName: string, exam: Exam, answers: Record<string, string>) =>
    safe<QuizResult>(
      "/attempts/score",
      scoreFixtureQuiz(studentName, exam, answers),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          student_name: studentName,
          exam_id: exam.id,
          answers,
        }),
      },
    ),
  html: async (path: string): Promise<ApiResult<string>> => {
    if (staticDemo)
      return { data: "", source: "fallback", message: fallbackMessage };
    try {
      const response = await fetch(`${base}${path}`);
      if (!response.ok) throw new Error(response.statusText);
      return { data: await response.text(), source: "live" };
    } catch {
      return { data: "", source: "fallback", message: fallbackMessage };
    }
  },
};

export const apiUrls = {
  // Static artifacts keep the public GitHub Pages demo useful without FastAPI.
  // The API-backed document routes remain available when running `make dev`.
  pp5: `${import.meta.env.BASE_URL}exports/teacheros-pp5-demo.xlsx`,
  exam: `${import.meta.env.BASE_URL}exports/exam.html`,
  paCar: `${import.meta.env.BASE_URL}exports/pa-car.html`,
};
