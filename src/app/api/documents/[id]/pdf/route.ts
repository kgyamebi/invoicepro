import { formatDate } from "@/lib/date";
import { renderDocumentPdf } from "@/lib/pdf/render";
import { incrementUsage } from "@/server/usage";
import { errorResponse } from "@/server/http";
import { assertDocumentAccess } from "@/server/tenant";
import { prisma } from "@/server/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await assertDocumentAccess(id);
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: access.business.id },
      include: { brandSettings: true, sellerPayMethods: true },
    });
    const buffer = await renderDocumentPdf({
      type: access.document.type,
      number: access.document.number,
      status: access.document.status,
      issueDate: formatDate(access.document.issueDate, business.dateFormat),
      dueDate: formatDate(access.document.dueDate, business.dateFormat),
      expiryDate: formatDate(access.document.expiryDate, business.dateFormat),
      currencyCode: access.document.currencyCode,
      notes: access.document.notes,
      terms: access.document.terms,
      paymentTerms: access.document.paymentTerms,
      subtotal: access.document.subtotal.toString(),
      taxTotal: access.document.taxTotal.toString(),
      shippingAmount: access.document.shippingAmount.toString(),
      documentDiscountAmount: access.document.documentDiscountAmount.toString(),
      grandTotal: access.document.grandTotal.toString(),
      amountPaid: access.document.amountPaid.toString(),
      balanceDue: access.document.balanceDue.toString(),
      templateKey: access.document.templateKey,
      customer: access.document.customer,
      business,
      items: access.document.items.map((item) => ({
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
      })),
      sellerPayMethods: business.sellerPayMethods,
    });
    await incrementUsage(access.organization.id, "pdfGenerations");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${access.document.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
