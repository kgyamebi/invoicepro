import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";

export const metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 space-y-4">
        <h1 className="text-4xl font-semibold">Cookies</h1>
        <p className="text-muted">We use a necessary session cookie to keep you signed in. We do not use advertising cookies in the core product.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
