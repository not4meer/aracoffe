import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { loginAction } from "@/app/yonetim/actions";
import { ActionForm } from "@/components/admin/ui";
import { btn, card, input, label } from "@/components/admin/styles";

export default async function GirisPage() {
  if (await getAdmin()) redirect("/yonetim");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-extrabold">Yönetim paneli</h1>
      <p className="mb-6 text-stone-700">Devam etmek için giriş yapın.</p>
      <div className={card}>
        <ActionForm action={loginAction} inlineMessage className="space-y-4">
          <div>
            <label htmlFor="username" className={label}>
              Kullanıcı adı
            </label>
            <input id="username" name="username" autoComplete="username" required maxLength={40} className={input} />
          </div>
          <div>
            <label htmlFor="password" className={label}>
              Şifre
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={200} className={input} />
          </div>
          <button type="submit" className={`${btn} w-full`}>
            Giriş yap
          </button>
        </ActionForm>
      </div>
    </main>
  );
}
