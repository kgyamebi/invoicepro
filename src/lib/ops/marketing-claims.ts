import { paymentsHeld } from "@/lib/payments/held";

export type MarketingClaim = {
  id: string;
  surface: string;
  claim: string;
  operational: boolean;
  action: "keep" | "complete" | "hide";
  evidence: string;
};

export function marketingClaims(): MarketingClaim[] {
  return [
    {
      id: "online_pay_faq",
      surface: "Landing FAQ",
      claim: paymentsHeld()
        ? "Online Pay Now is held; cash, bank, and mobile money recording remain available"
        : "Customers can pay online when Stripe, Paystack, or Flutterwave is connected",
      operational: true,
      action: "keep",
      evidence:
        "src/app/page.tsx uses paymentsHeld(); PublicPayNow hides checkout when held; POST /api/shared/[token]/pay returns 503; manual cash/bank/MoMo remain",
    },
    {
      id: "whatsapp_email_share",
      surface: "Landing bullets",
      claim: "Send by WhatsApp or email",
      operational: true,
      action: "keep",
      evidence: "Share APIs exist; email delivery still depends on EMAIL_PROVIDER (console does not deliver)",
    },
    {
      id: "free_plan_limits",
      surface: "Pricing",
      claim: "Free: 5 invoices, 5 quotations, 5 customers / month",
      operational: true,
      action: "keep",
      evidence: "src/lib/billing/plans.ts + src/server/usage.ts enforce monthly caps",
    },
    {
      id: "solo_unlimited",
      surface: "Pricing",
      claim: "Solo unlimited invoices",
      operational: true,
      action: "keep",
      evidence: "Null document limits with fairUseCap 20000 — not advertised as infinite infrastructure",
    },
    {
      id: "business_team",
      surface: "Pricing",
      claim: "Team access / multiple staff users",
      operational: true,
      action: "keep",
      evidence: "inviteMember + Business plan teams:true; e2e invite path in invoicing-loop",
    },
    {
      id: "business_support",
      surface: "Pricing",
      claim: "Email support (not priority/SLA support)",
      operational: true,
      action: "keep",
      evidence: "Customer-facing bullet is Email support; internal prioritySupport flag is not advertised as SLA",
    },
    {
      id: "live_refunds",
      surface: "Not advertised on marketing pages",
      claim: "Instant provider refunds",
      operational: false,
      action: "hide",
      evidence: "Refund adapters exist; live refund drill is WARN until dated evidence is recorded",
    },
    {
      id: "instant_momo",
      surface: "Not advertised as instant on marketing pages",
      claim: "Instant mobile-money checkout",
      operational: false,
      action: "hide",
      evidence: "Manual MoMo recording works; provider MoMo needs keys + dated drill",
    },
  ];
}

export function advertisedButIncomplete() {
  return marketingClaims().filter((row) => {
    if (row.operational || row.action === "keep") return false;
    const surface = row.surface.toLowerCase();
    return surface.includes("landing") || surface.includes("pricing") || surface.includes("onboarding");
  });
}
