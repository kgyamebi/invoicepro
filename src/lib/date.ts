import { format } from "date-fns";

export function formatDate(value: Date | string | null | undefined, pattern = "DD/MM/YYYY") {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  const map: Record<string, string> = {
    "DD/MM/YYYY": "dd/MM/yyyy",
    "MM/DD/YYYY": "MM/dd/yyyy",
    "YYYY-MM-DD": "yyyy-MM-dd",
    "DD.MM.YYYY": "dd.MM.yyyy",
  };
  return format(date, map[pattern] || "dd/MM/yyyy");
}

export function todayInput() {
  return format(new Date(), "yyyy-MM-dd");
}
