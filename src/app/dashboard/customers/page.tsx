import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";
import { CustomerForm } from "./ui";

export default async function CustomersPage() {
  const context = await getActiveContext();
  const customers = await prisma.customer.findMany({
    where: { businessId: context.business.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Customers</h1>
      <CustomerForm />
      {!customers.length ? (
        <EmptyState title="Add your first customer." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className="block border-b border-line px-4 py-3 last:border-b-0"
            >
              <p className="font-medium">{customer.company || customer.name}</p>
              <p className="text-sm text-muted">{customer.phone || customer.email || "No contact"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
