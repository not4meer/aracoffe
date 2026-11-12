import type { MetadataRoute } from "next";
import { getSite } from "@/lib/data";

// "Ana ekrana ekle" için uygulama bilgileri. Ad ve renkler veritabanından gelir.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSite();
  const v = encodeURIComponent(site.updated_at);
  return {
    name: site.business_name,
    short_name: site.business_name.length > 14 ? site.business_name.slice(0, 14) : site.business_name,
    description: site.seo_description || undefined,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "tr",
    background_color: site.color_bg,
    theme_color: site.color_primary,
    icons: [
      { src: `/ikon/192?v=${v}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/ikon/512?v=${v}`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/ikon/512?v=${v}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
