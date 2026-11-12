import Image from "next/image";
import { LogoMark } from "@/components/Logo";
import { mediaUrl, type Site } from "@/lib/data";

export function SiteLogo({ site, size, className = "" }: { site: Site; size: number; className?: string }) {
  const url = mediaUrl(site.logo_path, site.updated_at);
  if (url) {
    return (
      <Image src={url} alt={`${site.business_name} logosu`} width={size} height={size} unoptimized className={className} />
    );
  }
  return <LogoMark className={className} label={`${site.business_name} logosu`} />;
}
