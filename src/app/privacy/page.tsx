import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { getAppName } from "@/lib/utils";

export const metadata = { title: "Privacy", description: "How we handle business and customer data." };

export default function PrivacyPage() {
  const name = getAppName();
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 space-y-4">
        <h1 className="text-4xl font-semibold">Privacy</h1>
        <p className="text-muted">{name} stores business documents that can include names, phone numbers, addresses and payment instructions. We isolate data by business, encrypt traffic in production, and do not use customer document contents to train AI models unless a lawful, explicit permission is added later.</p>
        <p className="text-muted">Account deletion and document deletion are supported. Share links are random, hashed, and revocable.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
