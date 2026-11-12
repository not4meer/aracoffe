// Yuvarlak logoyu yükler: dairenin dışını şeffaf yapar, PNG'ye çevirir, depoya koyar, site ayarına bağlar.
// Kullanım: ENV_FILE=.env.local node scripts/upload-logo.mjs <dosya>
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const envFile = process.env.ENV_FILE ?? ".env.local";
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error("Logo dosyası bulunamadı.");
  process.exit(1);
}

const SIZE = 512;
const square = await sharp(file).rotate().resize(SIZE, SIZE, { fit: "cover" }).toBuffer();
const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - 3}" fill="#fff"/></svg>`);
const png = await sharp(square).composite([{ input: mask, blend: "dest-in" }]).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const { data: site, error: readErr } = await db.from("site_settings").select("logo_path").eq("id", 1).single();
if (readErr) throw readErr;

const path = `logo/${randomUUID()}.png`;
const up = await db.storage.from("media").upload(path, png, { contentType: "image/png", cacheControl: "3600" });
if (up.error) throw up.error;
const { error } = await db.from("site_settings").update({ logo_path: path }).eq("id", 1);
if (error) {
  await db.storage.from("media").remove([path]);
  throw error;
}
if (site.logo_path) await db.storage.from("media").remove([site.logo_path]);
console.log(`Logo yüklendi: ${path} (${Math.round(png.length / 1024)} KB)`);
