import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const N = 16384;
const KEYLEN = 64;

function scrypt(password: string, salt: Buffer, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, KEYLEN, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Biçim: scrypt$N$tuz(b64)$özet(b64) */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, { N });
  return `scrypt$${N}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !n || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(password, Buffer.from(salt, "base64"), { N: Number(n) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Şifre en az 10 karakter olmalı.";
  if (password.length > 200) return "Şifre çok uzun.";
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password)) return "Şifre hem harf hem rakam içermeli.";
  return null;
}
