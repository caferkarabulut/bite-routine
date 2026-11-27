// Large title of the Today screen: "Bugün" for today, "Dün" for yesterday, otherwise the weekday name.
import { addDays } from "../../domain";
import type { LocalDate } from "../../types";

export type DayTitleKind = "today" | "yesterday" | "weekday";

export function dayTitleKind(date: LocalDate, today: LocalDate): DayTitleKind {
  if (date === today) return "today";
  if (date === addDays(today, -1)) return "yesterday";
  return "weekday";
}
