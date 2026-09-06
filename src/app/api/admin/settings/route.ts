import { z } from "zod";
import { AuthError, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "SUPER_ADMIN") throw new AuthError("Admin only.", 403);
    const [plans, flags, providers, currencies] = await Promise.all([
      prisma.plan.findMany({ include: { prices: true }, orderBy: { sortOrder: "asc" } }),
      prisma.featureFlag.findMany(),
      prisma.paymentProviderConfig.findMany(),
      prisma.currency.findMany({ orderBy: { code: "asc" } }),
    ]);
    return json({ plans, flags, providers, currencies });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "SUPER_ADMIN") throw new AuthError("Admin only.", 403);
    const body = z
      .object({
        flags: z.array(z.object({ key: z.string(), enabled: z.boolean() })).optional(),
        plan: z
          .object({
            id: z.string(),
            documentLimit: z.number().nullable().optional(),
            prices: z.array(z.object({ id: z.string(), amount: z.string() })).optional(),
          })
          .optional(),
      })
      .parse(await request.json());
    if (body.flags) {
      for (const flag of body.flags) {
        await prisma.featureFlag.update({ where: { key: flag.key }, data: { enabled: flag.enabled } });
      }
    }
    if (body.plan) {
      await prisma.plan.update({
        where: { id: body.plan.id },
        data: { documentLimit: body.plan.documentLimit },
      });
      for (const price of body.plan.prices ?? []) {
        await prisma.planPrice.update({ where: { id: price.id }, data: { amount: price.amount } });
      }
    }
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
