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

## Müşteri: Ara Coffee Bakery (21.11 oturumu)
- Menü kaynağı: kullanıcının `menüiçeriği.xlsx` dosyası (65 ürün, 5 dolu kategori + boş Tatlılar/Sandviçler/Kruvasanlar/Waffle). Canlı DB'de zaten yüklü; yazım düzeltmeleri yapılmış (Cappucino→Cappuccino, Toffie→Toffee, D.Espresso→Double Espresso vb.).
- Logo: kullanıcının gönderdiği orijinal görsel (`~/Downloads/WhatsApp Image 2026-11-12 at 20.57.21.jpeg`), daire dışı şeffaf PNG olarak canlı + test depoya yüklendi (`scripts/upload-logo.mjs`). SVG çizim (`src/lib/logo-svg.ts`) sadece logo yoksa yedek. Menü kategori süsü = logodaki iki kahve çekirdeği.
- Menü kartları: tamamını kaplayan soluk duvar kâğıdı deseni (`.menu-wallpaper`). Köşe çizimleri kullanıcı beğenmedi, kaldırıldı.
- Tasarım: krem + koyu kahve, Fraunces + Manrope. Renkler DB'den (`site_settings`).
- Ayrı test projesi: `jmvdwbpdloozkzxyzusm` (`.env.test.local`, `SUPABASE_TARGET=test`). Testler `scripts/test-guard.mjs` ile canlıda çalışmayı reddeder. `npm run test` hepsini test DB'sine karşı çalıştırır.
- Panel: `/yonetim` (giriş, menü, bilgiler, saatler, fotoğraflar, renkler, QR, hesap). Yazma işlemleri `SUPABASE_SECRET_KEY` ister (`.env.local` ve `.env.test.local`).

## SAHTE / VARSAYIM VERİLER (kullanıcıya bildirildi, gerçekleriyle değişecek)
- Telefon: `05000000000` (sahte).
- Çalışma saatleri: her gün 08:00–23:00 (varsayım).
- Adres: "Concept Çarşı 12" (Instagram biyografisinden; şehir/ilçe bulunamadı, harita linki boş → adresten otomatik Google Maps araması).
- Tanıtım yazısı boş, sloganı Instagram'dan: "Lezzete kısa bir Ara".
- Renkler logodan türetilen tahmini değerler.

## Testler (21.11)
- `npm run test` = unit (17) + test DB'ye karşı build + Playwright. Bu Mac'te Chromium kurulu: `node scripts/with-test-env.mjs node node_modules/@playwright/test/cli.js test --project=android` → 22/22 geçti. WebKit (iphone) kurulu değil.
- Test build öncesi `.next/cache/fetch-cache` silinir (yoksa eski Supabase cevabıyla derler).
- Panel kullanıcıları: test DB `admin` (şifre `.env.test.local`), canlı DB `admin` (şifre kullanıcıdan, `.env.local`; teslimde değişmeli).

## Sıradaki adım
- Kullanıcıdan iki gizli anahtar (`sb_secret_...`: canlı + test) → `.env.local` / `.env.test.local` içine `SUPABASE_SECRET_KEY`. Sonra `npm run admin:user -- admin` ile panel kullanıcısı, panel e2e testleri (giriş, menü, fotoğraf, renk, saat, QR, kilit).
- Playwright Chromium kurulumu (`npx playwright install chromium`) kullanıcı onayı bekliyor; sonra `npm run test`.
- Audit raporu (brief Bölüm 9), Netlify (netlify.toml, canlı tutma görevi), en sonda domain + QR.

## Ortam notları
- Bulut sandbox'ı sadece HTTPS çıkışa izin veriyor; Postgres (5432/6543) bağlantısı reddediliyor. Şema işleri için Supabase MCP (doğru hesap) ya da Supabase erişim token'ı (`sbp_...`, Management API) gerekir.
- `.env.local` git dışında; konteyner silinince kaybolur. Yeni oturumda yoksa anahtarları kullanıcıdan tekrar iste.
