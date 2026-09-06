import { test, expect } from "@playwright/test";

test("marketing and tools are reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /professional invoices/i })).toBeVisible();
  await page.goto("/tools/invoice-calculator");
  await expect(page.getByRole("heading", { name: /invoice calculator/i })).toBeVisible();
});
