import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/marketing-nav";
import { Card } from "@/components/ui";
import { prisma } from "@/server/db";

export default async function BlogPage() {
  const articles = await prisma.blogArticle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  }).catch(() => []);
  return (
    <div>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold">Guides</h1>
        <div className="mt-8 space-y-4">
          {articles.map((article) => (
            <Link key={article.id} href={`/blog/${article.slug}`}>
              <Card>
                <h2 className="text-xl font-medium">{article.title}</h2>
                <p className="mt-2 text-sm text-muted">{article.excerpt}</p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
