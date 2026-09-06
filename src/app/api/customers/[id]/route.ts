import { customerSchema } from "@/lib/validation";
import { AuthError } from "@/server/auth";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { requireBusinessAccess } from "@/server/tenant";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!customer || customer.deletedAt) throw new AuthError("Customer not found.", 404);
    await requireBusinessAccess(customer.businessId, "invoice.view");
    return json({ customer });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new AuthError("Customer not found.", 404);
    await requireBusinessAccess(existing.businessId, "customer.manage");
    const body = customerSchema.partial().parse(await request.json());
    const customer = await prisma.customer.update({ where: { id }, data: body });
    return json({ customer });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new AuthError("Customer not found.", 404);
    await requireBusinessAccess(existing.businessId, "customer.manage");
    await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
