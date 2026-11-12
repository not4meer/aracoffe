import { requireAdmin } from "@/lib/admin/auth";
import { changeAccount } from "@/app/yonetim/actions";
import { ActionForm } from "@/components/admin/ui";
import { btn, card, input, label } from "@/components/admin/styles";

export default async function HesapPage() {
  const admin = await requireAdmin();
  return (
    <section className={card}>
      <h2 className="mb-1 text-lg font-extrabold">Hesap</h2>
      <p className="mb-4 text-sm text-stone-700">
        Kullanıcı adını ve şifreni buradan değiştirebilirsin. Şifre değişince diğer cihazlardaki oturumlar kapanır. Şifre en az 10 karakter olmalı ve hem harf hem rakam içermeli.
      </p>
      <ActionForm action={changeAccount} className="space-y-3">
        <div>
          <label htmlFor="username" className={label}>
            Kullanıcı adı
          </label>
          <input id="username" name="username" defaultValue={admin.username} autoComplete="username" maxLength={40} className={input} />
        </div>
        <div>
          <label htmlFor="next" className={label}>
            Yeni şifre (değiştirmeyecekseniz boş bırakın)
          </label>
          <input id="next" name="next" type="password" autoComplete="new-password" maxLength={200} className={input} />
        </div>
        <div>
          <label htmlFor="again" className={label}>
            Yeni şifre (tekrar)
          </label>
          <input id="again" name="again" type="password" autoComplete="new-password" maxLength={200} className={input} />
        </div>
        <div>
          <label htmlFor="current" className={label}>
            Mevcut şifre (onay için gerekli)
          </label>
          <input id="current" name="current" type="password" autoComplete="current-password" required maxLength={200} className={input} />
        </div>
        <button type="submit" className={btn}>
          Hesabı kaydet
        </button>
      </ActionForm>
    </section>
  );
}
