import { EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/money/currency";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";
import { ProductForm } from "./ui";

export default async function ProductsPage() {
  const context = await getActiveContext();
  const products = await prisma.product.findMany({
    where: { businessId: context.business.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Products</h1>
      <ProductForm />
      {!products.length ? (
        <EmptyState title="Add products to speed up invoicing." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {products.map((product) => (
            <div key={product.id} className="flex justify-between border-b border-line px-4 py-3 last:border-0">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted">{product.sku || product.kind}{product.trackStock ? ` · stock ${product.stockQuantity}` : ""}</p>
              </div>
              <p>{formatMoney(product.sellingPrice.toString(), context.business.currencyCode)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
