export function GrowthIndicator({
  value,
  withLabel = false,
}: {
  value: number;
  withLabel?: boolean;
}) {
  if (value === 0)
    return (
      <span
        className="growth-indicator neutral"
        aria-label="คะแนนไม่เปลี่ยนแปลง"
      >
        —{withLabel ? " ไม่เปลี่ยนแปลง" : ""}
      </span>
    );
  const positive = value > 0;
  return (
    <span
      className={`growth-indicator ${positive ? "up" : "down"}`}
      aria-label={`${positive ? "คะแนนเพิ่ม" : "คะแนนลด"} ${Math.abs(value)} คะแนน`}
    >
      {positive ? "↑" : "↓"} {Math.abs(value)}
      {withLabel ? " คะแนน" : ""}
    </span>
  );
}
