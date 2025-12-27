import { format, isBefore, parseISO, startOfDay } from "date-fns";

export function isoDate(d) {
  return format(d, "yyyy-MM-dd");
}

export function isOverdue(scheduledDateIso, status) {
  if (!scheduledDateIso) return false;
  if (status === "repaired" || status === "scrap") return false;
  return isBefore(parseISO(scheduledDateIso), startOfDay(new Date()));
}
