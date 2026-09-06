import { Decimal, assertNonNegative, d, roundMoney } from "./decimal";

export type DiscountType = "NONE" | "PERCENT" | "FIXED";

export type LineInput = {
  quantity: Decimal.Value;
  unitPrice: Decimal.Value;
  discountType?: DiscountType;
  discountValue?: Decimal.Value;
  taxRate?: Decimal.Value;
  taxInclusive?: boolean;
};

export type DocumentCalcInput = {
  lines: LineInput[];
  documentDiscountType?: DiscountType;
  documentDiscountValue?: Decimal.Value;
  shippingAmount?: Decimal.Value;
  otherChargesAmount?: Decimal.Value;
  amountPaid?: Decimal.Value;
  decimalPlaces: number;
};

export type LineResult = {
  quantity: string;
  unitPrice: string;
  lineSubtotal: string;
  discountAmount: string;
  taxableBase: string;
  taxAmount: string;
  lineTotal: string;
};

export type DocumentCalcResult = {
  lines: LineResult[];
  subtotal: string;
  itemDiscountTotal: string;
  documentDiscountAmount: string;
  taxTotal: string;
  shippingAmount: string;
  otherChargesAmount: string;
  grandTotal: string;
  amountPaid: string;
  balanceDue: string;
};

function applyDiscount(
  base: Decimal,
  type: DiscountType | undefined,
  value: Decimal.Value | undefined,
  decimalPlaces: number,
) {
  const raw = d(value);
  assertNonNegative(raw, "discount");
  if (!type || type === "NONE" || raw.isZero()) {
    return new Decimal(0);
  }
  const discount = type === "PERCENT" ? base.times(raw).dividedBy(100) : raw;
  if (discount.greaterThan(base)) {
    return roundMoney(base, decimalPlaces);
  }
  return roundMoney(discount, decimalPlaces);
}

export function calculateLine(line: LineInput, decimalPlaces: number): LineResult {
  const quantity = d(line.quantity);
  const unitPrice = d(line.unitPrice);
  assertNonNegative(quantity, "quantity");
  assertNonNegative(unitPrice, "unit price");

  const lineSubtotal = roundMoney(quantity.times(unitPrice), decimalPlaces);
  const discountAmount = applyDiscount(
    lineSubtotal,
    line.discountType,
    line.discountValue,
    decimalPlaces,
  );
  const afterDiscount = Decimal.max(lineSubtotal.minus(discountAmount), 0);
  const taxRate = d(line.taxRate);
  assertNonNegative(taxRate, "tax rate");

  let taxableBase = afterDiscount;
  let taxAmount = new Decimal(0);
  let lineTotal = afterDiscount;

  if (!taxRate.isZero()) {
    if (line.taxInclusive) {
      const divisor = new Decimal(1).plus(taxRate.dividedBy(100));
      taxableBase = roundMoney(afterDiscount.dividedBy(divisor), decimalPlaces);
      taxAmount = roundMoney(afterDiscount.minus(taxableBase), decimalPlaces);
      lineTotal = afterDiscount;
    } else {
      taxAmount = roundMoney(afterDiscount.times(taxRate).dividedBy(100), decimalPlaces);
      lineTotal = afterDiscount.plus(taxAmount);
    }
  }

  return {
    quantity: quantity.toString(),
    unitPrice: roundMoney(unitPrice, decimalPlaces).toFixed(decimalPlaces),
    lineSubtotal: lineSubtotal.toFixed(decimalPlaces),
    discountAmount: discountAmount.toFixed(decimalPlaces),
    taxableBase: taxableBase.toFixed(decimalPlaces),
    taxAmount: taxAmount.toFixed(decimalPlaces),
    lineTotal: lineTotal.toFixed(decimalPlaces),
  };
}

export function calculateDocument(input: DocumentCalcInput): DocumentCalcResult {
  const places = input.decimalPlaces;
  const lines = input.lines.map((line) => calculateLine(line, places));

  const subtotal = lines.reduce((sum, line) => sum.plus(line.lineSubtotal), new Decimal(0));
  const itemDiscountTotal = lines.reduce(
    (sum, line) => sum.plus(line.discountAmount),
    new Decimal(0),
  );
  const lineNet = lines.reduce(
    (sum, line) => sum.plus(d(line.lineTotal).minus(line.taxAmount)),
    new Decimal(0),
  );
  const taxTotal = lines.reduce((sum, line) => sum.plus(line.taxAmount), new Decimal(0));

  const documentDiscountAmount = applyDiscount(
    lineNet,
    input.documentDiscountType,
    input.documentDiscountValue,
    places,
  );

  const shipping = roundMoney(d(input.shippingAmount), places);
  const other = roundMoney(d(input.otherChargesAmount), places);
  assertNonNegative(shipping, "shipping");
  assertNonNegative(other, "other charges");

  const grandTotal = Decimal.max(
    lineNet.minus(documentDiscountAmount).plus(taxTotal).plus(shipping).plus(other),
    0,
  );
  const amountPaid = roundMoney(d(input.amountPaid), places);
  assertNonNegative(amountPaid, "amount paid");
  const balanceDue = Decimal.max(grandTotal.minus(amountPaid), 0);

  return {
    lines,
    subtotal: subtotal.toFixed(places),
    itemDiscountTotal: itemDiscountTotal.toFixed(places),
    documentDiscountAmount: documentDiscountAmount.toFixed(places),
    taxTotal: taxTotal.toFixed(places),
    shippingAmount: shipping.toFixed(places),
    otherChargesAmount: other.toFixed(places),
    grandTotal: grandTotal.toFixed(places),
    amountPaid: amountPaid.toFixed(places),
    balanceDue: balanceDue.toFixed(places),
  };
}
