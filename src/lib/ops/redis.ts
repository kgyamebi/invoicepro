import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis | null; redisDisabled?: boolean };

export function getRedis() {
  if (globalForRedis.redisDisabled) return null;
  if (globalForRedis.redis) return globalForRedis.redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRedis.redisDisabled = true;
    return null;
  }
  try {
    const client = new Redis(url, { maxRetriesPerRequest: 1, enableReadyCheck: true, lazyConnect: true });
    client.on("error", () => {
      globalForRedis.redisDisabled = true;
    });
    globalForRedis.redis = client;
    return client;
  } catch {
    globalForRedis.redisDisabled = true;
    return null;
  }
}

export async function pingRedis() {
  const redis = getRedis();
  if (!redis) return { ok: false, reason: "unconfigured" as const };
  try {
    if (redis.status === "wait") await redis.connect();
    const pong = await redis.ping();
    return { ok: pong === "PONG", reason: "ok" as const };
  } catch {
    return { ok: false, reason: "unreachable" as const };
  }
}
