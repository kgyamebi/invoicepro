import { documentSchema } from "@/lib/validation";
import { serializeDocument, setDocumentStatus, updateDocument } from "@/server/documents";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { assertDocumentAccess } from "@/server/tenant";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { document } = await assertDocumentAccess(id);
    return json({ document: serializeDocument(document) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await assertDocumentAccess(id, "invoice.edit");
    const payload = documentSchema.parse(await request.json());
    const document = await updateDocument(id, payload);
    await writeAudit({
      organizationId: access.organization.id,
      businessId: access.business.id,
      userId: access.user.id,
      action: "document.edited",
      entityType: "document",
      entityId: id,
    });
    return json({ document: serializeDocument(document) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await assertDocumentAccess(id, "invoice.delete");
    await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
    await setDocumentStatus(id, "cancelled", access.user.id, "Deleted");
    await writeAudit({
      organizationId: access.organization.id,
      businessId: access.business.id,
      userId: access.user.id,
      action: "document.deleted",
      entityType: "document",
      entityId: id,
    });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
