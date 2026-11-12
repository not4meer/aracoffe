import { cacheLife, cacheTag } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/public";
import { publicEnv } from "@/lib/env";
import type { HourRow } from "@/lib/format";

// Ziyaretçi tarafı okumaları: önbelleğe alınır, panelden yazınca etiketle yenilenir.

export type Site = {
  business_name: string;
  slogan: string;
  about_text: string;
  phone: string;
  address: string;
  map_url: string;
  instagram: string;
  currency_symbol: string;
  timezone: string;
  menu_title: string;
  gallery_title: string;
  contact_title: string;
  seo_title: string;
  seo_description: string;
  logo_path: string | null;
  cover_path: string | null;
  color_primary: string;
  color_text: string;
  color_bg: string;
  color_soft: string;
  color_accent: string;
  updated_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_path: string | null;
  image_url: string | null;
  is_sold_out: boolean;
};
export type Category = { id: string; name: string; note: string; products: Product[] };
export type Photo = { id: string; path: string; alt: string; width: number; height: number };

export function mediaUrl(path: string | null | undefined, version?: string): string | null {
  if (!path) return null;
  const v = version ? `?v=${encodeURIComponent(version)}` : "";
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/media/${path}${v}`;
}

export async function getSite(): Promise<Site> {
  "use cache";
  cacheTag("site");
  cacheLife("days");
  const { data, error } = await getPublicSupabase().from("site_settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error(`Site bilgileri okunamadı: ${error?.message ?? "kayıt yok"}`);
  return data as Site;
}

export async function getMenu(): Promise<Category[]> {
  "use cache";
  cacheTag("menu");
  cacheLife("days");
  const db = getPublicSupabase();
  const [cats, prods] = await Promise.all([
    db.from("categories").select("id,name,note").order("sort_order").order("created_at"),
    db
      .from("products")
      .select("id,category_id,name,description,price,image_path,is_sold_out")
      .order("sort_order")
      .order("created_at"),
  ]);
  if (cats.error) throw new Error(`Kategoriler okunamadı: ${cats.error.message}`);
  if (prods.error) throw new Error(`Ürünler okunamadı: ${prods.error.message}`);
  return (cats.data ?? [])
    .map((c) => ({
      ...c,
      products: (prods.data ?? [])
        .filter((p) => p.category_id === c.id)
        .map((p) => ({ ...p, price: Number(p.price), image_url: mediaUrl(p.image_path) })),
    }))
    .filter((c) => c.products.length > 0);
}

export async function getHours(): Promise<HourRow[]> {
  "use cache";
  cacheTag("hours");
  cacheLife("days");
  const { data, error } = await getPublicSupabase().from("opening_hours").select("day,is_closed,opens,closes").order("day");
  if (error) throw new Error(`Saatler okunamadı: ${error.message}`);
  return data ?? [];
}

export async function getPhotos(): Promise<Photo[]> {
  "use cache";
  cacheTag("photos");
  cacheLife("days");
  const { data, error } = await getPublicSupabase()
    .from("photos")
    .select("id,path,alt,width,height")
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(`Fotoğraflar okunamadı: ${error.message}`);
  return data ?? [];
}
