import { z } from "zod";
import { createCheckout } from "@/lib/payments/service";
import { getAppUrl } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { recordProviderTransaction } from "@/server/billing";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const membership = user.memberships[0];
    if (!membership) return json({ error: "Workspace missing." }, 409);
    const body = z
      .object({
        planKey: z.string(),
        interval: z.enum(["MONTHLY", "YEARLY", "ONE_TIME"]),
        currencyCode: z.string().default("USD"),
        provider: z.string().optional(),
        creditAmount: z.number().optional(),
      })
      .parse(await request.json());
    const plan = await prisma.plan.findUnique({
      where: { key: body.planKey },
      include: { prices: true },
    });
    if (!plan) return json({ error: "Plan not found." }, 404);
    const price = plan.prices.find(
      (item) =>
        item.currencyCode === body.currencyCode &&
        item.interval === body.interval &&
        (body.creditAmount ? item.creditAmount === body.creditAmount : (item.creditAmount ?? 0) === 0),
    ) || plan.prices.find((item) => item.interval === body.interval && item.currencyCode === "USD");
    if (!price) return json({ error: "Price is not configured for this currency." }, 400);
    const checkout = await createCheckout(body.provider, {
      organizationId: membership.organizationId,
      planKey: plan.key,
      interval: body.interval,
      currencyCode: price.currencyCode,
      amount: price.amount.toString(),
      email: user.email,
      successUrl: `${getAppUrl()}/dashboard/billing?status=success`,
      cancelUrl: `${getAppUrl()}/dashboard/billing?status=cancelled`,
      creditAmount: body.creditAmount,
    });
    await recordProviderTransaction({
      organizationId: membership.organizationId,
      provider: checkout.provider,
      providerRef: checkout.reference,
      type: body.interval === "ONE_TIME" ? "CREDIT_PACK" : "CHECKOUT",
      amount: price.amount.toString(),
      currencyCode: price.currencyCode,
      status: "pending",
      idempotencyKey: `${checkout.provider}:${checkout.reference}`,
    });
    return json(checkout);
  } catch (error) {
    return errorResponse(error);
  }
}
