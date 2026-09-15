import { invoicePaymentEmails } from "@/lib/email/service";
import { enqueueEmail } from "@/lib/email/queue";
import { getAppUrl } from "@/lib/utils";
import { convertInvoiceToReceipt, createShareLink } from "./documents";
import { prisma } from "./db";

export async function enqueueInvoicePaymentNotices(input: {
  documentId: string;
  organizationId: string;
  userId?: string;
  amount: string;
  reference: string;
  fullyPaid: boolean;
  receiptUrl?: string;
  receiptDocumentId?: string;
}) {
  const document = await prisma.document.findUnique({
    where: { id: input.documentId },
    include: { customer: true, business: true },
  });
  if (!document) return;

  let receiptUrl = input.receiptUrl;
  let receiptDocumentId = input.receiptDocumentId;
  if (!receiptUrl) {
    try {
      if (input.fullyPaid && input.userId) {
        const existingReceipt = await prisma.document.findFirst({
          where: { relatedInvoiceId: input.documentId, type: "RECEIPT", deletedAt: null },
        });
        const receipt =
          existingReceipt ||
          (await convertInvoiceToReceipt(input.documentId, input.userId, input.organizationId));
        receiptDocumentId = receipt.id;
        const token = await createShareLink(receipt.id);
        receiptUrl = `${getAppUrl()}/document/view/${token}`;
      } else {
        const token = await createShareLink(input.documentId);
        receiptUrl = `${getAppUrl()}/document/view/${token}`;
      }
    } catch {
      receiptUrl = getAppUrl();
    }
  }

  const notices = invoicePaymentEmails({
    invoiceNumber: document.number,
    amount: input.amount,
    reference: input.reference,
    receiptUrl,
    customerName: document.customer?.name,
  });
  if (document.customer?.email) {
    await enqueueEmail({
      to: document.customer.email,
      kind: "payment_received",
      organizationId: input.organizationId,
      documentId: receiptDocumentId || input.documentId,
      ...notices.customer,
    });
  }
  if (document.business.email) {
    await enqueueEmail({
      to: document.business.email,
      kind: "invoice_paid",
      organizationId: input.organizationId,
      documentId: receiptDocumentId || input.documentId,
      ...notices.business,
    });
  }
}
