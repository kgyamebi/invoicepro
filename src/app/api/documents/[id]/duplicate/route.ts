import { createDocument, serializeDocument } from "@/server/documents";
import { errorResponse, json } from "@/server/http";
import { assertDocumentAccess } from "@/server/tenant";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await assertDocumentAccess(id, "invoice.create");
    const source = access.document;
    const document = await createDocument({
      organizationId: access.organization.id,
      businessId: access.business.id,
      userId: access.user.id,
      payload: {
        type: source.type,
        customerId: source.customerId,
        notes: source.notes,
        terms: source.terms,
        paymentTerms: source.paymentTerms,
        templateKey: source.templateKey,
        documentDiscountType: source.documentDiscountType,
        documentDiscountValue: source.documentDiscountValue.toString(),
        shippingAmount: source.shippingAmount.toString(),
        otherChargesAmount: source.otherChargesAmount.toString(),
        items: source.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.description,
          category: item.category,
          quantity: item.quantity.toString(),
          unit: item.unit,
          unitPrice: item.unitPrice.toString(),
          discountType: item.discountType,
          discountValue: item.discountValue.toString(),
          taxName: item.taxName,
          taxRate: item.taxRate.toString(),
          taxInclusive: item.taxInclusive,
        })),
      },
    });
    return json({ document: serializeDocument(document) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
