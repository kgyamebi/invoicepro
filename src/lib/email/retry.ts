export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000] as const;
export const MAX_SEND_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

export function nextAttemptAtAfterFailure(attemptsAfterThisFailure: number, now = Date.now()) {
  const delay = RETRY_DELAYS_MS[attemptsAfterThisFailure - 1];
  if (delay == null) return null;
  return new Date(now + delay);
}

export function shouldMarkFailed(attemptsAfterThisFailure: number) {
  return attemptsAfterThisFailure >= MAX_SEND_ATTEMPTS;
}
