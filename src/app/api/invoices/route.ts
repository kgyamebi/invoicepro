import { documentSchema } from "@/lib/validation";
import { applyInventorySale, createDocument, serializeDocument } from "@/server/documents";
import { errorResponse, json } from "@/server/http";
import { getActiveContext } from "@/server/tenant";

export async function POST(request: Request) {
  try {
    const context = await getActiveContext();
    const payload = documentSchema.parse({ ...(await request.json()), type: "INVOICE" });
    const document = await createDocument({
      organizationId: context.organization.id,
      businessId: context.business.id,
      userId: context.user.id,
      payload,
    });
    if (context.business.inventoryEnabled && context.business.reduceStockOn === "INVOICE_CONFIRMED") {
      await applyInventorySale(document.id, context.user.id);
    }
    return json({ document: serializeDocument(document) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
