// Glass row of the water card.

/** One glass is 200 ml. */
export const GLASS_ML = 200;
/** More glasses than this do not fit; each glass then stands for goal / MAX_GLASSES. */
export const MAX_GLASSES = 12;

/** Size of one glass in ml: 200, or goal / 12 when the goal needs more than 12 glasses. */
export function glassSizeMl(goalMl: number): number {
  if (!Number.isFinite(goalMl) || goalMl <= 0) return GLASS_ML;
  return Math.ceil(goalMl / GLASS_ML) > MAX_GLASSES ? goalMl / MAX_GLASSES : GLASS_ML;
}

/** Fill level (0..1) of every glass for `waterMl` drunk against `goalMl`. At least one glass. */
export function glassFills(waterMl: number, goalMl: number): number[] {
  const size = glassSizeMl(goalMl);
  const goal = Number.isFinite(goalMl) && goalMl > 0 ? goalMl : GLASS_ML;
  const count = Math.max(1, Math.min(MAX_GLASSES, Math.ceil(goal / size - 1e-9)));
  const drunk = Number.isFinite(waterMl) ? Math.max(0, waterMl) : 0;
  return Array.from({ length: count }, (_, i) => Math.max(0, Math.min(1, (drunk - i * size) / size)));
}
