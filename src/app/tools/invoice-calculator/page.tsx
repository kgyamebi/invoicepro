import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Calculator } from "../ui";

export const metadata = {
  title: "Invoice calculator",
  description: "Calculate invoice totals with quantity, price, discount, tax and delivery. No signup required.",
};

export default function InvoiceCalculatorPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-4xl font-semibold">Invoice calculator</h1>
        <p className="mt-3 text-muted">Totals use the same decimal-safe engine as the product. Create an account to turn the result into a real invoice.</p>
        <Calculator mode="invoice" />
      </main>
      <MarketingFooter />
    </div>
  );
}
