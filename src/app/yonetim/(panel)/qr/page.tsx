import { requireAdmin } from "@/lib/admin/auth";
import { qrSvg, siteUrl } from "@/lib/admin/qr";
import { btn, btnGhost, card } from "@/components/admin/styles";

export default async function QrPage() {
  await requireAdmin();
  const url = await siteUrl();
  const svg = await qrSvg(url);
  const local = /^https?:\/\/(localhost|127\.)/.test(url);
  return (
    <section className={card}>
      <h2 className="mb-1 text-lg font-extrabold">QR kod</h2>
      <p className="mb-4 text-sm text-stone-700">
        Masalara koyacağınız QR kod, menü sitenizin adresini açar: <span className="font-mono font-semibold">{url}</span>
      </p>
      {local && (
        <p role="status" className="mb-4 rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950">
          ⚠ Bu adres sadece bu bilgisayarda çalışır. Siteyi yayına alıp alan adını bağladıktan sonra QR kodu buradan yeniden indirin; basmadan önce bunu bekleyin.
        </p>
      )}
      <div
        role="img"
        aria-label="Menü sitesinin QR kodu"
        className="mx-auto mb-5 w-64 max-w-full rounded-2xl border border-stone-200 bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="flex flex-wrap justify-center gap-2">
        <a href="/yonetim/qr-indir/png" download className={btn}>
          PNG indir (baskı için)
        </a>
        <a href="/yonetim/qr-indir/svg" download className={btnGhost}>
          SVG indir (matbaa için)
        </a>
      </div>
    </section>
  );
}
