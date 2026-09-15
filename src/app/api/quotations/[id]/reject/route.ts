import { setDocumentStatus } from "@/server/documents";
import { writeAudit } from "@/server/audit";
import { errorResponse, json } from "@/server/http";
import { assertDocumentAccess } from "@/server/tenant";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await assertDocumentAccess(id, "invoice.edit");
    const body = (await request.json().catch(() => ({}))) as { comment?: string };
    await setDocumentStatus(id, "rejected", access.user.id, body.comment);
    await writeAudit({
      organizationId: access.organization.id,
      businessId: access.business.id,
      userId: access.user.id,
      action: "quotation.rejected",
      entityType: "document",
      entityId: id,
    });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
