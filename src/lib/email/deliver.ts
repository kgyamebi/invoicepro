import { prisma } from "@/server/db";
import { sendEmail } from "./service";
import { PDF_EMAIL_KINDS, type EmailKind } from "./kinds";
import { nextAttemptAtAfterFailure, shouldMarkFailed } from "./retry";
import { popEmailJobs, promoteDelayedEmailJobs, pushEmailJob } from "./queue";

const LOCK_MS = 120_000;

export async function deliverEmailJob(logId: string) {
  const claimed = await prisma.emailLog.updateMany({
    where: {
      id: logId,
      status: "PENDING",
      OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(Date.now() - LOCK_MS) } }],
    },
    data: { lockedAt: new Date() },
  });
  if (claimed.count === 0) return { skipped: true as const };

  const log = await prisma.emailLog.findUnique({ where: { id: logId } });
  if (!log || log.status !== "PENDING") return { skipped: true as const };

  try {
    const attachments = await loadAttachments(log.kind as EmailKind, log.documentId);
    const result = await sendEmail({
      to: log.recipient,
      subject: log.subject,
      html: log.html,
      text: log.text || undefined,
      attachments,
    });
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: result.delivered ? "DELIVERED" : "SENT",
        provider: result.provider,
        messageId: result.messageId,
        sentAt: new Date(),
        deliveredAt: result.delivered ? new Date() : null,
        error: null,
        lockedAt: null,
      },
    });
    return { ok: true as const };
  } catch (error) {
    const attempts = log.attempts + 1;
    const reason = error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed.";
    if (shouldMarkFailed(attempts)) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          attempts,
          error: reason,
          lockedAt: null,
        },
      });
      return { ok: false as const, failed: true as const };
    }
    const nextAttemptAt = nextAttemptAtAfterFailure(attempts) ?? new Date(Date.now() + 60_000);
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "PENDING",
        attempts,
        error: reason,
        nextAttemptAt,
        lockedAt: null,
      },
    });
    await pushEmailJob(log.id, nextAttemptAt.getTime());
    return { ok: false as const, retryAt: nextAttemptAt };
  }
}

async function loadAttachments(kind: EmailKind, documentId: string | null) {
  if (!documentId || !PDF_EMAIL_KINDS.has(kind)) return undefined;
  try {
    const { renderDocumentPdfAttachment } = await import("@/lib/pdf/from-document");
    const file = await renderDocumentPdfAttachment(documentId);
    return file ? [file] : undefined;
  } catch {
    return undefined;
  }
}

export async function processEmailQueue() {
  await promoteDelayedEmailJobs();
  const fromRedis = await popEmailJobs(20);
  const due = await prisma.emailLog.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: { lte: new Date() },
      OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(Date.now() - LOCK_MS) } }],
    },
    orderBy: { nextAttemptAt: "asc" },
    take: 20,
    select: { id: true },
  });
  const ids = [...new Set([...fromRedis, ...due.map((row) => row.id)])];
  for (const id of ids) {
    await deliverEmailJob(id);
  }
  return ids.length;
}
