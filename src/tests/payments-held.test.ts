import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHECKOUT_HELD_MESSAGE, paymentsHeld } from "@/lib/payments/held";

describe("payments held", () => {
  it("treats PAYMENTS_REQUIRED=false as invoicing-only", () => {
    expect(paymentsHeld({ PAYMENTS_REQUIRED: "false" })).toBe(true);
    expect(paymentsHeld({ PAYMENTS_REQUIRED: "true" })).toBe(false);
    expect(CHECKOUT_HELD_MESSAGE).toMatch(/not available/i);
  });

  it("hides hosted checkout on the public invoice when payments are held", () => {
    const page = readFileSync("src/app/document/view/[token]/page.tsx", "utf8");
    const pay = readFileSync("src/app/document/view/[token]/pay-now.tsx", "utf8");
    expect(page).toContain("paymentsHeld={held}");
    expect(pay).toContain("checkoutOff");
    expect(pay).toContain("How to pay");
  });

  it("keeps the invoicing dashboard free of launch-ops banners", () => {
    const layout = readFileSync("src/app/dashboard/layout.tsx", "utf8");
    const settings = readFileSync("src/app/dashboard/settings/page.tsx", "utf8");
    expect(layout).not.toContain("LaunchReadinessBanner");
    expect(settings).not.toContain("email-health");
    expect(settings).not.toContain("payment-ops");
  });
});
