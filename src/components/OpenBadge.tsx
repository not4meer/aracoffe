"use client";

import { useEffect, useState } from "react";
import { isOpenNow, type HourRow } from "@/lib/format";

export function OpenBadge({ hours, timezone }: { hours: HourRow[]; timezone: string }) {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => setOpen(isOpenNow(hours, timezone));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours, timezone]);
  if (open === null) return <span className="inline-block h-7 w-24" aria-hidden />;
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${
        open ? "bg-paper text-brand" : "bg-brand/60 text-paper"
      }`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${open ? "bg-green-600" : "bg-paper/80"}`} />
      {open ? "Şu an açık" : "Şu an kapalı"}
    </span>
  );
}
