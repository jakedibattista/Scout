export const shuttleBenchmarks = { elite: 4.0, good: 4.5 };
export const dashBenchmarks = { elite: 2.5, good: 2.7 };
export const wallBallBenchmarks = { elite: 80, good: 60 };

export function parseSeconds(value?: string | number | null) {
  if (typeof value === "number") return value;
  if (!value) return null;
  const normalized = String(value).replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatSeconds(value: number | null) {
  if (value === null) return "—";
  return `${value.toFixed(2)}s`;
}

export function formatCount(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value)}`;
}

export function getMetricValue(
  metrics: Record<string, string | number> | undefined,
  keys: string[]
) {
  if (!metrics) return null;
  for (const key of keys) {
    if (metrics[key] !== undefined) return metrics[key];
  }
  return null;
}

export function getShuttleGrade(totalSeconds: number | null) {
  if (totalSeconds === null) return { label: "Pending", color: "text-white/50" };
  if (totalSeconds < shuttleBenchmarks.elite) {
    return { label: "Elite", color: "text-emerald-300" };
  }
  if (totalSeconds <= shuttleBenchmarks.good) {
    return { label: "Good", color: "text-yellow-300" };
  }
  return { label: "Needs work", color: "text-red-300" };
}

export function getDashGrade(totalSeconds: number | null) {
  if (totalSeconds === null) return { label: "Pending", color: "text-white/50" };
  if (totalSeconds < dashBenchmarks.elite) {
    return { label: "Elite", color: "text-emerald-300" };
  }
  if (totalSeconds <= dashBenchmarks.good) {
    return { label: "Good", color: "text-yellow-300" };
  }
  return { label: "Needs work", color: "text-red-300" };
}

export function getWallBallGrade(reps: number | null) {
  if (reps === null) return { label: "Pending", color: "text-white/50" };
  if (reps >= wallBallBenchmarks.elite) {
    return { label: "Elite", color: "text-emerald-300" };
  }
  if (reps >= wallBallBenchmarks.good) {
    return { label: "Good", color: "text-yellow-300" };
  }
  return { label: "Needs work", color: "text-red-300" };
}
