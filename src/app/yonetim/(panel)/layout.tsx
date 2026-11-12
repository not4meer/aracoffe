import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { logoutAction } from "@/app/yonetim/actions";
import { PanelNav } from "@/components/admin/ui";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Yönetim paneli</h1>
          <p className="text-sm text-stone-700">Merhaba, {admin.username}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-100">
            Siteyi gör
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-100">
              Çıkış
            </button>
          </form>
        </div>
      </header>
      <PanelNav />
      <div className="mt-5">{children}</div>
    </div>
  );
}
