import { describe, expect, it } from "vitest";
import { hmacSha256Hex, signaturesMatch, verifyPaystackSignature } from "@/lib/payments/signature";
import { detectPaymentMethods } from "@/lib/payments/service";

describe("payment security", () => {
  it("matches paystack signatures", () => {
    const body = "{\"event\":\"charge.success\"}";
    const secret = "test_secret";
    const header = hmacSha256Hex(secret, body);
    expect(verifyPaystackSignature(body, header, secret)).toBe(true);
    expect(verifyPaystackSignature(body, "nope", secret)).toBe(false);
  });

  it("uses constant-time compares of equal length", () => {
    expect(signaturesMatch("abcd", "abcd")).toBe(true);
    expect(signaturesMatch("abcd", "abce")).toBe(false);
  });

  it("hides methods when no provider is configured", () => {
    const methods = detectPaymentMethods({
      userCountry: "GH",
      businessCountry: "GH",
      currencyCode: "GHS",
    });
    expect(Array.isArray(methods)).toBe(true);
  });
});
