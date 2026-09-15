import Link from "next/link";
import { getAppName, getAppTagline } from "@/lib/utils";
import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Button, Card } from "@/components/ui";

const faqs = [
  {
    q: "Is this accounting software?",
    a: "No. It is invoicing and quotation software. You can track payments and outstanding balances without taking on a full ledger.",
  },
  {
    q: "Can I start free?",
    a: "Yes. The free plan includes a monthly document allowance, customers, products and PDF export. Paid plans are configured by the operator and stay intentionally affordable.",
  },
  {
    q: "Do you support Mobile Money?",
    a: "You can print Mobile Money details on invoices. Subscription billing shows Mobile Money or cards only when the configured payment provider actually supports them for that country.",
  },
  {
    q: "Can I invoice from my phone?",
    a: "Yes. The create flow is customer, items, review, share — designed for a shop counter or a construction site.",
  },
];

export default function HomePage() {
  const name = getAppName();
  return (
    <div>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium text-accent">{getAppTagline()}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Professional invoices and quotations in seconds.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Create beautiful invoices, quotations and receipts without expensive accounting software.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register?intent=invoice">
              <Button className="px-5 py-3">Create Free Invoice</Button>
            </Link>
            <Link href="/register?intent=quotation">
              <Button variant="secondary" className="px-5 py-3">
                Create Quotation
              </Button>
            </Link>
          </div>
        </section>

        <section id="demo" className="mx-auto max-w-6xl px-4 pb-16">
          <Card className="overflow-hidden p-0">
            <div className="grid md:grid-cols-2">
              <div className="border-b border-line p-6 md:border-b-0 md:border-r">
                <p className="text-xs uppercase tracking-wide text-muted">Invoice</p>
                <p className="mt-2 text-2xl font-semibold">INV-000042</p>
                <p className="text-muted">XYZ Developers</p>
                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex justify-between"><span>50 × LED Floodlight</span><span>GH₵9,000</span></div>
                  <div className="flex justify-between"><span>20 × Safety Helmet</span><span>GH₵900</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span>GH₵300</span></div>
                  <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span>GH₵10,200</span></div>
                </div>
              </div>
              <div className="bg-accent-soft p-6">
                <p className="text-xs uppercase tracking-wide text-muted">Quotation</p>
                <p className="mt-2 text-2xl font-semibold">QT-000042</p>
                <p className="text-muted">Valid 14 days · Accept on a secure link</p>
                <p className="mt-6 text-sm text-muted">
                  Customer opens the link, accepts, and you convert the same items into an invoice. No retyping.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section id="features" className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-3">
          {[
            ["Quotations to invoices", "Accept a quote and create the invoice from the same customer, items and taxes."],
            ["Invoices to receipts", "Record cash, bank or Mobile Money and issue a receipt against the balance."],
            ["WhatsApp sharing", "Open WhatsApp with a ready message and a secure view link. No fake attachment claims."],
            ["Deterministic totals", "Money is calculated in application code, never by a language model."],
            ["Global, locally usable", "Currencies, date formats and payment methods are configured — not hard-coded."],
            ["Mobile first", "A seller can create and send a quotation from a phone on site."],
          ].map(([title, body]) => (
            <Card key={title}>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </Card>
          ))}
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {["Add a customer", "Add items", "Review the total", "Share the PDF or link"].map((step, index) => (
              <Card key={step}>
                <p className="text-sm text-accent">0{index + 1}</p>
                <p className="mt-2 font-medium">{step}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <Card>
            <h2 className="text-2xl font-semibold">WhatsApp workflow</h2>
            <p className="mt-3 max-w-2xl text-muted">
              Create the document, generate a secure link, and send a short message with the number and total. The
              customer can view, download and — for quotations — accept or reject. Direct file-attachment automation is
              only available if a WhatsApp Business API is configured later.
            </p>
          </Card>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-3xl font-semibold">Global payments, honest methods</h2>
          <p className="mt-3 max-w-2xl text-muted">
            {name} uses a payment provider abstraction. Cards, Mobile Money, UPI or other local methods appear only when
            the configured provider supports them for that merchant country. Nothing is advertised that cannot be charged.
          </p>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-3xl font-semibold">Pricing that stays out of the way</h2>
          <p className="mt-3 text-muted">Plans and local prices are configured by the operator. Typical starting shape:</p>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {[
              ["Free", "10 documents / month"],
              ["Starter", "100 documents"],
              ["Pro", "500 documents + AI"],
              ["Business", "2,000 documents + teams"],
              ["Unlimited", "Fair-use unlimited"],
            ].map(([plan, detail]) => (
              <Card key={plan}>
                <p className="font-medium">{plan}</p>
                <p className="mt-2 text-sm text-muted">{detail}</p>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">Exact prices are loaded from configuration, not hard-coded into checkout.</p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-3xl font-semibold">Built for real work</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Freelancers", "Contractors", "Retailers", "Wholesalers", "Online sellers", "Consultants", "Construction"].map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-1 text-sm border border-line">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-3xl font-semibold">Questions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <Card key={item.q}>
                <h3 className="font-medium">{item.q}</h3>
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <Card className="bg-accent text-white">
            <h2 className="text-3xl font-semibold">Create your first invoice in under a minute.</h2>
            <div className="mt-6">
              <Link href="/register">
                <Button variant="secondary">Get started free</Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
      <MarketingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name,
            applicationCategory: "BusinessApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description: getAppTagline(),
          }),
        }}
      />
    </div>
  );
}
