# Skor+ — Google Play Lansman Pazarlama Stratejisi (Türkiye)

> Sürüm 3 — 18 Kasım 2026. Bütçe: sıfır / düşük (Play geliştirici hesabı 25 $ hariç). Ekip: tek geliştirici. Dağıtım: **Google Play** (APK dağıtımı sona eriyor). Pro: Play Billing (RevenueCat planlı).
> **İşaret kuralı:** "⚠ doğrulanmalı" yazan her madde, platform kuralı / tarih / ücret gibi güncel bilgi içerir; uygulamadan önce resmî kaynaktan kontrol edilir. Uydurma istatistik yoktur. Hedef rakamlar hedeftir, tahmin değildir.

## Değişiklik notu

**Sürüm 3 (18 Kasım 2026) — Play Store'a geçiş (büyük değişiklik):**
- APK güven stratejisi kaldırıldı: indirme sayfası, SHA-256 / VirusTotal, "bilinmeyen kaynak" SSS'i, APK paylaşım bağlantıları. Eski indirme sayfası küçük bir **destek sitesine** dönüşür: gizlilik politikası, KVKK, hesap silme, iletişim, Play bağlantısı.
- **Kapalı test şartı doğrulandı** (Google Play Console Yardım): 13 Kasım 2023'ten sonra açılan kişisel hesaplar, üretime çıkmadan önce **en az 12 test kullanıcısıyla, kesintisiz 14 gün** kapalı test yapmalı; sonra üretim erişimi başvurusu incelenir (genellikle ≤ 7 gün). Ön kayıt (pre-registration) bu şart karşılanana kadar kapalıdır. Sonuç: hesap alındıktan sonra **halka açık lansman en erken ~3-4 hafta sonra.** "2-3 hafta içinde lansman" hedefi, hesap bugün alınmazsa tutmaz (bkz. §0.3).
- Yeni bölümler: ASO (§3), Play politika korkulukları ve Data Safety (§4), kapalı test ve ön kayıt (§5), −2…+4 haftalık zaman çizelgesi (§6), Pro fiyatı ve deneme (§8).
- Tazelik mesajı spora göre ayrıldı: futbol API-Football Pro planına (7.500 istek/gün, dakikalık senkron) geçiyor; NBA ücretsiz planda (100/gün) kalıyor (§7).
- Paylaşım ve davet artık Play Store bağlantısına ve **Play install referrer UTM**'ine gidiyor (§9).
- Futbolda Akıllı Alarm (baskı alarmı, kırmızı kart) ücretli planla açılır; mesajları ve yasaklı ifadeler güncellendi (§11).
- KPI'lar Play Console metriklerine göre yenilendi (§10).
- İnovasyon belgesindeki yapım sırası korunur, ancak iki madde **lansman şartına** dönüşür: F7 "Hata bildir" (Play AI içerik politikası) ve hesap silme web bağlantısı (§4).

**Sürüm 2.2 ve öncesi:** APK dağıtımı varsayımıyla yazıldı. Geçerliliğini koruyan kısımlar bu sürüme taşındı: konumlandırma, segmentler, yasaklı ifadeler, F12 tazelik aşamaları (NBA için), F2/F3 ifade kuralları.

---

## 0. Durum özeti ve kritik yol

### 0.1 Lansmanda ürün (gerçekler)
- **Ücretsiz:** futbol ve NBA skorları, Türkçe takım adları, logolar, Dün/Bugün/Yarın şeridi, filtreler, futbolda Kadro (diziliş, yedekler, oyuncu puanları), NBA'de çeyrek tablosu ve Box Score (biten maçlarda), takım ve maç takibi, "maç başladı" bildirimi. Reklam yok (kodda reklam SDK'sı yok).
- **Ücretli plana bağlı, lansmanla açılan (futbol):** dakikalık canlı senkron, canlı istatistik, Akıllı Alarm (baskı alarmı; kırmızı kart analizi Pro), otomatik devre arası raporu. ⚠ Geliştirici `API_FOOTBALL_PAID=1`, `app_config.api_paid=true` ve cron değişikliklerini yaptıktan ve 1 maç günü doğruladıktan sonra pazarlamada kullanılır.
- **NBA ücretsiz planda kalır:** ~30 dk aralık (F12b yayındaysa maç saatlerinde daha sık), box score yalnız biten maçta, NBA seri alarmı kapalı.
- **Pro (Play Billing):** futbolda maç sonu taktik rapor (xG denetimi, momentum, teknik direktör etkisi), maç önü eşleşme, devre arası "Soyunma Odası Reçetesi", kırmızı kart analizi; NBA'de TS%, kırılma periyodu, bench ve +/- etkisi; Taktik Asistan (maç başına 3 soru).

### 0.2 Konum değişmedi
"Skoru herkes görür, nedenini sen gör." Fark hız değil, **Türkçe AI analiz**. Box score temel özelliktir, farklılaştırıcı değildir (rakip araştırması §5).

### 0.3 Kritik yol ve kullanıcının hemen yapması gerekenler
1. **Play geliştirici hesabını şimdi al.** Her gün gecikme lansmanı bir gün öteler. Kimlik doğrulaması birkaç gün sürebilir ⚠.
2. **12 değil 20-25 kapalı test gönüllüsü** topla (bırakanlar olur; Google kesintisiz 14 gün ve kullanım ister). Kaynak: mevcut APK kullanıcıları, Telegram kanalı, çevre.
3. **İmza anahtarı kararı:** Play App Signing'de mevcut EAS anahtarı imza anahtarı olarak kullanılmazsa APK kullanıcıları Play sürümüne güncelleyemez; kaldırıp yeniden kurmak zorunda kalır ve anonim hesap nedeniyle takipleri kaybolur ⚠ geliştirici doğrulamalı.
4. **Gizlilik politikası ve KVKK metnindeki yer tutucular** ([VERİ SORUMLUSU ADI], [İLETİŞİM E-POSTASI], [ADRES], [YAYIN TARİHİ]) doldurulmalı ve herkese açık bir URL'de yayımlanmalı. Play Console bunu ister.
5. **Vergi:** Play gelirinde GVK mük. 20/B istisnası için Türkiye'de ayrı banka hesabı gerekir (rakip araştırması §12.2). İlk ödemeden önce mali müşavirle kontrol ⚠.

---

## 1. Hedef kitle segmentleri (öncelik sırasıyla)

### S1 — Türk NBA takipçisi
- Gece maçlarını sabah kontrol eder. Mesaj: "Gece maçının box score'u ve Türkçe AI yorumu: maç hangi çeyrekte koptu, bench fark yarattı mı."
- Dikkat: NBA box score yalnız biten maçta; NBA tazeliği ücretsiz planda (§7).

### S2 — Taktik/veri meraklısı futbol takipçisi
- Mesaj: "Maç sonu xG denetimi, momentum kırılma anları ve teknik direktör hamleleri — Türkçe." Pro'nun ana alıcısı.

### S3 — Bildirim yorgunu, tek takım taraftarı
- Mesaj: "Takımını seç; maç başlayınca ve maçta veriyle anlamlı bir an olduğunda haber ver. Reklam yok."
- Akıllı Alarm yalnız takip edilen maçlara ve açık bırakılan türlere gider; bu "gürültüsüz" iddiasının dayanağıdır.

### S4 — Avrupa gecesi ve milli maç izleyicisi (geniş, düşük öncelik)
### S5 — İçerik üreticileri ve topluluk yöneticileri (çarpan)

---

## 2. Genel kurallar (tüm kanallar)
- Önce katkı, sonra tanıtım. Geliştirici kendini her tanıtımda açıkça belirtir.
- Yasak: sahte hesap, bot, satın alınmış etkileşim, **sahte veya teşvikli Play yorumu**, izinsiz grup paylaşımı, toplu DM, telifli maç görüntüsü.
- Kulüp, lig ve NBA logoları pazarlama görsellerinde ve mağaza grafiklerinde öne çıkarılmaz.
- Bahis çağrışımı yok (§11).
- **Play yorumu karşılığında hiçbir ödül verilmez** (Pro süresi dahil). Yorum istemek serbesttir; ödüllendirmek politika ihlalidir ⚠ (Play "Ratings, Reviews and Installs" politikası).

---

## 3. ASO (Play Store sayfası)

### 3.1 Başlık (≤ 30 karakter)
- **Önerilen:** `Skor+ Canlı Skor ve AI Analiz` (29)
- Yedek: `Skor+: Futbol, NBA, AI Analiz` (29)
- Kurallar: "en iyi", "1 numara", "ücretsiz", emoji, büyük harf yığını, rakip adı yok (Play meta veri politikası ⚠). "Canlı skor" kategori tanımıdır; hız iddiası değildir.

### 3.2 Kısa açıklama (≤ 80 karakter)
- **Önerilen:** `Futbol ve NBA skorları, Türkçe AI maç analizi, takımına özel bildirimler.` (73)

### 3.3 Tam açıklama (taslak, ≤ 4.000 karakter)

```
Skoru herkes görür, nedenini sen gör.

Skor+, futbol ve NBA maçlarını Türkçe takip etmen için yapıldı. Skorları, kadroları ve istatistikleri tek ekranda görürsün. Pro ile maçın neden öyle bittiğini Türkçe AI analiziyle okursun.

ÜCRETSİZ
• Futbol ve NBA skorları: dün, bugün, yarın
• Türkçe takım adları, sade arayüz, reklam yok
• Futbolda kadro, diziliş, yedekler ve maç sonu oyuncu puanları
• NBA'de çeyrek tablosu ve biten maçların tam box score'u (FG%, 3P%, FT%, ribaund, asist, +/-)
• Takımını takip et: maç başlayınca bildirim
• Akıllı Alarm (futbol): yalnız takip ettiğin maçlarda, veriyle anlamlı anlarda bildirim. Her korner ve faulde değil.
• Her maçta son güncelleme saati

SKOR+ PRO
• Maç sonu taktik rapor: xG ve şut kalitesi denetimi, momentum kırılma anları, teknik direktör hamlelerinin etkisi
• NBA analizi: şut verimliliği (TS%), maçın koptuğu periyot, bench katkısı, oyuncu etkisi
• Maç önü taktik eşleşme
• Devre arası raporu: "Soyunma Odası Reçetesi"
• Kırmızı kart sonrası kısa taktik analiz
• Taktik Asistan: maça özel, her maçta 3 soru

AI HAKKINDA
Analizler maç verisinden yapay zekâ ile üretilir ve "AI tarafından üretildi" etiketi taşır. Yorumdur, kesin bilgi veya tahmin değildir. Hatalı bulduğun analizi uygulama içinden bildirebilirsin.

Skor+ bağımsız bir geliştirici projesidir. Hiçbir lig, kulüp veya NBA ile resmî bağlantısı yoktur. Bahis veya tahmin hizmeti sunmaz.

Pro aboneliği Google Play üzerinden yönetilir; dilediğin zaman Play Store > Abonelikler'den iptal edebilirsin.
```
- Doldurulacaklar: fiyat ve deneme metni açıklamaya yazılmaz (Play kendisi gösterir; değişince açıklama eskimesin).
- Lansman anındaki gerçek duruma göre düzenlenir: Akıllı Alarm ve devre arası raporu ücretli API doğrulanmadan yazılmaz.

### 3.4 Anahtar kelimeler (Play'de alan yok; başlık, kısa ve tam açıklamada doğal kullanım)
- Birincil: canlı skor, maç sonuçları, futbol, NBA, maç analizi, taktik analiz, box score.
- İkincil: xG, maç istatistikleri, kadro, diziliş, takım takibi, basketbol skorları, Türkçe.
- Kullanılmaz: iddaa, bahis, tahmin, kupon, oran; rakip uygulama adları; kulüp adlarıyla anahtar kelime doldurma ⚠ (lig adları yalnız tanımlayıcı olarak, bir iki kez).

### 3.5 Ekran görüntüsü senaryosu (8 kare, dikey, gerçek arayüz)
Her karede üstte kısa başlık; arayüz gerçek veri. Kulüp logoları küçük kalır, logosu öne çıkan maç seçilmez.

| # | Ekran | Başlık |
|---|---|---|
| 1 | Maç sonu AI raporu (futbol, momentum + xG kartları) | Skoru herkes görür, nedenini sen gör |
| 2 | Ana liste, Bugün, takip filtresi | Takımın, maçların, tek ekranda |
| 3 | NBA Box Score (iki takım, kaydırılmış sütunlar) | Gece maçının tam box score'u |
| 4 | NBA AI analizi (periyot kırılması, TS%) | NBA'i Türkçe yorumla oku |
| 5 | Akıllı Alarm kartı / bildirim örneği | Sadece önemli an: gürültüsüz alarm |
| 6 | Futbol Kadro: diziliş + oyuncu puanları | Kadro, diziliş, oyuncu puanları |
| 7 | Devre arası raporu | Devre arasında ikinci yarının reçetesi |
| 8 | Taktik Asistan sohbeti | Maça özel sor: 3 soru, Türkçe cevap |

- Pro ekranlarında küçük "Pro" rozeti görünür (yanıltıcı olmasın).
- AI metinleri gerçek maçlardan, okunup kontrol edilmiş raporlardan alınır.
- Kare 5 ve 7, ücretli API canlıda doğrulanmadan kullanılmaz; yerine Ayarlar/takım takibi konur.

### 3.6 Öne çıkan grafik (1024×500)
- Koyu zemin, solda "Skor+" ve "Skoru herkes görür, nedenini sen gör.", sağda eğik telefon içinde AI raporu kartı (logo içermeyen bölüm). Kulüp/lig logosu, oyuncu fotoğrafı, top/saha fotoğrafı yok.

### 3.7 Kategori, etiketler, derecelendirme
- **Kategori:** Spor. Etiketler: Play'in sunduğu listeden futbol / basketbol / skor ile ilgili olanlar ⚠.
- **İçerik derecelendirmesi (IARC anketi):** şiddet, cinsellik, kumar yok; kullanıcılar arası etkileşim yok (Taktik Asistan yalnız kullanıcı ile AI arasında); dijital satın alma var. Beklenen sonuç en düşük yaş derecesi ⚠ (anket sonucu belirler).
- **Hedef kitle ve içerik:** 18 yaş ve üzeri seçilmesi önerilir. Daha düşük yaş grubu Aileler politikası yükümlülüklerini getirir ⚠ (ürün kararı).
- **Reklam beyanı:** "Reklam içermez".

---

## 4. Play politika korkulukları

### 4.1 Spor, bahis ve meta veri
- Uygulamada ve mağaza sayfasında bahis oranı, kupon, tahmin, bahis sitesi bağlantısı veya reklamı yok. Play'in gerçek parayla kumar politikası ayrıca yetki ister; Skor+ bu kapsama hiç girmemeli ⚠.
- AI raporları "tahmin" olarak sunulmaz. Maç önü raporu "eşleşme ve senaryo"dur; mağaza metninde "kim kazanır" dili yok.
- Resmî bağlantı imaları yok: açıklamada "resmî bağlantısı yoktur" cümlesi bulunur. İkon ve grafiklerde kulüp, lig, NBA markası yok (fikrî mülkiyet ve taklit politikası ⚠).
- Meta veri: üstünlük iddiası, sahte yorum alıntısı, emoji yığını, alakasız anahtar kelime yok.
- Bildirimler: yalnız kullanıcının açtığı türler; tanıtım amaçlı push gönderilmez (lansman duyurusu dahil, uygulama içi bant kullanılır).

### 4.2 AI ile üretilen içerik
- Play, üretken AI içeriği olan uygulamalardan **kullanıcının rahatsız edici AI içeriğini uygulamadan çıkmadan bildirebilmesini** istiyor (Ekim 2023 politika duyurusu; kapsamın Skor+ türü analiz uygulamalarını kapsayıp kapsamadığı ⚠ doğrulanmalı). Güvenli taraf: **F7 "Hata bildir" lansmandan önce** her AI kartında ve Taktik Asistan yanıtında yer alır.
- Her AI çıktısında "AI tarafından üretildi" etiketi; mağaza açıklamasında "AI hakkında" paragrafı.
- Taktik Asistan yalnız maç bağlamında yanıt verir (genel sohbet botu değil); bu, kısıtlı içerik üretme riskini azaltır. Uygunsuz soru/yanıt filtresi geliştiriciyle kontrol edilir ⚠.

### 4.3 Abonelik politikası
- Dijital içerik yalnız Play Billing ile satılır; Play sürümünde dış ödeme bağlantısı yok.
- Paywall'da fiyat, dönem, deneme süresi, otomatik yenileme ve iptal yolu açıkça yazar. Deneme bitince ücretlendirileceği deneme başlamadan önce görünür.
- "Abonelikleri yönet" bağlantısı (Play abonelik sayfası) Ayarlar'da bulunur.

### 4.4 Data Safety (Veri güvenliği) cevapları
Taslak; son hâli geliştiriciyle koda bakılarak doldurulur ⚠. Tüm aktarım HTTPS ile şifreli. Veriler "paylaşılmaz": hizmet sağlayıcılar (Supabase, Google Gemini, Firebase/Expo push, RevenueCat) kullanıcı adına işlediği için Play tanımında "paylaşım" sayılmaz ⚠, ama gizlilik politikasında adlarıyla yazılır.

| Uygulamadaki veri | Data Safety türü | Toplanıyor | Zorunlu mu | Amaç |
|---|---|---|---|---|
| Anonim hesap kimliği (Supabase anonymous auth) | Kişisel bilgiler > Kullanıcı kimlikleri | Evet | Evet | Uygulama işlevi, hesap yönetimi |
| Push token (FCM/Expo) | Cihaz veya diğer kimlikler | Evet | Hayır (bildirim izni verilirse) | Uygulama işlevi (bildirim) |
| Takım / maç takipleri, bildirim tercihleri | Uygulama etkinliği > Uygulama içi etkileşimler | Evet | Hayır | Uygulama işlevi, kişiselleştirme |
| Aktif günler (F4) | Uygulama etkinliği > Uygulama içi etkileşimler | Evet | Evet | Analiz (hizmeti iyileştirme) |
| Davet kodu ve davet ilişkisi (F3) | Uygulama etkinliği > Uygulama içi etkileşimler (veya Diğer kullanıcı kimlikleri ⚠) | Evet | Hayır | Uygulama işlevi |
| Taktik Asistan soruları | Uygulama etkinliği > Kullanıcının oluşturduğu diğer içerik | Evet | Hayır | Uygulama işlevi (AI yanıtı; Gemini'ye gönderilir) |
| Abonelik / satın alma durumu | Finansal bilgiler > Satın alma geçmişi | Evet | Hayır | Uygulama işlevi, hesap yönetimi |
| Pro bekleme listesi / AI hata bildirimi notu (F2/F7) | Uygulama etkinliği | Evet | Hayır | Uygulama işlevi, analiz |
| Konum, kişiler, e-posta, telefon, fotoğraf | — | **Hayır** | — | — |
| Çökme kaydı / tanılama | Uygulama bilgileri ve performans | Sentry vb. eklenirse **evet** (şu an yok) | — | — |

- **Silme:** uygulama içi "Hesabımı sil" var. Play ayrıca **web üzerinden hesap/veri silme talebi bağlantısı** istiyor (hesap oluşturan uygulamalar için; anonim hesabın kapsamı ⚠). Destek sitesinde basit bir silme talebi sayfası hazırlanır: kullanıcı Ayarlar'daki "Hesap kimliği"ni yazar.

### 4.5 Gizlilik politikası URL'si
- Zorunlu: herkese açık, giriş istemeyen, PDF olmayan bir web sayfası. Destek sitesinde (ör. GitHub Pages) `/gizlilik` ve `/kvkk`. Uygulama içi metinle (src/lib/legal.ts) birebir aynı.
- Eklenecekler: Gemini'ye gönderilen soru ve maç verisi, RevenueCat ve Play ile abonelik verisi, aktif günler (120 gün), davet ilişkisi, yurt dışına aktarım (KVKK m.9; Supabase, Google, RevenueCat ⚠ hukukçu).

---

## 5. Kapalı test ve ön kayıt

### 5.1 Doğrulanmış şart
Google Play Console Yardım ("App testing requirements for new personal developer accounts", answer/14151465; 18 Kasım 2026'da okundu):
- 13 Kasım 2023'ten sonra açılan kişisel hesaplar, **en az 12 test kullanıcısının son 14 gün boyunca kesintisiz kayıtlı olduğu** bir kapalı test yapmalı.
- Ayrılıp yeniden katılan test kullanıcısının 14 günü ardışık olmalı; 14 günden kısa kalıp ayrılan sayılmaz.
- Şart sağlanınca Play Console Panosu'ndan üretim erişimine başvurulur (kapalı test, uygulama ve üretime hazırlık soruları). İnceleme **genellikle 7 gün veya daha kısa**, bazen uzun.
- Az test kullanıcısı veya **yetersiz test etkileşimi** nedeniyle ek test istenebilir.
- Üçüncü taraf kaynaklar: kuruluş (organization) hesapları bu şarttan muaf; açık test bu şartı karşılamaz; ön kayıt üretim erişimine kadar kapalı ⚠ (Console'da doğrulanmalı).

### 5.2 Test ekibi planı
- **Hedef: 20-25 kayıtlı test kullanıcısı**, en az 15'i günlük aktif. 12'nin altına düşmemek için yedek.
- Kaynak: mevcut APK kullanıcıları (uygulama içi bant, OTA ile), Telegram kanalı, Pro bekleme listesi, çevre. Her test kullanıcısının bir Google hesabı olmalı; e-posta listesi bir Google Grubu ile yönetilir (kişisel veri yalnız bu amaçla, KVKK aydınlatmasıyla).
- Test kullanıcılarına net görev listesi: her gün uygulamayı aç, bir takım takip et, bir maçın AI raporunu oku, Taktik Asistan'a soru sor, haftada bir geri bildirim. Geri bildirim kanalı: Telegram test grubu + Play özel geri bildirimi.
- **Teşekkür (ödül değil, yorum karşılığı değil):** test ekibi "Kurucu Test Ekibi" listesine (izinle) girer; Pro çıktığında ücretsiz Pro süresi verilmesi Play abonelik promosyon kodlarıyla mümkünse yazılı ve sınırlı olarak vaat edilir ⚠ (promosyon kodu türleri doğrulanmalı).
- Test sırasında Play Billing **lisans test kullanıcılarıyla** denenir; gerçek ödeme gerekmez.
- 14 günlük sayaç her gün Console'dan izlenir (KPI T1).

### 5.3 Ön kayıt
- Yeni kişisel hesapta ön kayıt, üretim erişimine kadar açılamaz ⚠. Bu yüzden lansman öncesi talep **kendi kanallarımızla** toplanır: Telegram kanalı, uygulama içi bant (APK kullanıcılarına), Pro bekleme listesi (F2) ve destek sitesindeki "Play'e çıkınca haber ver" formu.
- Üretim onayı ile halka açık yayın arasına birkaç gün konabiliyorsa ön kayıt kısa süre açılır ⚠; açılamazsa plan değişmez.

---

## 6. Zaman çizelgesi (hesap satın alma = H0)

Varsayım: hesap ~2 hafta sonra alınır (bugün = H−2). Halka açık lansman (L) en erken ~H+3, büyük olasılıkla H+3…H+4. Hesap daha erken alınırsa tüm çizelge kayar.

| Hafta | Geliştirici | Pazarlama | Çıktı |
|---|---|---|---|
| **H−2** | RevenueCat + Play Billing entegrasyonu (yeni native build), Play install referrer (aynı build), F7 Hata bildir, paywall fiyat/deneme metni | Test ekibi çağrısı (Telegram + APK kullanıcılarına OTA bandı); destek sitesi: gizlilik, KVKK, silme talebi; ASO metinleri | 15+ gönüllü adı, yayında gizlilik URL'si |
| **H−1** | F3 Paylaş + Davet (Play bağlantısıyla), F4 aktif gün, F5 ilk açılış; ücretli API geçişi ve 1 maç günü doğrulama | 8 ekran görüntüsü, öne çıkan grafik, Data Safety taslağı, IARC cevapları; test ekibi 25'e | Mağaza varlıkları hazır; test listesi tamam |
| **H0** | Hesap alınır, kimlik doğrulama; uygulama kaydı, imza anahtarı kararı, iç test (internal) | Mağaza sayfası, Data Safety, içerik derecelendirmesi, hedef kitle doldurulur | Kapalı test parçası yüklendi |
| **H+1** | Kapalı test başlar (gün 1-7); hata düzeltmeleri OTA ile | Test ekibine günlük görev; KPI T1 her gün; Telegram'da "Play'e geliyoruz" geri sayımı | ≥ 12 kesintisiz test kullanıcısı |
| **H+2** | Kapalı test gün 8-14; F2 AI Vitrini hazırlanır | Lansman içerikleri: 3 kısa video, kart şablonları (Play rozeti ile), basın/topluluk mesajları | 14. gün sonunda üretim başvurusu |
| **H+3** | Üretim incelemesi (≤ 7 gün, ⚠ uzayabilir); onay gelince aşamalı yayın (%20 → %100) | Onay gününde lansman: Telegram, Discord, Reddit (moderatör izniyle), X, WhatsApp; APK kullanıcılarına "Play'e geç" bandı | **L: halka açık** |
| **H+4** | Çökme/ANR izleme, F2 vitrin açılır, ardından F12b (NBA tazeliği) ve F1 | İlk yorumlara yanıt, ilk hafta KPI'ları, ilk "Pro (deneme)" geri bildirimi | İlk hafta raporu |

İnceleme H+3'te gelmezse lansman içerikleri bekletilir; test ekibi uygulamayı kullanmaya devam eder ("ek test" riskine karşı).

Lansmandan sonraki ilk 30 gün (L…L+30): haftalık içerik ritmi (NBA sabah kartı, hafta sonu maç sonu AI kartı), haftada en fazla 3 vitrin maçı, ayda bir şeffaf geliştirici günlüğü.

---

## 7. Tazelik mesajı (Pro API ile)

**Futbol (API-Football Pro, 7.500 istek/gün, dakikalık senkron):** Dakikalık senkron bizim yoklama sıklığımızdır; veri sağlayıcının kendi gecikmesi ölçülmedi. Mesaj ölçümle ilerler:

| Aşama | Ne zaman | Söylenebilir | Söylenemez |
|---|---|---|---|
| F0 | Ücretli plan canlıda doğrulanmadan | Mevcut metin: "~30 dk aralıkla" | Her türlü yeni hız iddiası |
| F1 | Ücretli plan açık, < 7 gün ölçüm | "Futbolda maç sırasında sık güncellenir. Her maçta son güncelleme saati yazar." | Dakika rakamı, "anlık", "gerçek zamanlı" |
| F2 | ≥ 7 gün ölçüm (KPI 13: canlı maçlarda "Son güncelleme" aralığı medyanı ve %90'lık dilim) | "Futbolda maç sırasında genellikle ~X dakika içinde güncellenir" (X = ölçülen %90'lık dilim, yukarı yuvarlanır) | "Her zaman", "garanti", ölçülenden küçük rakam |
| F3 | Olay → ekran gecikmesi ayrıca ölçülürse (gerçek gol saati ile uygulamada görünme farkı, en az 20 maç örnek) ve %90'ı ≤ 60 sn ise | "Dakika dakika" kabul edilebilir | "Anlık" yine kullanılmaz (ölçülemeyen bir hız vaadidir) |

**NBA (ücretsiz plan, 100/gün):** Sürüm 2.2'deki aşamalar geçerli: "~30 dk aralıkla" → F12b yayında ve 7 gün log varsa "maç saatlerinde daha sık". Box score yalnız biten maçta.

Kurallar:
- **Tek cümlede iki spor birleştirilmez.** "Skorlar dakikalık güncellenir" yanlıştır (NBA için doğru değil).
- Uygulama içi not ("~30 dk aralıkla güncellenir") spora göre ayrılmalı; pazarlama metni uygulama metninden önce değişmez.
- Rakiplerle hız karşılaştırması yapılmaz.
- Kota tükenirse güncelleme durabilir; "en geç X dk" garantisi verilmez.

---

## 8. Pro fiyatı ve deneme (Play)

Kaynak: rakip araştırması §7 ve §12.3 (öneriler araştırma bulgusu değildir). Türkiye'de reklamsız skor premium'u çok ucuz (Maçkolik Pro 14,99 TL/ay, eski olabilir); AI abonelikleri 200-1.000 TL/ay. Skor+ Pro ikisinin arasında, AI değeriyle gerekçelendirilir; "reklamsız" Pro'nun gerekçesi değildir (ücretsizde de reklam yok).

**Lansman önerisi:**
| Plan | Fiyat (KDV dahil, Play TL fiyat kademesine göre ⚠) | Not |
|---|---|---|
| Aylık | **59,99 TL** | Araştırma bandının alt ucu: değer henüz kanıtlanmadı. |
| Yıllık | **499,99 TL** | Aylığa göre ~%30 tasarruf (59,99 × 12 = 719,88 TL). |
| Ücretsiz deneme | **7 gün**, iki planda da, kullanıcı başına bir kez (Play deneme teklifi) | 7 gün en az bir hafta sonu maç döngüsünü kapsar. |

- Paywall kodundaki taslak fiyatlar (79,99 / 599,99 TL) lansmanda ürün kararıyla güncellenir; mağaza ve uygulama aynı fiyatı gösterir (Play kendi fiyatını gösterir).
- Fiyat artışı ileride yeni abonelere uygulanır; mevcutlar korunur (güven).
- **Maliyet:** Gemini maliyeti kullanıcı başına ölçülür (deneme kullanıcıları dahil). Deneme kötüye kullanımı için asistan soru sınırı (maç başına 3) korunur.
- **Gelir hesabı:** Play hizmet ücreti abonelikte %15 ⚠ (güncel oran doğrulanmalı); RevenueCat aylık 2.500 $ izlenen gelire kadar ücretsiz (üçüncü taraf ⚠). 20/B istisnası ve %15 stopaj için mali müşavir ⚠.
- **Pazarlamada:** fiyat yalnız mağaza ve paywall'da. Sosyal içerikte fiyat yerine "7 gün ücretsiz dene" kullanılabilir; deneme bitince ücretlendirileceği aynı cümlede söylenir.
- Bekleme listesi ve test ekibine lansman teşekkürü: uzatılmış deneme veya promosyon kodu, Play'in izin verdiği biçimde ⚠. "Ömür boyu Pro" vaadi yok.

---

## 9. Paylaşım ve davet (Play bağlantısı)

### 9.1 Bağlantı biçimi
Tüm paylaşımlar Play mağaza sayfasına gider, `referrer` parametresinde UTM taşır:

```
https://play.google.com/store/apps/details?id=com.skorplus.app&referrer=utm_source%3D<kaynak>%26utm_medium%3D<ortam>%26utm_campaign%3D<kampanya>%26utm_content%3D<davet_kodu>
```

| Kullanım | utm_source | utm_medium | utm_campaign |
|---|---|---|---|
| Uygulama içi maç paylaşımı (F3) | app | share | match_share |
| Uygulama içi davetiye (F3) | app | invite | invite (utm_content = davet kodu) |
| Telegram kanalı | telegram | social | launch / nba_morning / ai_showcase |
| Reddit / Discord / X | reddit / discord / x | social | launch |
| QR (afiş, video sonu) | qr | offline / video | launch |
| İçerik üreticisi | creator_<takma ad> | referral | creator |

- Play Console edinme raporları `utm_source` / `utm_campaign` kırılımı gösterir ⚠ (rapor ayrıntısı doğrulanmalı).
- **Davet kodunun otomatik okunması** Play Install Referrer kütüphanesini gerektirir (native modül → RevenueCat ile aynı yeni build'e eklenir ⚠). Okunamazsa F3'teki elle kod girişi yedek olarak kalır.
- F13 web önizleme sayfası kullanılacaksa, sayfanın "Skor+'ı indir" düğmesi aynı referrer'lı Play bağlantısını taşır.
- Kısaltıcı kullanılmaz (WhatsApp'ta güvensiz görünür, servis kapanırsa bağlantı ölür).

### 9.2 Davet ödülü (Play politikasıyla uyumlu)
- Davet eden: 3 aktif davet (davetli en az 2 ayrı gün aktif) → Pro deneme süresi uzatması veya promosyon kodu ⚠ (RevenueCat promosyonel yetki / Play promosyon kodu doğrulanmalı). Nakit yok.
- Davet, yükleme veya yorum karşılığı değil, **aktif kullanım** karşılığıdır. Ödül asla Play yorumuna, puana veya "5 yıldız"a bağlanmaz.
- Sahte davet önlemleri F3'teki gibi: kendi kodu yok, 7 günden eski hesap kod giremez.

### 9.3 Paylaşım metinleri (kısa)
- NBA: `Rockets 112-105 Lakers (MS) · En skorer: J. Smith 31 sayı, FG% 52 · Skor+: <Play bağlantısı>`
- Futbol: `<Ev> 2-1 <Deplasman> (MS) · En yüksek puan: X (8,4) · Skor+: <bağlantı>`
- Davetiye: `Futbol ve NBA skorları, Türkçe AI maç analizi. Reklamsız. Davet kodum: ABC123 · <bağlantı>`
- Canlı maçta paylaşım: futbolda ücretli plan F2 aşamasına gelene kadar gizli; NBA'de gizli.

---

## 10. KPI'lar

Hedefler tek geliştiricinin sıfır bütçeli lansmanı için **hedeftir, tahmin değildir**. Kaynaklar: Play Console (edinme, dönüşüm, Android vitals, abonelik), RevenueCat, Supabase. Haftalık 15 dakikalık tablo.

### 10.1 Lansman öncesi
| # | KPI | Kaynak | Hedef |
|---|---|---|---|
| T1 | Kesintisiz kayıtlı test kullanıcısı (günlük) | Play Console kapalı test | Her gün ≥ 15 (asla < 12) |
| T2 | Test kullanıcılarının günlük aktif oranı | F4 `user_activity_days` | ≥ %60 |
| T3 | Test sürecinde açılan kritik hata | Telegram test grubu, Play geri bildirimi | Üretim başvurusundan önce 0 açık kritik |
| T4 | "Play'e çıkınca haber ver" kaydı | Form + Telegram üye sayısı | 200 |

### 10.2 Lansman sonrası
| # | KPI | Tanım | Kaynak | H+4 (lansman haftası) | L+30 |
|---|---|---|---|---|---|
| 1 | Mağaza sayfası ziyaretçisi | Tekil ziyaretçi | Play Console | 1.000 | 5.000 |
| 2 | Mağaza dönüşümü | Ziyaretçi → yükleme | Play Console | ≥ %25 | ≥ %30 |
| 3 | Yeni yükleme | Edinme, `utm_source` kırılımlı | Play Console | 250 | 1.500 |
| 4 | Aktivasyon | ≥ 1 takım takip eden yeni hesap oranı | Supabase | ≥ %50 (F5 ile) | ≥ %50 |
| 5 | Bildirim izni | Push token kaydı / yeni hesap | Supabase | ≥ %60 | ≥ %60 |
| 6 | D7 tutma | F4 aktif günler | Supabase | ölçülür | ≥ %25 |
| 7 | Deneme başlatma | Yeni hesap içinde deneme başlatan | RevenueCat / Play | ≥ %5 | ≥ %5 |
| 8 | Deneme → ücretli | Denemesi biten içinde ücretliye geçen | RevenueCat | ölçülür | ≥ %30 |
| 9 | Ücretli abone | Aktif ücretli abonelik | RevenueCat | ölçülür | 30 |
| 10 | Davet katsayısı | Davetle gelen / tüm yeni hesap | `invited_by` + `utm_medium=invite` | ≥ %10 | ≥ %15 |
| 11 | Paylaşımdan yükleme | `utm_medium=share` ve `invite` yüklemeleri / toplam | Play Console | ≥ %15 | ≥ %20 |
| 12 | Mağaza puanı | Ortalama puan ve yorum sayısı | Play Console | ≥ 4,3 | ≥ 4,3 |
| 13 | Futbol tazeliği | Canlı maçta "Son güncelleme" aralığı medyanı ve %90'lık dilimi | Supabase + loglar | ölçülür | §7 aşama kararı |
| 14 | Kararlılık | Çökmesiz kullanıcı oranı, ANR oranı | Android vitals | ≥ %99 çökmesiz | ≥ %99,5; ANR Play eşiğinin altında ⚠ |
| 15 | AI maliyeti | Pro/deneme kullanıcısı başına aylık Gemini maliyeti | Supabase token kolonları | ölçülür | Aylık Pro fiyatının ≤ %20'si |
| 16 | AI hata bildirimi | Bildirim / AI rapor görüntülemesi | F7 tablosu | ölçülür | < %2 |

- Kota sağlığı (NBA ≤ 94/gün; futbol 7.500 sınırının altında) teknik izleme olarak kalır.
- Gerçek sayılar paylaşılırken yuvarlama ve şişirme yok.

---

## 11. Reklamcı ajan için özet brief

**Ürün:** Skor+ — Türkçe futbol ve NBA skor uygulaması, Pro'da Türkçe AI maç analizi. Android, Google Play'de (lansmandan önce "yakında Google Play'de"). iOS yok.

**Tagline:** "Skoru herkes görür, nedenini sen gör." NBA: "Sayılar box score'da, anlamı Türkçe yorumda."

**Ton:** Sakin, zeki, veriye dayalı. Kulüp tarafsız. NBA içeriğinde basketbol dili; futbol teriminden kaçınılır. Bağımsız tek geliştirici hikâyesi güçtür.

**Ana mesajlar:**
1. Maçın nedenini Türkçe oku: futbolda xG, momentum, teknik direktör etkisi; NBA'de TS%, kırılma periyodu, bench. (Pro, 7 gün ücretsiz deneme.)
2. Takımını takip et; maç başlayınca ve veriyle anlamlı anda haber al (futbol Akıllı Alarm). Reklam yok.
3. NBA box score ve futbol kadro/puanlar ücretsiz.
4. Google Play'de; tek geliştirici, bağımsız proje.

**Tek CTA kuralı:** "Google Play'den indir" (referrer'lı bağlantı) veya lansman öncesi "Haber ver / test ekibine katıl". İkisi aynı içerikte birlikte verilmez.

**Yasaklı iddialar ve ifadeler:**
- "Anlık", "gerçek zamanlı", "en hızlı"; §7 aşamasında izin verilmeyen hiçbir dakika rakamı. Futbol ve NBA tazeliği tek cümlede birleştirilmez. "En geç X dk" garantisi yok.
- "Canlı box score" (NBA box score yalnız biten maçta), "NBA seri alarmı" (kapalı).
- "Gol bildirimi" (uygulamada ayrı bir gol bildirimi doğrulanmadı ⚠); "gol tahmin eder", "gol geliyor". Baskı alarmı için doğru dil: "baskıyı veriyle gösterir".
- "Kesin", "garanti", "kazandırır", "kupon", "oran", "iddaa", "bahis", "tahmin", "kim kazanır".
- "Resmî uygulama", "NBA/TFF/UEFA/kulüp onaylı" ve ortaklık imaları.
- "Türkiye'nin ilk/tek", "en iyi", "1 numara" ve kanıtsız karşılaştırma.
- "Ücretsiz Pro" (deneme dışında), "ömür boyu Pro", deneme bitince ücretlendirmeyi söylemeyen "ücretsiz dene" metni.
- Sosyal içerikte fiyat (fiyat yalnız mağaza ve paywall'da; değişince eski içerik yanıltmasın).
- "Maçın oyuncusu" paylaşım metinlerinde (yerine "En yüksek puan"); "Haftanın oyuncusu".
- "Birazdan", "maç biter bitmez", "anında" (box score ve özet zamanlaması garanti değil).
- "Yorum yap, Pro kazan" veya puan/yorum karşılığı herhangi bir ödül.
- "%100 güvenli", "verilerin hiç toplanmaz" (Data Safety ile çelişir).
- Uydurma kullanıcı/indirme sayısı, puan, yorum alıntısı.
- Kapsam dışı: kadın ligleri, alt yaş takımları, Basketbol Süper Ligi, EuroLeague, iOS.

**Görsel kurallar:** Kulüp/lig/NBA logoları, oyuncu fotoğrafları, maç görüntüleri öne çıkarılmaz. Ekran görüntüleri gerçek. AI örnekleri gerçek maçlardan, "AI tarafından üretildi" etiketiyle; Pro ekranlarında "Pro" rozeti.

**Kanallar (öncelik):** WhatsApp (uygulama içi paylaşım) → Telegram kanalı + izinli Telegram/Discord toplulukları → Reddit Türkiye (moderatör izniyle) → X → kısa video → içerik üreticileri.

---

## 12. APK kullanıcılarının geçişi
- OTA ile uygulama içi bant: önce "Test ekibine katıl" (H−2), lansmanda "Skor+ artık Google Play'de" + Play bağlantısı (`utm_source=apk_banner`).
- İmza anahtarı aynıysa Play sürümü APK'nın üstüne güncellenir ve takipler korunur ⚠ (§0.3). Değilse bant "kaldırıp Play'den kur" der ve takip kaybı dürüstçe yazılır; bu durumda F14 (takip taşıma kodu) lansmandan önce yapılmalı.
- GitHub Releases'teki APK'lar lansmandan sonra kaldırılır veya "artık güncellenmiyor" notu alır; destek sitesi Play'e yönlendirir.

---

## Ek: Doğrulanması gereken açık konular
1. Play App Signing'de mevcut EAS anahtarının kullanımı (APK → Play güncelleme yolu). **Kritik.**
2. Ön kaydın yeni kişisel hesapta üretim erişiminden önce açılıp açılamadığı (üçüncü taraf kaynak "kapalı" diyor).
3. Play AI içerik politikasının Skor+ türü analiz uygulamasına kapsamı (F7 lansman şartı olarak ele alınıyor).
4. Anonim hesaplarda web silme bağlantısı zorunluluğu.
5. Data Safety türlerinin (davet kodu, aktif gün, asistan soruları) son eşlemesi; hizmet sağlayıcıların "paylaşım" sayılmaması.
6. Play TL fiyat kademeleri, abonelik hizmet ücreti oranı, ücretsiz deneme ve promosyon kodu seçenekleri.
7. RevenueCat promosyonel yetki ile davet ödülü verilebilmesi.
8. Play Install Referrer kütüphanesinin Expo SDK sürümüyle uyumu; Play Console'da UTM raporlarının ayrıntısı.
9. API-Football Pro planında dakikalık senkronun ve Akıllı Alarm'ın canlıda doğrulanması; veri sağlayıcının ticari kullanım ve mağaza görsellerinde yeniden yayım koşulları.
10. 20/B istisnası, ayrı banka hesabı ve stopaj (mali müşavir); KVKK m.9 yurt dışı aktarım (hukukçu).
11. IARC anket sonucu ve hedef yaş kararı (18+ önerisi).
12. Güncel fikstürler (lansman haftasının derbileri, NBA takvimi, Türk oyuncuların takımları).

## Kaynaklar
- [Google Play Console Yardım — Yeni kişisel geliştirici hesapları için uygulama test şartları](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) (18 Kasım 2026'da okundu)
- [Android Developers Blog — Ekim 2023 politika güncellemesi (AI içerik bildirimi)](https://android-developers.googleblog.com/2023/10/announcing-policy-updates-to-support-app-quality-on-google-play.html), [TechCrunch, Ekim 2023](https://techcrunch.com/2023/10/25/google-plays-policy-update-cracks-down-on-offensive-ai-apps-disruptive-notifications/), [TechCrunch, Haziran 2024](https://techcrunch.com/2024/06/06/google-play-cracks-down-on-ai-apps-after-circulation-of-apps-for-making-deepfake-nudes)
- Üçüncü taraf (ön kayıt ve kuruluş hesabı muafiyeti; ⚠): [Choicely — 12 tester kuralı](https://www.choicely.com/blog/google-play-12-tester-rule), [playcode — Play'de yayın](https://playcode.io/blog/how-to-publish-an-app-on-google-play), [ProAndroidDev — 12 test kullanıcısı](https://proandroiddev.com/how-to-get-12-testers-for-google-play-closed-testing-and-actually-pass-6a2ab52a0779)
- Proje içi: `docs/rakip-arastirmasi.md` §5, §7, §12; `docs/inovasyon-onerileri.md`; `GELISTIRMELER.txt` 3.14-3.27.
