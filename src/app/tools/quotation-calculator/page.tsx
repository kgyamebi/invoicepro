import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Calculator } from "../ui";

export const metadata = { title: "Quotation calculator", description: "Add materials, labour and delivery before turning numbers into a quotation." };

export default function QuotationCalculatorPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-4xl font-semibold">Quotation calculator</h1>
        <p className="mt-3 text-muted">
          Construction cost, material and markup calculators can feed a quotation later. Use Create Quotation to transfer items when you have an account.
        </p>
        <Calculator mode="invoice" />
      </main>
      <MarketingFooter />
    </div>
  );
}
