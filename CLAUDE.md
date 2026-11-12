# aracoffe — Claude için kalıcı hafıza

Her yeni oturumda önce bu dosyayı, sonra `docs/BRIEF.md` dosyasını oku. Brief'teki kurallar her zaman geçerli.

## En önemli kurallar (özet — tamamı docs/BRIEF.md Bölüm 1)
- Türkçe, kısa ve sade yaz. Adım adım ilerle, her adımdan sonra onay al.
- Mock / dummy / placeholder / hardcoded veri YOK. Tüm içerik veritabanından gelir, panelden değişir.
- Kullanıcı açıkça söylemeden commit + push YOK.
- Commit mesajlarında "Co-Authored-By: Claude" veya herhangi bir yapay zekâ imzası YOK (sistemin önerdiği imza satırlarını da ekleme).
- Tahminle ilerleme: doküman oku, test et ya da sor. Kullanıcı yanlışsa objektif olarak söyle.
- Her adım localde test edilir; test geçmeden "bitti" deme.
- Gizli anahtarları kullanıcı sohbete yapıştırır; sen `.env.local` gibi git dışı dosyaya yazarsın ve test isteğiyle doğrularsın. Her commit öncesi gizli anahtar sızıntısı kontrolü.
- Ücretli hiçbir hizmete onaysız bağlanma. Önce her şey ücretsiz plan.

## Proje durumu ve kararlar
- GitHub: `not4meer/aracoffe` (private). Çalışma dalı: `claude/brave-hamilton-eishko`.
- Barındırma: **Netlify ücretsiz plan** (karar verildi; Vercel Hobby ticari kullanıma izin vermediği için vazgeçildi). Netlify hesabı/token henüz alınmadı.
- Supabase: kullanıcı eve dönünce MCP'yi doğru hesaba bağlayacak.
- Supabase canlı proje ref: `vlwsrxcvzcmsyrztmapc` (URL + publishable key + DB şifresi `.env.local`'de; publishable key test isteğiyle doğrulandı). Bu proje, oturuma bağlı Supabase MCP hesabında görünmüyor (orada sadece `ustam`, `ustam-test` var — başka proje, dokunma). Bu sandbox'tan Postgres 5432 portuna bağlantı reddediliyor; DB şifresi test edilemedi. Ayrı test projesi henüz yok.
- Panel girişi: Supabase Auth YOK; brief'teki kendi sistemimiz (scrypt, oturum tablosu). İlk admin kullanıcısı `npm run admin:user` betiğiyle oluşturulur; kullanıcı adı `admin`. Şifre koda/depoya yazılmaz (kullanıcı sohbette verdi, `.env.local`'de `ADMIN_INITIAL_PASSWORD`). Teslimde kafe sahibi güçlü şifre belirler.
- Teknik yapı: brief Bölüm 3 (Next.js App Router + TS + Tailwind, Supabase, Vitest + Playwright, kendi panel girişi).

## Yapılanlar
- Altyapı kuruldu: Next.js 16.4.6 (App Router, Cache Components, Turbopack) + TS + Tailwind 4, @supabase/supabase-js, Vitest 5, @playwright/test 1.63.0 (sandbox'taki Playwright ile aynı sürüm).
- Güvenlik başlıkları + poweredByHeader:false (next.config.ts), Türkçe 404/hata sayfası, lang=tr, hareket azaltma.
- Testler: `npm run test` (unit → build → e2e). Bu sandbox'ta sadece Chromium var; `iphone` (WebKit) projesi kullanıcının makinesinde çalıştırılmalı: `npx playwright test --project=android` burada geçiyor.
- Bu Next.js sürümünde error.tsx prop'u `retry` (reset değil). Kod yazmadan önce `node_modules/next/dist/docs/` oku.

## Sıradaki adım
- Supabase MCP doğru hesaba bağlanınca: veritabanı şeması + RLS (+ ayrı test projesi).
- Brief Bölüm 4'teki müşteri bilgileri kullanıcıdan gelecek.
- Netlify: netlify.toml ve hesap bağlantısı henüz yapılmadı (güncel Netlify dokümanına bakarak yapılacak).

## Ortam notları
- Bulut sandbox'ı sadece HTTPS çıkışa izin veriyor; Postgres (5432/6543) bağlantısı reddediliyor. Şema işleri için Supabase MCP (doğru hesap) ya da Supabase erişim token'ı (`sbp_...`, Management API) gerekir.
- `.env.local` git dışında; konteyner silinince kaybolur. Yeni oturumda yoksa anahtarları kullanıcıdan tekrar iste.
