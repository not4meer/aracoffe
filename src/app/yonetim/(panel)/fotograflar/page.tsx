import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/auth";
import { mediaUrl } from "@/lib/data";
import { LogoMark } from "@/components/Logo";
import { deletePhoto, movePhoto, removeLogo, setCover, updatePhoto, uploadLogo, uploadPhoto } from "@/app/yonetim/actions";
import { ActionForm, ImagePicker } from "@/components/admin/ui";
import { btn, btnDanger, btnGhost, card, input, label } from "@/components/admin/styles";

export default async function FotograflarPage() {
  await requireAdmin();
  const db = adminDb();
  const [site, photos] = await Promise.all([
    db.from("site_settings").select("logo_path,cover_path,updated_at").eq("id", 1).single(),
    db.from("photos").select("*").order("sort_order").order("created_at"),
  ]);
  if (site.error || photos.error) throw new Error("Fotoğraflar okunamadı.");
  const s = site.data!;
  const list = photos.data ?? [];
  const logoUrl = mediaUrl(s.logo_path, s.updated_at);

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="mb-1 text-lg font-extrabold">Logo</h2>
        <p className="mb-4 text-sm text-stone-700">Şeffaf PNG en iyi sonucu verir. Yeni logo yükleyince eskisi silinir.</p>
        <div className="mb-4 flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Mevcut logo" className="h-24 w-24 rounded-full bg-stone-100 object-contain" />
          ) : (
            <LogoMark className="h-24 w-24" />
          )}
          <p className="text-sm text-stone-700">{logoUrl ? "Yüklenen logo kullanılıyor." : "Varsayılan logo kullanılıyor."}</p>
        </div>
        <ActionForm action={uploadLogo} className="flex flex-wrap items-end gap-2">
          <ImagePicker max={800} png />
          <button type="submit" className={btn}>
            Logoyu değiştir
          </button>
        </ActionForm>
        {logoUrl && (
          <ActionForm action={removeLogo as never} confirm="Yüklenen logo silinecek ve varsayılan logo kullanılacak. Emin misiniz?" className="mt-3">
            <button type="submit" className={btnDanger}>
              Yüklenen logoyu kaldır
            </button>
          </ActionForm>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-1 text-lg font-extrabold">Yeni galeri fotoğrafı</h2>
        <p className="mb-4 text-sm text-stone-700">Telefonda seçtiğiniz fotoğraf otomatik küçültülür. Sadece JPEG, PNG ya da WebP.</p>
        <ActionForm action={uploadPhoto} className="space-y-3">
          <ImagePicker max={1600} />
          <div>
            <label htmlFor="new-alt" className={label}>
              Açıklama (görme engelliler ve arama motorları için)
            </label>
            <input id="new-alt" name="alt" maxLength={200} className={input} placeholder="Örn. Kafenin iç mekânı" />
          </div>
          <button type="submit" className={btn}>
            Fotoğrafı yükle
          </button>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-extrabold">Galeri ({list.length})</h2>
        {list.length === 0 && <p className={card}>Henüz fotoğraf yok.</p>}
        {list.map((p) => {
          const isCover = s.cover_path === p.path;
          return (
            <div key={p.id} className={`${card} grid gap-4 sm:grid-cols-[10rem_1fr]`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(p.path)!} alt={p.alt || "Galeri fotoğrafı"} width={p.width} height={p.height} className="h-40 w-full rounded-xl object-cover sm:w-40" />
              <div className="space-y-3">
                {isCover && <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">Kapak fotoğrafı</span>}
                <ActionForm key={p.updated_at} action={updatePhoto} className="space-y-3">
                  <input type="hidden" name="id" value={p.id} />
                  <div>
                    <label htmlFor={`alt-${p.id}`} className={label}>
                      Açıklama
                    </label>
                    <input id={`alt-${p.id}`} name="alt" defaultValue={p.alt} maxLength={200} className={input} />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" name="show" defaultChecked={p.show_in_gallery} className="h-5 w-5" />
                    Galeride göster
                  </label>
                  <button type="submit" className={btn}>
                    Kaydet
                  </button>
                </ActionForm>
                <div className="flex flex-wrap gap-2">
                  <ActionForm action={movePhoto} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="up" />
                    <button type="submit" className={btnGhost}>
                      ↑ Yukarı
                    </button>
                  </ActionForm>
                  <ActionForm action={movePhoto} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="down" />
                    <button type="submit" className={btnGhost}>
                      ↓ Aşağı
                    </button>
                  </ActionForm>
                  <ActionForm action={setCover} className="inline">
                    <input type="hidden" name="id" value={isCover ? "yok" : p.id} />
                    <button type="submit" className={btnGhost}>
                      {isCover ? "Kapaktan kaldır" : "Kapak yap"}
                    </button>
                  </ActionForm>
                  <ActionForm action={deletePhoto} confirm="Fotoğraf kalıcı olarak silinecek. Emin misiniz?" className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={btnDanger}>
                      Sil
                    </button>
                  </ActionForm>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
