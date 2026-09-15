export const EMAIL_KINDS = [
  "welcome",
  "verification",
  "password_reset",
  "quote",
  "invoice",
  "receipt",
  "payment_received",
  "invoice_paid",
  "refund_issued",
  "subscription_activated",
  "subscription_renewed",
  "team_invite",
] as const;

export type EmailKind = (typeof EMAIL_KINDS)[number];

export const PDF_EMAIL_KINDS = new Set<EmailKind>(["quote", "invoice", "receipt"]);

export function emailKindForDocumentType(type: string): EmailKind {
  if (type === "RECEIPT") return "receipt";
  if (type === "QUOTATION" || type === "ESTIMATE") return "quote";
  return "invoice";
}
