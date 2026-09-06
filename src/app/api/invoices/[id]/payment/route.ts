import { paymentSchema } from "@/lib/validation";
import { recordPayment } from "@/server/documents";
import { writeAudit } from "@/server/audit";
import { errorResponse, json } from "@/server/http";
import { assertDocumentAccess } from "@/server/tenant";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await assertDocumentAccess(id, "payment.manage");
    const body = paymentSchema.parse(await request.json());
    const result = await recordPayment({
      documentId: id,
      businessId: access.business.id,
      userId: access.user.id,
      ...body,
    });
    await writeAudit({
      organizationId: access.organization.id,
      businessId: access.business.id,
      userId: access.user.id,
      action: "payment.recorded",
      entityType: "document",
      entityId: id,
      metadata: { amount: body.amount, method: body.method },
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
