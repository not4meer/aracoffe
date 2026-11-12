import { afterEach, describe, expect, it, vi } from "vitest";
import { publicEnv } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("publicEnv", () => {
  it("değişken varsa değerini döndürür", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ornek.supabase.co");
    expect(publicEnv.supabaseUrl).toBe("https://ornek.supabase.co");
  });

  it("değişken eksik ya da boşsa açık hata verir", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "  ");
    expect(() => publicEnv.supabasePublishableKey).toThrow(
      "Eksik ortam değişkeni: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  });
});
