// Supabase ücretsiz projeleri 7 gün az kullanılınca duraklatılır.
// Bu zamanlanmış görev her gün küçük bir okuma yaparak projeyi canlı tutar.
export default async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new Response("Ortam değişkenleri eksik", { status: 500 });
  const res = await fetch(`${url}/rest/v1/site_settings?select=id&limit=1`, { headers: { apikey: key } });
  console.log(`Canlı tutma: Supabase ${res.status}`);
  return new Response(null, { status: res.ok ? 200 : 502 });
};

export const config = { schedule: "@daily" };
