export function whatsappShareUrl(phone: string | null | undefined, message: string) {
  const cleaned = (phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(message);
  return cleaned ? `https://wa.me/${cleaned}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function documentWhatsAppMessage(input: {
  customerName: string;
  documentLabel: string;
  number: string;
  total: string;
  validUntil?: string | null;
  viewUrl: string;
}) {
  return [
    `Hello ${input.customerName},`,
    "",
    `Please find ${input.documentLabel.toLowerCase()} ${input.number}.`,
    `Total: ${input.total}`,
    input.validUntil ? `Valid until: ${input.validUntil}` : "",
    "",
    `View: ${input.viewUrl}`,
    "",
    "Thank you.",
  ]
    .filter(Boolean)
    .join("\n");
}
