export const DOCUMENT_TYPES = [
  "INVOICE",
  "QUOTATION",
  "ESTIMATE",
  "RECEIPT",
  "PROFORMA",
  "CREDIT_NOTE",
  "PURCHASE_ORDER",
  "DELIVERY_NOTE",
  "STATEMENT",
] as const;

export type DocumentTypeKey = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUS = {
  QUOTATION: ["draft", "sent", "viewed", "accepted", "rejected", "expired"] as const,
  ESTIMATE: ["draft", "sent", "viewed", "accepted", "rejected", "expired"] as const,
  INVOICE: ["draft", "sent", "viewed", "partially_paid", "paid", "overdue", "cancelled"] as const,
  PROFORMA: ["draft", "sent", "viewed", "accepted", "cancelled"] as const,
  RECEIPT: ["issued", "cancelled"] as const,
  CREDIT_NOTE: ["draft", "issued", "cancelled"] as const,
  PURCHASE_ORDER: ["draft", "sent", "accepted", "cancelled"] as const,
  DELIVERY_NOTE: ["draft", "issued", "cancelled"] as const,
  STATEMENT: ["draft", "issued"] as const,
};

export const DEFAULT_PREFIX: Record<DocumentTypeKey, string> = {
  INVOICE: "INV",
  QUOTATION: "QT",
  ESTIMATE: "EST",
  RECEIPT: "REC",
  PROFORMA: "PI",
  CREDIT_NOTE: "CN",
  PURCHASE_ORDER: "PO",
  DELIVERY_NOTE: "DN",
  STATEMENT: "ST",
};

export const TEMPLATES = [
  { key: "classic", name: "Classic" },
  { key: "modern", name: "Modern" },
  { key: "minimal", name: "Minimal" },
  { key: "corporate", name: "Corporate" },
  { key: "construction", name: "Construction" },
  { key: "wholesale", name: "Wholesale" },
  { key: "professional", name: "Professional" },
] as const;

export function labelForDocumentType(type: DocumentTypeKey) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function invoiceStatusFromBalance(balanceDue: string, grandTotal: string, current: string) {
  if (current === "cancelled") return "cancelled";
  const balance = Number(balanceDue);
  const total = Number(grandTotal);
  if (total > 0 && balance <= 0) return "paid";
  if (balance > 0 && balance < total) return "partially_paid";
  return current === "draft" ? "draft" : current;
}
