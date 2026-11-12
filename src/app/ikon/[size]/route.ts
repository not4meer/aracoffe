import sharp from "sharp";
import { getSite, mediaUrl } from "@/lib/data";
import { LOGO_SVG } from "@/lib/logo-svg";

const SIZES = new Set([180, 192, 512]);

/**
 * Ana ekran ikonu: logo, ana renkli kare zemin üzerinde ortalanır (kenarda güvenli boşluk bırakılır,
 * böylece telefon ikonu yuvarlatsa bile logo kesilmez). Logo ve renk veritabanından gelir.
 */
export async function GET(req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size: raw } = await ctx.params;
  const size = Number(raw);
  if (!SIZES.has(size)) return new Response("Bulunamadı", { status: 404 });
  const version = new URL(req.url).searchParams.get("v");

  const site = await getSite();
  const logoUrl = mediaUrl(site.logo_path, site.updated_at);
  let logo: Buffer;
  if (logoUrl) {
    const res = await fetch(logoUrl);
    if (!res.ok) return new Response("Logo okunamadı", { status: 502 });
    logo = Buffer.from(await res.arrayBuffer());
  } else {
    logo = await sharp(Buffer.from(LOGO_SVG), { density: 300 }).resize(size, size).png().toBuffer();
  }

  const inner = Math.round(size * 0.78);
  const mark = await sharp(logo).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const png = await sharp({ create: { width: size, height: size, channels: 4, background: site.color_primary } })
    .composite([{ input: mark, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // Sürüm numarası (?v=) logo/renk değişince değiştiği için uzun süre önbelleğe alınabilir.
      "Cache-Control": version ? "public, max-age=31536000, immutable" : "public, max-age=3600",
    },
  });
}
