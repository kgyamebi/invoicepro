import { AuthError, requireUser } from "./auth";
import { prisma } from "./db";
import { assertCan, type Permission } from "./rbac";

export async function getActiveContext(businessId?: string | null) {
  const user = await requireUser();
  const membership = user.memberships[0];
  if (!membership) {
    throw new AuthError("Create a business to continue.", 409);
  }
  const businesses = membership.organization.businesses.filter((item) => !item.deletedAt);
  const business =
    (businessId && businesses.find((item) => item.id === businessId)) ||
    businesses.find((item) => item.isDefault) ||
    businesses[0];
  if (!business) {
    throw new AuthError("Create a business to continue.", 409);
  }
  return {
    user,
    membership,
    organization: membership.organization,
    business,
  };
}

export async function requireBusinessAccess(businessId: string, permission?: Permission) {
  const context = await getActiveContext(businessId);
  if (context.business.id !== businessId) {
    throw new AuthError("You do not have access to this business.", 403);
  }
  if (permission) {
    assertCan(context.membership.role, permission);
  }
  return context;
}

export async function assertDocumentAccess(documentId: string, permission: Permission = "invoice.view") {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { business: true, customer: true, items: { orderBy: { position: "asc" } } },
  });
  if (!document || document.deletedAt) {
    throw new AuthError("Document not found.", 404);
  }
  const context = await requireBusinessAccess(document.businessId, permission);
  return { ...context, document };
}
