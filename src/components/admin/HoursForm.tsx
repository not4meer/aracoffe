"use client";

import { useRef } from "react";
import { saveHours } from "@/app/yonetim/actions";
import { ActionForm } from "@/components/admin/ui";
import { btn, btnGhost, input } from "@/components/admin/styles";
import { DAY_NAMES, DAY_ORDER, hhmm, type HourRow } from "@/lib/format";

export function HoursForm({ hours }: { hours: HourRow[] }) {
  const formRef = useRef<HTMLDivElement>(null);

  function applyMondayToAll() {
    const root = formRef.current;
    if (!root) return;
    const get = (n: string) => root.querySelector<HTMLInputElement>(`[name="${n}"]`)!;
    const opens = get("opens_1").value;
    const closes = get("closes_1").value;
    const closed = get("closed_1").checked;
    for (let d = 0; d < 7; d++) {
      get(`opens_${d}`).value = opens;
      get(`closes_${d}`).value = closes;
      get(`closed_${d}`).checked = closed;
    }
  }

  return (
    <ActionForm action={saveHours} className="space-y-4">
      <div ref={formRef} className="space-y-2">
        {DAY_ORDER.map((d) => {
          const h = hours.find((x) => x.day === d);
          return (
            <div key={d} className="grid grid-cols-[6.5rem_1fr_1fr] items-center gap-2 sm:grid-cols-[8rem_1fr_1fr_auto]">
              <span className="font-bold">{DAY_NAMES[d]}</span>
              <label className="sr-only" htmlFor={`o-${d}`}>
                {DAY_NAMES[d]} açılış
              </label>
              <input id={`o-${d}`} type="time" name={`opens_${d}`} defaultValue={hhmm(h?.opens ?? "09:00")} className={input} />
              <label className="sr-only" htmlFor={`c-${d}`}>
                {DAY_NAMES[d]} kapanış
              </label>
              <input id={`c-${d}`} type="time" name={`closes_${d}`} defaultValue={hhmm(h?.closes ?? "22:00")} className={input} />
              <label className="col-span-3 flex items-center gap-2 text-sm font-semibold sm:col-span-1">
                <input type="checkbox" name={`closed_${d}`} defaultChecked={h?.is_closed ?? false} className="h-5 w-5" />
                Kapalı
              </label>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-stone-700">Kapanış saati açılıştan önceyse gece yarısından sonra kapanıyor demektir (örn. 18:00 – 02:00).</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btn}>
          Saatleri kaydet
        </button>
        <button type="button" onClick={applyMondayToAll} className={btnGhost}>
          Pazartesiyi tüm günlere uygula
        </button>
      </div>
    </ActionForm>
  );
}
