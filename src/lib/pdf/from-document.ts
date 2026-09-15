import { formatDate } from "@/lib/date";
import { renderDocumentPdf, type PdfDocument } from "@/lib/pdf/render";
import type { DocumentTypeKey } from "@/lib/documents/types";
import { resolvePdfPresentation } from "@/server/usage";

type MoneyLike = { toString(): string } | string | number | null | undefined;

function money(value: MoneyLike) {
  if (value === null || value === undefined) return "0";
  return String(value);
}

export type PdfSource = {
  type: string;
  number: string;
  status: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
  expiryDate?: Date | string | null;
  currencyCode: string;
  notes?: string | null;
  terms?: string | null;
  paymentTerms?: string | null;
  subtotal: MoneyLike;
  taxTotal: MoneyLike;
  shippingAmount: MoneyLike;
  documentDiscountAmount: MoneyLike;
  otherChargesAmount?: MoneyLike;
  grandTotal: MoneyLike;
  amountPaid: MoneyLike;
  balanceDue: MoneyLike;
  templateKey: string;
  customer?: PdfDocument["customer"];
  items: {
    name: string;
    description?: string | null;
    category?: string | null;
    quantity: MoneyLike;
    unit?: string | null;
    unitPrice: MoneyLike;
    lineTotal: MoneyLike;
    discountAmount?: MoneyLike;
  }[];
  business: {
    organizationId: string;
    dateFormat: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    countryCode?: string;
    taxId?: string | null;
    website?: string | null;
    paymentInstructions?: string | null;
    logoPath?: string | null;
    brandSettings?: { footerText?: string | null } | null;
    sellerPayMethods?: PdfDocument["sellerPayMethods"];
  };
};

export async function toPdfDocument(document: PdfSource): Promise<PdfDocument> {
  const presentation = await resolvePdfPresentation(document.business.organizationId, document.business.logoPath);
  const dateFormat = document.business.dateFormat;
  return {
    type: document.type as DocumentTypeKey,
    number: document.number,
    status: document.status,
    issueDate: formatDate(document.issueDate, dateFormat),
    dueDate: formatDate(document.dueDate, dateFormat),
    expiryDate: formatDate(document.expiryDate, dateFormat),
    currencyCode: document.currencyCode,
    notes: document.notes,
    terms: document.terms,
    paymentTerms: document.paymentTerms,
    subtotal: money(document.subtotal),
    taxTotal: money(document.taxTotal),
    shippingAmount: money(document.shippingAmount),
    documentDiscountAmount: money(document.documentDiscountAmount),
    otherChargesAmount: money(document.otherChargesAmount),
    grandTotal: money(document.grandTotal),
    amountPaid: money(document.amountPaid),
    balanceDue: money(document.balanceDue),
    templateKey: document.templateKey,
    footerText: document.business.brandSettings?.footerText,
    customer: document.customer,
    business: { ...document.business, logoPath: presentation.logoPath },
    items: document.items.map((item) => ({
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: money(item.quantity),
      unit: item.unit || "pcs",
      unitPrice: money(item.unitPrice),
      lineTotal: money(item.lineTotal),
      discountAmount: money(item.discountAmount),
    })),
    sellerPayMethods: document.business.sellerPayMethods,
    platformBrand: presentation.platformBrand,
  };
}

export async function renderLoadedDocumentPdf(document: PdfSource) {
  return renderDocumentPdf(await toPdfDocument(document));
}

export async function renderDocumentPdfAttachment(documentId: string) {
  const { prisma } = await import("@/server/db");
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      items: { orderBy: { position: "asc" } },
      customer: true,
      business: { include: { brandSettings: true, sellerPayMethods: true } },
    },
  });
  if (!document || document.deletedAt) return null;
  const buffer = await renderLoadedDocumentPdf(document);
  return {
    filename: `${document.number}.pdf`,
    content: Buffer.from(buffer),
    contentType: "application/pdf",
  };
}
