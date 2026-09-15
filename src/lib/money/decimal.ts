import Decimal from "decimal.js";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -20,
  toExpPos: 20,
});

export { Decimal };

export function d(value: Decimal.Value | null | undefined): Decimal {
  if (value === null || value === undefined || value === "") {
    return new Decimal(0);
  }
  return new Decimal(value);
}

export function roundMoney(value: Decimal.Value, decimalPlaces: number): Decimal {
  const places = Number.isFinite(decimalPlaces) ? decimalPlaces : 2;
  return d(value).toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
}

export function assertNonNegative(value: Decimal, field: string) {
  if (value.isNegative()) {
    throw new Error(`${field} cannot be negative`);
  }
}
