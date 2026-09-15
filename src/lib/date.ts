import { format } from "date-fns";

export function formatDate(value: Date | string | null | undefined, pattern = "DD/MM/YYYY") {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
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

export function toInputDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
}

export function addDaysInput(days: number, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return format(date, "yyyy-MM-dd");
}

/** Net 14 / 30 days → due date. Defaults to 14 days when terms have no explicit period. */
export function dueDateFromPaymentTerms(paymentTerms: string | null | undefined, issueDate = new Date()) {
  const text = paymentTerms || "";
  const match =
    text.match(/\b(?:net|due(?:\s+in)?)\s*(\d{1,3})\b/i) || text.match(/\b(\d{1,3})\s*days?\b/i);
  const days = match ? Math.min(365, Math.max(1, Number(match[1]))) : 14;
  const due = new Date(issueDate);
  due.setUTCDate(due.getUTCDate() + days);
  return due;
}
