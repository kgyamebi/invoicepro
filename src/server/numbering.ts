import type { DocumentType } from "@prisma/client";
import { prisma } from "./db";

function prefixFor(type: DocumentType, business: {
  invoicePrefix: string;
  quotationPrefix: string;
  receiptPrefix: string;
  estimatePrefix: string;
  proformaPrefix: string;
  creditNotePrefix: string;
  purchaseOrderPrefix: string;
  deliveryNotePrefix: string;
}) {
  switch (type) {
    case "INVOICE":
      return business.invoicePrefix;
    case "QUOTATION":
      return business.quotationPrefix;
    case "RECEIPT":
      return business.receiptPrefix;
    case "ESTIMATE":
      return business.estimatePrefix;
    case "PROFORMA":
      return business.proformaPrefix;
    case "CREDIT_NOTE":
      return business.creditNotePrefix;
    case "PURCHASE_ORDER":
      return business.purchaseOrderPrefix;
    case "DELIVERY_NOTE":
      return business.deliveryNotePrefix;
    default:
      return "DOC";
  }
}

export async function nextDocumentNumber(
  businessId: string,
  type: DocumentType,
  options?: { preferred?: string | null },
) {
  if (options?.preferred) {
    const existing = await prisma.document.findFirst({
      where: { businessId, type, number: options.preferred, deletedAt: null },
    });
    if (existing) {
      throw new Error("That document number is already in use.");
    }
    return options.preferred;
  }

  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const prefix = prefixFor(type, business);
  const year = business.yearlyResetNumbers ? new Date().getUTCFullYear() : 0;

  const sequence = await prisma.documentSequence.upsert({
    where: {
      businessId_type_year_prefix: {
        businessId,
        type,
        year,
        prefix,
      },
    },
    update: { nextNumber: { increment: 1 } },
    create: { businessId, type, year, prefix, nextNumber: 2 },
  });

  const value = sequence.nextNumber - 1;
  const padded = String(value).padStart(6, "0");
  return year > 0 ? `${prefix}-${year}-${padded}` : `${prefix}-${padded}`;
}
