import type { LocalDate } from "../types";

const ISTANBUL = "Europe/Istanbul";
const DAY_MS = 86_400_000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtcMs(date: LocalDate): number {
  const m = DATE_RE.exec(date);
  if (!m) throw new RangeError(`Invalid local date: ${date}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

function fromUtcMs(ms: number): LocalDate {
  const d = new Date(ms);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1, 2)}-${pad(d.getUTCDate(), 2)}`;
}

/** True for a real calendar day written as "YYYY-MM-DD" (rejects 2026-02-30). */
export function isValidLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== "string") return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1) return false;
  const d = new Date(toUtcMs(value));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/** The calendar day in Europe/Istanbul at the given instant (default: now). */
export function todayInIstanbul(now: Date = new Date()): LocalDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ISTANBUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return `${pad(get("year"), 4)}-${pad(get("month"), 2)}-${pad(get("day"), 2)}`;
}

/** Calendar arithmetic on local dates; n may be negative. */
export function addDays(date: LocalDate, n: number): LocalDate {
  return fromUtcMs(toUtcMs(date) + n * DAY_MS);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** The 7 days ending at `endDate` (inclusive), ascending. */
export function weekRange(endDate: LocalDate): LocalDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(endDate, i - 6));
}

/** Parts of a local date; weekday 0 = Sunday. */
export function dateParts(date: LocalDate): { year: number; month: number; day: number; weekday: number } {
  const d = new Date(toUtcMs(date));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay() };
}
