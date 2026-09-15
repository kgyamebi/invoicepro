import Link from "next/link";
import { Logo } from "./brand";
import { Button } from "./ui";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/tools/invoice-calculator">Tools</Link>
          <Link href="/blog">Blog</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden text-sm md:inline">
            Log in
          </Link>
          <Link href="/register">
            <Button>Create Free Invoice</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted">Simple invoicing and quotations for small businesses.</p>
        </div>
        <div className="text-sm space-y-2">
          <p className="font-medium text-ink">Product</p>
          <Link href="/invoice-generator" className="block text-muted">Invoice generator</Link>
          <Link href="/quotation-generator" className="block text-muted">Quotation generator</Link>
          <Link href="/receipt-generator" className="block text-muted">Receipt generator</Link>
          <Link href="/#pricing" className="block text-muted">Pricing</Link>
        </div>
        <div className="text-sm space-y-2">
          <p className="font-medium text-ink">Tools</p>
          <Link href="/tools/invoice-calculator" className="block text-muted">Invoice calculator</Link>
          <Link href="/tools/vat-calculator" className="block text-muted">VAT calculator</Link>
          <Link href="/tools/discount-calculator" className="block text-muted">Discount calculator</Link>
          <Link href="/blog" className="block text-muted">Guides</Link>
        </div>
        <div className="text-sm space-y-2">
          <p className="font-medium text-ink">Legal</p>
          <Link href="/privacy" className="block text-muted">Privacy</Link>
          <Link href="/terms" className="block text-muted">Terms</Link>
          <Link href="/security" className="block text-muted">Security</Link>
          <Link href="/cookies" className="block text-muted">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
