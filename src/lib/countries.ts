export type CountryDefinition = {
  code: string;
  name: string;
  defaultCurrency: string;
  defaultLocale: string;
  dateFormat: string;
  seoSlug?: string;
};

export const COUNTRIES: CountryDefinition[] = [
  { code: "GH", name: "Ghana", defaultCurrency: "GHS", defaultLocale: "en", dateFormat: "DD/MM/YYYY", seoSlug: "ghana" },
  { code: "NG", name: "Nigeria", defaultCurrency: "NGN", defaultLocale: "en", dateFormat: "DD/MM/YYYY", seoSlug: "nigeria" },
  { code: "KE", name: "Kenya", defaultCurrency: "KES", defaultLocale: "en", dateFormat: "DD/MM/YYYY", seoSlug: "kenya" },
  { code: "ZA", name: "South Africa", defaultCurrency: "ZAR", defaultLocale: "en", dateFormat: "YYYY-MM-DD", seoSlug: "south-africa" },
  { code: "UG", name: "Uganda", defaultCurrency: "UGX", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "TZ", name: "Tanzania", defaultCurrency: "TZS", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "RW", name: "Rwanda", defaultCurrency: "RWF", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "EG", name: "Egypt", defaultCurrency: "EGP", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "IN", name: "India", defaultCurrency: "INR", defaultLocale: "en", dateFormat: "DD/MM/YYYY", seoSlug: "india" },
  { code: "PK", name: "Pakistan", defaultCurrency: "PKR", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "BD", name: "Bangladesh", defaultCurrency: "BDT", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "CN", name: "China", defaultCurrency: "CNY", defaultLocale: "zh", dateFormat: "YYYY-MM-DD" },
  { code: "PH", name: "Philippines", defaultCurrency: "PHP", defaultLocale: "en", dateFormat: "MM/DD/YYYY" },
  { code: "ID", name: "Indonesia", defaultCurrency: "IDR", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "TH", name: "Thailand", defaultCurrency: "THB", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "VN", name: "Vietnam", defaultCurrency: "VND", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
  { code: "BR", name: "Brazil", defaultCurrency: "BRL", defaultLocale: "pt", dateFormat: "DD/MM/YYYY" },
  { code: "MX", name: "Mexico", defaultCurrency: "MXN", defaultLocale: "es", dateFormat: "DD/MM/YYYY" },
  { code: "US", name: "United States", defaultCurrency: "USD", defaultLocale: "en", dateFormat: "MM/DD/YYYY", seoSlug: "usa" },
  { code: "CA", name: "Canada", defaultCurrency: "CAD", defaultLocale: "en", dateFormat: "YYYY-MM-DD" },
  { code: "GB", name: "United Kingdom", defaultCurrency: "GBP", defaultLocale: "en", dateFormat: "DD/MM/YYYY", seoSlug: "uk" },
  { code: "DE", name: "Germany", defaultCurrency: "EUR", defaultLocale: "de", dateFormat: "DD.MM.YYYY" },
  { code: "FR", name: "France", defaultCurrency: "EUR", defaultLocale: "fr", dateFormat: "DD/MM/YYYY" },
  { code: "AE", name: "United Arab Emirates", defaultCurrency: "AED", defaultLocale: "en", dateFormat: "DD/MM/YYYY", seoSlug: "uae" },
  { code: "AU", name: "Australia", defaultCurrency: "AUD", defaultLocale: "en", dateFormat: "DD/MM/YYYY" },
];

export function getCountry(code: string) {
  return COUNTRIES.find((country) => country.code === code);
}

export const BUSINESS_TYPES = [
  "Retail",
  "Wholesale",
  "Construction",
  "Freelancer",
  "Services",
  "E-commerce",
  "Consulting",
  "Manufacturing",
  "Other",
] as const;

export const CONSTRUCTION_CATEGORIES = [
  "Materials",
  "Labour",
  "Equipment",
  "Transport",
  "Installation",
  "Other",
] as const;
