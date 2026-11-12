# Kafe / Restoran Menü Sitesi — Proje Başlangıç Brief'i

> Bu metni yeni bir menü sitesi işine başlarken yapay zekâ asistanına ilk mesaj olarak veriyorum.
> Okuduktan sonra **kod yazmaya başlama**. Önce "Bölüm 4 — Müşteriden toplanacak bilgiler" listesinden eksik olanları sor, sonra plan sun ve onay bekle.

---

## 1. Benim çalışma kurallarım (her zaman geçerli)

1. Projede hiçbir şekilde mock, dummy, placeholder veya hardcoded veri olmayacak. Her şey dinamik ve gerçek olacak. Sitede görünen tüm içerik (menü, fiyat, yazılar, telefon, adres, saatler, fotoğraflar, logo, renkler) veritabanından gelir ve admin panelinden değiştirilebilir.
2. Ben söylemeden commit + push yok. Ben söyleyene kadar aklına bile getirme.
3. Commit mesajında hiçbir şekilde "Co-Authored-By: Claude" veya benzeri yapay zekâ imzası olmayacak.
4. Bir şeye karar vermeden önce doğru olduğundan emin ol. Emin değilsen dokümana bak, test et ya da sor. Tahminle ilerleme.
5. Her zaman objektif ol. Söylediklerimde yanlış bir şey varsa sana göre doğru olanı söyle.
6. Her zaman adım adım ilerle. Acele etme.
7. "Burayı şimdilik mock yapayım", "burayı şu anlık atlayalım" gibi söylemlerde bulunma. Bir kısım tamamen bitmeden diğerine geçme.
8. Her adım localde test edilmeli ve testler başarıyla geçmeli. Test geçmeden "bitti" deme. Başarısız test varsa nedenini bul ve açıkça söyle.
9. Proje bitim aşamasına geldiğinde kapsamlı bir audit yap: hangi kısımlar gerçekten çalışıyor, mock/dummy/placeholder/hardcoded veri var mı, güvenlik açığı var mı. Kapsamlı bir rapor sun ve olası değişiklikler için onayımı bekle.
10. Bana kısa ve sade yaz. Çok uzun yazarsan konudan sapabilirim ve kafam karışabilir. Türkçe yaz.
11. Web sitesi tasarımında yüklediğim tasarım skill'lerini kullan (frontend-design skill'i; metinler için copywriting skill'i).
12. **Gizli anahtarlar:** Benden anahtarları kendi elimle bir dosyaya ya da koda eklememi isteme. Anahtarları doğrudan sohbete yapıştıracağım. Sen onları `.env.local` gibi git'e girmeyen dosyalara yaz. Anahtarın gerçekten doğru projeye ait olduğunu bir test isteğiyle doğrula.
13. **Git deposu en başta:** İşe başlarken benden GitHub'da **private** bir depo açmamı iste ve adresini al. Depoya ilk yüklemeyi ben onay verince yap. Gizli anahtar içeren hiçbir dosya depoya girmemeli; her commit'ten önce bunu kontrol et.
14. **Önce her şey ücretsiz:** Müşteriden ödeme alınana kadar tamamen ücretsiz planlarla ayağa kaldırıyoruz. Hiçbir ücretli hizmete benim onayım olmadan bağlanma. Ödeme alındıktan sonra müşterinin isteğine göre ücretli planlara geçilir ve domain alınıp bağlanır.
15. **Kalıcı hafıza:** Bu kuralları ve projeyle ilgili kararları hafızana kaydet. Yeni oturumda tekrar sormana gerek kalmasın.

---

## 2. Ne yapıyoruz

Bir kafe / restoran için **telefon öncelikli menü sitesi** ve kafe sahibinin her şeyi kendisinin değiştirebildiği **yönetim paneli**.

- Ziyaretçilerin çoğu masadaki QR kodu okutup telefondan girer. Tasarım önce telefona göre yapılır.
- Teslimden sonra benim işim minimum olmalı. Kafe sahibi panelden her şeyi kendisi yönetebilmeli.
- Dil: aksi söylenmedikçe sadece Türkçe.

---

## 3. Kanıtlanmış teknik yapı (önceki projede çalışan)

Daha iyi bir gerekçen yoksa bu yapıyı kullan. Değiştirmek istersen nedenini söyleyip onay al.

| Katman | Seçim | Not |
|---|---|---|
| Uygulama | **Next.js (App Router, Cache Components)** + TypeScript + Tailwind | Bu sürüm eğitim verindeki Next.js'ten farklı olabilir. Kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili dokümanı oku. |
| Veritabanı + dosya | **Supabase** (Postgres + Storage) | Ziyaretçi sadece okur (RLS). Tüm yazmalar sunucuda, oturum doğrulandıktan sonra gizli anahtarla yapılır. |
| Barındırma | **Netlify ücretsiz plan** | Vercel'in ücretsiz (Hobby) planı ticari kullanıma izin vermiyor; para karşılığı yapılan bir iş ticaridir. Netlify ücretsiz sözleşmesinde ticari yasak yok, ama garanti de yok (her projede güncel koşulları tekrar kontrol et). |
| Testler | **Vitest** (birim + veritabanı) ve **Playwright** (iPhone/WebKit + Android) | Testler production build'e karşı çalışır. |
| Panel girişi | Kendi kullanıcı adı + şifre sistemimiz | scrypt hash, veritabanında oturum tablosu, hatalı deneme kilidi. Supabase Auth kullanılmıyor. |

---

## 4. Müşteriden toplanacak bilgiler (işe başlamadan önce sor)

Eksik olanları tek mesajda, kısa bir liste olarak sor:

1. İşletmenin adı ve kısa tanıtımı (ne sunuyor: kahve, yemek, karaoke, oyun masası vb.)
2. **Logo:** yüksek çözünürlüklü PNG ya da SVG (sohbetteki küçük görsel yetmez).
3. **Renkler:** logodan alınacak mı, özel istekleri var mı?
4. **Menü:** fotoğraf, PDF ya da Excel. Kategoriler, ürünler, fiyatlar, açıklamalar. Okunmayan yer varsa tahmin etme, sor. Yazım hatalarını listele ve düzeltilip düzeltilmeyeceğini sor.
5. **Fotoğraflar:** mekân ve ürün fotoğraflarının **orijinalleri** (ekran görüntüsü değil). Menüde ürün fotoğrafı olacak mı?
6. **İletişim:** adres, telefon(lar) ve hangi telefonun ne için olduğu (rezervasyon vb.), Instagram ve diğer sosyal hesaplar.
7. **Çalışma saatleri** (gün gün; gece yarısından sonra kapanıyor mu?).
8. Özel bölümler: rezervasyon, karaoke, etkinlik, kampanya vb. Rezervasyon telefonla mı, form ile mi?
9. Dil: sadece Türkçe mi?
10. Domain: var mı, alınacak mı? (Yayın ücretsiz adresle başlar.)
11. QR kod gerekiyor mu? Masa sayısı, baskı boyutu.
12. Hesaplar kimin adına açılacak: benim mi, müşterinin mi (Supabase, Netlify, GitHub, domain)?

---

## 5. Müşteri sitesi — beklenen özellikler

- Telefon öncelikli, tek sayfa: kapak (logo + fotoğraf), menü, özel bölüm(ler), fotoğraf galerisi, adres ve saatler.
- **Menü:** kategoriler, ürün adı, fiyat, açıklama; "Tükendi" gösterimi; gizli ürün ve kategoriler görünmez (veritabanı kuralıyla da okunamaz).
- **Arama:** Türkçe karakterden bağımsız ("cay" yazınca "Çay" bulunur). Sayfa tam yüklenmeden yazılan metin de çalışmalı.
- **Kayan kategori şeridi:** yapışkan, kaydırdıkça aktif kategoriyi gösterir.
- **"Şu an açık / kapalı"** rozeti (işletmenin saat dilimine göre, gece yarısını geçen saatleri doğru hesaplar).
- Tek dokunuşla **arama**, **yol tarifi** (adresten otomatik Google Maps linki ya da özel link), **Instagram**.
- Türkçe **404** ve **hata** sayfaları.
- **SEO:** başlık, açıklama, Open Graph görseli, `robots.txt` (panel hariç), `sitemap.xml`.
- **Güvenlik başlıkları:** CSP `frame-ancestors 'none'`, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS; `X-Powered-By` gizli.
- Erişilebilirlik: WCAG AA (axe taramasında 0 ihlal), klavye odağı görünür, hareket azaltma tercihine saygı.
- Hız: görseller WebP ve boyutlandırılmış, sayfa önbellekten sunulur.

---

## 6. Admin paneli — yapılabilecek işlemler

Panel adresi gizli bir yol (örn. `/yonetim`), ana sayfada linki yok, arama motorlarına kapalı (`noindex`).

**Menü**
- Kategori ekle, düzenle (ad, not), sil (onay sorar), sırala (yukarı/aşağı), gizle/göster.
- Ürün ekle, düzenle (ad, fiyat, açıklama), sil (onay sorar), sırala, gizle/göster, **"Tükendi / Satışa aç"**, başka kategoriye taşı. ( menü fotoluysa ftoyu silme veya güncelleme veya foto ekleme seçenekleri)
- Fiyat girişi "120", "12,50", "12.50" kabul eder; belirsiz "1.250" reddedilir.

**Site bilgileri** (her grup ayrı kaydedilir; birini kaydetmek diğerindeki yazılmamış taslağı silmez)
- İletişim: telefon (boşluklu/parantezli yazılsa da kabul), adres, özel harita linki, Instagram (@, kullanıcı adı ya da tam link kabul).
- Sayfa yazıları: işletme adı, slogan, bölüm başlıkları, para birimi.
- Özel bölümler (örn. karaoke): göster/gizle, başlık, metin, fiyatların hangi menü kategorisinden geleceği.
- Arama motoru / paylaşım açıklaması.

**Fotoğraflar ve logo**
- Yükle (telefonda küçültülür, sunucuda EXIF/GPS silinir, WebP'ye çevrilir), açıklama (alt metni) düzenle, galeride göster/gizle, sırala, sil (depodan da silinir).
- Kapak fotoğrafı ve özel bölüm fotoğrafı seçimi.
- Logo değiştirme (şeffaflık korunur, eski dosya silinir).
- SVG ve fotoğraf olmayan dosyalar reddedilir.

**Çalışma saatleri:** gün gün açılış/kapanış, "kapalı", "Pazartesiyi tüm günlere uygula".

**Renkler:** ana renk, yazı, zemin, açık ton, vurgu; hex kodu ya da renk seçici; canlı önizleme; okunabilirlik (kontrast) uyarısı. Kodda hiçbir renk sabit yazılmaz.

**QR kod:** site adresinden otomatik üretilir; PNG (baskı) ve SVG (matbaa) indirme. Domain değişince panel yeni QR'ı kendisi üretir.

**Hesap:** kullanıcı adı ve şifre değiştirme (şifre değişince diğer cihazlardaki oturumlar kapanır).

**Güvenlik**
- Her panel sayfası ve her sunucu işlemi oturumu veritabanından doğrular.
- Çerez: HttpOnly, Secure (https), SameSite=Lax, sadece panel yolunda.
- Hatalı deneme kilidi: IP başına 15 dakikada 5, kullanıcı adı başına 10 deneme.
- Aşırı uzun girdiler veritabanına gitmeden reddedilir.
- Unutulan şifre için komut satırından sıfırlama betiği (`npm run admin:user -- <kullanici>`).

---

## 7. Çalışma sırası

Her adımın sonunda test et, sonucu kısa raporla, sonraki adım için onay al.

0. Git deposu (private GitHub) ve hesaplar: Supabase (canlı + **ayrı test projesi**), Netlify.
1. Plan: yapı, tasarım yönü (renkler, yazı tipi, sayfa düzeni), panel kapsamı → onay.
2. Kurulum, veritabanı şeması, güvenlik kuralları (RLS), müşterinin gerçek verisinin aktarılması.
3. Müşteri sitesi.
4. Panel girişi.
5. Panel bölümleri (menü → site bilgileri → saatler → fotoğraflar → renkler → QR).
6. Kapsamlı audit → rapor → onay → düzeltmeler.
7. Netlify'a yayın ve canlı adreste doğrulama.
8. Teslim.

---

## 8. Önceki projeden öğrenilen dersler (tekrar yaşanmasın)

**Testler ve veritabanı**
- **İlk günden ayrı bir Supabase test projesi** aç. Testler canlı veritabanında çalışırsa test verisi ziyaretçilere görünebilir. Testler, test ayarı yoksa ya da canlı veritabanını gösteriyorsa çalışmayı reddetmeli.
- Testler kendi oluşturdukları kayıtları (`e2e-` önekli) temizlemeli; her çalıştırmanın başında ve sonunda genel temizlik olmalı.
- Gerçek veriyi değiştiren testler önce kopyasını almalı, sonra geri yüklemeli.
- İnternet kesintisi testleri toplu başarısız yapabilir. `ENOTFOUND`, `fetch failed` gibi ağ hatalarında kodu suçlamadan önce bağlantıyı kontrol et ve tekrar çalıştır.

**Next.js (yeni sürüm) tuzakları**
- Next.js son 3 sayfayı gizli olarak bellekte tutar (React Activity). Düzenleme formları geri dönülünce eski değer göstermesin diye form alanlarını kaydın güncelleme zamanına (`updated_at`) ya da kendi değerlerine bağla. Testlerde sadece görünür öğeleri seç.
- React 19, form işleminden sonra formu (dosya seçimi dahil) her durumda sıfırlar.
- Sayfa hazır olmadan forma yazılan metin silinebilir. Panel formlarını hazır olana kadar kilitli tut. Sil düğmeleri de onay sorulmadan çalışmasın diye kilitli olmalı.
- Paneldeki değişikliğin sitede anında görünmesi için önbellek etiketi + `updateTag` kullan. Canlıda ayrıca test et.
- **`proxy.ts` (eski adıyla middleware) kullanma:** Netlify eklentisi Turbopack ile derlenmiş proxy'yi paketleyemedi. Asıl güvenlik zaten her sayfadaki oturum kontrolünde.

**Netlify**
- Ücretsiz projelerde **"Powered by Netlify" rozeti** varsayılan açık geliyor; kapat (Project configuration > General > Powered by Netlify badge, ya da API'de `built_with_badge_enabled=false`).
- İstemci IP'si için platformun kendi başlığını oku (Netlify: `x-nf-client-connection-ip`, Vercel: `x-vercel-forwarded-for`); başka platformun başlığına güvenme.
- Ücretsiz planda sunucu fonksiyonları ABD'de çalışıyor; veritabanı Avrupa'daysa panel kayıtları biraz yavaş olur.
- Proje git'e bağlı değilse yayın: `NETLIFY_AUTH_TOKEN` ile `netlify deploy --prod`.

**Supabase**
- Ücretsiz projeler 7 gün az kullanılırsa duraklatılıyor. Günlük bir **Netlify zamanlanmış görevi** küçük bir sorgu atarak projeyi canlı tutar.
- Supabase'in kendi "üye ol" özelliği kullanılmıyorsa kapat (Authentication ayarlarında "Allow new users to sign up").
- Silinen depolama dosyaları CDN önbelleğinde bir süre (yaklaşık 1 saat) erişilebilir kalır.
- Yıkıcı SQL (silme, kural silme) çalıştırmadan önce sor. Mevcut kuralı silmek yerine ek kural (restrictive policy) eklemek daha güvenli.

**Diğer**
- Fotoğraf yükleme: Vercel/Netlify istek sınırlarına takılmamak için fotoğrafı tarayıcıda küçült; sunucuda tekrar işle.
- Playwright'ın Windows'taki WebKit motoru değişken fontları yanlış çizer ve `http://localhost`'ta Secure çerezi kabul etmez. Bunlar test motoru sorunudur, gerçek iPhone'da yoktur. Şüphede gerçek telefonda kontrol ettir.
- Kendi düzeltmelerini de gözden geçir: bir açığı kapatırken yenisini açmak kolay.

---

## 9. Audit kontrol listesi (proje sonunda)

- Kodda sabit/sahte veri taraması (marka bilgisi, telefon, adres, fiyat, renk, para birimi).
- Her sunucu işleminde oturum kontrolü var mı?
- Gizli anahtar tarayıcı paketine sızıyor mu?
- Veritabanı kuralları (RLS), fonksiyon yetkileri, depolama kuralları; Supabase güvenlik ve performans uyarıları.
- Saldırı denemeleri: aşırı uzun girdi, sahte IP başlığı, sahte/süresi dolmuş çerez, kaba kuvvet kilidi, SVG/sahte dosya yükleme, XSS (CSS'e giden renk değerleri dahil).
- Güvenlik başlıkları, `robots.txt`, sitemap, 404/hata sayfaları.
- `npm audit --omit=dev` (canlıya giden paketlerde açık olmamalı).
- Erişilebilirlik (axe) ve sayfa ağırlığı.
- Barındırma ve veritabanı planlarının koşulları ve maliyetleri (güncel kaynaktan doğrula).
- Canlı adreste: çerez bayrakları, panelden kayıt → sitede anında görünme, görseller, zamanlanmış görev kaydı.

---

## 10. Teslim kontrol listesi

- Panel şifresi: kafe sahibi kendi güçlü şifresini belirler (Hesap bölümü).
- Hesap sahipliği: Supabase, Netlify, GitHub, domain kimin adına?
- Sohbette paylaşılan anahtarların yenilenmesi önerilir; geçici erişim tokenları (örn. Netlify) teslimden sonra iptal edilir.
- Domain alındıysa: site adresi ayarı (`NEXT_PUBLIC_SITE_URL`) güncellenir, yeniden yüklenir, QR panelden yeniden indirilir. QR'lar domain kesinleştikten sonra bastırılmalı.
- Fotoğrafların orijinalleri panelden yüklenir.
- Kafe sahibine kısa kullanım anlatımı: panel adresi, giriş, menü güncelleme, tükendi işaretleme, fotoğraf değiştirme.

### Teslimden sonra müşterinin olası ödemeleri (fiyatları her projede güncel kaynaktan doğrula)

| Kalem | En ucuz | Daha güvenli |
|---|---|---|
| Domain | yıllık, .com yaklaşık 10–15 $ | aynı |
| Barındırma | Netlify ücretsiz: 0 (garanti yok) | Vercel Pro ~20 $/ay ya da Netlify ücretli plan |
| Veritabanı | Supabase ücretsiz + günlük canlı tutma görevi: 0 | Supabase Pro ~25 $/ay (duraklatma yok, yedek) |

---

## 11. Başlangıç noktası

Önceki bir menü sitesi deposu varsa (örn. `bella-cafe`) **sıfırdan yazma**: onu şablon olarak kopyala, markaya özel her şey zaten veritabanından geldiği için yeni müşterinin verisini, logosunu, renklerini ve tasarım yönünü uyarla. Tasarımı yine de yeni markaya göre özgün yap; önceki projenin görünümünü birebir tekrar etme.
