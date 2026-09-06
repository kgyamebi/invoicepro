import nodemailer from "nodemailer";
import { getAppName, getAppUrl } from "@/lib/utils";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `noreply@localhost`,
    ...input,
  });
}

export async function sendEmail(input: EmailInput) {
  const provider = process.env.EMAIL_PROVIDER || "console";
  if (provider === "console" || !process.env.SMTP_HOST) {
    console.info("[email]", input.to, input.subject);
    return { delivered: false, provider: "console" };
  }
  if (provider === "smtp") {
    await sendSmtp(input);
    return { delivered: true, provider: "smtp" };
  }
  if (provider === "resend" && process.env.EMAIL_API_KEY) {
    await fetch("https://api.resend.com/emails", {
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
      }),
    });
    return { delivered: true, provider: "resend" };
  }
  console.info("[email]", input.to, input.subject);
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
  const app = getAppName();
  return {
    subject: `${input.documentLabel} ${input.number} from ${app}`,
    html: `
      <p>Hello ${input.customerName},</p>
      <p>Please find ${input.documentLabel.toLowerCase()} <strong>${input.number}</strong>.</p>
      <p>Total: <strong>${input.total}</strong>${input.dueLabel ? `<br/>${input.dueLabel}` : ""}</p>
      <p><a href="${input.viewUrl}">View or download</a></p>
      <p>Thank you.</p>
    `,
    text: `Hello ${input.customerName}, please view ${input.documentLabel} ${input.number}. Total ${input.total}. ${input.viewUrl}`,
  };
}

export function authEmail(kind: "verify" | "reset", token: string) {
  const url =
    kind === "verify"
      ? `${getAppUrl()}/verify-email?token=${token}`
      : `${getAppUrl()}/reset-password?token=${token}`;
  const subject = kind === "verify" ? "Verify your email" : "Reset your password";
  return {
    subject,
    html: `<p>Use this link to continue:</p><p><a href="${url}">${url}</a></p>`,
    text: url,
  };
}
