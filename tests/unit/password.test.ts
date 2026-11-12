import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hashPassword, passwordProblem, verifyPassword } from "@/lib/admin/password";

describe("şifre", () => {
  it("doğru şifreyi doğrular, yanlışı reddeder", async () => {
    const h = await hashPassword("Kahve12345");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Kahve12345", h)).toBe(true);
    expect(await verifyPassword("Kahve12346", h)).toBe(false);
  });
  it("bozuk özeti reddeder", async () => {
    expect(await verifyPassword("x", "bozuk")).toBe(false);
  });
  it("aynı şifre farklı özet üretir (tuzlu)", async () => {
    expect(await hashPassword("Kahve12345")).not.toBe(await hashPassword("Kahve12345"));
  });
  it("zayıf şifreyi reddeder", () => {
    expect(passwordProblem("kisa1")).toMatch(/en az 10/);
    expect(passwordProblem("sadeceharfler")).toMatch(/harf hem rakam/);
    expect(passwordProblem("Kahve12345")).toBeNull();
  });
});
