import { prisma } from "@/server/db";
import { emailQueueDepth } from "@/lib/email/queue";
import { pingRedis } from "./redis";
import {
  classifyEmailFailures,
  classifyEmailProvider,
  classifyEmailQueue,
  classifyEmailSuccessRate,
  overallEmailHealth,
  type EmailHealthRow,
} from "./email-health";

export async function collectEmailHealthReport() {
  const provider = process.env.EMAIL_PROVIDER || "console";
  const rows: EmailHealthRow[] = [classifyEmailProvider(provider)];
  const ping = await pingRedis();
  const depth = await emailQueueDepth();
  let pending = 0;
  let oldestPendingMinutes: number | null = null;
  let failed = 0;
  let sent = 0;
  let recent: {
    id: string;
    recipient: string;
    subject: string;
    provider: string;
    status: string;
    sentAt: Date | null;
    createdAt: Date;
    error: string | null;
  }[] = [];

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingCount, oldest, failedCount, sentCount, recentRows] = await Promise.all([
      prisma.emailLog.count({ where: { status: "PENDING" } }),
      prisma.emailLog.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      prisma.emailLog.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
      prisma.emailLog.count({
        where: { status: { in: ["SENT", "DELIVERED"] }, createdAt: { gte: since } },
      }),
      prisma.emailLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          recipient: true,
          subject: true,
          provider: true,
          status: true,
          sentAt: true,
          createdAt: true,
          error: true,
        },
      }),
    ]);
    pending = pendingCount + depth.ready + depth.delayed;
    oldestPendingMinutes = oldest ? (Date.now() - oldest.createdAt.getTime()) / 60000 : null;
    failed = failedCount;
    sent = sentCount;
    recent = recentRows;
  } catch {
    rows.push({ id: "email_log", status: "FAIL", detail: "Could not read EmailLog rows" });
  }

  rows.push(
    classifyEmailQueue({ redis: ping.ok, pending, oldestPendingMinutes }),
    classifyEmailFailures(failed, sent),
    classifyEmailSuccessRate(sent, failed),
  );

  return { rows, overall: overallEmailHealth(rows), recent, provider, pending, failed, sent };
}
