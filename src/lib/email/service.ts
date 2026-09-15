import nodemailer from "nodemailer";
import { getAppUrl } from "@/lib/utils";
import { documentTemplateForLabel, emailTemplates } from "./templates";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

async function sendSmtp(input: EmailInput) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `noreply@localhost`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments?.map((file) => ({
      filename: file.filename,
      content: file.content,
      contentType: file.contentType || "application/pdf",
    })),
  });
  return typeof info.messageId === "string" ? info.messageId : undefined;
}

export async function sendEmail(input: EmailInput) {
  const provider = process.env.EMAIL_PROVIDER || "console";
  if (provider === "smtp" && process.env.SMTP_HOST) {
    const messageId = await sendSmtp(input);
    return { delivered: true, provider: "smtp", messageId };
  }
  if (provider === "resend" && process.env.EMAIL_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments?.map((file) => ({
          filename: file.filename,
          content: file.content.toString("base64"),
        })),
      }),
    });
    if (!response.ok) {
      throw new Error("Email delivery failed.");
    }
    const payload = (await response.json().catch(() => ({}))) as { id?: string };
    return { delivered: true, provider: "resend", messageId: payload.id };
  }
  console.info(
    "[email]",
    input.to,
    input.subject,
    input.attachments?.map((file) => file.filename).join(",") || "",
  );
  return { delivered: false, provider: "console" };
}

export function documentEmail(input: {
  customerName: string;
  documentLabel: string;
  number: string;
  total: string;
  dueLabel?: string;
  viewUrl: string;
}) {
  return documentTemplateForLabel(input.documentLabel)(input);
}

export function invoicePaymentEmails(input: {
  invoiceNumber: string;
  amount: string;
  reference: string;
  receiptUrl: string;
  customerName?: string | null;
}) {
  return {
    customer: emailTemplates.paymentReceived(input),
    business: emailTemplates.invoicePaid(input),
  };
}

export function authEmail(kind: "verify" | "reset", token: string) {
  const url =
    kind === "verify"
      ? `${getAppUrl()}/verify-email?token=${token}`
      : `${getAppUrl()}/reset-password?token=${token}`;
  return kind === "verify" ? emailTemplates.verification({ url }) : emailTemplates.passwordReset({ url });
}
