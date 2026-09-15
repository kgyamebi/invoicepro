import { DocumentList } from "@/components/document-list";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export default async function ReceiptsPage() {
  const context = await getActiveContext();
  const documents = await prisma.document.findMany({
    where: { businessId: context.business.id, type: "RECEIPT", deletedAt: null },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <DocumentList
      title="Receipts"
      empty="Create a receipt from an invoice after you record a payment."
      hrefNew="/dashboard/invoices"
      basePath="/dashboard/receipts"
      currency={context.business.currencyCode}
      documents={documents}
    />
  );
}
