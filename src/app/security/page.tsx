import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";

export const metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 space-y-4">
        <h1 className="text-4xl font-semibold">Security</h1>
        <p className="text-muted">Passwords are hashed. Sessions are httpOnly cookies. Authorization is enforced on the server for every business-owned record. PDFs are not served from predictable public URLs. Webhooks are signature-checked and idempotent. Rate limits apply to auth and generation endpoints.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
