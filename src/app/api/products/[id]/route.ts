import { productSchema } from "@/lib/validation";
import { AuthError } from "@/server/auth";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { requireBusinessAccess } from "@/server/tenant";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.deletedAt) throw new AuthError("Product not found.", 404);
    await requireBusinessAccess(product.businessId, "invoice.view");
    return json({ product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AuthError("Product not found.", 404);
    await requireBusinessAccess(existing.businessId, "product.manage");
    const body = productSchema.partial().parse(await request.json());
    const product = await prisma.product.update({ where: { id }, data: body });
    return json({ product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AuthError("Product not found.", 404);
    await requireBusinessAccess(existing.businessId, "product.manage");
    await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
