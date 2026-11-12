import { LOGO_SVG } from "@/lib/logo-svg";

// Varsayılan logo. Panelden logo yüklenirse SiteLogo onu gösterir.
export function LogoMark({ className, label = "Logo" }: { className?: string; label?: string }) {
  return <span role="img" aria-label={label} className={`block ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />;
}
