import type { MetadataRoute } from "next";
import { SEO_PAGES } from "@/lib/seo/catalog";
import { getAppUrl } from "@/lib/utils";
import { prisma } from "@/server/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const staticRoutes = [
    "",
    "/blog",
    "/privacy",
    "/terms",
    "/security",
    "/cookies",
    "/tools/invoice-calculator",
    "/tools/vat-calculator",
    "/tools/discount-calculator",
    "/tools/profit-margin-calculator",
    "/tools/quotation-calculator",
    "/tools/payment-calculator",
    ...SEO_PAGES.map((page) => `/${page.slug}`),
  ];
  const articles = await prisma.blogArticle.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  }).catch(() => []);
  return [
    ...staticRoutes.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...articles.map((article) => ({
      url: `${base}/blog/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
