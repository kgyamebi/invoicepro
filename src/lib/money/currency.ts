export type SymbolPosition = "before" | "after";

export type CurrencyDefinition = {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: SymbolPosition;
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
};

export const CURRENCIES: Record<string, CurrencyDefinition> = {
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KSh", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "R", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  UGX: { code: "UGX", name: "Ugandan Shilling", symbol: "USh", symbolPosition: "before", decimalPlaces: 0, thousandSeparator: ",", decimalSeparator: "." },
  TZS: { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  RWF: { code: "RWF", name: "Rwandan Franc", symbol: "FRw", symbolPosition: "before", decimalPlaces: 0, thousandSeparator: ",", decimalSeparator: "." },
  EGP: { code: "EGP", name: "Egyptian Pound", symbol: "E£", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "₨", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  BDT: { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  PHP: { code: "PHP", name: "Philippine Peso", symbol: "₱", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  IDR: { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", symbolPosition: "before", decimalPlaces: 0, thousandSeparator: ".", decimalSeparator: "," },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  VND: { code: "VND", name: "Vietnamese Dong", symbol: "₫", symbolPosition: "after", decimalPlaces: 0, thousandSeparator: ".", decimalSeparator: "," },
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ".", decimalSeparator: "," },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "MX$", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  USD: { code: "USD", name: "US Dollar", symbol: "$", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  EUR: { code: "EUR", name: "Euro", symbol: "€", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  AED: { code: "AED", name: "UAE Dirham", symbol: "AED", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", symbolPosition: "before", decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." },
};

export function getCurrency(code: string): CurrencyDefinition {
  return CURRENCIES[code] ?? {
    code,
    name: code,
    symbol: code,
    symbolPosition: "before",
    decimalPlaces: 2,
    thousandSeparator: ",",
    decimalSeparator: ".",
  };
}

export function formatMoney(amount: string | number, currencyCode: string) {
  const currency = getCurrency(currencyCode);
  const [whole, fraction = ""] = Number(amount).toString().split(".");
  const safeWhole = whole.replace("-", "");
  const grouped = safeWhole.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandSeparator);
  const decimals =
    currency.decimalPlaces === 0
      ? grouped
      : `${grouped}${currency.decimalSeparator}${(fraction + "0".repeat(currency.decimalPlaces)).slice(0, currency.decimalPlaces)}`;
  const signed = Number(amount) < 0 ? `-${decimals}` : decimals;
  return currency.symbolPosition === "after"
    ? `${signed} ${currency.symbol}`
    : `${currency.symbol}${signed}`;
}

export function formatMoneyFromDecimal(amount: { toFixed: (n: number) => string }, currencyCode: string) {
  const currency = getCurrency(currencyCode);
  return formatMoney(amount.toFixed(currency.decimalPlaces), currencyCode);
}
