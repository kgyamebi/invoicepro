import { statusLabel } from "@/lib/documents/status-label";
import { getCurrency } from "@/lib/money/currency";
import { Decimal, d } from "@/lib/money/decimal";

export const PDF_RENDER_VERSION = 4;

export type PdfKind = "invoice" | "receipt" | "quote" | "other";

export type PdfTheme = {
  accent: string;
  accentSoft: string;
  ink: string;
  muted: string;
  line: string;
  tableHeader: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  surface: string;
  filledTableHeader: boolean;
  leftRail: boolean;
  ruleHeight: number;
  partyFill: boolean;
  compact: boolean;
  pagePadding: number;
};

const INK = {
  ink: "#0A2540",
  muted: "#697386",
  line: "#E6EBF1",
  success: "#0E9F6E",
  successSoft: "#E6F9F1",
  danger: "#DF1B41",
  dangerSoft: "#FDE8EC",
  surface: "#F7F8FA",
} as const;

export function pdfKind(type: string): PdfKind {
  if (type === "INVOICE") return "invoice";
  if (type === "RECEIPT") return "receipt";
  if (type === "QUOTATION" || type === "ESTIMATE") return "quote";
  return "other";
}

export function pdfTheme(templateKey?: string | null): PdfTheme {
  const key = (templateKey || "classic").toLowerCase();
  if (key === "minimal") {
    return {
      ...INK,
      accent: "#0A2540",
      accentSoft: "#EEF1F6",
      tableHeader: "#0A2540",
      filledTableHeader: false,
      leftRail: false,
      ruleHeight: 0.75,
      partyFill: false,
      compact: false,
      pagePadding: 48,
    };
  }
  if (key === "corporate") {
    return {
      ...INK,
      accent: "#0A2540",
      accentSoft: "#EEF1F6",
      tableHeader: "#0A2540",
      filledTableHeader: true,
      leftRail: false,
      ruleHeight: 8,
      partyFill: true,
      compact: true,
      pagePadding: 40,
    };
  }
  if (key === "modern") {
    return {
      ...INK,
      accent: "#0A5FFF",
      accentSoft: "#E8F0FF",
      tableHeader: "#0A5FFF",
      filledTableHeader: false,
      leftRail: true,
      ruleHeight: 0,
      partyFill: true,
      compact: false,
      pagePadding: 48,
    };
  }
  if (key === "construction") {
    return {
      ...INK,
      accent: "#0A5FFF",
      accentSoft: "#E8F0FF",
      tableHeader: "#0A2540",
      filledTableHeader: true,
      leftRail: false,
      ruleHeight: 6,
      partyFill: true,
      compact: false,
      pagePadding: 40,
    };
  }
  if (key === "wholesale") {
    return {
      ...INK,
      accent: "#0A5FFF",
      accentSoft: "#E8F0FF",
      tableHeader: "#0A5FFF",
      filledTableHeader: true,
      leftRail: false,
      ruleHeight: 2,
      partyFill: false,
      compact: true,
      pagePadding: 36,
    };
  }
  if (key === "professional") {
    return {
      ...INK,
      accent: "#0A5FFF",
      accentSoft: "#F4F8FF",
      tableHeader: "#0A5FFF",
      filledTableHeader: false,
      leftRail: false,
      ruleHeight: 1.25,
      partyFill: true,
      compact: false,
      pagePadding: 50,
    };
  }
  return {
    ...INK,
    accent: "#0A5FFF",
    accentSoft: "#E8F0FF",
    tableHeader: "#0A5FFF",
    filledTableHeader: true,
    leftRail: false,
    ruleHeight: 2.5,
    partyFill: true,
    compact: false,
    pagePadding: 44,
  };
}

export function isZeroMoney(value: string | null | undefined) {
  try {
    return !d(value || 0).gt(0);
  } catch {
    return true;
  }
}

export function formatPdfQuantity(quantity: string, unit?: string | null) {
  const n = Number(quantity);
  const shown = Number.isFinite(n) && Number.isInteger(n) ? String(n) : quantity;
  return unit ? `${shown} ${unit}` : shown;
}

/** Helvetica cannot draw GH₵ / ₦ / ₹. ISO codes stay print-safe. */
export function formatPdfMoney(amount: string | number, currencyCode: string) {
  const currency = getCurrency(currencyCode);
  const value = new Decimal(amount || 0);
  const negative = value.isNegative();
  const fixed = value.abs().toFixed(currency.decimalPlaces);
  const [whole, fraction = ""] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandSeparator);
  const decimals = currency.decimalPlaces === 0 ? grouped : `${grouped}${currency.decimalSeparator}${fraction}`;
  const signed = negative ? `-${decimals}` : decimals;
  if (/[^\x00-\xFF]/.test(currency.symbol)) {
    return `${currency.code} ${signed}`;
  }
  return currency.symbolPosition === "after" ? `${signed} ${currency.symbol}` : `${currency.symbol}${signed}`;
}

export function pdfStatusColors(status: string, theme: PdfTheme) {
  const tone = status.trim().toLowerCase();
  if (["paid", "issued", "accepted"].includes(tone)) {
    return { bg: theme.successSoft, fg: theme.success };
  }
  if (["overdue", "rejected", "cancelled", "expired"].includes(tone)) {
    return { bg: theme.dangerSoft, fg: theme.danger };
  }
  if (["partially_paid"].includes(tone)) {
    return { bg: "#FFF6E5", fg: "#C9780C" };
  }
  return { bg: theme.accentSoft, fg: theme.accent };
}

export function pdfStatusText(status: string) {
  return statusLabel(status);
}

export function compactAddress(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part && part.length > 0));
}

export function pdfFilename(type: string, number: string) {
  const slug = type.toLowerCase().replaceAll("_", "-");
  const safe = number.replace(/["\\/:*?<>|]+/g, "").trim() || "document";
  return `${slug}-${safe}.pdf`;
}
