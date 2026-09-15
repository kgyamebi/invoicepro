import { formatDate } from "@/lib/date";
import { renderDocumentPdf } from "@/lib/pdf/render";
import { resolveShareToken, setDocumentStatus } from "@/server/documents";
import { prisma } from "@/server/db";
import { json } from "@/server/http";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const record = await resolveShareToken(token);
  if (!record) return json({ error: "This link is invalid or has expired." }, 404);
  await prisma.shareToken.update({
    where: { id: record.id },
    data: { viewCount: { increment: 1 } },
  });
  const document = record.document;
  if (["draft", "sent"].includes(document.status) && document.type === "QUOTATION") {
    await setDocumentStatus(document.id, "viewed");
  }
  const download = new URL(request.url).searchParams.get("download");
  if (download) {
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
      business: document.business,
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
    });
    await prisma.document.update({
      where: { id: document.id },
      data: { downloadCount: { increment: 1 } },
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${document.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  return json({
    document: {
      type: document.type,
      number: document.number,
      status: document.status,
      issueDate: document.issueDate,
      dueDate: document.dueDate,
      expiryDate: document.expiryDate,
      currencyCode: document.currencyCode,
      notes: document.notes,
      terms: document.terms,
      grandTotal: document.grandTotal.toString(),
      amountPaid: document.amountPaid.toString(),
      balanceDue: document.balanceDue.toString(),
      subtotal: document.subtotal.toString(),
      taxTotal: document.taxTotal.toString(),
      shippingAmount: document.shippingAmount.toString(),
      items: document.items.map((item) => ({
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
      })),
      customer: document.customer,
      business: {
        name: document.business.name,
        email: document.business.email,
        phone: document.business.phone,
        addressLine1: document.business.addressLine1,
        city: document.business.city,
      },
    },
  });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const record = await resolveShareToken(token);
  if (!record) return json({ error: "This link is invalid or has expired." }, 404);
  const body = (await request.json()) as { action: "accept" | "reject"; comment?: string };
  if (record.document.type !== "QUOTATION") {
    return json({ error: "Only quotations can be accepted here." }, 400);
  }
  await setDocumentStatus(
    record.document.id,
    body.action === "accept" ? "accepted" : "rejected",
    undefined,
    body.comment,
  );
  return json({ ok: true });
}
