import { en, type Messages } from "./en";

const catalogs: Record<string, Messages> = { en };

export function t(locale = "en"): Messages {
  return catalogs[locale] ?? en;
}

export const SUPPORTED_LOCALES = ["en", "fr", "es", "pt", "ar", "zh", "hi", "sw"] as const;
