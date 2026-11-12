// Saf (yan etkisiz) yardımcılar: fiyat, telefon, Instagram, arama, çalışma saatleri, renk.

/** Türkçe karakterden bağımsız arama için metni sadeleştirir ("Çay" -> "cay"). */
export function normalizeTr(text: string): string {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** "120", "12,50", "12.50" kabul; belirsiz "1.250" reddedilir. Geçersizse null. */
export function parsePrice(input: string): number | null {
  const t = input.trim().replace(/\s/g, "");
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(t)) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatPrice(value: number | string, symbol: string): string {
  const n = typeof value === "string" ? Number(value) : value;
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  const text = n.toLocaleString("tr-TR", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${text}`;
}

/** Boşluklu/parantezli yazılan telefonu rakamlara indirger. Geçersizse null. */
export function normalizePhone(input: string): string | null {
  const t = input.trim();
  if (t === "") return "";
  const plus = t.startsWith("+");
  const digits = t.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return (plus ? "+" : "") + digits;
}

export function phoneHref(phone: string): string {
  if (phone.startsWith("+")) return `tel:${phone}`;
  if (phone.startsWith("0")) return `tel:+9${phone}`; // 05xx -> +905xx
  return `tel:+90${phone}`;
}

export function formatPhoneDisplay(phone: string): string {
  const m = phone.match(/^0(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `0 (${m[1]}) ${m[2]} ${m[3]} ${m[4]}` : phone;
}

/** @isim, isim ya da tam link kabul; kullanıcı adını döndürür. Geçersizse null, boşsa "". */
export function normalizeInstagram(input: string): string | null {
  let t = input.trim();
  if (t === "") return "";
  t = t.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "");
  t = t.split(/[/?#]/)[0] ?? "";
  return /^[A-Za-z0-9._]{1,30}$/.test(t) ? t : null;
}

export function mapsHref(address: string, customUrl: string): string {
  if (customUrl) return customUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export type HourRow = { day: number; is_closed: boolean; opens: string; closes: string };

function toMinutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

/** İşletmenin saat dilimine göre şu an açık mı? Gece yarısını geçen saatleri doğru hesaplar. */
export function isOpenNow(hours: HourRow[], timeZone: string, now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  const minutes =
    Number(parts.find((p) => p.type === "hour")?.value) * 60 +
    Number(parts.find((p) => p.type === "minute")?.value);

  const today = hours.find((h) => h.day === day);
  if (today && !today.is_closed) {
    const o = toMinutes(today.opens);
    const c = toMinutes(today.closes);
    if (c > o) {
      if (minutes >= o && minutes < c) return true;
    } else if (minutes >= o) {
      return true; // gece yarısını geçen vardiyanın ilk kısmı
    }
  }
  const prev = hours.find((h) => h.day === (day + 6) % 7);
  if (prev && !prev.is_closed) {
    const o = toMinutes(prev.opens);
    const c = toMinutes(prev.closes);
    if (c <= o && minutes < c) return true; // dünün vardiyası bugüne taşıyor
  }
  return false;
}

export const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
/** Görüntüleme sırası: Pazartesi'den başlar. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function hhmm(t: string): string {
  return t.slice(0, 5);
}

export function isHexColor(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

/** WCAG kontrast oranı (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}
