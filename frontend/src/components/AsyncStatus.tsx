import { StatusPill } from "./DesignSystem";

export function AsyncStatus({
  message,
  kind = "info",
}: {
  message?: string;
  kind?: "info" | "warning" | "error";
}) {
  if (!message) return null;
  const isDemo =
    message.includes("ตัวอย่าง") || message.toLowerCase().includes("demo data");
  const tone = isDemo
    ? "neutral"
    : kind === "error"
      ? "error"
      : kind === "warning"
        ? "warning"
        : "success";
  return (
    <div
      className={`async-status ${isDemo ? "demo" : kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <StatusPill tone={tone}>{isDemo ? "Demo data" : kind}</StatusPill>
      <span>{isDemo ? "ข้อมูลตัวอย่างที่ตรวจสอบแล้ว" : message}</span>
    </div>
  );
}
