import type { Metadata, Viewport } from "next";
import { Gloock, Outfit } from "next/font/google";
import "./globals.css";
import { getSite, mediaUrl } from "@/lib/data";

const gloock = Gloock({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-fraunces", display: "swap" });
const manrope = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const logo = mediaUrl(site.logo_path, site.updated_at);
  const title = site.seo_title || site.business_name;
  return {
    metadataBase: base ? new URL(base) : undefined,
    title,
    description: site.seo_description || undefined,
    openGraph: {
      title,
      description: site.seo_description || undefined,
      siteName: site.business_name,
      locale: "tr_TR",
      type: "website",
    },
    icons: logo ? { icon: logo } : { icon: "/icon.svg" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const site = await getSite();
  return { themeColor: site.color_primary };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  const theme = {
    "--c-primary": site.color_primary,
    "--c-text": site.color_text,
    "--c-bg": site.color_bg,
    "--c-soft": site.color_soft,
    "--c-accent": site.color_accent,
  } as React.CSSProperties;
  return (
    <html lang="tr" className={`${gloock.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col" style={theme}>
        {children}
      </body>
    </html>
  );
}
