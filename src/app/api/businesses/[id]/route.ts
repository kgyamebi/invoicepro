import { businessSchema } from "@/lib/validation";
import { errorResponse, json } from "@/server/http";
import { prisma } from "@/server/db";
import { requireBusinessAccess } from "@/server/tenant";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await requireBusinessAccess(id, "settings.manage");
    const body = businessSchema.partial().parse(await request.json());
    const business = await prisma.business.update({ where: { id }, data: body });
    return json({ business });
  } catch (error) {
    return errorResponse(error);
  }
}
