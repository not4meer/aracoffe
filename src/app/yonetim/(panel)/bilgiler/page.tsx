import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/auth";
import { saveContact, saveSeo, saveTexts } from "@/app/yonetim/actions";
import { ActionForm } from "@/components/admin/ui";
import { btn, card, input, label } from "@/components/admin/styles";

export default async function BilgilerPage() {
  await requireAdmin();
  const { data: s, error } = await adminDb().from("site_settings").select("*").eq("id", 1).single();
  if (error || !s) throw new Error("Site bilgileri okunamadı.");

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="mb-1 text-lg font-extrabold">İletişim</h2>
        <p className="mb-4 text-sm text-stone-700">Sitedeki “Ara”, “Yol tarifi” ve “Instagram” düğmeleri buradan beslenir.</p>
        <ActionForm key={s.updated_at} action={saveContact} className="space-y-3">
          <div>
            <label htmlFor="phone" className={label}>
              Telefon
            </label>
            <input id="phone" name="phone" defaultValue={s.phone} inputMode="tel" maxLength={30} className={input} placeholder="0532 123 45 67" />
          </div>
          <div>
            <label htmlFor="address" className={label}>
              Adres
            </label>
            <textarea id="address" name="address" defaultValue={s.address} rows={2} maxLength={300} className={input} />
          </div>
          <div>
            <label htmlFor="map_url" className={label}>
              Harita linki (boş bırakırsanız adresten otomatik oluşur)
            </label>
            <input id="map_url" name="map_url" defaultValue={s.map_url} maxLength={500} className={input} placeholder="https://maps.google.com/..." />
          </div>
          <div>
            <label htmlFor="instagram" className={label}>
              Instagram
            </label>
            <input id="instagram" name="instagram" defaultValue={s.instagram} maxLength={80} className={input} placeholder="@kullaniciadi" />
          </div>
          <button type="submit" className={btn}>
            İletişimi kaydet
          </button>
        </ActionForm>
      </section>

      <section className={card}>
        <h2 className="mb-4 text-lg font-extrabold">Sayfa yazıları</h2>
        <ActionForm key={s.updated_at} action={saveTexts} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="business_name" className={label}>
                İşletme adı
              </label>
              <input id="business_name" name="business_name" defaultValue={s.business_name} required maxLength={80} className={input} />
            </div>
            <div>
              <label htmlFor="currency_symbol" className={label}>
                Para birimi
              </label>
              <input id="currency_symbol" name="currency_symbol" defaultValue={s.currency_symbol} required maxLength={5} className={input} />
            </div>
          </div>
          <div>
            <label htmlFor="slogan" className={label}>
              Slogan
            </label>
            <input id="slogan" name="slogan" defaultValue={s.slogan} maxLength={160} className={input} />
          </div>
          <div>
            <label htmlFor="about_text" className={label}>
              Kısa tanıtım (kapağın altında görünür)
            </label>
            <textarea id="about_text" name="about_text" defaultValue={s.about_text} rows={3} maxLength={1000} className={input} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="menu_title" className={label}>
                Menü başlığı
              </label>
              <input id="menu_title" name="menu_title" defaultValue={s.menu_title} maxLength={60} className={input} />
            </div>
            <div>
              <label htmlFor="gallery_title" className={label}>
                Galeri başlığı
              </label>
              <input id="gallery_title" name="gallery_title" defaultValue={s.gallery_title} maxLength={60} className={input} />
            </div>
            <div>
              <label htmlFor="contact_title" className={label}>
                İletişim başlığı
              </label>
              <input id="contact_title" name="contact_title" defaultValue={s.contact_title} maxLength={60} className={input} />
            </div>
          </div>
          <button type="submit" className={btn}>
            Yazıları kaydet
          </button>
        </ActionForm>
      </section>

      <section className={card}>
        <h2 className="mb-1 text-lg font-extrabold">Arama motoru ve paylaşım</h2>
        <p className="mb-4 text-sm text-stone-700">Google sonuçlarında ve link paylaşırken görünen başlık ile açıklama.</p>
        <ActionForm key={s.updated_at} action={saveSeo} className="space-y-3">
          <div>
            <label htmlFor="seo_title" className={label}>
              Başlık
            </label>
            <input id="seo_title" name="seo_title" defaultValue={s.seo_title} maxLength={70} className={input} />
          </div>
          <div>
            <label htmlFor="seo_description" className={label}>
              Açıklama
            </label>
            <textarea id="seo_description" name="seo_description" defaultValue={s.seo_description} rows={3} maxLength={200} className={input} />
          </div>
          <button type="submit" className={btn}>
            Kaydet
          </button>
        </ActionForm>
      </section>
    </div>
  );
}
