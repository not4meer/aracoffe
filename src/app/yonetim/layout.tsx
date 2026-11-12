import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Yönetim paneli",
  robots: { index: false, follow: false },
};

export default function YonetimLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900" style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}>
      <Suspense fallback={<p className="p-6 text-stone-700">Yükleniyor…</p>}>{children}</Suspense>
      <Toaster />
    </div>
  );
}
