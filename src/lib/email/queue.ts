import { prisma } from "@/server/db";
import { getRedis } from "@/lib/ops/redis";
import type { EmailKind } from "./kinds";

export const EMAIL_QUEUE_KEY = "invoiceflow:email:queue";
export const EMAIL_DELAYED_KEY = "invoiceflow:email:delayed";

export type EnqueueEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  kind: EmailKind;
  documentId?: string | null;
  organizationId?: string | null;
};

export async function enqueueEmail(input: EnqueueEmailInput) {
  const provider = process.env.EMAIL_PROVIDER || "console";
  const log = await prisma.emailLog.create({
    data: {
      recipient: input.to,
      subject: input.subject,
      provider,
      status: "PENDING",
      html: input.html,
      text: input.text,
      kind: input.kind,
      nextAttemptAt: new Date(),
      documentId: input.documentId || undefined,
      organizationId: input.organizationId || undefined,
    },
  });
  await pushEmailJob(log.id, Date.now());
  if (process.env.EMAIL_SYNC_DELIVER === "true") {
    const { deliverEmailJob } = await import("./deliver");
    await deliverEmailJob(log.id);
  } else {
    void import("./deliver")
      .then((mod) => mod.processEmailQueue())
      .catch(() => undefined);
  }
  return log;
}

export async function pushEmailJob(logId: string, availableAtMs = Date.now()) {
  const redis = getRedis();
  if (!redis) return false;
  try {
    if (redis.status === "wait") await redis.connect();
    if (availableAtMs > Date.now() + 500) {
      await redis.zadd(EMAIL_DELAYED_KEY, availableAtMs, logId);
    } else {
      await redis.lpush(EMAIL_QUEUE_KEY, logId);
    }
    return true;
  } catch {
    return false;
  }
}

export async function promoteDelayedEmailJobs(limit = 50) {
  const redis = getRedis();
  if (!redis) return 0;
  try {
    if (redis.status === "wait") await redis.connect();
    const ids = await redis.zrangebyscore(EMAIL_DELAYED_KEY, 0, Date.now(), "LIMIT", 0, limit);
    if (!ids.length) return 0;
    await redis.zrem(EMAIL_DELAYED_KEY, ...ids);
    await redis.lpush(EMAIL_QUEUE_KEY, ...ids);
    return ids.length;
  } catch {
    return 0;
  }
}

export async function popEmailJobs(limit = 20) {
  const redis = getRedis();
  if (!redis) return [] as string[];
  const ids: string[] = [];
  try {
    if (redis.status === "wait") await redis.connect();
    for (let i = 0; i < limit; i += 1) {
      const id = await redis.lpop(EMAIL_QUEUE_KEY);
      if (!id) break;
      ids.push(id);
    }
  } catch {
    return ids;
  }
  return ids;
}

export async function emailQueueDepth() {
  const redis = getRedis();
  if (!redis) return { ready: 0, delayed: 0, redis: false as const };
  try {
    if (redis.status === "wait") await redis.connect();
    const [ready, delayed] = await Promise.all([redis.llen(EMAIL_QUEUE_KEY), redis.zcard(EMAIL_DELAYED_KEY)]);
    return { ready, delayed, redis: true as const };
  } catch {
    return { ready: 0, delayed: 0, redis: false as const };
  }
}
