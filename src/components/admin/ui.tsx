"use client";

import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { State } from "@/app/yonetim/actions";

// ---- Bildirim (toast) ----
type Toast = { id: number; ok: boolean; message: string };
let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function pushToast(ok: boolean, message: string) {
  const t = { id: nextId++, ok, message };
  toasts = [...toasts.slice(-2), t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 4500);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts,
  );
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <p
          key={t.id}
          role={t.ok ? "status" : "alert"}
          className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            t.ok ? "bg-emerald-700 text-white" : "bg-red-700 text-white"
          }`}
        >
          {t.message}
        </p>
      ))}
    </div>
  );
}

// ---- Form: hazır olana kadar kilitli, sonucu bildirim olarak gösterir ----
export function ActionForm({
  action,
  children,
  className,
  inlineMessage = false,
  onSuccess,
  confirm: confirmText,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  children: React.ReactNode;
  className?: string;
  inlineMessage?: boolean;
  onSuccess?: () => void;
  confirm?: string;
}) {
  // Bildirim, işlem biter bitmez gösterilir. Form o sırada sayfadan kalkmış olsa bile
  // (ör. silinen kategori) kullanıcı sonucu görür.
  const [state, formAction, pending] = useActionState(async (prev: State, fd: FormData) => {
    const result = await action(prev, fd);
    // Hata formun altında gösteriliyorsa ayrıca bildirim çıkarma.
    if (result && !(inlineMessage && !result.ok)) pushToast(result.ok, result.message);
    if (result?.ok) onSuccess?.();
    return result;
  }, null);
  // Sayfa hazır (hydrate) olana kadar form kilitli kalır.
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <form
      action={formAction}
      className={className
        ?.replace(/\bspace-y-3\b/, "grid gap-3")
        .replace(/\bspace-y-4\b/, "grid gap-4")}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <fieldset disabled={!ready || pending} className="contents">
        {children}
      </fieldset>
      {inlineMessage && state && !state.ok && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
          {state.message}
        </p>
      )}
    </form>
  );
}

// ---- Fotoğraf seçici: telefonda yüklemeden önce küçültür ----
async function shrink(file: File, max: number, type: "image/webp" | "image/png"): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.85));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], `foto.${type === "image/png" ? "png" : "webp"}`, { type });
}

export function ImagePicker({ name = "file", max = 1600, png = false }: { name?: string; max?: number; png?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <input
        ref={ref}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        required
        disabled={busy}
        className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-stone-900 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white"
        onChange={async (e) => {
          const f = e.currentTarget.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            const small = await shrink(f, max, png ? "image/png" : "image/webp");
            if (small !== f && ref.current) {
              const dt = new DataTransfer();
              dt.items.add(small);
              ref.current.files = dt.files;
            }
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && <p className="mt-1 text-sm text-stone-600">Fotoğraf küçültülüyor…</p>}
    </div>
  );
}

// ---- Üst menü ----
const TABS = [
  { href: "/yonetim", label: "Menü" },
  { href: "/yonetim/bilgiler", label: "Bilgiler" },
  { href: "/yonetim/saatler", label: "Saatler" },
  { href: "/yonetim/fotograflar", label: "Fotoğraflar" },
  { href: "/yonetim/renkler", label: "Renkler" },
  { href: "/yonetim/qr", label: "QR kod" },
  { href: "/yonetim/hesap", label: "Hesap" },
];

export function PanelNav() {
  const path = usePathname();
  return (
    <nav aria-label="Panel bölümleri" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex gap-1.5 pb-1">
        {TABS.map((t) => {
          const active = t.href === "/yonetim" ? path === "/yonetim" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${
                  active ? "bg-stone-900 text-white" : "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-100"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
