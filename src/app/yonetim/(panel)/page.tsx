import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/auth";
import { formatPrice, normalizeTr } from "@/lib/format";
import { mediaUrl } from "@/lib/data";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  moveCategory,
  moveProduct,
  moveProductToCategory,
  removeProductImage,
  setProductFlag,
  setProductImage,
  toggleCategory,
  updateCategory,
  updateProduct,
} from "@/app/yonetim/actions";
import { ActionForm, ImagePicker } from "@/components/admin/ui";
import { PanelSearch } from "@/components/admin/PanelSearch";
import { btn, btnDanger, btnGhost, card, input, label } from "@/components/admin/styles";

type Cat = { id: string; name: string; note: string; is_visible: boolean; updated_at: string };
type Prod = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_path: string | null;
  is_visible: boolean;
  is_sold_out: boolean;
  updated_at: string;
};

function Mini({
  action,
  fields,
  children,
  danger,
  confirm,
  title,
}: {
  action: (p: never, fd: FormData) => Promise<never>;
  fields: Record<string, string>;
  children: React.ReactNode;
  danger?: boolean;
  confirm?: string;
  title?: string;
}) {
  return (
    <ActionForm action={action as never} confirm={confirm} className="inline">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" title={title} className={danger ? btnDanger : btnGhost}>
        {children}
      </button>
    </ActionForm>
  );
}

export default async function MenuPage() {
  await requireAdmin();
  const db = adminDb();
  const [cats, prods, site] = await Promise.all([
    db.from("categories").select("*").order("sort_order").order("created_at"),
    db.from("products").select("*").order("sort_order").order("created_at"),
    db.from("site_settings").select("currency_symbol").eq("id", 1).single(),
  ]);
  if (cats.error || prods.error) throw new Error("Menü okunamadı.");
  const categories = (cats.data ?? []) as Cat[];
  const products = (prods.data ?? []) as Prod[];
  const symbol = site.data?.currency_symbol ?? "₺";

  return (
    <div className="space-y-5">
      <PanelSearch />
      <details className={card}>
        <summary className="cursor-pointer text-base font-extrabold">+ Yeni kategori ekle</summary>
        <ActionForm action={createCategory} className="mt-4 space-y-3">
          <div>
            <label htmlFor="new-cat-name" className={label}>
              Kategori adı
            </label>
            <input id="new-cat-name" name="name" required maxLength={80} className={input} placeholder="Örn. Tatlılar" />
          </div>
          <div>
            <label htmlFor="new-cat-note" className={label}>
              Not (isteğe bağlı)
            </label>
            <input id="new-cat-note" name="note" maxLength={300} className={input} />
          </div>
          <button type="submit" className={btn}>
            Kategori ekle
          </button>
        </ActionForm>
      </details>

      {categories.length === 0 && <p className={card}>Henüz kategori yok. Yukarıdan ilk kategoriyi ekleyin.</p>}

      {categories.map((c, ci) => {
        const list = products.filter((p) => p.category_id === c.id);
        return (
          <details key={c.id} data-kategori={c.name} open={ci === 0} className={`${card} ${c.is_visible ? "" : "opacity-80"}`}>
            <summary className="cursor-pointer list-none">
              <span className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-lg font-extrabold">{c.name}</span>
                  <span className="ml-2 text-sm text-stone-700">{list.length} ürün</span>
                  {!c.is_visible && <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold">Gizli</span>}
                </span>
                <span aria-hidden className="text-stone-600">
                  ▾
                </span>
              </span>
            </summary>

            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Mini action={moveCategory as never} fields={{ id: c.id, dir: "up" }} title="Yukarı taşı">
                  ↑ Yukarı
                </Mini>
                <Mini action={moveCategory as never} fields={{ id: c.id, dir: "down" }} title="Aşağı taşı">
                  ↓ Aşağı
                </Mini>
                <Mini action={toggleCategory as never} fields={{ id: c.id, visible: c.is_visible ? "0" : "1" }}>
                  {c.is_visible ? "Gizle" : "Göster"}
                </Mini>
                <Mini
                  action={deleteCategory as never}
                  fields={{ id: c.id }}
                  danger
                  confirm={`“${c.name}” kategorisi ve içindeki ${list.length} ürün silinecek. Bu işlem geri alınamaz. Emin misiniz?`}
                >
                  Kategoriyi sil
                </Mini>
              </div>

              <details className="rounded-xl bg-stone-50 p-3">
                <summary className="cursor-pointer text-sm font-bold">Kategori adını / notunu düzenle</summary>
              <ActionForm key={c.updated_at} action={updateCategory} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={c.id} />
                <div>
                  <label htmlFor={`cn-${c.id}`} className={label}>
                    Kategori adı
                  </label>
                  <input id={`cn-${c.id}`} name="name" defaultValue={c.name} required maxLength={80} className={input} />
                </div>
                <div>
                  <label htmlFor={`cno-${c.id}`} className={label}>
                    Not
                  </label>
                  <input id={`cno-${c.id}`} name="note" defaultValue={c.note} maxLength={300} className={input} />
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className={btn}>
                    Kategoriyi kaydet
                  </button>
                </div>
              </ActionForm>
              </details>

              <ul className="divide-y divide-stone-200">
                {list.map((p) => (
                  <li key={p.id} data-ara={normalizeTr(`${p.name} ${p.description}`)} className="flex items-start gap-2 py-2">
                    <details className="min-w-0 flex-1">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1.5">
                        <span className="min-w-0">
                          <span className={`font-bold ${p.is_visible ? "" : "text-stone-500 line-through"}`}>{p.name}</span>
                          {p.is_sold_out && <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">Tükendi</span>}
                          {!p.is_visible && <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold">Gizli</span>}
                        </span>
                        <span className="shrink-0 font-bold tabular-nums">{formatPrice(p.price, symbol)}</span>
                      </summary>

                      <div className="mt-3 space-y-3 rounded-xl bg-stone-50 p-3">
                        <ActionForm key={p.updated_at} action={updateProduct} className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                          <input type="hidden" name="id" value={p.id} />
                          <div>
                            <label htmlFor={`pn-${p.id}`} className={label}>
                              Ürün adı
                            </label>
                            <input id={`pn-${p.id}`} name="name" defaultValue={p.name} required maxLength={120} className={input} />
                          </div>
                          <div>
                            <label htmlFor={`pp-${p.id}`} className={label}>
                              Fiyat
                            </label>
                            <input id={`pp-${p.id}`} name="price" defaultValue={String(Number(p.price)).replace(".", ",")} required inputMode="decimal" className={input} />
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor={`pd-${p.id}`} className={label}>
                              Açıklama (isteğe bağlı)
                            </label>
                            <textarea id={`pd-${p.id}`} name="description" defaultValue={p.description} maxLength={500} rows={2} className={input} />
                          </div>
                          <div className="sm:col-span-2">
                            <button type="submit" className={btn}>
                              Ürünü kaydet
                            </button>
                          </div>
                        </ActionForm>

                        <div className="flex flex-wrap gap-2">
                          <Mini action={moveProduct as never} fields={{ id: p.id, category_id: c.id, dir: "up" }}>
                            ↑ Yukarı
                          </Mini>
                          <Mini action={moveProduct as never} fields={{ id: p.id, category_id: c.id, dir: "down" }}>
                            ↓ Aşağı
                          </Mini>
                          <Mini action={setProductFlag as never} fields={{ id: p.id, flag: "is_visible", value: p.is_visible ? "0" : "1" }}>
                            {p.is_visible ? "Gizle" : "Göster"}
                          </Mini>
                          <Mini action={deleteProduct as never} fields={{ id: p.id }} danger confirm={`“${p.name}” silinecek. Emin misiniz?`}>
                            Sil
                          </Mini>
                        </div>

                        {categories.length > 1 && (
                          <ActionForm action={moveProductToCategory} className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="id" value={p.id} />
                            <div>
                              <label htmlFor={`mv-${p.id}`} className={label}>
                                Başka kategoriye taşı
                              </label>
                              <select id={`mv-${p.id}`} name="category_id" defaultValue={c.id} className={input}>
                                {categories.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button type="submit" className={btnGhost}>
                              Taşı
                            </button>
                          </ActionForm>
                        )}

                        <div className="space-y-2">
                          <p className={label}>Ürün fotoğrafı</p>
                          {p.image_path && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(p.image_path, p.updated_at)!} alt={`${p.name} fotoğrafı`} className="h-24 w-24 rounded-xl object-cover" />
                          )}
                          <ActionForm action={setProductImage} className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="id" value={p.id} />
                            <ImagePicker max={1000} />
                            <button type="submit" className={btnGhost}>
                              {p.image_path ? "Fotoğrafı değiştir" : "Fotoğraf ekle"}
                            </button>
                          </ActionForm>
                          {p.image_path && (
                            <Mini action={removeProductImage as never} fields={{ id: p.id }} danger confirm="Ürün fotoğrafı silinecek. Emin misiniz?">
                              Fotoğrafı sil
                            </Mini>
                          )}
                        </div>
                      </div>
                    </details>
                    <div className="shrink-0 pt-0.5">
                      <Mini action={setProductFlag as never} fields={{ id: p.id, flag: "is_sold_out", value: p.is_sold_out ? "0" : "1" }} title={p.is_sold_out ? `${p.name} satışa aç` : `${p.name} tükendi`}>
                        {p.is_sold_out ? "Satışa aç" : "Tükendi"}
                      </Mini>
                    </div>
                  </li>
                ))}
              </ul>

              <details className="rounded-xl border border-dashed border-stone-300 p-3">
                <summary className="cursor-pointer font-bold">+ “{c.name}” kategorisine ürün ekle</summary>
                <ActionForm action={createProduct} className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
                  <input type="hidden" name="category_id" value={c.id} />
                  <div>
                    <label htmlFor={`np-${c.id}`} className={label}>
                      Ürün adı
                    </label>
                    <input id={`np-${c.id}`} name="name" required maxLength={120} className={input} />
                  </div>
                  <div>
                    <label htmlFor={`npp-${c.id}`} className={label}>
                      Fiyat
                    </label>
                    <input id={`npp-${c.id}`} name="price" required inputMode="decimal" placeholder="120" className={input} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`npd-${c.id}`} className={label}>
                      Açıklama (isteğe bağlı)
                    </label>
                    <textarea id={`npd-${c.id}`} name="description" maxLength={500} rows={2} className={input} />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" className={btn}>
                      Ürünü ekle
                    </button>
                  </div>
                </ActionForm>
              </details>
            </div>
          </details>
        );
      })}
    </div>
  );
}
