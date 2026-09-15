import { formatDate } from "@/lib/date";
import { renderDocumentPdf } from "@/lib/pdf/render";
import { prisma } from "@/server/db";
import { resolvePdfPresentation } from "@/server/usage";

export async function renderDocumentPdfAttachment(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      items: true,
      customer: true,
      business: { include: { brandSettings: true, sellerPayMethods: true } },
    },
  });
  if (!document || document.deletedAt) return null;
  const presentation = await resolvePdfPresentation(document.business.organizationId, document.business.logoPath);
  const buffer = await renderDocumentPdf({
    type: document.type,
    number: document.number,
    status: document.status,
    issueDate: formatDate(document.issueDate, document.business.dateFormat),
    dueDate: formatDate(document.dueDate, document.business.dateFormat),
    expiryDate: formatDate(document.expiryDate, document.business.dateFormat),
    currencyCode: document.currencyCode,
    notes: document.notes,
    terms: document.terms,
    paymentTerms: document.paymentTerms,
    subtotal: document.subtotal.toString(),
    taxTotal: document.taxTotal.toString(),
    shippingAmount: document.shippingAmount.toString(),
    documentDiscountAmount: document.documentDiscountAmount.toString(),
    grandTotal: document.grandTotal.toString(),
    amountPaid: document.amountPaid.toString(),
    balanceDue: document.balanceDue.toString(),
    templateKey: document.templateKey,
    customer: document.customer,
    business: { ...document.business, logoPath: presentation.logoPath },
    items: document.items.map((item) => ({
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
    })),
    sellerPayMethods: document.business.sellerPayMethods,
    platformBrand: presentation.platformBrand,
  });
  return {
    filename: `${document.number}.pdf`,
    content: Buffer.from(buffer),
    contentType: "application/pdf",
  };
}
