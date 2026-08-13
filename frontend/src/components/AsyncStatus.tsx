export function AsyncStatus({
  message,
  kind = "info",
}: {
  message?: string;
  kind?: "info" | "warning" | "error";
}) {
  if (!message) return null;
  return (
    <p
      className={`async-status ${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}
