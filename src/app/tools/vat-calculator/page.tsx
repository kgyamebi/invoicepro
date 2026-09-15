import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Calculator } from "../ui";

export const metadata = {
  title: "VAT calculator",
  description: "Add or extract tax from an amount using a rate you provide. We do not invent country tax rates.",
};

export default function VatCalculatorPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-4xl font-semibold">VAT calculator</h1>
        <p className="mt-3 text-muted">Enter your own rate. Tax rules differ by country and registration.</p>
        <Calculator mode="vat" />
      </main>
      <MarketingFooter />
    </div>
  );
}
