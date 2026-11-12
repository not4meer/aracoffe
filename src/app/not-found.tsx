import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
      <p>Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link href="/" className="underline underline-offset-4">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
