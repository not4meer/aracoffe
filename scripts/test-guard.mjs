// Testler canlı veritabanında çalışmasın diye koruma.
// .env.test.local yoksa, hedef "test" değilse ya da adres canlı adresle aynıysa durur.
import { readFileSync, existsSync } from "node:fs";

function parse(file) {
  if (!existsSync(file)) return null;
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return out;
}

function fail(msg) {
  console.error(`\nTEST KORUMASI: ${msg}\nTestler çalıştırılmadı.\n`);
  process.exit(1);
}

const test = parse(".env.test.local");
if (!test) fail(".env.test.local yok. Ayrı test projesinin bilgileri gerekli.");
if (test.SUPABASE_TARGET !== "test") fail('.env.test.local içinde SUPABASE_TARGET=test yok.');
if (!test.NEXT_PUBLIC_SUPABASE_URL) fail("Test projesinin adresi (NEXT_PUBLIC_SUPABASE_URL) yok.");

const live = parse(".env.local");
if (live?.NEXT_PUBLIC_SUPABASE_URL === test.NEXT_PUBLIC_SUPABASE_URL) {
  fail("Test adresi canlı veritabanıyla aynı. Testler canlıda çalışamaz.");
}
console.log("Test koruması: test veritabanı doğrulandı.");
