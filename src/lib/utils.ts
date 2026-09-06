import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function getAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || "InvoiceFlow";
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getAppTagline() {
  return (
    process.env.NEXT_PUBLIC_APP_TAGLINE ||
    "Professional invoices, quotations and receipts — without the expensive software."
  );
}
