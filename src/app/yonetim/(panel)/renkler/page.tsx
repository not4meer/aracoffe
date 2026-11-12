import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/auth";
import { ColorsForm } from "@/components/admin/ColorsForm";

export default async function RenklerPage() {
  await requireAdmin();
  const { data: s, error } = await adminDb()
    .from("site_settings")
    .select("color_primary,color_text,color_bg,color_soft,color_accent,business_name,slogan,currency_symbol,updated_at")
    .eq("id", 1)
    .single();
  if (error || !s) throw new Error("Renkler okunamadı.");
  const { updated_at, business_name, slogan, currency_symbol, ...colors } = s;
  return (
    <div>
      <h2 className="mb-1 text-lg font-extrabold">Renkler</h2>
      <p className="mb-4 text-sm text-stone-700">Renk seçiciyle ya da kod yazarak değiştirin. Aşağıda canlı önizlemeyi görürsünüz; kaydedince sitede hemen değişir.</p>
      <ColorsForm key={updated_at} initial={colors} name={business_name} slogan={slogan} symbol={currency_symbol} />
    </div>
  );
}
