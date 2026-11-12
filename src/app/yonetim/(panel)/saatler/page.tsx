import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/auth";
import { HoursForm } from "@/components/admin/HoursForm";
import { card } from "@/components/admin/styles";

export default async function SaatlerPage() {
  await requireAdmin();
  const { data, error } = await adminDb().from("opening_hours").select("day,is_closed,opens,closes,updated_at").order("day");
  if (error) throw new Error("Saatler okunamadı.");
  const stamp = (data ?? []).map((r) => r.updated_at).join();
  return (
    <section className={card}>
      <h2 className="mb-4 text-lg font-extrabold">Çalışma saatleri</h2>
      <HoursForm key={stamp} hours={data ?? []} />
    </section>
  );
}
