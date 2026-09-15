import type { DiscountType, DocumentType, PaymentMethodType, Prisma } from "@prisma/client";
import { calculateDocument } from "@/lib/money/calculate";
import { getCurrency } from "@/lib/money/currency";
import { invoiceStatusFromBalance } from "@/lib/documents/types";
import { hashToken, randomToken } from "@/lib/auth/crypto";
import { prisma } from "./db";
import { nextDocumentNumber } from "./numbering";
import { writeAudit } from "./audit";
import { assertCanCreateDocument, consumeDocumentUsage } from "./usage";

export type ItemPayload = {
  productId?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  quantity: string | number;
  unit?: string;
  unitPrice: string | number;
  discountType?: DiscountType;
  discountValue?: string | number;
  taxName?: string | null;
  taxRate?: string | number;
  taxInclusive?: boolean;
};

export type DocumentPayload = {
  type: DocumentType;
  customerId?: string | null;
  issueDate?: string;
  dueDate?: string | null;
  expiryDate?: string | null;
  number?: string | null;
  notes?: string | null;
  terms?: string | null;
  paymentTerms?: string | null;
  templateKey?: string;
  documentDiscountType?: DiscountType;
  documentDiscountValue?: string | number;
  shippingAmount?: string | number;
  otherChargesAmount?: string | number;
  items: ItemPayload[];
};

function toDate(value?: string | null) {
  return value ? new Date(value) : undefined;
}

export function computeTotals(payload: DocumentPayload, currencyCode: string) {
  const currency = getCurrency(currencyCode);
  return calculateDocument({
    lines: payload.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountType: item.discountType,
      discountValue: item.discountValue,
      taxRate: item.taxRate,
      taxInclusive: item.taxInclusive,
    })),
    documentDiscountType: payload.documentDiscountType,
    documentDiscountValue: payload.documentDiscountValue,
    shippingAmount: payload.shippingAmount,
    otherChargesAmount: payload.otherChargesAmount,
    decimalPlaces: currency.decimalPlaces,
  });
}

export async function createDocument(input: {
  organizationId: string;
  businessId: string;
  userId: string;
  payload: DocumentPayload;
  status?: string;
  convertedFromId?: string;
  relatedInvoiceId?: string;
  skipUsage?: boolean;
}) {
  if (!input.skipUsage) {
    const gate = await assertCanCreateDocument(input.organizationId);
    await consumeDocumentUsage(input.organizationId, gate.usedCredit);
  }

  const business = await prisma.business.findUniqueOrThrow({ where: { id: input.businessId } });
  const totals = computeTotals(input.payload, business.currencyCode);
  const number = await nextDocumentNumber(input.businessId, input.payload.type, {
    preferred: input.payload.number,
  });
  const defaultStatus =
    input.payload.type === "RECEIPT" ? "issued" : input.status || "draft";

  const document = await prisma.document.create({
    data: {
      businessId: input.businessId,
      customerId: input.payload.customerId ?? undefined,
      convertedFromId: input.convertedFromId,
      relatedInvoiceId: input.relatedInvoiceId,
      type: input.payload.type,
      number,
      status: defaultStatus,
      issueDate: toDate(input.payload.issueDate) ?? new Date(),
      dueDate: toDate(input.payload.dueDate),
      expiryDate: toDate(input.payload.expiryDate),
      currencyCode: business.currencyCode,
      subtotal: totals.subtotal,
      itemDiscountTotal: totals.itemDiscountTotal,
      documentDiscountType: input.payload.documentDiscountType ?? "NONE",
      documentDiscountValue: String(input.payload.documentDiscountValue ?? 0),
      documentDiscountAmount: totals.documentDiscountAmount,
      taxTotal: totals.taxTotal,
      shippingAmount: totals.shippingAmount,
      otherChargesAmount: totals.otherChargesAmount,
      grandTotal: totals.grandTotal,
      amountPaid: totals.amountPaid,
      balanceDue: totals.balanceDue,
      notes: input.payload.notes,
      terms: input.payload.terms,
      paymentTerms: input.payload.paymentTerms,
      templateKey: input.payload.templateKey || business.preferredTemplate,
      createdById: input.userId,
      items: {
        create: totals.lines.map((line, index) => ({
          productId: input.payload.items[index]?.productId ?? undefined,
          position: index,
          name: input.payload.items[index]?.name ?? "Item",
          description: input.payload.items[index]?.description,
          category: input.payload.items[index]?.category,
          quantity: line.quantity,
          unit: input.payload.items[index]?.unit || "pcs",
          unitPrice: line.unitPrice,
          discountType: input.payload.items[index]?.discountType ?? "NONE",
          discountValue: String(input.payload.items[index]?.discountValue ?? 0),
          discountAmount: line.discountAmount,
          taxName: input.payload.items[index]?.taxName,
          taxRate: String(input.payload.items[index]?.taxRate ?? 0),
          taxInclusive: input.payload.items[index]?.taxInclusive ?? false,
          taxAmount: line.taxAmount,
          lineSubtotal: line.lineSubtotal,
          lineTotal: line.lineTotal,
        })),
      },
      statusHistory: {
        create: { toStatus: defaultStatus, actorUserId: input.userId },
      },
    },
    include: { items: true, customer: true },
  });

  await writeAudit({
    organizationId: input.organizationId,
    businessId: input.businessId,
    userId: input.userId,
    action: `${input.payload.type.toLowerCase()}.created`,
    entityType: "document",
    entityId: document.id,
  });

  return document;
}

export async function updateDocument(documentId: string, payload: DocumentPayload) {
  const existing = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  const totals = computeTotals(payload, existing.currencyCode);
  await prisma.documentItem.deleteMany({ where: { documentId } });
  return prisma.document.update({
    where: { id: documentId },
    data: {
      customerId: payload.customerId ?? existing.customerId,
      issueDate: toDate(payload.issueDate) ?? existing.issueDate,
      dueDate: toDate(payload.dueDate),
      expiryDate: toDate(payload.expiryDate),
      notes: payload.notes,
      terms: payload.terms,
      paymentTerms: payload.paymentTerms,
      templateKey: payload.templateKey ?? existing.templateKey,
      documentDiscountType: payload.documentDiscountType ?? "NONE",
      documentDiscountValue: String(payload.documentDiscountValue ?? 0),
      subtotal: totals.subtotal,
      itemDiscountTotal: totals.itemDiscountTotal,
      documentDiscountAmount: totals.documentDiscountAmount,
      taxTotal: totals.taxTotal,
      shippingAmount: totals.shippingAmount,
      otherChargesAmount: totals.otherChargesAmount,
      grandTotal: totals.grandTotal,
      balanceDue: totals.grandTotal,
      items: {
        create: totals.lines.map((line, index) => ({
          productId: payload.items[index]?.productId ?? undefined,
          position: index,
          name: payload.items[index]?.name ?? "Item",
          description: payload.items[index]?.description,
          category: payload.items[index]?.category,
          quantity: line.quantity,
          unit: payload.items[index]?.unit || "pcs",
          unitPrice: line.unitPrice,
          discountType: payload.items[index]?.discountType ?? "NONE",
          discountValue: String(payload.items[index]?.discountValue ?? 0),
          discountAmount: line.discountAmount,
          taxName: payload.items[index]?.taxName,
          taxRate: String(payload.items[index]?.taxRate ?? 0),
          taxInclusive: payload.items[index]?.taxInclusive ?? false,
          taxAmount: line.taxAmount,
          lineSubtotal: line.lineSubtotal,
          lineTotal: line.lineTotal,
        })),
      },
    },
    include: { items: true, customer: true },
  });
}

export async function setDocumentStatus(
  documentId: string,
  status: string,
  userId?: string,
  note?: string,
) {
  const existing = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  return prisma.document.update({
    where: { id: documentId },
    data: {
      status,
      acceptedAt: status === "accepted" ? new Date() : existing.acceptedAt,
      rejectedAt: status === "rejected" ? new Date() : existing.rejectedAt,
      sentAt: status === "sent" ? new Date() : existing.sentAt,
      acceptanceComment: note ?? existing.acceptanceComment,
      statusHistory: {
        create: { fromStatus: existing.status, toStatus: status, note, actorUserId: userId },
      },
    },
  });
}

export async function convertQuotationToInvoice(quotationId: string, userId: string, organizationId: string) {
  const quotation = await prisma.document.findUniqueOrThrow({
    where: { id: quotationId },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (quotation.type !== "QUOTATION") {
    throw new Error("Only quotations can be converted to invoices.");
  }
  const existing = await prisma.document.findFirst({
    where: { convertedFromId: quotation.id, type: "INVOICE", deletedAt: null },
  });
  if (existing) return existing;

  const invoice = await createDocument({
    organizationId,
    businessId: quotation.businessId,
    userId,
    convertedFromId: quotation.id,
    payload: {
      type: "INVOICE",
      customerId: quotation.customerId,
      notes: quotation.notes,
      terms: quotation.terms,
      paymentTerms: quotation.paymentTerms,
      templateKey: quotation.templateKey,
      documentDiscountType: quotation.documentDiscountType,
      documentDiscountValue: quotation.documentDiscountValue.toString(),
      shippingAmount: quotation.shippingAmount.toString(),
      otherChargesAmount: quotation.otherChargesAmount.toString(),
      items: quotation.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        discountType: item.discountType,
        discountValue: item.discountValue.toString(),
        taxName: item.taxName,
        taxRate: item.taxRate.toString(),
        taxInclusive: item.taxInclusive,
      })),
    },
  });

  await prisma.document.update({
    where: { id: quotation.id },
    data: { status: quotation.status === "draft" ? "accepted" : quotation.status },
  });
  return invoice;
}

export async function recordPayment(input: {
  documentId: string;
  businessId: string;
  userId: string;
  amount: string;
  paidAt?: string;
  method: PaymentMethodType;
  reference?: string;
  notes?: string;
}) {
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: input.documentId },
    include: { business: true },
  });
  if (document.type !== "INVOICE") {
    throw new Error("Payments can only be recorded against invoices.");
  }
  const currency = getCurrency(document.currencyCode);
  const payment = await prisma.payment.create({
    data: {
      businessId: input.businessId,
      documentId: input.documentId,
      amount: input.amount,
      currencyCode: document.currencyCode,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      createdById: input.userId,
      allocations: {
        create: { documentId: input.documentId, amount: input.amount },
      },
    },
  });

  const paid = await prisma.payment.aggregate({
    where: { documentId: input.documentId },
    _sum: { amount: true },
  });
  const amountPaid = (paid._sum.amount ?? 0).toString();
  const balanceDue = calculateDocument({
    lines: [{ quantity: 1, unitPrice: document.grandTotal.toString() }],
    amountPaid,
    decimalPlaces: currency.decimalPlaces,
  }).balanceDue;
  const nextStatus = invoiceStatusFromBalance(balanceDue, document.grandTotal.toString(), document.status);

  await prisma.document.update({
    where: { id: input.documentId },
    data: {
      amountPaid,
      balanceDue,
      status: nextStatus,
      statusHistory: {
        create: { fromStatus: document.status, toStatus: nextStatus, actorUserId: input.userId },
      },
    },
  });

  if (
    document.business.inventoryEnabled &&
    document.business.reduceStockOn === "INVOICE_PAID" &&
    nextStatus === "paid"
  ) {
    await applyInventorySale(document.id, input.userId);
  }

  return { payment, amountPaid, balanceDue, status: nextStatus };
}

export async function applyInventorySale(documentId: string, userId: string) {
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    include: { items: true, business: true },
  });
  if (!document.business.inventoryEnabled) return;
  for (const item of document.items) {
    if (!item.productId) continue;
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product?.trackStock) continue;
    await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: { decrement: item.quantity } },
    });
    await prisma.inventoryMovement.create({
      data: {
        businessId: document.businessId,
        productId: product.id,
        documentId,
        type: "SALE",
        quantity: `-${item.quantity.toString()}`,
        reason: `Invoice ${document.number}`,
        createdById: userId,
      },
    });
  }
}

export async function convertInvoiceToReceipt(invoiceId: string, userId: string, organizationId: string) {
  const invoice = await prisma.document.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (invoice.type !== "INVOICE") {
    throw new Error("Only invoices can be converted to receipts.");
  }
  return createDocument({
    organizationId,
    businessId: invoice.businessId,
    userId,
    relatedInvoiceId: invoice.id,
    payload: {
      type: "RECEIPT",
      customerId: invoice.customerId,
      notes: `Payment received for invoice ${invoice.number}`,
      items: [
        {
          name: `Payment for ${invoice.number}`,
          quantity: 1,
          unitPrice: invoice.amountPaid.toString(),
        },
      ],
    },
  });
}

export async function createShareLink(documentId: string, expiresInDays?: number) {
  const token = randomToken(24);
  await prisma.shareToken.create({
    data: {
      documentId,
      tokenHash: hashToken(token),
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function resolveShareToken(token: string) {
  const record = await prisma.shareToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      document: {
        include: {
          items: { orderBy: { position: "asc" } },
          customer: true,
          business: { include: { brandSettings: true, sellerPayMethods: true } },
        },
      },
    },
  });
  if (!record || record.revokedAt) return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;
  if (record.maxViews && record.viewCount >= record.maxViews) return null;
  return record;
}

export function serializeDocument(document: Prisma.DocumentGetPayload<{
  include: { items: true; customer: true };
}>) {
  return {
    ...document,
    subtotal: document.subtotal.toString(),
    itemDiscountTotal: document.itemDiscountTotal.toString(),
    documentDiscountValue: document.documentDiscountValue.toString(),
    documentDiscountAmount: document.documentDiscountAmount.toString(),
    taxTotal: document.taxTotal.toString(),
    shippingAmount: document.shippingAmount.toString(),
    otherChargesAmount: document.otherChargesAmount.toString(),
    grandTotal: document.grandTotal.toString(),
    amountPaid: document.amountPaid.toString(),
    balanceDue: document.balanceDue.toString(),
    items: document.items.map((item) => ({
      ...item,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      discountValue: item.discountValue.toString(),
      discountAmount: item.discountAmount.toString(),
      taxRate: item.taxRate.toString(),
      taxAmount: item.taxAmount.toString(),
      lineSubtotal: item.lineSubtotal.toString(),
      lineTotal: item.lineTotal.toString(),
    })),
  };
}
