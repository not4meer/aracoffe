import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

/** Site adresi: NEXT_PUBLIC_SITE_URL varsa o, yoksa isteğin geldiği adres (domain değişince kendiliğinden güncellenir). */
export async function siteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export const qrSvg = (url: string) => QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
export const qrPng = (url: string) => QRCode.toBuffer(url, { type: "png", errorCorrectionLevel: "M", margin: 2, width: 1200 });
