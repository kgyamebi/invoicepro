import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 space-y-4">
        <h1 className="text-4xl font-semibold">Terms</h1>
        <p className="text-muted">The service provides document management tools. You are responsible for the accuracy of invoices, tax settings and payment details you show to customers. Quotation acceptance records a status and timestamp; it is not a legally binding electronic signature unless you add a compliant signing product.</p>
        <p className="text-muted">Paid plans and credits are configured by the operator. Payments activate only after server-side provider verification.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
