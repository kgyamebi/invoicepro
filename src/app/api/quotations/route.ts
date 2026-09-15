import { documentSchema } from "@/lib/validation";
import { createDocument, serializeDocument } from "@/server/documents";
import { errorResponse, json } from "@/server/http";
import { getActiveContext } from "@/server/tenant";

export async function POST(request: Request) {
  try {
    const context = await getActiveContext();
    const payload = documentSchema.parse({ ...(await request.json()), type: "QUOTATION" });
    const document = await createDocument({
      organizationId: context.organization.id,
      businessId: context.business.id,
      userId: context.user.id,
      payload,
    });
    return json({ document: serializeDocument(document) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
