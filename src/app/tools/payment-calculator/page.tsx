import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Calculator } from "../ui";

export const metadata = { title: "Payment calculator", description: "See remaining balance after a partial payment." };

export default function PaymentCalculatorPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-4xl font-semibold">Payment calculator</h1>
        <Calculator mode="payment" />
      </main>
      <MarketingFooter />
    </div>
  );
}
