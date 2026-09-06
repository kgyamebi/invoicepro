import { productSchema } from "@/lib/validation";
import { errorResponse, json } from "@/server/http";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const context = await getActiveContext(searchParams.get("businessId"));
    const q = searchParams.get("q")?.trim();
    const products = await prisma.product.findMany({
      where: {
        businessId: context.business.id,
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { taxRate: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return json({ products });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = productSchema.parse(await request.json());
    const context = await getActiveContext();
    const product = await prisma.product.create({
      data: {
        businessId: context.business.id,
        name: body.name,
        sku: body.sku,
        description: body.description,
        categoryId: body.categoryId,
        kind: body.kind ?? (body.trackStock === false ? "SERVICE" : "PRODUCT"),
        unit: body.unit || "pcs",
        sellingPrice: body.sellingPrice,
        costPrice: body.costPrice,
        trackStock: body.trackStock ?? body.kind !== "SERVICE",
        stockQuantity: body.stockQuantity || "0",
        lowStockThreshold: body.lowStockThreshold,
        constructionCategory: body.constructionCategory,
      },
    });
    return json({ product }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
