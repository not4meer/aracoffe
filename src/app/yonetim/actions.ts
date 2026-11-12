"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/admin/db";
import { endOtherSessions, endSession, login, requireAdmin } from "@/lib/admin/auth";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/admin/password";
import { processImage, removeMedia, uploadMedia } from "@/lib/admin/images";
import { isHexColor, isValidHttpUrl, normalizeInstagram, normalizePhone, parsePrice } from "@/lib/format";

export type State = { ok: boolean; message: string } | null;

const ok = (message: string): State => ({ ok: true, message });
const fail = (message: string): State => ({ ok: false, message });

/** Her işlem: önce oturum doğrulanır, sonra çalışır; hata kullanıcıya Türkçe döner. */
async function guarded(fn: () => Promise<State>): Promise<State> {
  await requireAdmin();
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("NEXT_REDIRECT")) throw e;
    console.error(e);
    return fail(e instanceof Error && e.message ? e.message : "Beklenmeyen bir hata oldu.");
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const isId = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

function tooLong(label: string, v: string, max: number): string | null {
  return v.length > max ? `${label} en fazla ${max} karakter olabilir.` : null;
}

function check(...problems: (string | null)[]): string | null {
  return problems.find((p) => p) ?? null;
}

// ---------- Giriş / çıkış ----------

export async function loginAction(_: State, fd: FormData): Promise<State> {
  const username = str(fd, "username");
  const password = String(fd.get("password") ?? "");
  if (!username || !password) return fail("Kullanıcı adı ve şifre gerekli.");
  if (username.length > 40 || password.length > 200) return fail("Kullanıcı adı ya da şifre hatalı.");
  const r = await login(username, password);
  if (!r.ok) return fail(r.message);
  redirect("/yonetim");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/yonetim/giris");
}

// ---------- Sıralama yardımcısı ----------

async function reorder(table: "categories" | "products" | "photos", id: string, dir: "up" | "down", scope?: { col: string; val: string }) {
  let q = adminDb().from(table).select("id").order("sort_order").order("created_at");
  if (scope) q = q.eq(scope.col, scope.val);
  const { data, error } = await q;
  if (error || !data) throw new Error("Sıralama okunamadı.");
  const ids = data.map((r) => r.id as string);
  const i = ids.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  await Promise.all(ids.map((rowId, idx) => adminDb().from(table).update({ sort_order: idx + 1 }).eq("id", rowId)));
}

async function nextOrder(table: "categories" | "products" | "photos", scope?: { col: string; val: string }): Promise<number> {
  let q = adminDb().from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  if (scope) q = q.eq(scope.col, scope.val);
  const { data } = await q;
  return ((data?.[0]?.sort_order as number | undefined) ?? 0) + 1;
}

// ---------- Kategoriler ----------

export async function createCategory(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const name = str(fd, "name");
    const note = str(fd, "note");
    if (!name) return fail("Kategori adı gerekli.");
    const bad = check(tooLong("Kategori adı", name, 80), tooLong("Not", note, 300));
    if (bad) return fail(bad);
    const { error } = await adminDb().from("categories").insert({ name, note, sort_order: await nextOrder("categories") });
    if (error) return fail("Kategori eklenemedi.");
    updateTag("menu");
    return ok("Kategori eklendi.");
  });
}

export async function updateCategory(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    const name = str(fd, "name");
    const note = str(fd, "note");
    if (!isId(id)) return fail("Geçersiz kategori.");
    if (!name) return fail("Kategori adı gerekli.");
    const bad = check(tooLong("Kategori adı", name, 80), tooLong("Not", note, 300));
    if (bad) return fail(bad);
    const { error } = await adminDb().from("categories").update({ name, note }).eq("id", id);
    if (error) return fail("Kategori kaydedilemedi.");
    updateTag("menu");
    return ok("Kategori kaydedildi.");
  });
}

export async function deleteCategory(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (!isId(id)) return fail("Geçersiz kategori.");
    const { data: prods } = await adminDb().from("products").select("image_path").eq("category_id", id);
    const { error } = await adminDb().from("categories").delete().eq("id", id);
    if (error) return fail("Kategori silinemedi.");
    await Promise.all((prods ?? []).map((p) => removeMedia(p.image_path as string | null)));
    updateTag("menu");
    return ok("Kategori ve içindeki ürünler silindi.");
  });
}

export async function moveCategory(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    const dir = str(fd, "dir") === "up" ? "up" : "down";
    if (!isId(id)) return fail("Geçersiz kategori.");
    await reorder("categories", id, dir);
    updateTag("menu");
    return ok("Sıra değişti.");
  });
}

export async function toggleCategory(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (!isId(id)) return fail("Geçersiz kategori.");
    const visible = str(fd, "visible") === "1";
    const { error } = await adminDb().from("categories").update({ is_visible: visible }).eq("id", id);
    if (error) return fail("Değiştirilemedi.");
    updateTag("menu");
    return ok(visible ? "Kategori gösteriliyor." : "Kategori gizlendi.");
  });
}

// ---------- Ürünler ----------

function productFields(fd: FormData): { name: string; description: string; price: number } | string {
  const name = str(fd, "name");
  const description = str(fd, "description");
  const price = parsePrice(str(fd, "price"));
  if (!name) return "Ürün adı gerekli.";
  const bad = check(tooLong("Ürün adı", name, 120), tooLong("Açıklama", description, 500));
  if (bad) return bad;
  if (price === null) return "Fiyat geçersiz. Örnek: 120, 12,50 ya da 12.50";
  return { name, description, price };
}

export async function createProduct(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const categoryId = str(fd, "category_id");
    if (!isId(categoryId)) return fail("Geçersiz kategori.");
    const f = productFields(fd);
    if (typeof f === "string") return fail(f);
    const { error } = await adminDb()
      .from("products")
      .insert({ ...f, category_id: categoryId, sort_order: await nextOrder("products", { col: "category_id", val: categoryId }) });
    if (error) return fail("Ürün eklenemedi.");
    updateTag("menu");
    return ok("Ürün eklendi.");
  });
}

export async function updateProduct(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (!isId(id)) return fail("Geçersiz ürün.");
    const f = productFields(fd);
    if (typeof f === "string") return fail(f);
    const { error } = await adminDb().from("products").update(f).eq("id", id);
    if (error) return fail("Ürün kaydedilemedi.");
    updateTag("menu");
    return ok("Ürün kaydedildi.");
  });
}

export async function deleteProduct(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (!isId(id)) return fail("Geçersiz ürün.");
    const { data } = await adminDb().from("products").select("image_path").eq("id", id).maybeSingle();
    const { error } = await adminDb().from("products").delete().eq("id", id);
    if (error) return fail("Ürün silinemedi.");
    await removeMedia(data?.image_path as string | null);
    updateTag("menu");
    return ok("Ürün silindi.");
  });
}

export async function moveProduct(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    const categoryId = str(fd, "category_id");
    const dir = str(fd, "dir") === "up" ? "up" : "down";
    if (!isId(id) || !isId(categoryId)) return fail("Geçersiz ürün.");
    await reorder("products", id, dir, { col: "category_id", val: categoryId });
    updateTag("menu");
    return ok("Sıra değişti.");
  });
}

export async function setProductFlag(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    const flag = str(fd, "flag");
    const value = str(fd, "value") === "1";
    if (!isId(id) || (flag !== "is_visible" && flag !== "is_sold_out")) return fail("Geçersiz istek.");
    const { error } = await adminDb().from("products").update({ [flag]: value }).eq("id", id);
    if (error) return fail("Değiştirilemedi.");
    updateTag("menu");
    if (flag === "is_sold_out") return ok(value ? "Tükendi olarak işaretlendi." : "Tekrar satışa açıldı.");
    return ok(value ? "Ürün gösteriliyor." : "Ürün gizlendi.");
  });
}

export async function moveProductToCategory(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    const categoryId = str(fd, "category_id");
    if (!isId(id) || !isId(categoryId)) return fail("Geçersiz istek.");
    const { error } = await adminDb()
      .from("products")
      .update({ category_id: categoryId, sort_order: await nextOrder("products", { col: "category_id", val: categoryId }) })
      .eq("id", id);
    if (error) return fail("Taşınamadı.");
    updateTag("menu");
    return ok("Ürün taşındı.");
  });
}

export async function setProductImage(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (!isId(id)) return fail("Geçersiz ürün.");
    const img = await processImage(fd.get("file") as File, "product");
    const { data } = await adminDb().from("products").select("image_path").eq("id", id).maybeSingle();
    const path = await uploadMedia("urun", img);
    const { error } = await adminDb().from("products").update({ image_path: path }).eq("id", id);
    if (error) {
      await removeMedia(path);
      return fail("Fotoğraf kaydedilemedi.");
    }
    await removeMedia(data?.image_path as string | null);
    updateTag("menu");
    return ok("Ürün fotoğrafı güncellendi.");
  });
}

export async function removeProductImage(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (!isId(id)) return fail("Geçersiz ürün.");
    const { data } = await adminDb().from("products").select("image_path").eq("id", id).maybeSingle();
    const { error } = await adminDb().from("products").update({ image_path: null }).eq("id", id);
    if (error) return fail("Fotoğraf silinemedi.");
    await removeMedia(data?.image_path as string | null);
    updateTag("menu");
    return ok("Ürün fotoğrafı silindi.");
  });
}

// ---------- Site bilgileri ----------

async function saveSite(patch: Record<string, string | null>, message: string): Promise<State> {
  const { error } = await adminDb().from("site_settings").update(patch).eq("id", 1);
  if (error) return fail("Kaydedilemedi.");
  updateTag("site");
  return ok(message);
}

export async function saveContact(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const phone = normalizePhone(str(fd, "phone"));
    const instagram = normalizeInstagram(str(fd, "instagram"));
    const address = str(fd, "address");
    const mapUrl = str(fd, "map_url");
    if (phone === null) return fail("Telefon numarası geçersiz. Örnek: 0532 123 45 67");
    if (instagram === null) return fail("Instagram geçersiz. @kullaniciadi, kullanıcı adı ya da tam link yazabilirsiniz.");
    if (phone.length > 20) return fail("Telefon çok uzun.");
    const bad = check(tooLong("Adres", address, 300), tooLong("Harita linki", mapUrl, 500));
    if (bad) return fail(bad);
    if (mapUrl && !isValidHttpUrl(mapUrl)) return fail("Harita linki http:// ya da https:// ile başlamalı.");
    return saveSite({ phone, instagram, address, map_url: mapUrl }, "İletişim bilgileri kaydedildi.");
  });
}

export async function saveTexts(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const business_name = str(fd, "business_name");
    const slogan = str(fd, "slogan");
    const about_text = str(fd, "about_text");
    const menu_title = str(fd, "menu_title");
    const gallery_title = str(fd, "gallery_title");
    const contact_title = str(fd, "contact_title");
    const currency_symbol = str(fd, "currency_symbol");
    if (!business_name) return fail("İşletme adı gerekli.");
    if (!currency_symbol) return fail("Para birimi gerekli.");
    const bad = check(
      tooLong("İşletme adı", business_name, 80),
      tooLong("Slogan", slogan, 160),
      tooLong("Tanıtım yazısı", about_text, 1000),
      tooLong("Menü başlığı", menu_title, 60),
      tooLong("Galeri başlığı", gallery_title, 60),
      tooLong("İletişim başlığı", contact_title, 60),
      tooLong("Para birimi", currency_symbol, 5),
    );
    if (bad) return fail(bad);
    return saveSite({ business_name, slogan, about_text, menu_title, gallery_title, contact_title, currency_symbol }, "Sayfa yazıları kaydedildi.");
  });
}

export async function saveSeo(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const seo_title = str(fd, "seo_title");
    const seo_description = str(fd, "seo_description");
    const bad = check(tooLong("Başlık", seo_title, 70), tooLong("Açıklama", seo_description, 200));
    if (bad) return fail(bad);
    return saveSite({ seo_title, seo_description }, "Arama motoru bilgileri kaydedildi.");
  });
}

// ---------- Saatler ----------

export async function saveHours(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const rows = [];
    for (let day = 0; day < 7; day++) {
      const closed = fd.get(`closed_${day}`) === "on";
      const opens = str(fd, `opens_${day}`);
      const closes = str(fd, `closes_${day}`);
      if (!closed && (!/^\d{2}:\d{2}$/.test(opens) || !/^\d{2}:\d{2}$/.test(closes))) return fail("Saatleri SS:DD biçiminde girin.");
      if (!closed && opens === closes) return fail("Açılış ve kapanış saati aynı olamaz.");
      rows.push({ day, is_closed: closed, opens: opens || "09:00", closes: closes || "22:00" });
    }
    const { error } = await adminDb().from("opening_hours").upsert(rows, { onConflict: "day" });
    if (error) return fail("Saatler kaydedilemedi.");
    updateTag("hours");
    return ok("Çalışma saatleri kaydedildi.");
  });
}

// ---------- Renkler ----------

export async function saveColors(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const keys = ["color_primary", "color_text", "color_bg", "color_soft", "color_accent"] as const;
    const patch: Record<string, string> = {};
    for (const k of keys) {
      let v = str(fd, k);
      if (!v.startsWith("#")) v = `#${v}`;
      if (!isHexColor(v)) return fail("Renk kodu geçersiz. Örnek: #4A2416");
      patch[k] = v.toUpperCase();
    }
    return saveSite(patch, "Renkler kaydedildi.");
  });
}

// ---------- Fotoğraflar ve logo ----------

export async function uploadPhoto(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const alt = str(fd, "alt");
    if (alt.length > 200) return fail("Açıklama en fazla 200 karakter olabilir.");
    const img = await processImage(fd.get("file") as File, "photo");
    const path = await uploadMedia("galeri", img);
    const { error } = await adminDb()
      .from("photos")
      .insert({ path, alt, width: img.width, height: img.height, sort_order: await nextOrder("photos") });
    if (error) {
      await removeMedia(path);
      return fail("Fotoğraf kaydedilemedi.");
    }
    updateTag("photos");
    return ok("Fotoğraf yüklendi.");
  });
}

export async function updatePhoto(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    const alt = str(fd, "alt");
    if (!isId(id)) return fail("Geçersiz fotoğraf.");
    if (alt.length > 200) return fail("Açıklama en fazla 200 karakter olabilir.");
    const { error } = await adminDb()
      .from("photos")
      .update({ alt, show_in_gallery: fd.get("show") === "on" })
      .eq("id", id);
    if (error) return fail("Kaydedilemedi.");
    updateTag("photos");
    return ok("Fotoğraf kaydedildi.");
  });
}

export async function movePhoto(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (!isId(id)) return fail("Geçersiz fotoğraf.");
    await reorder("photos", id, str(fd, "dir") === "up" ? "up" : "down");
    updateTag("photos");
    return ok("Sıra değişti.");
  });
}

export async function deletePhoto(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (!isId(id)) return fail("Geçersiz fotoğraf.");
    const { data } = await adminDb().from("photos").select("path").eq("id", id).maybeSingle();
    const { error } = await adminDb().from("photos").delete().eq("id", id);
    if (error) return fail("Silinemedi.");
    if (data?.path) {
      const { data: site } = await adminDb().from("site_settings").select("cover_path").eq("id", 1).single();
      if (site?.cover_path === data.path) await adminDb().from("site_settings").update({ cover_path: null }).eq("id", 1);
      await removeMedia(data.path as string);
    }
    updateTag("photos");
    updateTag("site");
    return ok("Fotoğraf silindi.");
  });
}

export async function setCover(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const id = str(fd, "id");
    if (id === "yok") return saveSite({ cover_path: null }, "Kapak fotoğrafı kaldırıldı.");
    if (!isId(id)) return fail("Geçersiz fotoğraf.");
    const { data } = await adminDb().from("photos").select("path").eq("id", id).maybeSingle();
    if (!data) return fail("Fotoğraf bulunamadı.");
    return saveSite({ cover_path: data.path as string }, "Kapak fotoğrafı seçildi.");
  });
}

export async function uploadLogo(_: State, fd: FormData): Promise<State> {
  return guarded(async () => {
    const img = await processImage(fd.get("file") as File, "logo");
    const { data } = await adminDb().from("site_settings").select("logo_path").eq("id", 1).single();
    const path = await uploadMedia("logo", img);
    const r = await saveSite({ logo_path: path }, "Logo değişti.");
    if (r?.ok) await removeMedia(data?.logo_path as string | null);
    else await removeMedia(path);
    return r;
  });
}

export async function removeLogo(): Promise<State> {
  return guarded(async () => {
    const { data } = await adminDb().from("site_settings").select("logo_path").eq("id", 1).single();
    const r = await saveSite({ logo_path: null }, "Özel logo kaldırıldı, varsayılan logo gösteriliyor.");
    if (r?.ok) await removeMedia(data?.logo_path as string | null);
    return r;
  });
}

// ---------- Hesap ----------

export async function changeAccount(_prev: State, fd: FormData): Promise<State> {
  const admin = await requireAdmin();
  try {
    const current = String(fd.get("current") ?? "");
    const username = str(fd, "username").toLowerCase();
    const next = String(fd.get("next") ?? "");
    const again = String(fd.get("again") ?? "");

    const { data: user } = await adminDb().from("admin_users").select("password_hash").eq("id", admin.id).single();
    if (!user || !(await verifyPassword(current, user.password_hash as string))) return fail("Mevcut şifre yanlış.");

    const patch: Record<string, string> = {};
    if (username && username !== admin.username) {
      if (!/^[a-z0-9._-]{3,40}$/.test(username)) return fail("Kullanıcı adı 3–40 karakter olmalı (harf, rakam, . _ -).");
      patch.username = username;
    }
    if (next) {
      if (next !== again) return fail("Yeni şifreler aynı değil.");
      const problem = passwordProblem(next);
      if (problem) return fail(problem);
      patch.password_hash = await hashPassword(next);
    }
    if (Object.keys(patch).length === 0) return fail("Değiştirilecek bir şey yok.");

    const { error } = await adminDb().from("admin_users").update(patch).eq("id", admin.id);
    if (error) return fail(error.code === "23505" ? "Bu kullanıcı adı kullanılıyor." : "Kaydedilemedi.");
    if (patch.password_hash) await endOtherSessions(admin.id);
    return ok(patch.password_hash ? "Hesap kaydedildi. Diğer cihazlardaki oturumlar kapatıldı." : "Hesap kaydedildi.");
  } catch (e) {
    console.error(e);
    return fail("Beklenmeyen bir hata oldu.");
  }
}
