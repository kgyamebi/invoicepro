import { documentSchema } from "@/lib/validation";
import { createDocument, serializeDocument } from "@/server/documents";
import { applyInventorySale } from "@/server/documents";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { getActiveContext } from "@/server/tenant";
import type { DocumentType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const context = await getActiveContext(searchParams.get("businessId"));
    const type = searchParams.get("type") as DocumentType | null;
    const q = searchParams.get("q")?.trim();
    const documents = await prisma.document.findMany({
      where: {
        businessId: context.business.id,
        deletedAt: null,
        ...(type ? { type } : {}),
        ...(q
          ? {
              OR: [
                { number: { contains: q, mode: "insensitive" } },
                { customer: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { customer: true, items: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return json({ documents: documents.map(serializeDocument) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getActiveContext();
    const payload = documentSchema.parse(await request.json());
    const document = await createDocument({
      organizationId: context.organization.id,
      businessId: context.business.id,
      userId: context.user.id,
      payload,
    });
    if (
      payload.type === "INVOICE" &&
      context.business.inventoryEnabled &&
      context.business.reduceStockOn === "INVOICE_CONFIRMED"
    ) {
      await applyInventorySale(document.id, context.user.id);
    }
    return json({ document: serializeDocument(document) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
