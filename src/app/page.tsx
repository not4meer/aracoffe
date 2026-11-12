import Image from "next/image";
import { getHours, getMenu, getPhotos, getSite, mediaUrl } from "@/lib/data";
import { formatPhoneDisplay, mapsHref, phoneHref } from "@/lib/format";
import { Menu } from "@/components/Menu";
import { OpenBadge } from "@/components/OpenBadge";
import { SiteLogo } from "@/components/SiteLogo";
import { HoursTable } from "@/components/HoursTable";
import { BackToTop } from "@/components/BackToTop";

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default async function Home() {
  const [site, menu, hours, photos] = await Promise.all([getSite(), getMenu(), getHours(), getPhotos()]);
  const cover = mediaUrl(site.cover_path, site.updated_at);
  const actionClass =
    "inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2.5 text-sm font-bold text-brand shadow-sm transition-transform hover:scale-[1.03]";

  return (
    <>
      <header className="relative overflow-hidden bg-brand text-paper">
        <div aria-hidden className="pointer-events-none absolute -inset-20 text-paper opacity-[0.06]">
          <div className="bean-pattern absolute inset-0" />
        </div>
        {cover && (
          <>
            <Image src={cover} alt="" fill priority unoptimized className="object-cover opacity-40" />
            <div className="absolute inset-0 bg-brand/60" />
          </>
        )}
        <div className="relative mx-auto flex max-w-2xl flex-col items-center px-4 pb-14 pt-12 text-center">
          <SiteLogo site={site} size={144} className="h-36 w-36 rounded-full shadow-2xl ring-[6px] ring-paper/25" />
          <h1 className="mt-7 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">{site.business_name}</h1>
          {site.slogan && (
            <p className="mt-3 flex items-center gap-3 text-lg font-light italic tracking-wide text-paper/90">
              <span aria-hidden className="h-px w-8 bg-paper/50" />
              {site.slogan}
              <span aria-hidden className="h-px w-8 bg-paper/50" />
            </p>
          )}
          <div className="mt-5">
            <OpenBadge hours={hours} timezone={site.timezone} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {site.phone && (
              <a href={phoneHref(site.phone)} className={actionClass}>
                <Icon d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
                Ara
              </a>
            )}
            {site.address && (
              <a href={mapsHref(site.address, site.map_url)} target="_blank" rel="noopener noreferrer" className={actionClass}>
                <Icon d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                Yol tarifi
              </a>
            )}
            {site.instagram && (
              <a href={`https://www.instagram.com/${site.instagram}/`} target="_blank" rel="noopener noreferrer" className={actionClass}>
                <Icon d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.5 6.5h.01" />
                Instagram
              </a>
            )}
          </div>
        </div>
        <svg aria-hidden viewBox="0 0 1440 40" preserveAspectRatio="none" className="absolute bottom-[-1px] left-0 h-6 w-full text-paper">
          <path fill="currentColor" d="M0 40V20C240 0 480 0 720 12s480 14 720-2v30Z" />
        </svg>
      </header>

      <main className="flex-1">
        {site.about_text && (
          <section className="mx-auto max-w-2xl px-4 pt-8 text-center">
            <p className="text-lg leading-relaxed text-ink/90">{site.about_text}</p>
          </section>
        )}

        <Menu categories={menu} symbol={site.currency_symbol} menuTitle={site.menu_title || "Menü"} />

        {photos.length > 0 && (
          <section aria-labelledby="galeri-baslik" className="bg-soft/60 py-12">
            <div className="mx-auto max-w-2xl px-4">
              <h2 id="galeri-baslik" className="font-display text-4xl text-brand">
                {site.gallery_title || "Galeri"}
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-3">
                {photos.map((p) => (
                  <li key={p.id} className="overflow-hidden rounded-2xl bg-soft">
                    <Image src={mediaUrl(p.path)!} alt={p.alt} width={p.width} height={p.height} unoptimized loading="lazy" className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section id="iletisim" aria-labelledby="iletisim-baslik" className="mx-auto max-w-2xl px-4 py-12">
          <h2 id="iletisim-baslik" className="font-display text-4xl text-brand">
            {site.contact_title || "İletişim"}
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div className="space-y-4">
              {site.address && (
                <p>
                  <span className="block text-sm font-bold uppercase tracking-wide text-accent">Adres</span>
                  {site.address}
                </p>
              )}
              {site.phone && (
                <p>
                  <span className="block text-sm font-bold uppercase tracking-wide text-accent">Telefon</span>
                  <a href={phoneHref(site.phone)} className="underline underline-offset-4">
                    {formatPhoneDisplay(site.phone)}
                  </a>
                </p>
              )}
              {site.instagram && (
                <p>
                  <span className="block text-sm font-bold uppercase tracking-wide text-accent">Instagram</span>
                  <a href={`https://www.instagram.com/${site.instagram}/`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    @{site.instagram}
                  </a>
                </p>
              )}
            </div>
            <div>
              <span className="block text-sm font-bold uppercase tracking-wide text-accent">Çalışma saatleri</span>
              <HoursTable hours={hours} timezone={site.timezone} />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative mt-4 bg-brand text-paper">
        <svg aria-hidden viewBox="0 0 1440 40" preserveAspectRatio="none" className="absolute left-0 top-[-1px] h-6 w-full rotate-180 text-paper">
          <path fill="currentColor" d="M0 40V20C240 0 480 0 720 12s480 14 720-2v30Z" />
        </svg>
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pb-10 pt-14 text-center">
          <SiteLogo site={site} size={64} className="h-16 w-16 rounded-full ring-4 ring-paper/20" />
          <p className="mt-4 font-display text-2xl">{site.business_name}</p>
          {site.slogan && <p className="mt-1 text-sm italic text-paper/80">{site.slogan}</p>}
          {site.instagram && (
            <a href={`https://www.instagram.com/${site.instagram}/`} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold underline underline-offset-4">
              @{site.instagram}
            </a>
          )}
        </div>
      </footer>
      <BackToTop />
    </>
  );
}
