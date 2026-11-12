import { ImageResponse } from "next/og";
import { getSite, mediaUrl } from "@/lib/data";
import { LOGO_SVG } from "@/lib/logo-svg";

// WhatsApp / Instagram'da link paylaşılınca görünen önizleme görseli. Renk ve ad veritabanından gelir.
export const alt = "Menü";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const site = await getSite();
  const logo = mediaUrl(site.logo_path, site.updated_at) ?? `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: site.color_primary,
          color: site.color_bg,
        }}
      >
        <img src={logo} width={280} height={280} alt="" style={{ borderRadius: 9999 }} />
        <div style={{ marginTop: 40, fontSize: 76, fontWeight: 700, letterSpacing: -1 }}>{site.business_name}</div>
      </div>
    ),
    size,
  );
}
