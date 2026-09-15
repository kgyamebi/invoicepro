import type { CheckStatus } from "./startup";

export type EmailHealthRow = {
  id: string;
  status: CheckStatus;
  detail: string;
};

export function classifyEmailProvider(provider = "console"): EmailHealthRow {
  const value = provider.toLowerCase();
  if (value === "smtp" || value === "resend") {
    return { id: "provider", status: "PASS", detail: `Outbound provider is ${value}` };
  }
  return {
    id: "provider",
    status: process.env.NODE_ENV === "production" ? "FAIL" : "WARN",
    detail: "Outbound provider is console — messages are logged, not delivered",
  };
}

export function classifyEmailQueue(input: {
  redis: boolean;
  pending: number;
  oldestPendingMinutes: number | null;
}): EmailHealthRow {
  if (!input.redis && input.pending > 0) {
    return {
      id: "queue",
      status: "FAIL",
      detail: `${input.pending} pending emails and Redis is unavailable`,
    };
  }
  if (!input.redis) {
    return {
      id: "queue",
      status: process.env.NODE_ENV === "production" ? "FAIL" : "WARN",
      detail: "Redis is unavailable — the worker will poll EmailLog instead of the queue",
    };
  }
  if (input.oldestPendingMinutes !== null && input.oldestPendingMinutes >= 30) {
    return {
      id: "queue",
      status: "WARN",
      detail: `Oldest pending email is ${Math.round(input.oldestPendingMinutes)} minutes old`,
    };
  }
  if (input.pending >= 50) {
    return { id: "queue", status: "WARN", detail: `${input.pending} emails waiting in the queue` };
  }
  return { id: "queue", status: "PASS", detail: `${input.pending} pending jobs` };
}

export function classifyEmailFailures(failed: number, sent: number): EmailHealthRow {
  if (failed > 0 && sent === 0) {
    return {
      id: "failures",
      status: "FAIL",
      detail: `${failed} failed sends and no successful sends in the window`,
    };
  }
  if (failed >= 10) {
    return { id: "failures", status: "WARN", detail: `${failed} failed sends in the last 24 hours` };
  }
  return { id: "failures", status: "PASS", detail: `${failed} failed sends in the last 24 hours` };
}

export function classifyEmailSuccessRate(sent: number, failed: number): EmailHealthRow {
  const total = sent + failed;
  if (total === 0) {
    return {
      id: "success_rate",
      status: "WARN",
      detail: "No outbound email in the last 24 hours",
    };
  }
  const rate = Math.round((sent / total) * 100);
  if (rate < 80) {
    return { id: "success_rate", status: "FAIL", detail: `${rate}% success rate (${sent}/${total})` };
  }
  if (rate < 95) {
    return { id: "success_rate", status: "WARN", detail: `${rate}% success rate (${sent}/${total})` };
  }
  return { id: "success_rate", status: "PASS", detail: `${rate}% success rate (${sent}/${total})` };
}

export function overallEmailHealth(rows: EmailHealthRow[]): CheckStatus {
  if (rows.some((row) => row.status === "FAIL")) return "FAIL";
  if (rows.some((row) => row.status === "WARN")) return "WARN";
  return "PASS";
}
