import { Card } from "@/components/ui";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export default async function InventoryPage() {
  const context = await getActiveContext();
  const products = await prisma.product.findMany({
    where: { businessId: context.business.id, deletedAt: null, trackStock: true },
    include: { inventoryMovements: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Inventory</h1>
      <p className="text-sm text-muted">
        Stock reduces when invoices are confirmed or paid, depending on business settings. Quotations never reduce stock.
      </p>
      {products.map((product) => (
        <Card key={product.id}>
          <div className="flex justify-between">
            <p className="font-medium">{product.name}</p>
            <p>{product.stockQuantity.toString()}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
