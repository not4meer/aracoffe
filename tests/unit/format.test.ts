import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  formatPrice,
  isOpenNow,
  normalizeInstagram,
  normalizePhone,
  normalizeTr,
  parsePrice,
  phoneHref,
  type HourRow,
} from "@/lib/format";

describe("normalizeTr", () => {
  it("Türkçe karakterden bağımsız arar", () => {
    expect(normalizeTr("Çay")).toBe("cay");
    expect(normalizeTr("ÇİLEKLİ Limonata")).toBe("cilekli limonata");
    expect(normalizeTr("Hindistan Cevizli")).toContain("cevizli");
    expect(normalizeTr("Işık")).toBe("isik");
  });
});

describe("parsePrice", () => {
  it("120, 12,50 ve 12.50 kabul eder", () => {
    expect(parsePrice("120")).toBe(120);
    expect(parsePrice("12,50")).toBe(12.5);
    expect(parsePrice("12.50")).toBe(12.5);
  });
  it("belirsiz 1.250 ve saçma girdileri reddeder", () => {
    expect(parsePrice("1.250")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
    expect(parsePrice("-5")).toBeNull();
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("1,2,3")).toBeNull();
  });
});

describe("formatPrice", () => {
  it("tam sayıyı kuruşsuz, kuruşlu fiyatı iki haneyle yazar", () => {
    expect(formatPrice(110, "₺")).toBe("₺110");
    expect(formatPrice("12.5", "₺")).toBe("₺12,50");
  });
});

describe("telefon ve Instagram", () => {
  it("boşluklu ve parantezli telefonu kabul eder", () => {
    expect(normalizePhone("0 (532) 123 45 67")).toBe("05321234567");
    expect(normalizePhone("+90 532 123 45 67")).toBe("+905321234567");
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("")).toBe("");
  });
  it("tel linki üretir", () => {
    expect(phoneHref("05321234567")).toBe("tel:+905321234567");
  });
  it("Instagram: @, kullanıcı adı ve tam link", () => {
    expect(normalizeInstagram("@aracoffeebakery")).toBe("aracoffeebakery");
    expect(normalizeInstagram("aracoffeebakery")).toBe("aracoffeebakery");
    expect(normalizeInstagram("https://www.instagram.com/aracoffeebakery/?hl=tr")).toBe("aracoffeebakery");
    expect(normalizeInstagram("bu geçersiz!")).toBeNull();
  });
});

describe("isOpenNow", () => {
  const all = (opens: string, closes: string): HourRow[] =>
    [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, is_closed: false, opens, closes }));
  // 2026-01-07 Çarşamba 12:00 UTC = İstanbul 15:00
  const noon = new Date("2026-01-07T12:00:00Z");

  it("gün içi saatlerde", () => {
    expect(isOpenNow(all("08:00", "23:00"), "Europe/Istanbul", noon)).toBe(true);
    expect(isOpenNow(all("16:00", "23:00"), "Europe/Istanbul", noon)).toBe(false);
  });
  it("gece yarısını geçen saatlerde (18:00–02:00)", () => {
    const hours = all("18:00", "02:00");
    expect(isOpenNow(hours, "Europe/Istanbul", new Date("2026-01-07T22:00:00Z"))).toBe(true); // İstanbul 01:00
    expect(isOpenNow(hours, "Europe/Istanbul", new Date("2026-01-07T14:00:00Z"))).toBe(false); // 17:00
    expect(isOpenNow(hours, "Europe/Istanbul", new Date("2026-01-07T16:00:00Z"))).toBe(true); // 19:00
  });
  it("kapalı gün", () => {
    const hours = all("08:00", "23:00");
    hours[3] = { day: 3, is_closed: true, opens: "08:00", closes: "23:00" };
    expect(isOpenNow(hours, "Europe/Istanbul", noon)).toBe(false);
  });
});

describe("contrastRatio", () => {
  it("siyah-beyaz 21, aynı renk 1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrastRatio("#4A2416", "#4A2416")).toBe(1);
  });
});
