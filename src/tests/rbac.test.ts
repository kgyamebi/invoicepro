import { describe, expect, it } from "vitest";
import { can } from "@/server/rbac";

describe("permissions", () => {
  it("lets staff create invoices but not manage billing", () => {
    expect(can("STAFF", "invoice.create")).toBe(true);
    expect(can("STAFF", "billing.manage")).toBe(false);
  });

  it("lets viewers read reports but not edit invoices", () => {
    expect(can("VIEWER", "report.view")).toBe(true);
    expect(can("VIEWER", "invoice.edit")).toBe(false);
  });
});
