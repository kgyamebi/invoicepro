import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { prisma } from "@/server/db";
import { getAppUrl } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.blogArticle.findUnique({ where: { slug } }).catch(() => null);
  if (!article) return {};
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: { canonical: `${getAppUrl()}/blog/${article.slug}` },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.blogArticle.findUnique({ where: { slug } }).catch(() => null);
  if (!article || article.status !== "PUBLISHED") notFound();
  return (
    <div>
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold">{article.title}</h1>
        <p className="mt-8 whitespace-pre-wrap leading-7 text-muted">{article.content}</p>
      </article>
      <MarketingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
          }),
        }}
      />
    </div>
  );
}
