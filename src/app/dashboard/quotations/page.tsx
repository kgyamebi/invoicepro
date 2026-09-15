import { DocumentList } from "@/components/document-list";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export default async function QuotationsPage() {
  const context = await getActiveContext();
  const documents = await prisma.document.findMany({
    where: { businessId: context.business.id, type: "QUOTATION", deletedAt: null },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <DocumentList
      title="Quotations"
      empty="Create a quotation and send it for acceptance."
      hrefNew="/dashboard/quotations/new"
      basePath="/dashboard/quotations"
      currency={context.business.currencyCode}
      documents={documents}
    />
  );
}
