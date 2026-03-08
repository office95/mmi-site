import { test, expect } from "@playwright/test";

test("homepage lädt", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Music Mission Institute/i);
  await expect(page.getByRole("link", { name: /Entdecken/i })).toBeVisible();
});

const sessionId = process.env.TEST_SESSION_ID;

test.describe("Checkout Smoke (optional)", () => {
  test.skip(!sessionId, "Setze TEST_SESSION_ID für Checkout-Smoke");

  test("legt Checkout-Session an", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        sessionId,
        email: process.env.TEST_CUSTOMER_EMAIL || "test@example.com",
        first_name: process.env.TEST_FIRST_NAME || "Test",
        last_name: process.env.TEST_LAST_NAME || "User",
        city: process.env.TEST_CITY || "Teststadt",
        consent_gdpr: true,
        participants: 1,
      },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.url).toBeTruthy();
    expect(String(json.url)).toContain("stripe");
  });
});
