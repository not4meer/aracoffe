import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Testler sadece test veritabanında çalışır (playwright.config + scripts/test-guard.mjs).
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  if (process.env.SUPABASE_TARGET !== "test") throw new Error("Testler sadece test veritabanında çalışır.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const ADMIN_USER = "admin";
export const ADMIN_PASS = () => {
  const p = process.env.ADMIN_INITIAL_PASSWORD;
  if (!p) throw new Error("ADMIN_INITIAL_PASSWORD (.env.test.local) gerekli.");
  return p;
};

/** e2e- önekli kayıtları ve giriş denemelerini temizler. */
export async function cleanup() {
  const d = db();
  const { data: prods } = await d.from("products").select("image_path").like("name", "e2e-%");
  const { data: photos } = await d.from("photos").select("path").like("alt", "e2e-%");
  const paths = [...(prods ?? []).map((p) => p.image_path), ...(photos ?? []).map((p) => p.path)].filter(Boolean) as string[];
  if (paths.length) await d.storage.from("media").remove(paths);
  await d.from("products").delete().like("name", "e2e-%");
  await d.from("categories").delete().like("name", "e2e-%");
  await d.from("photos").delete().like("alt", "e2e-%");
  await d.from("login_attempts").delete().gte("id", 0);
}

export async function login(page: Page) {
  await page.goto("/yonetim/giris");
  await page.getByLabel("Kullanıcı adı").fill(ADMIN_USER);
  await page.getByLabel("Şifre").fill(ADMIN_PASS());
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/yonetim$/, { timeout: 20_000 });
}

export async function toast(page: Page, text: string | RegExp) {
  await expect(page.locator("[aria-live=polite] p").filter({ hasText: text }).last()).toBeVisible({ timeout: 15_000 });
}
