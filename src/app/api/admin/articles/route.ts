import { z } from "zod";
import { AuthError, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "SUPER_ADMIN") throw new AuthError("Admin only.", 403);
    const body = z
      .object({
        slug: z.string(),
        title: z.string(),
        excerpt: z.string(),
        content: z.string(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publish: z.boolean().optional(),
      })
      .parse(await request.json());
    const article = await prisma.blogArticle.create({
      data: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt,
        content: body.content,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        tags: body.tags ?? [],
        status: body.publish ? "PUBLISHED" : "DRAFT",
        publishedAt: body.publish ? new Date() : null,
        authorId: user.id,
      },
    });
    return json({ article }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
