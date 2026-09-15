import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return json({ error: error.message }, error.status);
  }
  if (error instanceof ZodError) {
    return json({ error: "Please check the form and try again.", details: error.flatten() }, 422);
  }
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 400;
  const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  return json({ error: message }, status || 400);
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max = Number(process.env.RATE_LIMIT_MAX || 120)) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60) * 1000;
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > max) {
    throw new AuthError("Too many requests. Please wait a moment.", 429);
  }
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
