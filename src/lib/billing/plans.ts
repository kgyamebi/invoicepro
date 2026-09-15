export const FREE_PLAN_KEY = "free";
export const SOLO_PLAN_KEY = "solo";
export const BUSINESS_PLAN_KEY = "business";
export const EARLY_ADOPTER_PLAN_KEY = "early-adopter";
export const EARLY_ADOPTER_CAP = 100;

export const PUBLIC_PLAN_KEYS = [
  FREE_PLAN_KEY,
  SOLO_PLAN_KEY,
  BUSINESS_PLAN_KEY,
  EARLY_ADOPTER_PLAN_KEY,
] as const;

export type PlanReportsLevel = "none" | "basic" | "advanced";

export type PlanFeatureSet = {
  invoiceLimit: number | null;
  quotationLimit: number | null;
  customerLimit: number | null;
  whatsapp: boolean;
  emailShare: boolean;
  reports: PlanReportsLevel;
  customLogo: boolean;
  invoiceflowBranding: boolean;
  teams: boolean;
  prioritySupport: boolean;
};

export type CatalogPrice = {
  currencyCode: "USD";
  interval: "MONTHLY" | "YEARLY" | "ONE_TIME";
  amount: string;
};

export type PlanCatalogEntry = {
  key: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  recommended?: boolean;
  badge?: string | null;
  limitedOffer?: boolean;
  documentLimit: number | null;
  pdfLimit: number | null;
  aiLimit: number;
  userLimit: number;
  businessLimit: number;
  fairUseCap: number | null;
  monthlyUsd: string | null;
  annualUsd: string | null;
  oneTimeUsd: string | null;
  features: PlanFeatureSet;
  bullets: string[];
  prices: CatalogPrice[];
};

const unlimited = {
  invoiceLimit: null,
  quotationLimit: null,
  customerLimit: null,
} as const;

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    key: FREE_PLAN_KEY,
    name: "Free",
    description: "Send your first quotations and invoices with no credit card required.",
    sortOrder: 0,
    isActive: true,
    badge: null,
    documentLimit: null,
    pdfLimit: null,
    aiLimit: 0,
    userLimit: 1,
    businessLimit: 1,
    fairUseCap: null,
    monthlyUsd: "0",
    annualUsd: null,
    oneTimeUsd: null,
    features: {
      invoiceLimit: 5,
      quotationLimit: 5,
      customerLimit: 5,
      whatsapp: true,
      emailShare: true,
      reports: "basic",
      customLogo: false,
      invoiceflowBranding: true,
      teams: false,
      prioritySupport: false,
    },
    bullets: [
      "5 invoices per month",
      "5 quotations per month",
      "5 customers",
      "InvoiceFlow branding on PDFs",
      "Basic reports",
      "Single user",
    ],
    prices: [{ currencyCode: "USD", interval: "MONTHLY", amount: "0" }],
  },
  {
    key: SOLO_PLAN_KEY,
    name: "Solo",
    description: "Unlimited invoicing for freelancers and one-person businesses.",
    sortOrder: 1,
    isActive: true,
    recommended: true,
    badge: "Most Popular",
    documentLimit: null,
    pdfLimit: null,
    aiLimit: 0,
    userLimit: 1,
    businessLimit: 1,
    fairUseCap: 20000,
    monthlyUsd: "2",
    annualUsd: "20",
    oneTimeUsd: null,
    features: {
      ...unlimited,
      whatsapp: true,
      emailShare: true,
      reports: "basic",
      customLogo: false,
      invoiceflowBranding: false,
      teams: false,
      prioritySupport: false,
    },
    bullets: [
      "Unlimited invoices",
      "Unlimited quotations",
      "Unlimited customers",
      "Unlimited products/services",
      "PDF downloads",
      "WhatsApp sharing",
      "Email sharing",
      "Payment tracking",
      "Receipt generation",
      "Single user",
    ],
    prices: [
      { currencyCode: "USD", interval: "MONTHLY", amount: "2" },
      { currencyCode: "USD", interval: "YEARLY", amount: "20" },
    ],
  },
  {
    key: BUSINESS_PLAN_KEY,
    name: "Business",
    description: "Team invoicing, custom branding, and advanced reports.",
    sortOrder: 2,
    isActive: true,
    badge: null,
    documentLimit: null,
    pdfLimit: null,
    aiLimit: 0,
    userLimit: 8,
    businessLimit: 5,
    fairUseCap: 20000,
    monthlyUsd: "5",
    annualUsd: "50",
    oneTimeUsd: null,
    features: {
      ...unlimited,
      whatsapp: true,
      emailShare: true,
      reports: "advanced",
      customLogo: true,
      invoiceflowBranding: false,
      teams: true,
      prioritySupport: true,
    },
    bullets: [
      "Everything in Solo",
      "Custom company logo",
      "Multiple staff users",
      "Team access",
      "Advanced reports",
      "Priority support",
    ],
    prices: [
      { currencyCode: "USD", interval: "MONTHLY", amount: "5" },
      { currencyCode: "USD", interval: "YEARLY", amount: "50" },
    ],
  },
  {
    key: EARLY_ADOPTER_PLAN_KEY,
    name: "Early Adopter Lifetime",
    description: "One payment. Lifetime Business features. Limited to the first 100 paying customers.",
    sortOrder: 3,
    isActive: true,
    badge: "Limited launch offer",
    limitedOffer: true,
    documentLimit: null,
    pdfLimit: null,
    aiLimit: 0,
    userLimit: 8,
    businessLimit: 5,
    fairUseCap: 20000,
    monthlyUsd: null,
    annualUsd: null,
    oneTimeUsd: "19",
    features: {
      ...unlimited,
      whatsapp: true,
      emailShare: true,
      reports: "advanced",
      customLogo: true,
      invoiceflowBranding: false,
      teams: true,
      prioritySupport: true,
    },
    bullets: [
      "All current Business plan features",
      "Lifetime access",
      "One-time payment",
      "First 100 paying customers only",
    ],
    prices: [{ currencyCode: "USD", interval: "ONE_TIME", amount: "19" }],
  },
];

export const LEGACY_PLAN_KEYS = ["starter", "pro", "unlimited"] as const;

export function getCatalogPlan(key: string) {
  return PLAN_CATALOG.find((plan) => plan.key === key);
}

function asLimit(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function asReports(value: unknown): PlanReportsLevel {
  if (value === "advanced" || value === true) return "advanced";
  if (value === "basic") return "basic";
  if (value === "none" || value === false) return "none";
  return "basic";
}

export function parsePlanFeatures(raw: unknown): PlanFeatureSet {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const customLogo =
    typeof value.customLogo === "boolean" ? Boolean(value.customLogo) : !("invoiceLimit" in value);
  const brandingExplicit = typeof value.invoiceflowBranding === "boolean";
  return {
    invoiceLimit: asLimit(value.invoiceLimit),
    quotationLimit: asLimit(value.quotationLimit),
    customerLimit: asLimit(value.customerLimit),
    whatsapp: value.whatsapp !== false,
    emailShare: value.emailShare !== false,
    reports: asReports(value.reports),
    customLogo,
    invoiceflowBranding: brandingExplicit ? Boolean(value.invoiceflowBranding) : !customLogo,
    teams: Boolean(value.teams),
    prioritySupport: Boolean(value.prioritySupport),
  };
}

export function annualSavingsUsd(monthly: string | null, annual: string | null) {
  if (!monthly || !annual) return null;
  const monthlyCost = Number(monthly) * 12;
  const yearlyCost = Number(annual);
  const saved = monthlyCost - yearlyCost;
  if (!Number.isFinite(saved) || saved <= 0) return null;
  return saved.toFixed(2);
}
