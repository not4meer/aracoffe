import { getAdmin } from "@/lib/admin/auth";
import { qrPng, qrSvg, siteUrl } from "@/lib/admin/qr";

export async function GET(_req: Request, ctx: { params: Promise<{ format: string }> }) {
  if (!(await getAdmin())) return new Response("Giriş gerekli", { status: 401 });
  const { format } = await ctx.params;
  const url = await siteUrl();
  if (format === "png") {
    return new Response(new Uint8Array(await qrPng(url)), {
      headers: { "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="menu-qr.png"', "Cache-Control": "no-store" },
    });
  }
  if (format === "svg") {
    return new Response(await qrSvg(url), {
      headers: { "Content-Type": "image/svg+xml", "Content-Disposition": 'attachment; filename="menu-qr.svg"', "Cache-Control": "no-store" },
    });
  }
  return new Response("Bulunamadı", { status: 404 });
}
