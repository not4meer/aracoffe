import { expect, test } from "@playwright/test";

test("ana sayfa: işletme adı, kategoriler ve fiyatlar veritabanından gelir", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ara Coffee Bakery");
  const nav = page.getByRole("navigation", { name: "Kategoriler" });
  for (const name of ["Sıcak Kahveler", "Soğuk Kahveler", "Sıcak İçecekler", "Soğuk İçecekler", "Spesiyaller"]) {
    await expect(nav.getByRole("link", { name })).toBeVisible();
  }
  // Ürünü olmayan kategoriler gösterilmez
  await expect(nav.getByRole("link", { name: "Tatlılar" })).toHaveCount(0);
  await expect(page.getByText("Espresso", { exact: true })).toBeVisible();
  await expect(page.getByText("₺110").first()).toBeVisible();
});

test("arama Türkçe karakterden bağımsız çalışır", async ({ page }) => {
  await page.goto("/");
  const box = page.getByRole("searchbox", { name: "Menüde ara" });
  await box.fill("cay");
  await expect(page.getByText("Ada Çayı")).toBeVisible();
  await expect(page.getByText("Espresso", { exact: true })).toHaveCount(0);
  await box.fill("zzzz");
  await expect(page.getByText("Bulunamadı")).toBeVisible();
  await page.getByRole("button", { name: "Tüm menüyü göster" }).click();
  await expect(page.getByText("Espresso", { exact: true })).toBeVisible();
});

test("mobilde yatay kaydırma yok", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("açık/kapalı rozeti görünür", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Şu an (açık|kapalı)/)).toBeVisible();
});

test("robots.txt paneli kapatır, panel noindex ve girişe yönlenir", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /yonetim");
  await page.goto("/yonetim");
  await expect(page).toHaveURL(/\/yonetim\/giris$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("button", { name: "Giriş yap" })).toBeVisible();
});

test("ana sayfada panele link yok", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href*="yonetim"]')).toHaveCount(0);
});

test("giriş yapmadan panel işlemleri ve QR indirme reddedilir", async ({ request }) => {
  const res = await request.get("/yonetim/qr-indir/png");
  expect(res.status()).toBe(401);
});

test("kategori şeridi sayfayı geri kaydırmaz; sayfanın sonuna inilebilir", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(800);
  const atBottom = await page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4);
  expect(atBottom).toBe(true);
});

test("paylaşım görseli üretilir", async ({ request }) => {
  const res = await request.get("/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("ana ekrana ekleme: manifest ve ikonlar", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m.display).toBe("standalone");
  expect(m.name).toBe("Ara Coffee Bakery");
  expect(m.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  expect(m.icons.length).toBeGreaterThanOrEqual(2);
  for (const icon of m.icons) {
    const r = await request.get(icon.src);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toBe("image/png");
  }
  const apple = await request.get("/ikon/180");
  expect(apple.status()).toBe(200);
  expect((await request.get("/ikon/999")).status()).toBe(404);
});

test("sayfada Apple ana ekran ikonu bağlantısı var", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", /\/ikon\/180/);
});
