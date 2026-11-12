"use client";

import { useState } from "react";
import { saveColors } from "@/app/yonetim/actions";
import { ActionForm } from "@/components/admin/ui";
import { btn, card, input, label } from "@/components/admin/styles";
import { contrastRatio, isHexColor } from "@/lib/format";

type Colors = { color_primary: string; color_text: string; color_bg: string; color_soft: string; color_accent: string };

const FIELDS: { key: keyof Colors; title: string; hint: string }[] = [
  { key: "color_primary", title: "Ana renk", hint: "Kapak, düğmeler, başlıklar" },
  { key: "color_text", title: "Yazı rengi", hint: "Ürün adları, açıklamalar" },
  { key: "color_bg", title: "Zemin", hint: "Sayfa arka planı" },
  { key: "color_soft", title: "Açık ton", hint: "Kutular, arama çubuğu" },
  { key: "color_accent", title: "Vurgu", hint: "Etiketler, küçük başlıklar" },
];

function normalize(v: string): string {
  const t = v.trim();
  return t.startsWith("#") ? t : `#${t}`;
}

export function ColorsForm({ initial, name, slogan, symbol }: { initial: Colors; name: string; slogan: string; symbol: string }) {
  const [c, setC] = useState<Colors>(initial);
  const valid = (Object.values(c) as string[]).every((v) => isHexColor(normalize(v)));
  const hex = (k: keyof Colors) => (isHexColor(normalize(c[k])) ? normalize(c[k]) : initial[k]);

  const warnings: string[] = [];
  if (contrastRatio(hex("color_text"), hex("color_bg")) < 4.5) warnings.push("Yazı rengi ile zemin arasındaki kontrast düşük; yazılar zor okunabilir.");
  if (contrastRatio(hex("color_bg"), hex("color_primary")) < 4.5) warnings.push("Ana renk ile zemin arasındaki kontrast düşük; kapaktaki yazılar zor okunabilir.");
  if (contrastRatio(hex("color_accent"), hex("color_bg")) < 4.5) warnings.push("Vurgu rengi zeminde zor okunabilir.");

  return (
    <div className="space-y-5">
      <ActionForm action={saveColors} className={`${card} space-y-4`}>
        {FIELDS.map((f) => (
          <div key={f.key} className="grid grid-cols-[3.5rem_1fr] items-end gap-3">
            <input
              type="color"
              aria-label={`${f.title} renk seçici`}
              value={hex(f.key)}
              onChange={(e) => setC({ ...c, [f.key]: e.target.value.toUpperCase() })}
              className="h-12 w-14 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
            />
            <div>
              <label htmlFor={f.key} className={label}>
                {f.title} <span className="font-normal text-stone-600">— {f.hint}</span>
              </label>
              <input
                id={f.key}
                name={f.key}
                value={c[f.key]}
                onChange={(e) => setC({ ...c, [f.key]: e.target.value })}
                maxLength={7}
                spellCheck={false}
                className={`${input} font-mono`}
                aria-invalid={!isHexColor(normalize(c[f.key]))}
              />
            </div>
          </div>
        ))}
        {warnings.map((w) => (
          <p key={w} role="status" className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950">
            ⚠ {w}
          </p>
        ))}
        {!valid && <p className="text-sm font-semibold text-red-700">Renk kodları #RRGGBB biçiminde olmalı.</p>}
        <button type="submit" disabled={!valid} className={btn}>
          Renkleri kaydet
        </button>
      </ActionForm>

      <div aria-label="Canlı önizleme" className="overflow-hidden rounded-2xl border border-stone-300">
        <p className="bg-stone-200 px-4 py-2 text-sm font-bold">Canlı önizleme</p>
        <div style={{ background: hex("color_bg"), color: hex("color_text") }}>
          <div className="px-5 py-8 text-center" style={{ background: hex("color_primary"), color: hex("color_bg") }}>
            <p className="text-2xl font-extrabold">{name}</p>
            {slogan && <p className="mt-1 opacity-90">{slogan}</p>}
          </div>
          <div className="space-y-3 p-5">
            <p className="rounded-full px-4 py-2 text-sm" style={{ background: hex("color_soft") }}>
              Menüde ara
            </p>
            <p className="text-xl font-extrabold" style={{ color: hex("color_primary") }}>
              Örnek kategori
            </p>
            <p className="flex justify-between font-semibold">
              <span>
                Örnek ürün{" "}
                <span className="ml-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: hex("color_accent"), color: hex("color_bg") }}>
                  Tükendi
                </span>
              </span>
              <span style={{ color: hex("color_primary") }}>{symbol}100</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
