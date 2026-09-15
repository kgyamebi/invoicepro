import { notFound, redirect } from "next/navigation";
import { DocumentEditor } from "@/components/document-editor";
import { PageHeader } from "@/components/ui";
import { toInputDate } from "@/lib/date";
import { documentDashboardPath, type DocumentTypeKey } from "@/lib/documents/types";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getActiveContext();
  const document = await prisma.document.findFirst({
    where: { id, businessId: context.business.id, deletedAt: null },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!document) notFound();
  if (document.type === "RECEIPT" || document.status === "cancelled") {
    redirect(documentDashboardPath(document.type, id));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Edit ${document.number}`}
        description="Change lines, dates, or notes. Amount already paid is kept and the balance is recalculated."
      />
      <DocumentEditor
        type={document.type as DocumentTypeKey}
        documentId={document.id}
        currency={document.currencyCode}
        initial={{
          customerId: document.customerId || "",
          notes: document.notes || "",
          terms: document.terms || "",
          paymentTerms: document.paymentTerms || "",
          shippingAmount: document.shippingAmount.toString(),
          documentDiscountType: document.documentDiscountType === "FIXED" ? "FIXED" : document.documentDiscountType === "PERCENT" ? "PERCENT" : "NONE",
          documentDiscountValue: document.documentDiscountValue.toString(),
          expiryDate: toInputDate(document.expiryDate),
          dueDate: toInputDate(document.dueDate),
          items: document.items.map((item) => ({
            productId: item.productId || undefined,
            name: item.name,
            category: item.category || "",
            quantity: item.quantity.toString(),
            unit: item.unit,
            unitPrice: item.unitPrice.toString(),
            discountType: item.discountType === "FIXED" ? "FIXED" : item.discountType === "PERCENT" ? "PERCENT" : "NONE",
            discountValue: item.discountValue.toString(),
            taxRate: item.taxRate.toString(),
          })),
        }}
      />
    </div>
  );
}
