import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Button, Card } from "@/components/ui";
import { getSeoPage, SEO_PAGES } from "@/lib/seo/catalog";
import { getAppName, getAppUrl } from "@/lib/utils";

export function generateStaticParams() {
  return SEO_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) return {};
  const url = `${getAppUrl()}/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url },
    twitter: { title: page.title, description: page.description },
  };
}

export default async function SeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) notFound();
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-accent">{getAppName()}</p>
        <h1 className="mt-2 text-4xl font-semibold">{page.heading}</h1>
        <p className="mt-4 text-lg text-muted">{page.intro}</p>
        <div className="mt-6 flex gap-3">
          <Link href={page.href}>
            <Button>{page.cta}</Button>
          </Link>
          <Link href="/quotation-generator">
            <Button variant="secondary">See quotations</Button>
          </Link>
        </div>
        <div className="mt-10 grid gap-3">
          {page.points.map((point) => (
            <Card key={point}>{point}</Card>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
