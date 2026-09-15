import { getAppName, getAppUrl } from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapBrand(input: { title: string; preview: string; html: string; text: string; ctaUrl?: string; ctaLabel?: string }) {
  const app = getAppName();
  const origin = getAppUrl();
  const cta = input.ctaUrl
    ? `<p style="margin:24px 0 8px"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:#0B3D3C;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">${escapeHtml(input.ctaLabel || "Continue")}</a></p>`
    : "";
  return {
    html: `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F3F0EA;font-family:Arial,Helvetica,sans-serif;color:#0C1222">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F0EA;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #E4DFD4;border-radius:16px;overflow:hidden">
        <tr><td style="background:#0B3D3C;color:#ffffff;padding:20px 28px">
          <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:.8">${escapeHtml(app)}</p>
          <h1 style="margin:8px 0 0;font-size:22px">${escapeHtml(input.title)}</h1>
        </td></tr>
        <tr><td style="padding:28px">
          ${input.html}
          ${cta}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#FAF8F4;color:#5C6574;font-size:12px">
          Sent by ${escapeHtml(app)} · <a href="${escapeHtml(origin)}" style="color:#0B3D3C">${escapeHtml(origin.replace(/^https?:\/\//, ""))}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    text: `${input.title}\n\n${input.text}${input.ctaUrl ? `\n\n${input.ctaLabel || "Continue"}: ${input.ctaUrl}` : ""}\n\n${app}`,
  };
}

export const emailTemplates = {
  welcome(input: { name: string }) {
    const app = getAppName();
    const origin = getAppUrl();
    const name = escapeHtml(input.name);
    const wrapped = wrapBrand({
      title: `Welcome to ${app}`,
      preview: `Your workspace is ready.`,
      html: `<p>Hello ${name},</p><p>Your ${escapeHtml(app)} workspace is ready. Create quotations, send invoices, and collect payments from one place.</p>`,
      text: `Hello ${input.name}, your ${app} workspace is ready.`,
      ctaUrl: `${origin}/dashboard`,
      ctaLabel: "Open dashboard",
    });
    return { subject: `Welcome to ${app}`, ...wrapped };
  },

  verification(input: { url: string }) {
    const wrapped = wrapBrand({
      title: "Verify your email",
      preview: "Confirm your email address to continue.",
      html: `<p>Use this link to verify your email address and finish setting up your account.</p><p style="word-break:break-all"><a href="${escapeHtml(input.url)}" style="color:#0B3D3C">${escapeHtml(input.url)}</a></p>`,
      text: `Verify your email: ${input.url}`,
      ctaUrl: input.url,
      ctaLabel: "Verify email",
    });
    return { subject: "Verify your email", ...wrapped };
  },

  passwordReset(input: { url: string }) {
    const wrapped = wrapBrand({
      title: "Reset your password",
      preview: "Choose a new password for your account.",
      html: `<p>We received a request to reset your password. If you did not ask for this, you can ignore this email.</p><p style="word-break:break-all"><a href="${escapeHtml(input.url)}" style="color:#0B3D3C">${escapeHtml(input.url)}</a></p>`,
      text: `Reset your password: ${input.url}`,
      ctaUrl: input.url,
      ctaLabel: "Reset password",
    });
    return { subject: "Reset your password", ...wrapped };
  },

  quote(input: { customerName: string; number: string; total: string; dueLabel?: string; viewUrl: string }) {
    return documentNotice("Quotation", input);
  },

  invoice(input: { customerName: string; number: string; total: string; dueLabel?: string; viewUrl: string }) {
    return documentNotice("Invoice", input);
  },

  receipt(input: { customerName: string; number: string; total: string; dueLabel?: string; viewUrl: string }) {
    return documentNotice("Receipt", input);
  },

  paymentReceived(input: {
    customerName?: string | null;
    invoiceNumber: string;
    amount: string;
    reference: string;
    receiptUrl: string;
  }) {
    const name = escapeHtml(input.customerName || "there");
    const wrapped = wrapBrand({
      title: "Payment Received",
      preview: `We received ${input.amount} for ${input.invoiceNumber}.`,
      html: `<p>Hello ${name},</p><p>We received your payment.</p>${paymentDetailsHtml(input)}`,
      text: `Payment Received. Invoice ${input.invoiceNumber}. Amount ${input.amount}. Reference ${input.reference}. Receipt: ${input.receiptUrl}`,
      ctaUrl: input.receiptUrl,
      ctaLabel: "View receipt",
    });
    return { subject: "Payment Received", ...wrapped };
  },

  invoicePaid(input: {
    invoiceNumber: string;
    amount: string;
    reference: string;
    receiptUrl: string;
  }) {
    const wrapped = wrapBrand({
      title: "Invoice Paid",
      preview: `${input.invoiceNumber} was paid.`,
      html: `<p>A customer payment was received.</p>${paymentDetailsHtml(input)}`,
      text: `Invoice Paid. Invoice ${input.invoiceNumber}. Amount ${input.amount}. Reference ${input.reference}. Receipt: ${input.receiptUrl}`,
      ctaUrl: input.receiptUrl,
      ctaLabel: "View receipt",
    });
    return { subject: "Invoice Paid", ...wrapped };
  },

  refundIssued(input: { name?: string | null; amount: string; reference: string }) {
    const name = escapeHtml(input.name || "there");
    const wrapped = wrapBrand({
      title: "Refund Issued",
      preview: `A refund of ${input.amount} was issued.`,
      html: `<p>Hello ${name},</p><p>A refund of <strong>${escapeHtml(input.amount)}</strong> was issued.</p><p>Reference: <strong>${escapeHtml(input.reference)}</strong></p>`,
      text: `Refund Issued. Amount ${input.amount}. Reference ${input.reference}`,
    });
    return { subject: "Refund Issued", ...wrapped };
  },

  subscriptionActivated(input: { name?: string | null; planName: string }) {
    const name = escapeHtml(input.name || "there");
    const wrapped = wrapBrand({
      title: "Subscription Activated",
      preview: `${input.planName} is now active.`,
      html: `<p>Hello ${name},</p><p>Your <strong>${escapeHtml(input.planName)}</strong> subscription is active. Thank you for choosing ${escapeHtml(getAppName())}.</p>`,
      text: `Subscription Activated. Plan ${input.planName}.`,
      ctaUrl: `${getAppUrl()}/dashboard/billing`,
      ctaLabel: "View billing",
    });
    return { subject: "Subscription Activated", ...wrapped };
  },

  subscriptionRenewed(input: { name?: string | null; planName: string }) {
    const name = escapeHtml(input.name || "there");
    const wrapped = wrapBrand({
      title: "Subscription Renewed",
      preview: `${input.planName} renewed successfully.`,
      html: `<p>Hello ${name},</p><p>Your <strong>${escapeHtml(input.planName)}</strong> subscription renewed successfully.</p>`,
      text: `Subscription Renewed. Plan ${input.planName}.`,
      ctaUrl: `${getAppUrl()}/dashboard/billing`,
      ctaLabel: "View billing",
    });
    return { subject: "Subscription Renewed", ...wrapped };
  },

  teamInvite(input: { role: string; url: string }) {
    const wrapped = wrapBrand({
      title: "Team invitation",
      preview: `You were invited as ${input.role}.`,
      html: `<p>You were invited as <strong>${escapeHtml(input.role)}</strong>.</p><p style="word-break:break-all"><a href="${escapeHtml(input.url)}" style="color:#0B3D3C">${escapeHtml(input.url)}</a></p>`,
      text: `You were invited as ${input.role}. ${input.url}`,
      ctaUrl: input.url,
      ctaLabel: "Accept invitation",
    });
    return { subject: "Team invitation", ...wrapped };
  },
};

function paymentDetailsHtml(input: { invoiceNumber: string; amount: string; reference: string; receiptUrl: string }) {
  return `<p>Invoice: <strong>${escapeHtml(input.invoiceNumber)}</strong></p>
      <p>Amount: <strong>${escapeHtml(input.amount)}</strong></p>
      <p>Transaction reference: <strong>${escapeHtml(input.reference)}</strong></p>
      <p><a href="${escapeHtml(input.receiptUrl)}" style="color:#0B3D3C">View receipt</a></p>`;
}

function documentNotice(
  documentLabel: string,
  input: { customerName: string; number: string; total: string; dueLabel?: string; viewUrl: string },
) {
  const app = getAppName();
  const wrapped = wrapBrand({
    title: `${documentLabel} ${input.number}`,
    preview: `Please find ${documentLabel.toLowerCase()} ${input.number}.`,
    html: `<p>Hello ${escapeHtml(input.customerName)},</p>
      <p>Please find ${escapeHtml(documentLabel.toLowerCase())} <strong>${escapeHtml(input.number)}</strong>.</p>
      <p>Total: <strong>${escapeHtml(input.total)}</strong>${input.dueLabel ? `<br/>${escapeHtml(input.dueLabel)}` : ""}</p>
      <p>A PDF copy is attached when available. You can also use the share link below.</p>`,
    text: `Hello ${input.customerName}, please view ${documentLabel} ${input.number}. Total ${input.total}. ${input.viewUrl}`,
    ctaUrl: input.viewUrl,
    ctaLabel: "View or download",
  });
  return { subject: `${documentLabel} ${input.number} from ${app}`, ...wrapped };
}

export function documentTemplateForLabel(documentLabel: string) {
  const value = documentLabel.toLowerCase();
  if (value.includes("receipt")) return emailTemplates.receipt;
  if (value.includes("quot") || value.includes("estimate")) return emailTemplates.quote;
  return emailTemplates.invoice;
}
