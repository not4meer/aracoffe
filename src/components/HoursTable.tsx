"use client";

import { useSyncExternalStore } from "react";
import { DAY_NAMES, DAY_ORDER, hhmm, type HourRow } from "@/lib/format";

function todayIn(timeZone: string): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

/** Çalışma saatleri; bugünün satırı (işletmenin saat dilimine göre) vurgulanır. */
export function HoursTable({ hours, timezone }: { hours: HourRow[]; timezone: string }) {
  const today = useSyncExternalStore(
    () => () => {},
    () => todayIn(timezone),
    () => -1,
  );
  return (
    <table className="mt-2 w-full text-[0.95rem]">
      <caption className="sr-only">Çalışma saatleri</caption>
      <tbody>
        {DAY_ORDER.map((d) => {
          const h = hours.find((x) => x.day === d);
          const isToday = d === today;
          return (
            <tr key={d} aria-current={isToday ? "date" : undefined} className={`border-b border-brand/10 last:border-0 ${isToday ? "font-bold text-brand" : ""}`}>
              <th scope="row" className="py-2 pr-4 text-left font-semibold">
                {DAY_NAMES[d]}
                {isToday && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-paper">Bugün</span>}
              </th>
              <td className="py-2 text-right tabular-nums">{!h || h.is_closed ? "Kapalı" : `${hhmm(h.opens)} – ${hhmm(h.closes)}`}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
