import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { ADMIN_USER, cleanup, db, login, toast } from "./helpers";

// Panel testleri aynı veritabanını değiştirdiği için sırayla çalışır.
test.describe.configure({ mode: "serial", timeout: 120_000 });

test.beforeAll(cleanup);
test.afterAll(cleanup);

test("hatalı şifre reddedilir, 5 hatalı denemeden sonra kilitlenir", async ({ page }) => {
  await page.goto("/yonetim/giris");
  for (let i = 0; i < 5; i++) {
    await page.getByLabel("Kullanıcı adı").fill(ADMIN_USER);
    await page.getByLabel("Şifre").fill(`yanlis-sifre-${i}`);
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "hatalı" })).toBeVisible();
  }
  await page.getByLabel("Kullanıcı adı").fill(ADMIN_USER);
  await page.getByLabel("Şifre").fill("yine-yanlis");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Çok fazla hatalı deneme" })).toBeVisible();
  await db().from("login_attempts").delete().gte("id", 0);
});

test("giriş: çerez HttpOnly, SameSite=Lax ve sadece panel yolunda; çıkış oturumu kapatır", async ({ page, context }) => {
  await login(page);
  const cookie = (await context.cookies()).find((c) => c.name === "yonetim_oturum");
  expect(cookie).toBeDefined();
  expect(cookie!.httpOnly).toBe(true);
  expect(cookie!.sameSite).toBe("Lax");
  expect(cookie!.path).toBe("/yonetim");
  await page.getByRole("button", { name: "Çıkış" }).click();
  await expect(page).toHaveURL(/\/yonetim\/giris$/);
  await page.goto("/yonetim");
  await expect(page).toHaveURL(/\/yonetim\/giris$/);
});

test("sahte çerezle panele girilemez", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "yonetim_oturum", value: "sahte-token", url: `${baseURL}/yonetim` }]);
  await page.goto("/yonetim");
  await expect(page).toHaveURL(/\/yonetim\/giris$/);
});

test("menü: kategori ve ürün ekle, fiyat kuralları, tükendi, gizle, sil — sitede anında görünür", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await login(page);

  await page.getByText("+ Yeni kategori ekle").click();
  await page.locator("#new-cat-name").fill("e2e-Kategori");
  await page.getByRole("button", { name: "Kategori ekle" }).click();
  await toast(page, "Kategori eklendi.");

  const cat = page.locator('details[data-kategori="e2e-Kategori"]');
  await cat.locator("summary").first().click();
  await cat.getByText("kategorisine ürün ekle").click();

  // Belirsiz fiyat reddedilir
  await cat.getByLabel("Ürün adı").last().fill("e2e-Ürün");
  await cat.getByLabel("Fiyat").last().fill("1.250");
  await cat.getByRole("button", { name: "Ürünü ekle" }).click();
  await toast(page, "Fiyat geçersiz");

  await cat.getByLabel("Ürün adı").last().fill("e2e-Ürün");
  await cat.getByLabel("Fiyat").last().fill("12,50");
  await cat.getByRole("button", { name: "Ürünü ekle" }).click();
  await toast(page, "Ürün eklendi.");

  await page.goto("/");
  await expect(page.getByText("e2e-Ürün")).toBeVisible();
  await expect(page.getByText("₺12,50")).toBeVisible();

  // Tükendi
  await page.goto("/yonetim");
  const catOpen = page.locator('details[data-kategori="e2e-Kategori"]');
  await catOpen.locator("summary").first().click();
  const row = catOpen.locator("li").filter({ hasText: "e2e-Ürün" }).first();
  await row.getByRole("button", { name: "Tükendi" }).click();
  await toast(page, "Tükendi olarak işaretlendi.");
  await page.goto("/");
  await expect(page.locator("li").filter({ hasText: "e2e-Ürün" }).getByText("Tükendi")).toBeVisible();

  // Gizle: sitede görünmez ve veritabanı kuralıyla da okunamaz
  await page.goto("/yonetim");
  const cat2 = page.locator('details[data-kategori="e2e-Kategori"]');
  await cat2.locator("summary").first().click();
  await cat2.getByRole("button", { name: "Gizle" }).first().click();
  await toast(page, "Kategori gizlendi.");
  await page.goto("/");
  await expect(page.getByText("e2e-Ürün")).toHaveCount(0);
  const anon = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=name&name=eq.e2e-Ürün`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
  });
  expect(await anon.json()).toEqual([]);

  // Sil (onay sorar)
  await page.goto("/yonetim");
  const cat3 = page.locator('details[data-kategori="e2e-Kategori"]');
  await cat3.locator("summary").first().click();
  await cat3.getByRole("button", { name: "Kategoriyi sil" }).click();
  await toast(page, "Kategori ve içindeki ürünler silindi.");
  const { data } = await db().from("categories").select("id").eq("name", "e2e-Kategori");
  expect(data).toEqual([]);
});

test("bilgiler: telefon ve Instagram farklı yazımlarla kabul edilir, sitede görünür", async ({ page }) => {
  const { data: before } = await db().from("site_settings").select("phone,instagram,address,map_url").eq("id", 1).single();
  try {
    await login(page);
    await page.goto("/yonetim/bilgiler");
    await page.getByLabel("Telefon").fill("0 (532) 111 22 33");
    await page.getByLabel("Instagram").fill("https://www.instagram.com/aracoffeebakery/");
    await page.getByRole("button", { name: "İletişimi kaydet" }).click();
    await toast(page, "İletişim bilgileri kaydedildi.");
    const { data } = await db().from("site_settings").select("phone,instagram").eq("id", 1).single();
    expect(data).toEqual({ phone: "05321112233", instagram: "aracoffeebakery" });
    await page.goto("/");
    await expect(page.locator('a[href="tel:+905321112233"]').first()).toBeVisible();

    await page.goto("/yonetim/bilgiler");
    await page.getByLabel("Telefon").fill("12");
    await page.getByRole("button", { name: "İletişimi kaydet" }).click();
    await toast(page, "Telefon numarası geçersiz");
  } finally {
    await db().from("site_settings").update(before!).eq("id", 1);
  }
});

test("saatler: kapalı gün kaydedilir ve sitede görünür", async ({ page }) => {
  const { data: before } = await db().from("opening_hours").select("day,is_closed,opens,closes").order("day");
  try {
    await login(page);
    await page.goto("/yonetim/saatler");
    await page.locator('input[name="closed_2"]').check();
    await page.getByRole("button", { name: "Saatleri kaydet" }).click();
    await toast(page, "Çalışma saatleri kaydedildi.");
    await page.goto("/");
    await expect(page.locator("tr").filter({ hasText: "Salı" })).toContainText("Kapalı");
  } finally {
    await db().from("opening_hours").upsert(before!, { onConflict: "day" });
  }
});

test("renkler: geçersiz kod kaydedilmez, geçerli renk siteye yansır", async ({ page }) => {
  const { data: before } = await db().from("site_settings").select("color_primary").eq("id", 1).single();
  try {
    await login(page);
    await page.goto("/yonetim/renkler");
    const field = page.getByLabel(/Ana renk/).last();
    await field.fill("kirmizi");
    await expect(page.getByRole("button", { name: "Renkleri kaydet" })).toBeDisabled();
    await field.fill("#123456");
    await page.getByRole("button", { name: "Renkleri kaydet" }).click();
    await toast(page, "Renkler kaydedildi.");
    await page.goto("/");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#123456");
  } finally {
    await db().from("site_settings").update(before!).eq("id", 1);
  }
});

test("fotoğraf: yükle (EXIF silinir, WebP), galeride görünür, sil; SVG reddedilir", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await login(page);
  await page.goto("/yonetim/fotograflar");

  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
  const uploadForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Fotoğrafı yükle" }) });
  await uploadForm.locator('input[type="file"]').setInputFiles({ name: "kotu.svg", mimeType: "image/svg+xml", buffer: svg });
  await uploadForm.getByRole("button", { name: "Fotoğrafı yükle" }).click();
  await toast(page, /JPEG, PNG ya da WebP|geçerli bir fotoğraf/);

  const jpg = await sharp({ create: { width: 64, height: 48, channels: 3, background: "#8a4b1f" } })
    .jpeg()
    .withExif({ IFD0: { Copyright: "e2e-gizli" } })
    .toBuffer();
  await uploadForm.locator('input[type="file"]').setInputFiles({ name: "foto.jpg", mimeType: "image/jpeg", buffer: jpg });
  await uploadForm.getByLabel(/Açıklama/).fill("e2e-foto");
  await uploadForm.getByRole("button", { name: "Fotoğrafı yükle" }).click();
  await toast(page, "Fotoğraf yüklendi.");

  const { data: photo } = await db().from("photos").select("path").eq("alt", "e2e-foto").single();
  expect(photo!.path).toMatch(/\.webp$/);
  const file = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${photo!.path}`);
  const meta = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
  expect(meta.format).toBe("webp");
  expect(meta.exif).toBeUndefined();

  await page.goto("/");
  await expect(page.getByRole("img", { name: "e2e-foto" })).toBeVisible();

  await page.goto("/yonetim/fotograflar");
  const card = page
    .locator("div")
    .filter({ has: page.locator('input[value="e2e-foto"]') })
    .filter({ has: page.getByRole("button", { name: "Sil" }) })
    .last();
  await card.getByRole("button", { name: "Sil" }).click();
  await toast(page, "Fotoğraf silindi.");
  const { data: gone } = await db().from("photos").select("id").eq("alt", "e2e-foto");
  expect(gone).toEqual([]);
});

test("QR: panelde görünür ve oturumla PNG/SVG indirilir", async ({ page }) => {
  await login(page);
  await page.goto("/yonetim/qr");
  await expect(page.getByRole("img", { name: "Menü sitesinin QR kodu" })).toBeVisible();
  const png = await page.request.get("/yonetim/qr-indir/png");
  expect(png.status()).toBe(200);
  expect(png.headers()["content-type"]).toBe("image/png");
  const svg = await page.request.get("/yonetim/qr-indir/svg");
  expect(await svg.text()).toContain("<svg");
});

test("hesap: yanlış mevcut şifreyle değişiklik yapılmaz", async ({ page }) => {
  await login(page);
  await page.goto("/yonetim/hesap");
  await page.getByLabel("Yeni şifre (değiştirmeyecekseniz boş bırakın)").fill("YeniSifre12345");
  await page.getByLabel("Yeni şifre (tekrar)").fill("YeniSifre12345");
  await page.getByLabel("Mevcut şifre (onay için gerekli)").fill("yanlis");
  await page.getByRole("button", { name: "Hesabı kaydet" }).click();
  await toast(page, "Mevcut şifre yanlış.");
});
