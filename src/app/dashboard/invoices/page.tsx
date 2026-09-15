import { DocumentList } from "@/components/document-list";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export default async function InvoicesPage() {
  const context = await getActiveContext();
  const documents = await prisma.document.findMany({
    where: { businessId: context.business.id, type: "INVOICE", deletedAt: null },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <DocumentList
      title="Invoices"
      empty="Create your first invoice in under a minute."
      hrefNew="/dashboard/invoices/new"
      basePath="/dashboard/invoices"
      currency={context.business.currencyCode}
      documents={documents}
    />
  );
}
