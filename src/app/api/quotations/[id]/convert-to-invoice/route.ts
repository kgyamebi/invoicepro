import { convertQuotationToInvoice, serializeDocument } from "@/server/documents";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { assertDocumentAccess } from "@/server/tenant";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await assertDocumentAccess(id, "invoice.create");
    const invoice = await convertQuotationToInvoice(id, access.user.id, access.organization.id);
    const full = await prisma.document.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { items: true, customer: true },
    });
    return json({ document: serializeDocument(full) });
  } catch (error) {
    return errorResponse(error);
  }
}
