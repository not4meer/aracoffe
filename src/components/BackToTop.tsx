"use client";

import { useEffect, useState } from "react";

/** Uzun menüde aşağı inince beliren "menü başına dön" düğmesi. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 1200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      aria-label="Menünün başına dön"
      onClick={() => document.getElementById("menu")?.scrollIntoView({ block: "start" })}
      className={`fixed bottom-5 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-paper shadow-lg transition-all duration-200 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
      tabIndex={show ? 0 : -1}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
