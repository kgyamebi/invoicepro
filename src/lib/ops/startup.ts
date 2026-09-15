import { isAuthSecretStrong } from "@/lib/auth/session-token";

export type CheckStatus = "PASS" | "WARN" | "FAIL";

export type StartupCheck = {
  id: string;
  status: CheckStatus;
  detail: string;
};

function hasValue(value?: string) {
  return Boolean(value && value.trim());
}

function keyLooksValid(value: string, prefixes: string[]) {
  if (!hasValue(value)) return false;
  if (prefixes.some((prefix) => value.startsWith(prefix))) return value.length >= 16;
  return value.length >= 16;
}

export function collectStartupChecks(env: NodeJS.ProcessEnv = process.env): StartupCheck[] {
  const production = env.NODE_ENV === "production";
  const checks: StartupCheck[] = [];

  const databaseUrl = env.DATABASE_URL || "";
  checks.push({
    id: "database",
    status: databaseUrl.startsWith("postgres") ? "PASS" : "FAIL",
    detail: databaseUrl.startsWith("postgres") ? "DATABASE_URL is set" : "DATABASE_URL is missing or not postgres",
  });

  const secret = env.AUTH_SECRET || "";
  checks.push({
    id: "auth_secret",
    status: isAuthSecretStrong(secret) ? "PASS" : production ? "FAIL" : "WARN",
    detail: isAuthSecretStrong(secret)
      ? "AUTH_SECRET has at least 32 characters"
      : "AUTH_SECRET is missing, short, or a placeholder",
  });

  const emailProvider = env.EMAIL_PROVIDER || "console";
  const smtpReady = emailProvider === "smtp" && hasValue(env.SMTP_HOST) && hasValue(env.EMAIL_FROM);
  const resendReady = emailProvider === "resend" && hasValue(env.EMAIL_API_KEY) && hasValue(env.EMAIL_FROM);
  checks.push({
    id: "smtp",
    status: smtpReady || resendReady ? "PASS" : production ? "FAIL" : "WARN",
    detail: smtpReady || resendReady ? `Email provider ${emailProvider}` : "Email still on console — receipts and verify links will not send",
  });

  const stripe = env.STRIPE_SECRET_KEY || "";
  checks.push(providerCheck("stripe", stripe, ["sk_test_", "sk_live_"], env.STRIPE_WEBHOOK_SECRET));
  const paystack = env.PAYSTACK_SECRET_KEY || "";
  checks.push(providerCheck("paystack", paystack, ["sk_test_", "sk_live_"], env.PAYSTACK_WEBHOOK_SECRET || paystack));
  const flutterwave = env.FLUTTERWAVE_SECRET_KEY || "";
  checks.push(providerCheck("flutterwave", flutterwave, ["FLWSECK_"], env.FLUTTERWAVE_WEBHOOK_SECRET));
  if (!stripe && !paystack && !flutterwave) {
    checks.push({
      id: "payments",
      status: production ? "FAIL" : "WARN",
      detail: "No payment provider is configured",
    });
  }

  const redis = env.REDIS_URL || "";
  checks.push({
    id: "redis",
    status: redis.startsWith("redis") ? "PASS" : production ? "FAIL" : "WARN",
    detail: redis.startsWith("redis") ? "REDIS_URL is set" : "Rate limits will stay in-memory without REDIS_URL",
  });

  const sentry = env.SENTRY_DSN || "";
  checks.push({
    id: "monitoring",
    status: hasValue(sentry) ? "PASS" : "WARN",
    detail: hasValue(sentry) ? "SENTRY_DSN is set" : "No SENTRY_DSN — errors stay in process logs",
  });

  return checks;
}

function providerCheck(id: string, secret: string, prefixes: string[], webhook?: string): StartupCheck {
  if (!secret) {
    return { id, status: "WARN", detail: `${id} is not configured` };
  }
  if (!keyLooksValid(secret, prefixes)) {
    return { id, status: "FAIL", detail: `${id} secret looks malformed` };
  }
  if (!webhook) {
    return { id, status: "WARN", detail: `${id} secret is set but webhook secret is missing` };
  }
  return { id, status: "PASS", detail: `${id} keys look valid` };
}

export function assertProductionStartup(env: NodeJS.ProcessEnv = process.env) {
  const checks = collectStartupChecks(env);
  const failed = checks.filter((item) => item.status === "FAIL");
  if (env.NODE_ENV === "production" && failed.length) {
    const message = failed.map((item) => `${item.id}: ${item.detail}`).join("; ");
    throw new Error(`Startup validation failed. ${message}`);
  }
  return checks;
}

export function requireEmailVerification(env: NodeJS.ProcessEnv = process.env) {
  if (env.REQUIRE_EMAIL_VERIFICATION === "false") return false;
  return env.NODE_ENV === "production" || env.REQUIRE_EMAIL_VERIFICATION === "true";
}
