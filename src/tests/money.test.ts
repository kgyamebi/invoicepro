import { describe, expect, it } from "vitest";
import { calculateDocument, calculateLine } from "@/lib/money/calculate";

describe("money engine", () => {
  it("calculates the acceptance quotation", () => {
    const result = calculateDocument({
      lines: [
        { quantity: 50, unitPrice: 180 },
        { quantity: 20, unitPrice: 45 },
      ],
      shippingAmount: 300,
      decimalPlaces: 2,
    });
    expect(result.subtotal).toBe("9900.00");
    expect(result.shippingAmount).toBe("300.00");
    expect(result.grandTotal).toBe("10200.00");
  });

  it("tracks partial payments", () => {
    const result = calculateDocument({
      lines: [{ quantity: 1, unitPrice: 10200 }],
      amountPaid: 5000,
      decimalPlaces: 2,
    });
    expect(result.amountPaid).toBe("5000.00");
    expect(result.balanceDue).toBe("5200.00");
  });

  it("rounds tax using currency decimals", () => {
    const line = calculateLine({ quantity: 3, unitPrice: 19.99, taxRate: 10 }, 2);
    expect(line.lineSubtotal).toBe("59.97");
    expect(line.taxAmount).toBe("6.00");
    expect(line.lineTotal).toBe("65.97");
  });

  it("rejects negative prices", () => {
    expect(() => calculateLine({ quantity: 1, unitPrice: -5 }, 2)).toThrow();
  });

  it("clamps discounts so totals cannot go negative", () => {
    const result = calculateDocument({
      lines: [{ quantity: 1, unitPrice: 10, discountType: "FIXED", discountValue: 50 }],
      decimalPlaces: 2,
    });
    expect(result.grandTotal).toBe("0.00");
  });

  it("treats zero quantity as a zero line", () => {
    const line = calculateLine({ quantity: 0, unitPrice: 180 }, 2);
    expect(line.lineTotal).toBe("0.00");
  });

  it("supports currencies with zero decimals", () => {
    const result = calculateDocument({
      lines: [{ quantity: 2, unitPrice: 1500 }],
      decimalPlaces: 0,
    });
    expect(result.grandTotal).toBe("3000");
  });
});
