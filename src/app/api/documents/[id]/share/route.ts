import { documentEmail, sendEmail } from "@/lib/email/service";
import { formatMoney } from "@/lib/money/currency";
import { getAppUrl } from "@/lib/utils";
import { documentWhatsAppMessage, whatsappShareUrl } from "@/lib/whatsapp";
import { labelForDocumentType } from "@/lib/documents/types";
import { createShareLink, setDocumentStatus } from "@/server/documents";
import { incrementUsage } from "@/server/usage";
import { errorResponse, json } from "@/server/http";
import { assertDocumentAccess } from "@/server/tenant";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await assertDocumentAccess(id, "invoice.edit");
    const body = (await request.json().catch(() => ({}))) as { channel?: string; expiresInDays?: number };
    const token = await createShareLink(id, body.expiresInDays);
    const viewUrl = `${getAppUrl()}/document/view/${token}`;
    const label = labelForDocumentType(access.document.type);
    const total = formatMoney(access.document.grandTotal.toString(), access.document.currencyCode);
    const customerName = access.document.customer?.name || "there";
    const message = documentWhatsAppMessage({
      customerName,
      documentLabel: label,
      number: access.document.number,
      total,
      validUntil: access.document.expiryDate?.toISOString().slice(0, 10),
      viewUrl,
    });
    if (body.channel === "email" && access.document.customer?.email) {
      const mail = documentEmail({
        customerName,
        documentLabel: label,
        number: access.document.number,
        total,
        dueLabel: access.document.dueDate
          ? `Due: ${access.document.dueDate.toISOString().slice(0, 10)}`
          : undefined,
        viewUrl,
      });
      await sendEmail({ to: access.document.customer.email, ...mail });
    }
    if (access.document.status === "draft") {
      await setDocumentStatus(id, "sent", access.user.id);
    }
    await incrementUsage(access.organization.id, "exports");
    return json({
      token,
      viewUrl,
      whatsappUrl: whatsappShareUrl(access.document.customer?.whatsapp || access.document.customer?.phone, message),
      message,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
