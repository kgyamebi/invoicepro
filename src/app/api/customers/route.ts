import { customerSchema } from "@/lib/validation";
import { errorResponse, json } from "@/server/http";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const context = await getActiveContext(searchParams.get("businessId"));
    const q = searchParams.get("q")?.trim();
    const customers = await prisma.customer.findMany({
      where: {
        businessId: context.business.id,
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { company: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return json({ customers });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = customerSchema.parse(await request.json());
    const context = await getActiveContext();
    const customer = await prisma.customer.create({
      data: { ...body, email: body.email || null, businessId: context.business.id },
    });
    return json({ customer }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
