"use client";

import { useState } from "react";
import { normalizeTr } from "@/lib/format";
import { input } from "@/components/admin/styles";

/**
 * Panelde ürün arama: yazdıkça sadece eşleşen ürünler ve kategoriler görünür,
 * eşleşen kategoriler otomatik açılır. Türkçe karakterden bağımsızdır ("cay" -> "Çay").
 */
export function PanelSearch() {
  const [info, setInfo] = useState("");

  function apply(raw: string) {
    const q = normalizeTr(raw);
    const cats = document.querySelectorAll<HTMLDetailsElement>("details[data-kategori]");
    let total = 0;
    cats.forEach((cat) => {
      const items = cat.querySelectorAll<HTMLElement>("li[data-ara]");
      // Kategori adı eşleşirse içindeki tüm ürünler gösterilir.
      const catMatch = !q || normalizeTr(cat.dataset.kategori ?? "").includes(q);
      let hits = 0;
      items.forEach((li) => {
        const match = catMatch || (li.dataset.ara ?? "").includes(q);
        li.style.display = match ? "" : "none";
        if (match) hits++;
      });
      total += hits;
      cat.style.display = hits > 0 ? "" : "none";
      if (q) {
        // Aramayla açılan kategorileri işaretle, arama silinince geri kapat.
        if (hits > 0 && !cat.open) {
          cat.open = true;
          cat.dataset.araAcildi = "1";
        }
      } else if (cat.dataset.araAcildi === "1") {
        cat.open = false;
        delete cat.dataset.araAcildi;
      }
    });
    setInfo(q ? (total ? `${total} ürün bulundu` : "Eşleşen ürün yok") : "");
  }

  return (
    <div className="sticky top-0 z-10 -mx-4 bg-stone-100/95 px-4 pb-3 pt-1 backdrop-blur">
      <label htmlFor="panel-ara" className="sr-only">
        Ürün ara
      </label>
      <input
        id="panel-ara"
        type="search"
        autoComplete="off"
        placeholder="Ürün ara: latte, çay, limonata…"
        onChange={(e) => apply(e.target.value)}
        className={input}
      />
      <p role="status" className="mt-1 min-h-5 text-sm font-semibold text-stone-700">
        {info}
      </p>
    </div>
  );
}
