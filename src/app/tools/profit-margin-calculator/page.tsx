import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Calculator } from "../ui";

export const metadata = { title: "Profit margin calculator", description: "Compare cost and selling price to see margin and markup." };

export default function ProfitMarginPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-4xl font-semibold">Profit margin calculator</h1>
        <Calculator mode="margin" />
      </main>
      <MarketingFooter />
    </div>
  );
}
