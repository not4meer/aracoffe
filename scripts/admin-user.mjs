// Panel kullanıcısı oluşturur ya da şifresini sıfırlar.
// Kullanım:  npm run admin:user -- <kullanici-adi>
// Şifre: ADMIN_INITIAL_PASSWORD ortam değişkeni (.env.local) ya da komut satırında sorulur.
import { readFileSync, existsSync } from "node:fs";
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadEnv(process.env.ENV_FILE ?? ".env.local");

const username = (process.argv[2] ?? "admin").trim().toLowerCase();
if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
  console.error("Kullanıcı adı 3–40 karakter olmalı (harf, rakam, . _ -).");
  process.exit(1);
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => (rl.close(), resolve(a))));
}

const password = process.env.ADMIN_INITIAL_PASSWORD || (await ask("Yeni şifre (en az 10 karakter, harf+rakam): "));
if (password.length < 10 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password)) {
  console.error("Şifre en az 10 karakter olmalı ve hem harf hem rakam içermeli.");
  process.exit(1);
}

const N = 16384;
const salt = randomBytes(16);
const key = await new Promise((res, rej) => scrypt(password, salt, 64, { N }, (e, k) => (e ? rej(e) : res(k))));
const hash = `scrypt$${N}$${salt.toString("base64")}$${key.toString("base64")}`;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY gerekli.");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false } });

const { data: existing } = await db.from("admin_users").select("id").eq("username", username).maybeSingle();
if (existing) {
  const { error } = await db.from("admin_users").update({ password_hash: hash }).eq("id", existing.id);
  if (error) throw error;
  await db.from("admin_sessions").delete().eq("user_id", existing.id);
  console.log(`"${username}" kullanıcısının şifresi güncellendi, açık oturumlar kapatıldı.`);
} else {
  const { error } = await db.from("admin_users").insert({ username, password_hash: hash });
  if (error) throw error;
  console.log(`"${username}" kullanıcısı oluşturuldu.`);
}
