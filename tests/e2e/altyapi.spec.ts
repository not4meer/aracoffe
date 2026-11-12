import { expect, test } from "@playwright/test";

test("güvenlik başlıkları var, X-Powered-By yok", async ({ request }) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("sayfa dili Türkçe", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
});

test("olmayan sayfada Türkçe 404", async ({ page }) => {
  const res = await page.goto("/olmayan-bir-sayfa");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Sayfa bulunamadı" })).toBeVisible();
  await page.getByRole("link", { name: "Ana sayfaya dön" }).click();
  await expect(page).toHaveURL("/");
});
