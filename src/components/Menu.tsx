"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice, normalizeTr } from "@/lib/format";
import type { Category } from "@/lib/data";

type Props = { categories: Category[]; symbol: string; menuTitle: string };

export function Menu({ categories, symbol, menuTitle }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const stripRef = useRef<HTMLDivElement>(null);
  const q = normalizeTr(query);

  // Sayfa tam yüklenmeden yazılan metni de al.
  useEffect(() => {
    const el = document.getElementById("menu-arama") as HTMLInputElement | null;
    if (el && el.value) queueMicrotask(() => setQuery(el.value));
  }, []);

  const visible = categories
    .map((c) => ({
      ...c,
      products: q ? c.products.filter((p) => normalizeTr(`${p.name} ${p.description}`).includes(q)) : c.products,
    }))
    .filter((c) => c.products.length > 0);

  // Kaydırdıkça aktif kategoriyi bul: üstü yapışkan çubuğun altına geçmiş son kategori.
  useEffect(() => {
    const update = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-cat]"));
      if (sections.length === 0) return;
      const bar = (document.getElementById("menu-cubuk")?.offsetHeight ?? 0) + 24;
      let current = sections[0]!;
      for (const s of sections) if (s.getBoundingClientRect().top <= bar) current = s;
      setActive(current.dataset.cat ?? "");
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [q]);

  // Aktif kategoriyi şeritte ortala. Sadece şerit yatay kayar; sayfanın kendisi kaydırılmaz.
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!strip || !chip) return;
    strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  const count = visible.reduce((n, c) => n + c.products.length, 0);

  function onSearch(value: string) {
    // Aramaya başlarken menünün başına dön; sonuçlar yapışkan çubuğun hemen altında görünsün.
    if (!query && value) {
      const menu = document.getElementById("menu");
      if (menu && menu.getBoundingClientRect().top < 0) menu.scrollIntoView({ block: "start" });
    }
    setQuery(value);
  }

  return (
    <section id="menu" aria-labelledby="menu-baslik">
      <div id="menu-cubuk" className="sticky top-0 z-20 border-b border-brand/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 pt-3">
          <label htmlFor="menu-arama" className="sr-only">
            Menüde ara
          </label>
          <div className="relative">
            <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="menu-arama"
              type="search"
              autoComplete="off"
              placeholder="Menüde ara: latte, çay, limonata…"
              enterKeyHint="search"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full appearance-none rounded-full border border-brand/15 bg-soft/60 py-2.5 pl-11 pr-11 text-base text-ink placeholder:text-ink/60 focus:border-brand focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  document.getElementById("menu-arama")?.focus();
                }}
                aria-label="Aramayı temizle"
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brand hover:bg-brand/10"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <nav aria-label="Kategoriler" className="mx-auto max-w-2xl">
          <div
            ref={stripRef}
            className="hide-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-4 py-3"
            style={{ maskImage: "linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 24px), transparent)" }}
          >
            {visible.map((c) => (
              <a
                key={c.id}
                href={`#kat-${c.id}`}
                data-chip={c.id}
                aria-current={active === c.id ? "true" : undefined}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active === c.id ? "bg-brand text-paper" : "bg-soft text-ink hover:bg-soft/70"
                }`}
              >
                {c.name}
              </a>
            ))}
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-6 pt-8">
        <h2 id="menu-baslik" className="sr-only">
          {menuTitle}
        </h2>
        <p role="status" className="sr-only">
          {q ? `${count} ürün bulundu` : ""}
        </p>
        {visible.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-display text-2xl text-brand">Bulunamadı</p>
            <p className="mt-1 text-ink/75">“{query}” için menüde bir şey yok.</p>
            <button type="button" onClick={() => setQuery("")} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-bold text-paper">
              Tüm menüyü göster
            </button>
          </div>
        )}
        <div className="space-y-10">
          {visible.map((c) => (
            <section key={c.id} id={`kat-${c.id}`} data-cat={c.id} aria-labelledby={`h-${c.id}`} className="menu-wallpaper overflow-hidden rounded-[2rem] bg-soft/50 px-5 pb-3 pt-7 ring-1 ring-brand/10 sm:px-8">
              <div className="mb-2 flex flex-col items-center text-center">
                {/* Logodaki iki kahve çekirdeği */}
                <svg aria-hidden viewBox="610 350 290 230" className="mb-2 h-8 w-10 text-brand">
                  <defs>
                    <mask id={`cekirdek-${c.id}`}>
                      <rect x="600" y="340" width="320" height="260" fill="#fff" />
                      <g fill="none" stroke="#000" strokeWidth="16" strokeLinecap="round">
                        <path d="M648 438 C676 470 676 500 712 552" />
                        <path d="M852 372 C828 408 846 440 818 482" />
                      </g>
                    </mask>
                  </defs>
                  <g fill="currentColor" mask={`url(#cekirdek-${c.id})`}>
                    <ellipse cx="680" cy="494" rx="46" ry="70" transform="rotate(-38 680 494)" />
                    <ellipse cx="836" cy="428" rx="44" ry="66" transform="rotate(30 836 428)" />
                  </g>
                </svg>
                <h3 id={`h-${c.id}`} className="font-display text-3xl tracking-tight text-brand sm:text-4xl">
                  {c.name}
                </h3>
                {c.note && <p className="mt-1 text-sm italic text-ink/75">{c.note}</p>}
                <span aria-hidden className="mt-3 h-px w-16 bg-brand/30" />
              </div>
              <ul>
                {c.products.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} width={64} height={64} loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className={`text-[1.05rem] font-medium leading-snug ${p.is_sold_out ? "text-ink/60 line-through" : ""}`}>{p.name}</p>
                        <span aria-hidden className="price-leader" />
                        <p className={`shrink-0 text-lg font-bold tabular-nums ${p.is_sold_out ? "text-ink/60" : "text-brand"}`}>
                          {formatPrice(p.price, symbol)}
                        </p>
                      </div>
                      {p.is_sold_out && <span className="mt-1 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-paper">Tükendi</span>}
                      {p.description && <p className="mt-0.5 text-sm text-ink/75">{p.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
