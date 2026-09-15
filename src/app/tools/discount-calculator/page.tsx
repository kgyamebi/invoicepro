import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Calculator } from "../ui";

export const metadata = { title: "Discount calculator", description: "Work out percentage or fixed discounts before you send a quote." };

export default function DiscountCalculatorPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-4xl font-semibold">Discount calculator</h1>
        <Calculator mode="discount" />
      </main>
      <MarketingFooter />
    </div>
  );
}
