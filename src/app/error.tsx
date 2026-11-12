"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Bir şeyler ters gitti</h1>
      <p>Sayfa şu an yüklenemedi. Lütfen tekrar deneyin.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-full border px-5 py-2"
      >
        Tekrar dene
      </button>
    </main>
  );
}
