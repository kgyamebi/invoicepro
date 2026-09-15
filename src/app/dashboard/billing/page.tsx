import { Card } from "@/components/ui";
import { detectPaymentMethods } from "@/lib/payments/service";
import { prisma } from "@/server/db";
import { getOrCreateUsage } from "@/server/usage";
import { getActiveContext } from "@/server/tenant";
import { CheckoutButtons } from "./ui";

export default async function BillingPage() {
  const context = await getActiveContext();
  const [plans, credits, usage] = await Promise.all([
    prisma.plan.findMany({
      where: { isActive: true },
      include: { prices: { where: { isActive: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.creditAccount.findUnique({ where: { organizationId: context.organization.id } }),
    getOrCreateUsage(context.organization.id),
  ]);
  const current = context.organization.subscription;
  const methods = detectPaymentMethods({
    userCountry: context.user.countryCode,
    businessCountry: context.business.countryCode,
    currencyCode: context.business.currencyCode,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Billing</h1>
      <Card>
        <p className="text-sm text-muted">Current plan</p>
        <p className="text-2xl font-semibold">{current?.plan.key || "free"}</p>
        <p className="mt-2 text-sm text-muted">
          Documents this month: {usage.documentsCreated}
          {current?.plan.documentLimit ? ` / ${current.plan.documentLimit}` : ""}
        </p>
        <p className="text-sm text-muted">Credits: {credits?.balance ?? 0}</p>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <h2 className="text-lg font-medium">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted">{plan.description}</p>
            {plan.prices
              .filter((price) => price.interval === "MONTHLY" && (price.creditAmount ?? 0) === 0)
              .map((price) => (
                <p key={price.id} className="mt-3 text-xl">
                  {price.currencyCode} {price.amount.toString()}
                  <span className="text-sm text-muted"> / month</span>
                </p>
              ))}
            <CheckoutButtons planKey={plan.key} />
          </Card>
        ))}
      </div>
      <Card>
        <p className="font-medium">Available payment methods</p>
        <p className="mt-2 text-sm text-muted">
          {methods.length
            ? methods.flatMap((entry) => entry.methods.map((method) => method.label)).join(" · ")
            : "No live payment provider is configured yet. Checkout stays disabled until keys are added."}
        </p>
      </Card>
    </div>
  );
}
