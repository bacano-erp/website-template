import type { BusinessBranch, BusinessWeekday } from "@bacano/sdk";

const WEEKDAYS: Record<BusinessWeekday, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export type OpeningHoursLine = { days: string; hours: string };

/**
 * A branch's weekly hours as lines to show, joining consecutive days with
 * the same hours: "Lunes a viernes · 9:00 – 18:00". A day without ranges is
 * closed. An empty list means the branch has no hours on record.
 */
export function openingHoursLines(
  branch: Pick<BusinessBranch, "openingHours">,
): OpeningHoursLine[] {
  if (branch.openingHours.length === 0) return [];
  const byDay = new Map<number, string>();
  for (let weekday = 1; weekday <= 7; weekday++) {
    const ranges = branch.openingHours
      .filter((range) => range.weekday === weekday)
      .map((range) => `${time(range.opensAt)} – ${time(range.closesAt)}`);
    byDay.set(weekday, ranges.length ? ranges.join(" y ") : "Cerrado");
  }

  const lines: OpeningHoursLine[] = [];
  let start = 1;
  for (let weekday = 2; weekday <= 8; weekday++) {
    if (weekday <= 7 && byDay.get(weekday) === byDay.get(start)) continue;
    const end = weekday - 1;
    const first = WEEKDAYS[start as BusinessWeekday];
    const last = WEEKDAYS[end as BusinessWeekday].toLowerCase();
    lines.push({
      days:
        start === end
          ? first
          : end === start + 1
            ? `${first} y ${last}`
            : `${first} a ${last}`,
      hours: byDay.get(start) ?? "Cerrado",
    });
    start = weekday;
  }
  return lines;
}

/** "09:00" → "9:00". */
function time(value: string) {
  return value.replace(/^0(\d)/, "$1");
}
