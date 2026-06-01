/** Single source of truth for the drill types supported across the app. */

export const ALLOWED_DRILLS = ["wall_ball", "dash_20", "shuttle_5_10_5"] as const;

export type DrillType = (typeof ALLOWED_DRILLS)[number];

const allowedDrillSet = new Set<string>(ALLOWED_DRILLS);

export function isDrillType(value: unknown): value is DrillType {
  return typeof value === "string" && allowedDrillSet.has(value);
}
