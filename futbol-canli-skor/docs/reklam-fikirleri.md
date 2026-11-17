# Skor+ — Reklam ve Kreatif Fikirler (Türkiye, ~0 TL)

> Hazırlanma tarihi: 17 Kasım 2026. Kaynak brief: `docs/pazarlama-stratejisi.md`, 7. bölüm. Bu belge o stratejiye bağlıdır; çelişki olursa strateji belgesi geçerlidir.
> **Köşeli parantezli her alan** (`[Ev sahibi]`, `[dk]`, `[xG]`, `[indirme-sayfası]`) gerçek maç verisi ve gerçek uygulama çıktısıyla doldurulur. Kurgu alarm, kurgu analiz, uydurma sayı yok.
> "⚠ doğrulanmalı" işaretli maddeler platform kuralı, ücret veya tarih içerir. Uygulamadan önce kontrol edilir.

---

## 0. Kreatif çerçeve (her içerikte geçerli)

**Kampanya cümleleri (brief'ten):**
- Ana: **"Skoru herkes görür, nedenini sen gör."**
- Kısa: **"Skor değil, sebebi."**

**Ses:** Sakin, zeki, "akıllı arkadaş". Tribün bağırışı yok. Kulüp tarafsız. Kısa cümle.

**Kontrol listesi — paylaşmadan önce 8 soru:**
1. "Tahmin", "kesin", "garanti", "kazandırır", "kupon", "oran", "iddaa", "bahis" geçiyor mu? Geçiyorsa sil.
2. "Resmî", "onaylı", "ortağı" ima ediliyor mu? Sil.
3. "En iyi", "en hızlı", "1 numara" var mı? Sil.
4. Pro fiyatı veya "abone ol" var mı? Sil. Pro için sadece "yakında" ve "bekleme listesi".
5. "Play Store'da" yazıyor mu? Geçiş bitene kadar sil.
6. Kulüp/lig logosu, oyuncu fotoğrafı, yayın görüntüsü var mı? Çıkar.
7. Tek CTA mı? "İndirme sayfası" **veya** "bekleme listesi". İkisi aynı anda değil.
8. Tanıtımsa "Bu uygulamayı ben geliştiriyorum" ifadesi var mı? Yoksa ekle.

**Alarm dili kuralı:** Uygulamanın alarm metinleri ("gol kapıda!" gibi) yalnız **gerçek ekran görüntüsü** olarak, gerçek maçtan gösterilir. Reklam metni bu ifadeyi kendi sesiyle tekrarlamaz. Reklam cümlesi her zaman **"baskıyı veriyle gösterir"** çizgisinde kalır, "golü bilir" çizgisine geçmez. Alarmın gelip golün gelmediği vakalar da paylaşılır ("Alarm geldi, kaleci kurtardı"). Bu, "tahmin uygulaması" algısını ve bahis çağrışımını önler.

> Not (geliştiriciye, kod değişikliği yapılmadı): "Gol kapıda!" ifadesi uygulama içinde de bahis/tahmin çağrışımı taşıyabilir. Paylaşım kartına giren alarm metni için "baskı arttı" tonunda bir varyant düşünülebilir.

---

## 1. Üç kampanya konsepti

### Konsept A — "Nedenini Gör" (ana kampanya)
- **Büyük fikir:** Herkes skoru aynı anda öğrenir. Fark, skorun **neden** öyle olduğunu anlamaktır. Her büyük maçtan sonra uygulamanın gerçek AI analizini 3 maddelik bir kartla "ücretsiz örnek" olarak dışarı taşı. Skor küçük, sebep büyük yazılır.
- **Slogan:** "Skoru herkes görür, nedenini sen gör."
- **Alt slogan:** "Maç bitti. 3 maddede neden bitti."
- **Neden işe yarar:**
  - S1 (taktik/veri meraklısı) zaten "neden" sorusunu soruyor. İçerik, onların tartışma diline doğrudan katkı.
  - Maliyet sıfır: içeriği uygulama üretiyor, geliştirici sadece seçiyor.
  - Pro satışta değil ama Pro'nun değeri görünüyor. Bekleme listesi talebi ölçülür.
  - Kulüp tarafsız: kart iki takımı aynı dille anlatır, derbide bile kavga değil tartışma doğurur.
- **Kanal:** X (birincil), Reddit r/superlig bağlantısız veri gönderisi, Instagram carousel, kısa video formatı 1.
- **CTA:** Maç sonu kartında "İndirme sayfası". Pro analizi gösteren carousel'de "Bekleme listesi".

### Konsept B — "Sadece Senin Takımın" (bildirim/sadelik)
- **Büyük fikir:** Skor uygulamaları her şeyi bildirir. Skor+ sadece seçtiğin takımı ve sadece önemli anı bildirir. Görsel dil: kalabalık bir bildirim yığını değil, ekranda **tek bir** bildirim: "Maç başladı."
- **Slogan:** "Bir takım. Bir bildirim. Yeter."
- **Alt slogan:** "Takımını seç, gerisini düşünme."
- **Neden işe yarar:**
  - S2'nin (bildirim yorgunu tek takım taraftarı) gerçek bir acısına dokunur. Bugün çalışan ücretsiz özelliği satar; satılamayan Pro'ya yaslanmaz.
  - Kulüp tarafsız ve her takım taraftarı için aynı mesaj. Logo gerekmez.
  - 15 sn'lik ekran kaydına çok uygun: takım seç, bildirim gelir, bitti.
- **Kanal:** TikTok/Reels/Shorts, izinli Telegram/Discord taraftar grupları, Instagram hikâye.
- **CTA:** "İndirme sayfası".
- **Uyarı:** "Reklamsız" kelimesi sadece uygulamada reklam olmadığı doğrulanırsa eklenir (⚠ doğrulanmalı). Doğrulanmadan "gürültüsüz" kullanılır.

### Konsept C — "Tek Kişilik Takım" (geliştirici hikâyesi + Play Store yolculuğu)
- **Büyük fikir:** Skor+ bir şirket değil, bir kişi. Geliştirici kendi yüzü/sesiyle uygulamayı neden yaptığını, APK'nın neden güvenli kontrol edilebileceğini ve Play Store'a nasıl taşınacağını anlatır. Topluluk, "Kurucu Destekçi" veya "kapalı test ekibi" olarak hikâyeye katılır.
- **Slogan:** "Tek kişilik takım. Senin sahan."
- **Alt slogan:** "Play Store yolculuğuna ortak ol."
- **Neden işe yarar:**
  - APK güvensizliği en büyük engel. Yüzü olan, şeffaf bir geliştirici bu engeli metinden daha iyi aşar.
  - Türkiye'de bağımsız yerli geliştirici hikâyesi sempati ve paylaşım üretir.
  - Kapalı test gönüllüsü toplama hedefine (strateji 3.4) doğrudan hizmet eder.
- **Kanal:** Kısa video (geliştirici günlüğü), Ekşi Sözlük ve r/superlig şeffaf gönderiler, teknoloji forumları, Telegram kanalı.
- **CTA:** "Kapalı test ekibine katıl / bekleme listesi" (tek form).
- **Uyarı:** "Kurucu Destekçi" ödülü bir **teşekkür vaadidir**, satış değildir. Vaat yazılı ve sınırlı tutulur. Gerçek ilerleme sayıları (bağış, gönüllü) yuvarlanmadan paylaşılır.

---

## 2. Hazır içerikler

### 2.1 X/Twitter — 10 gönderi

Tüm metinler 280 karakter sınırının altındadır (hashtag dahil). Bağlantı varsayılan olarak bio'da; testte ilk yanıta konur (strateji 2.3). Köşeli parantezleri gerçek veriyle doldur.

**1 — Maç günü (sabah)**
> Bugün [Ev sahibi]–[Konuk] var.
> Skoru zaten herkes öğrenecek.
> Ben maç bitince 3 maddede nedenini paylaşacağım: baskı, xG, kırılma anı.
> Takip et, akşam görüşürüz.
> #SüperLig #Futbol

**2 — Maç günü (maç sonu kartı)**
> [Ev sahibi] [skor] [Konuk]. Peki neden?
> 1) [gerçek madde 1]
> 2) [gerçek madde 2]
> 3) [gerçek madde 3]
> Analiz: Skor+ (kendi geliştirdiğim Türkçe canlı skor uygulaması). Link bio'da.
> #SüperLig

**3 — Derbi (ön izleme, iki tarafa eşit)**
> Derbi öncesi taktik eşleşme:
> [Ev sahibi]: [gerçek güçlü yön]
> [Konuk]: [gerçek güçlü yön]
> Bence maçı kanat koridorları belirleyecek. Siz ne düşünüyorsunuz?
> Skoru herkes görür, nedenini sen gör.
> #Derbi #SüperLig

**4 — Derbi (devre arası)**
> Derbide devre arası.
> Skor [x-y] ama tablo şunu söylüyor: [gerçek veri, ör. "konuk ekip son 15 dk'da [n] isabetli şut"].
> İkinci yarıda kim neyi değiştirmeli? Cevabınızı yazın, maç sonu karşılaştıralım.
> #Derbi

**5 — Avrupa gecesi**
> Avrupa gecesi. Bu akşam sahadaki Türk takımları:
> [Takım – Rakip – Saat]
> [Takım – Rakip – Saat]
> Hepsi tek ekranda, Türkçe. Maç sonu toplu özet burada.
> #UEFA #AvrupaGecesi

**6 — Avrupa gecesi (maç sonu toplu özet)**
> Avrupa gecesi bitti, 3 cümlelik özet:
> [Takım]: [gerçek neden]
> [Takım]: [gerçek neden]
> [Takım]: [gerçek neden]
> Hangisi sizi şaşırttı?
> #AvrupaGecesi

**7 — NBA / Alperen (sabah "Gece ne oldu?")**
> Gece ne oldu?
> Alperen: [sayı] sayı, [ribaund] ribaund, [asist] asist.
> Maçın kırıldığı an: [gerçek an, ör. "3. çeyrekte [x]-0'lık seri"].
> Uyurken kaçırdıysan, kahve yanında 20 saniyede oku.
> #NBA #Alperen

**8 — NBA seri alarmı (gerçek vaka, ekran görüntülü)**
> Dün gece telefona düşen bildirim bu: [ekran görüntüsü — gerçek "NBA Seri Alarmı"].
> Sonrası: [gerçek sonuç, dönüş oldu ya da olmadı].
> Alarm maçı bilmez, seriyi görür. Bu özellik yakında Pro'da; bekleme listesi bio'da.
> #NBA

**9 — "Nedenini gör" (baskı alarmı, dürüst vaka)**
> Bu baskı alarmı [dk]. dakikada geldi.
> Gol geldi mi? [Gerçek sonuç: "Evet, [dk]. dakikada." / "Hayır, kaleci kurtardı."]
> Alarm golü bilmez; baskıyı veriyle gösterir. İkisini de paylaşıyorum, çünkü veri böyle çalışır.
> #Futbol #xG

**10 — "Nedenini gör" (geliştirici, şeffaf tanıtım)**
> Skor+'ı tek başıma geliştiriyorum.
> Ücretsiz, Türkçe canlı skor: Süper Lig, büyük ligler, UEFA, milli takımlar, NBA.
> Sadece takip ettiğin takım için "maç başladı" bildirimi.
> APK'nın SHA-256 ve VirusTotal sonucunu sayfada kendin kontrol edebilirsin. Link bio'da.

**Hashtag önerisi (en fazla 2 hashtag/gönderi):**
- Futbol: `#SüperLig`, `#Futbol`, `#Derbi`, `#xG`
- Avrupa: `#AvrupaGecesi`, `#UEFA` (ortaklık ima edilmez; sadece konu etiketi)
- NBA: `#NBA`, `#Alperen` (⚠ doğrulanmalı: güncel takım ve sakatlık durumu; takım adı yazmadan önce kontrol et)
- Kaçınılacak: bahis/tahmin/kupon içerikli trend etiketler, kulüp resmî kampanya etiketleri.

---

### 2.2 Kısa video senaryoları (TikTok / Reels / Shorts, 15-30 sn)

Ortak üretim kuralları:
- Görüntü: sadece telefon ekran kaydı (uygulama arayüzü) + metin + basit grafik. Maç yayın görüntüsü, oyuncu fotoğrafı, kulüp logosu öne çıkarılmaz. Uygulama içindeki küçük logolar ekran kaydında kalırsa bulanıklaştır veya küçük tut (strateji 2. bölüm).
- Ses: platformun **ticari kullanım** kütüphanesinden telifsiz müzik veya sessiz + seslendirme (⚠ doğrulanmalı: her platformun ticari ses kütüphanesi). Popüler şarkı kullanılmaz.
- Format: 9:16, altyazı her zaman açık (çoğu kişi sessiz izler).
- Gerçek veri: ekranda görünen her alarm/analiz gerçek bir maçtan.
- Yayın: büyük maçtan sonra 2-3 saat içinde, üç platforma aynı video.

**Video 1 — "Skoru herkes gördü, işte nedeni" (25 sn, Konsept A)**

| Saniye | Sahne | Ekran yazısı | Seslendirme |
|---|---|---|---|
| 0-3 | Skor ekranı, sadece sonuç | "[Ev sahibi] [skor] [Konuk]" | "Skoru herkes gördü." |
| 3-5 | Ekran karararak sonuç küçülür | "Peki neden?" | "Peki neden?" |
| 5-11 | Maç sonu AI analizi kaydırılır, 1. madde vurgulu | "1) [gerçek madde]" | "[Madde 1, sade dille]" |
| 11-17 | 2. madde vurgulu | "2) [gerçek madde]" | "[Madde 2]" |
| 17-22 | 3. madde vurgulu | "3) [gerçek madde]" | "[Madde 3]" |
| 22-25 | Uygulama ana ekranı + kapanış kartı | "Skoru herkes görür, nedenini sen gör." | "Link profilde." |

**Kapanış çağrısı:** "İndirme sayfası profilde." (Ekranda: "Analiz özelliği yakında Pro'da" notu küçük puntoyla; ayrı CTA değil, bilgi.)

**Video 2 — "Bir takım, bir bildirim" (15 sn, Konsept B)**

| Saniye | Sahne | Ekran yazısı | Seslendirme |
|---|---|---|---|
| 0-3 | Kilit ekranında üst üste yığılmış **genel** bildirim çizimi (maket, logosuz) | "Her maç, her gol, her şey…" | (sessiz, sadece ses efekti) |
| 3-5 | Yığın silinir | "Gerek yok." | — |
| 5-10 | Skor+'ta takım arama, takım seçme, "Takip" düğmesi | "Takımını seç." | "Takımını seç." |
| 10-13 | Gerçek "maç başladı" bildirimi kilit ekranına düşer | "Sadece önemli an." | "Sadece önemli an." |
| 13-15 | Kapanış kartı | "Bir takım. Bir bildirim. Yeter." | "Link profilde." |

**Kapanış çağrısı:** "İndirme sayfası profilde."
**Not:** 0-3 sn'deki yığın maket olduğu için köşeye "temsilîdir" yazılır. Başka uygulamanın adı/arayüzü gösterilmez (rakip kötüleme yok).

**Video 3 — "Bu bildirim 5 dakika önce geldi" (20 sn, Konsept A, sadece gerçek vaka)**

| Saniye | Sahne | Ekran yazısı | Seslendirme |
|---|---|---|---|
| 0-3 | Kilit ekranında gerçek "Baskı Alarmı" bildirimi, saat damgası görünür | "[dk]. dakika, bu bildirim geldi." | "Bu bildirim [dk]. dakikada geldi." |
| 3-9 | Bildirime dokunulur, alarm detayı (isabetli şut, xG) | "Son 10 dk: [n] isabetli şut, [xG] xG" | "Son on dakikada [n] isabetli şut." |
| 9-14 | Maç akışında sonraki olay | "[Gerçek sonuç]" | "[Gol geldi / kaleci kurtardı]." |
| 14-18 | Sade metin kartı | "Alarm golü bilmez. Baskıyı gösterir." | "Alarm golü bilmez. Baskıyı veriyle gösterir." |
| 18-20 | Kapanış kartı | "Baskı alarmı: yakında Pro'da" | "Bekleme listesi profilde." |

**Kapanış çağrısı:** "Bekleme listesi profilde."
**Kural:** Alarmın golle sonuçlanmadığı bir vakayla da aynı video çekilir ve sırayla yayınlanır. "Hep doğru çıkıyor" izlenimi verilmez.

**Video 4 — "Gece ne oldu?" NBA / Alperen (20 sn, Konsept A, S3)**

| Saniye | Sahne | Ekran yazısı | Seslendirme |
|---|---|---|---|
| 0-3 | Sabah saati (ör. 08:30) olan telefon kilit ekranı | "Gece NBA vardı. Uyudun." | "Gece maç vardı, sen uyudun." |
| 3-8 | Skor+ NBA maç detayı, skor | "[Takım] [skor] [Rakip]" | "Skor bu." |
| 8-14 | Alperen'in istatistik satırı vurgulu | "Alperen: [sayı] sayı, [rib] ribaund, [ast] asist" | "Alperen [sayı] sayı, [rib] ribaund." |
| 14-18 | Maçın kırılma anı (gerçek seri) | "Kırılma: [çeyrek], [x]-0 seri" | "Maç [çeyrek] çeyrekte kırıldı." |
| 18-20 | Kapanış kartı | "Alperen sahadayken haberin olsun." | "Link profilde." |

**Kapanış çağrısı:** "İndirme sayfası profilde."
**Uyarı:** Oyuncu fotoğrafı kullanılmaz; sadece adı metin olarak. ⚠ doğrulanmalı: güncel takım ve maç takvimi.

**Video 5 — "Bu uygulamayı ben yaptım" geliştirici günlüğü (30 sn, Konsept C)**

| Saniye | Sahne | Ekran yazısı | Seslendirme (geliştiricinin kendi sesi) |
|---|---|---|---|
| 0-3 | Geliştiricinin elleri/masası veya yüzü (isteğe bağlı) | "Bunu tek başıma yapıyorum." | "Merhaba, Skor+'ı tek başıma geliştiriyorum." |
| 3-10 | Uygulama ekran kaydı: canlı skor listesi, takım takibi | "Türkçe canlı skor + takım takibi" | "Türkçe canlı skor, takım takibi, maç başladı bildirimi. Ücretsiz." |
| 10-17 | İndirme sayfası: SHA-256 ve VirusTotal bölümü | "Kontrolü sana bırakıyorum." | "Play Store'da değilim, o yüzden APK'nın özetini ve tarama sonucunu açıkça koyuyorum. Kendin kontrol et." |
| 17-25 | Play Store hedefi ilerleme çubuğu (gerçek değer) | "Hedef: Play Store" | "Hedefim Play Store. Bunun için kapalı test ekibine ihtiyacım var." |
| 25-30 | Kapanış kartı | "Tek kişilik takım. Senin sahan." | "Katılmak istersen form profilde." |

**Kapanış çağrısı:** "Kapalı test formu profilde."
**Not:** Sayılar (bağış, gönüllü) gerçek değerle gösterilir; değer henüz düşükse yine de dürüstçe gösterilir veya hiç gösterilmez.

---

### 2.3 Instagram carousel — 3 plan

Tasarım: koyu tema (#0A0E14 zemin, #2BE37A vurgu, Pro slaytlarında #F5C451). Kare veya 4:5. Kulüp logosu yok; takım adları sadece metin. Son slayt tek CTA.

**Carousel 1 — "Derbinin 5 kırılma anı" (Konsept A)**
1. Kapak: "Derbinin 5 kırılma anı" / alt satır: "[Ev sahibi] [skor] [Konuk] — skoru biliyorsun, nedenini kaydır."
2. "1. [dk]' — [gerçek olay]. Neden önemliydi: [tek cümle]."
3. "2. [dk]' — [gerçek olay]. [tek cümle]."
4. "3. [dk]' — [gerçek olay]. [tek cümle]."
5. "4. [dk]' — [gerçek olay]. [tek cümle]."
6. "5. [dk]' — [gerçek olay]. [tek cümle]."
7. Özet: "Tek cümlede: [gerçek sonuç cümlesi]." / "Sence 6. kırılma anı neydi? Yoruma yaz."
8. CTA: "Bu analiz Skor+'ın yakında gelecek Pro özelliğinden. Bekleme listesi: profildeki link."

**Carousel 2 — "Bildirim gürültüsünü kapat: 3 adım" (Konsept B)**
1. Kapak: "Maç günü telefonun susmuyor mu?" / "3 adımda sadece senin takımın."
2. "Adım 1: Skor+'ı aç, takımını ara." (gerçek ekran görüntüsü)
3. "Adım 2: 'Takip'e dokun." (gerçek ekran görüntüsü)
4. "Adım 3: Bildirim iznini ver. Gerisi otomatik." (gerçek ekran görüntüsü)
5. "Ne gelir? Takımının maçı başladığında tek bildirim. O kadar."
6. "Kapsam: Süper Lig, Avrupa'nın büyük ligleri, UEFA kupaları, milli takımlar, NBA."
7. "Neden Play Store'da değil? Tek kişilik projeyim, geçiş için çalışıyorum. APK'nın SHA-256 ve VirusTotal sonucu indirme sayfasında."
8. CTA: "İndirme sayfası: profildeki link."

**Carousel 3 — "Devre arasında ne değişmeli?" (Konsept A, Pro örneği, canlı/maç sonrası)**
1. Kapak (#F5C451 küçük "Pro örneği" etiketi): "Soyunma Odası Reçetesi" / "[Ev sahibi]–[Konuk], devre arası."
2. "İlk yarı tablosu: [gerçek 3 veri: şut, xG, topa sahip olma]."
3. "[Ev sahibi] için reçete: [gerçek AI önerisi]."
4. "[Konuk] için reçete: [gerçek AI önerisi]." (iki tarafa eşit alan)
5. "İkinci yarıda ne oldu? [gerçek sonuç: öneri uygulandı mı, ne değişti]."
6. "Bu bir tahmin değil; ilk yarının verisinden çıkan taktik okuma."
7. CTA: "Pro yakında. Bekleme listesi: profildeki link."

Hikâye eki (her carousel için): "Devre arası kim değişiklik yapmalı?" anketi (strateji 2.7).

---

### 2.4 Reddit r/superlig taslağı

> **Önce:** 2-3 hafta normal katılım + moderatörlere modmail (aşağıda). ⚠ doğrulanmalı: self-promotion kuralı, flair zorunluluğu, hesap yaşı/karma şartı. Ayda en fazla 1 tanıtım gönderisi.

**Modmail (gönderiden önce):**
> Merhaba, kendi geliştirdiğim ücretsiz bir Türkçe canlı skor uygulaması var (Android, şimdilik APK). Subreddit'te bir kez geri bildirim istemek için paylaşmamda sakınca var mı? Uygunsa hangi flair'i kullanmalıyım? Uygun değilse hiç paylaşmam. Teşekkürler.

**Gönderi başlığı:**
> Kendi geliştirdiğim Türkçe canlı skor uygulaması için dürüst geri bildirim arıyorum (ücretsiz, Android)

**Gönderi gövdesi:**
> Selam. Bir süredir burada maç başlıklarına yazıyorum. Boş zamanlarımda tek başıma Skor+ adında bir canlı skor uygulaması geliştiriyorum ve buradaki kitlenin fikrini çok önemsiyorum.
>
> **Ne yapıyor (bugün çalışan kısım, ücretsiz):**
> - Süper Lig, Avrupa'nın büyük ligleri, UEFA kupaları, milli takımlar ve NBA canlı skor
> - Türkçe takım adları
> - Sadece takip ettiğin takım/maç için "maç başladı" bildirimi
>
> **Ne yapmıyor / dürüst notlar:**
> - Play Store'da değil, APK ile dağıtıyorum. Bu yüzden Android "bilinmeyen kaynak" uyarısı gösteriyor. İndirme sayfasında her sürümün SHA-256 özeti, VirusTotal sonucu ve her iznin neden istendiği yazıyor. Kontrol edip öyle kurun lütfen.
> - Maç sonu taktik analizi gibi özellikler üzerinde çalışıyorum ama henüz açık değil.
> - Kadın ligleri, BSL ve EuroLeague şu an yok.
>
> **Sorularım:**
> 1. Bir skor uygulamasında sizi en çok ne rahatsız ediyor?
> 2. Hangi bildirimi gerçekten istersiniz, hangisini asla?
> 3. APK kurmak sizin için engel mi? Ne görseniz güvenirsiniz?
>
> Ekran görüntüleri: [galeri]
> İndirme sayfası: [indirme-sayfası?utm_source=reddit]
>
> Eleştiriye açığım, olumsuz yorumlar da işime yarar. Teşekkürler.

---

### 2.5 Ekşi Sözlük entry taslağı

> **Nereye:** Yeni "skor+" başlığı açılmaz. Var olan "canlı skor uygulaması", "en iyi maç sonucu uygulaması" gibi başlıklara bilgilendirici entry (⚠ doğrulanmalı: tanıtım entry'si kuralları; çaylak hesap entry'leri görünmeyebilir). Ayda 1-2, aynı metin kopyalanmaz. Kendi ürününe övgü yazmak veya başkasına yazdırmak yok.

**Entry:**
> açık söyleyeyim, aşağıda bahsettiğim uygulamayı ben geliştiriyorum. o yüzden bunu tarafsız yorum olarak değil bilgi olarak okuyun.
>
> tek başıma skor+ diye bir android uygulaması yapıyorum. türkçe canlı skor; süper lig, avrupa'nın büyük ligleri, uefa kupaları, milli takımlar ve nba var. asıl derdim bildirim kalabalığıydı: sadece takip ettiğin takımın maçı başlayınca tek bildirim geliyor.
>
> eksikleri: play store'da değil, apk ile dağıtıyorum. kurulumda android'in uyarısı çıkıyor. indirme sayfasında sha-256 özeti ve virustotal sonucu var, merak eden kontrol edebilir. bsl ve euroleague yok.
>
> başlıktaki arkadaşlar skor uygulamalarında en çok neyden şikâyet ediyorsa yazarsa not alırım, geri bildirime gerçekten ihtiyacım var.
>
> (bkz: [indirme-sayfası])

---

### 2.6 Telegram/Discord yöneticisine izin mesajı

> Kişiselleştir: grubun adı, gruptan gerçekten okuduğun bir şey. Kopyala-yapıştır toplu gönderim yok. Bahis içerikli gruplara yazılmaz.

**Mesaj:**
> Merhaba [yönetici adı], [grup adı] grubunu bir süredir takip ediyorum; özellikle [gerçek gözlem, ör. "maç sonu tartışmaları çok kaliteli"].
>
> Kendimi tanıtayım: Skor+ adında Türkçe bir canlı skor uygulamasını tek başıma geliştiriyorum. Uygulama maçlar için devre arası ve maç sonu kısa taktik özetleri üretiyor.
>
> Sorum şu: maç günlerinde gruba [takım/maç] için 3-4 satırlık bir devre arası özeti paylaşmamda sakınca var mı? İsterseniz hiç bağlantı koymam, sadece metin olur. Uygun görmezseniz de tamamen anlarım, bir daha yazmam.
>
> Önce bir örneği size özelden göstermemi isterseniz memnuniyetle atarım.
> Teşekkürler, iyi maçlar.

---

### 2.7 APK indirme sayfası metinleri

**Başlık:**
> Skoru herkes görür, nedenini sen gör.

**Alt başlık:**
> Türkçe, ücretsiz canlı skor. Süper Lig, Avrupa'nın büyük ligleri, UEFA kupaları, milli takımlar ve NBA. Sadece takip ettiğin takım için, sadece önemli anda bildirim.

**3 fayda maddesi:**
1. **Sadece senin takımın.** Takımını seç; maçı başladığında tek bildirim gelir. Gerisi seni rahatsız etmez.
2. **Tamamen Türkçe.** Takım adları, ekranlar, bildirimler Türkçe. Gece NBA'i de, Avrupa gecesini de aynı yerden takip et.
3. **Yakında: skorun nedeni.** Maç sonu taktik analizi, devre arası raporu ve baskı alarmı üzerinde çalışıyorum. Açıldığında ilk haberi bekleme listesi alır.

> Sayfa CTA kuralı: Ana düğme **"APK'yı indir"**. Bekleme listesi bağlantısı aynı ekranda ikinci CTA olarak durmaz; SSS'teki "Pro ne zaman?" sorusunun içinde metin bağlantısı olarak yer alır.

**Güven bölümü — "Neden Play Store'da değil? Ve neden güvenebilirsin?"**
> Skor+ tek kişilik bir proje. Play Store'a geçmek için çalışıyorum; o zamana kadar uygulamayı buradan, APK olarak dağıtıyorum.
>
> Android, Play Store dışından gelen her uygulamada bir uyarı gösterir. Bu uyarı uygulamanın zararlı olduğu anlamına gelmez; uygulamanın Google tarafından incelenmediği anlamına gelir. Bu yüzden kontrolü sana bırakıyorum:
>
> - **SHA-256 özeti:** `[sürüm] — [özet]`. İndirdiğin dosyanın özetiyle karşılaştır.
> - **VirusTotal sonucu:** [bu sürümün tarama bağlantısı]. Her sürümde yeniden taranır.
> - **İzinler ve nedenleri:** Bildirim izni yalnız "maç başladı" bildirimi için. [Diğer izinler ve gerçek nedenleri.]
> - **Toplanan veri:** [Gerçekte ne toplandığı / ne toplanmadığı.] Ayrıntı: [gizlilik politikası].
> - **Aynı imza:** Tüm sürümler aynı imza anahtarıyla imzalanır. Güncelleme farklı imzalıysa kurma ve bana haber ver.
> - **Kim yapıyor:** [Geliştirici adı/kimliği, 2 cümlelik "ben kimim".] İletişim: [adres].
>
> Kurulumdan sonra "bilinmeyen kaynaklar" iznini geri kapatabilirsin. Adım adım anlatım aşağıda.

> Kullanılmayacak ifadeler: "%100 güvenli", "virüssüz garanti", "resmî", "Play Store'da".

---

## 3. Paylaşım kartı — 3 tasarım önerisi

Ortak kurallar:
- Renkler: zemin **#0A0E14**, canlı/ücretsiz vurgu **#2BE37A**, Pro vurgu **#F5C451**. Metin: birincil beyaza yakın (ör. #E8EDF2), ikincil gri (ör. #8A94A3). Kontrast okunabilir kalmalı (küçük metin için WCAG AA hedefi).
- **Kulüp/lig logosu, oyuncu fotoğrafı, resmî marka yok.** Takımlar sadece metinle. Takım renkleri de kullanılmaz (dolaylı marka çağrışımı ve taraf tutma algısı). Ev sahibi/konuk ayrımı nötr gri tonlarla.
- Boyutlar: X için 16:9 (1200×675), Instagram/hikâye için 4:5 (1080×1350) ve 9:16 (1080×1920) varyantı.
- **Filigran:** Skor+ adı/ikonu, sağ alt köşe, %40-60 opaklık, kenardan güvenli boşluk bırakılır (platform arayüzü alt köşeyi kapatabilir; 9:16'da alttan ~%15 boş).
- **CTA:** Kartta tek satır, kısa adres: "[indirme-sayfası]". Pro kartında aynı satır "Bekleme listesi: [adres]" olur. İkisi birlikte değil.
- Alt bilgi satırı (küçük): "Veri: [veri sağlayıcı adı, ⚠ lisans izin veriyorsa]" ve kartın oluşturulma saati. Saat damgası, alarm vakalarının dürüstlüğünü kanıtlar.
- Örnek veri ile tasarlanan maketlerde köşeye "temsilîdir" notu.

### Kart 1 — "Skor küçük, sebep büyük" (maç sonu analiz kartı, Konsept A)
- **Düzen (yukarıdan aşağı):**
  1. Üst şerit: küçük etiket "MAÇ SONU" (#2BE37A, büyük harf, küçük punto) + tarih.
  2. Skor satırı: "[Ev sahibi] 2 – 1 [Konuk]" orta boy, beyaz. Bilerek küçük tutulur.
  3. Başlık (en büyük öğe): "Neden?" veya analizin tek cümlelik özeti.
  4. 3 madde: numaralı, her biri en fazla 2 satır. Madde numaraları #2BE37A daire içinde.
  5. Alt şerit: solda veri/saat bilgisi, sağda filigran + adres.
- **Hiyerarşi:** "Neden?" > 3 madde > skor > etiketler. Göz önce soruyu, sonra cevabı okur; skor bağlam olarak kalır.
- **Neden işe yarar:** Kampanya cümlesini görselleştirir. Kart tek başına dolaşsa bile mesaj okunur.

### Kart 2 — "Alarm anı" (Pro alarm kartı, gerçek vaka)
- **Düzen:**
  1. Üst: "PRO ÖRNEĞİ — YAKINDA" etiketi (#F5C451 dolgulu küçük hap; metin #0A0E14).
  2. Merkez: bildirim balonu görünümü (koyu gri kart, ince #F5C451 kenar). İçinde gerçek alarm metni birebir. Yanında büyük saat damgası: "[dk]'".
  3. Altında veri şeridi: 2-3 küçük sayı kutusu ("İsabetli şut: [n]", "xG: [x]", "Süre: son 10 dk").
  4. Sonuç satırı: "Sonra ne oldu? [gerçek sonuç]" — golse de değilse de yazılır.
  5. Alt sabit cümle (küçük, gri): "Alarm golü bilmez; baskıyı veriyle gösterir."
  6. Sağ alt: filigran + "Bekleme listesi: [adres]".
- **Hiyerarşi:** Saat damgası + alarm balonu > veri şeridi > sonuç > açıklama.
- **Renk:** Altın sadece Pro etiketinde ve balon kenarında. Kart geneli koyu kalır; altın "premium" işaret olarak az kullanılır.
- **Not:** NBA seri alarmı için aynı şablon; veri kutuları "Seri: [x]-0", "Çeyrek: [n]", "Fark: [n]".

### Kart 3 — "Devre arası tahtası" (Soyunma Odası Reçetesi, iki sütun)
- **Düzen:**
  1. Üst: "DEVRE ARASI" etiketi (#2BE37A) + "[Ev sahibi] [x]-[y] [Konuk]".
  2. Orta: iki eşit sütun, aralarında ince dikey çizgi. Her sütunda takım adı (metin), ilk yarının 2 verisi ve "Reçete:" başlıklı 1-2 öneri.
  3. Alt: tek satır soru "İkinci yarıda kim haklı çıkacak? Maç sonu karşılaştıralım." (etkileşim; tahmin değil, tartışma çağrısı)
  4. Sağ alt: filigran + adres. Pro özelliğiyse sol üstte küçük altın "Pro örneği" hapı.
- **Hiyerarşi:** İki sütun eşit ağırlıkta (kulüp tarafsızlığı görsel olarak da korunur) > skor > soru.
- **Neden işe yarar:** Derbide iki taraf taraftarı da kendi takımını kartta görür; paylaşım iki kitleye birden yayılır.

> Geliştiriciye not (kod değişikliği yapılmadı): Strateji 4.1'deki "uygulama içi Paylaş düğmesi" bu üç şablonla hayata geçirilirse kullanıcılar kartı kendileri üretir. Kartlar otomatik üretilecekse logo içermeyen bu sade düzenler teknik olarak da basittir.

---

## 4. Maç günü içerik takvimi şablonu

Tarih/saatler fikstürden doldurulur (⚠ doğrulanmalı: TFF, UEFA, NBA resmî fikstürleri; ertelemeler). Bir maç günü toplam hedef süre: ~90 dk.

| Zaman | Ne paylaşılır | Kanal | Hazırlık | CTA |
|---|---|---|---|---|
| **Maç günü −1 (akşam)** | Taktik eşleşme kartı (sadece derbi/Avrupa gecesi) | X, IG hikâye | Uygulamanın maç önü eşleşme çıktısından 2 madde seç (15 dk) | Yok veya indirme sayfası (bio) |
| **Maç günü sabahı** | "Bugün [maç] var. Akşam nedenini paylaşacağım." (X #1) | X | 5 dk | Takip et |
| **Maç −1 saat** | Kısa hatırlatma + IG anketi ("İlk yarıyı kim alır?" yerine "Kim daha çok baskı yapar?" — sonuç tahmini değil, oyun tarzı sorusu) | X, IG hikâye | 5 dk | Yok |
| **Maç sırasında** | Tek canlı thread aç; sadece gerçekten önemli anları ekle. Gerçek alarm gelirse ekran görüntüsünü saatiyle kaydet (sonra kullanmak için) | X | Maçı izlerken | Yok |
| **Devre arası (15 dk pencere)** | Devre arası kartı (Kart 3) veya 3 satırlık özet; izinli Telegram/Discord gruplarına metin özet | X, izinli gruplar, IG hikâye | Uygulamanın devre arası raporundan seç, şablona yapıştır (≤10 dk) | Bekleme listesi (Pro örneğiyse) |
| **Maç sonu +0-30 dk** | Maç sonu kartı (Kart 1); alarm vakası varsa Kart 2 | X | 15 dk | İndirme sayfası |
| **Maç sonu +2-3 saat** | Kısa video (Video 1 veya 3); carousel taslağı | TikTok, Reels, Shorts | 30 dk (ekran kaydı + düzenleme) | Profildeki link |
| **Ertesi gün** | Carousel (Derbinin 5 kırılma anı); Reddit'te bağlantısız veri gönderisi (haftada 1-2) | IG, Reddit | 20 dk | Bekleme listesi (IG) / yok (Reddit) |
| **NBA sabahı (09:00 civarı)** | "Gece ne oldu?" kartı (X #7) veya Video 4 | X, Shorts/Reels | 10 dk | İndirme sayfası |

**Haftalık ritim (strateji 4.3 ile aynı):** Pzt hafta sonu veri thread'i · Sal-Per Avrupa gecesi · Cum derbi ön izleme · Cmt-Paz canlı devre arası + maç sonu · NBA sabahları kısa kart.

**Boş şablon (kopyala ve doldur):**

```
Maç: [Ev sahibi] – [Konuk] | Tarih/Saat: [ ] | Tür: Derbi / Avrupa / Milli / NBA / Büyük lig
[ ] -1 gün: Eşleşme kartı — 2 madde: ...
[ ] Sabah: X #1 metni hazır
[ ] -1 saat: IG anketi sorusu: ...
[ ] Maç içi: canlı thread bağlantısı: ... | Alarm ekran görüntüleri: ...
[ ] Devre arası: Kart 3 / metin özet — izinli gruplar: ...
[ ] Maç sonu: Kart 1 (+ Kart 2 varsa) — 3 madde: ...
[ ] +2-3 saat: Video no: ... | yüklendi: TikTok / Reels / Shorts
[ ] +1 gün: Carousel / Reddit veri gönderisi
Kontrol listesi (0. bölüm, 8 soru) geçildi mi? [ ]
UTM etiketleri: x / ig / tiktok / yt / reddit / tg
```

---

## 5. Ücretli deneme planı (500-1000 TL çıkarsa) ve bütçesiz yol

### 5.1 Önce: bu parayı reklama değil Play Store'a harcamak daha verimli olabilir
Strateji belgesine göre en büyük büyüme engeli APK ve Play Store kayıt ücreti tek seferlik ~25 $ (⚠ doğrulanmalı: güncel ücret, kur ve Türkiye'den kabul edilen ödeme yöntemi). Bu ücret 500-1000 TL'nin içinde kalıyorsa **önerim parayı önce Play Console kaydına ayırmaktır.** Gerekçe: APK sayfasına reklamla gelen kullanıcının önemli bir kısmı "bilinmeyen kaynak" uyarısında kaybolur. Aynı para kalıcı bir dönüşüm engelini kaldırır; reklam ise tek seferlik trafik getirir.

### 5.2 Kayıt ücreti karşılandıysa veya ayrı bütçe varsa: 14 günlük mikro test
- **Amaç:** Hangi mesajın (Konsept A, B, C) indirme sayfasına gerçek indirme getirdiğini öğrenmek. Büyüme değil, **öğrenme** satın alınır.
- **Platform:** Organik olarak en iyi giden **mevcut** gönderiyi öne çıkarma (Instagram/Facebook "boost" veya TikTok Promote). Sıfırdan reklam üretilmez. ⚠ doğrulanmalı: Meta ve TikTok reklam politikalarının APK/harici indirme bağlantısına izni, minimum günlük bütçe, Türkiye vergi/fatura koşulları. Reklam doğrudan APK dosyasına değil, indirme sayfasına yönlenir.
- **Yapı:**
  - 3 kreatif × eşit bütçe: Video 2 (Konsept B), Video 1 (Konsept A), Video 4 (NBA, S3).
  - Süre: 7 gün test + 7 gün kazanana tüm kalan bütçe.
  - Hedefleme: Türkiye, 18-34, ilgi alanı futbol/basketbol, Android cihazlar (platform izin veriyorsa).
  - **Hariç tutulacaklar:** bahis, şans oyunları, iddaa vb. ilgi alanları (platform izin veriyorsa). Reklam metni ve görseli 0. bölümdeki kontrol listesinden geçer.
  - Zamanlama: maç saatlerinin 2-3 saat öncesi ve maç sonrası (bildirim değeri en anlaşılır an).
- **Durdurma kuralı:** 3. günün sonunda bir kreatifin indirme sayfası tıklama maliyeti diğerlerinin belirgin şekilde üstündeyse (ör. 2 katı) o kreatif kapatılır. Hiçbir kreatif APK indirmesi getirmiyorsa test 7. gün durdurulur ve kalan bütçe saklanır.

### 5.3 Ölçüm
| Metrik | Nasıl | Karar |
|---|---|---|
| Tıklama başı maliyet (indirme sayfası) | Reklam paneli + her kreatife ayrı UTM (`utm_source=meta&utm_content=konseptB`) | Mesajın ilgi çekip çekmediği |
| İndirme başı maliyet | Sayfa analitiği (GoatCounter/Cloudflare, ⚠ ücretsiz katman doğrulanmalı) + GitHub Releases indirme sayısı, kampanya günleriyle karşılaştırma | **Ana karar metriği** |
| Sayfa → indirme oranı | Ziyaret / indirme | Düşükse sorun reklam değil güven bölümüdür; sayfa düzeltilir |
| Takım takibi yapan yeni kullanıcı oranı | Backend sorgusu, kampanya öncesi 7 gün ile karşılaştırma | Gerçek aktivasyon |
| D7 tutma | Backend (son açılış zamanı) | Ücretli kullanıcı kalıyor mu |

Sonuçlar gerçek sayılarla, yuvarlanmadan Google Sheets'e yazılır. "X kişi indirdi" diye paylaşılacaksa sadece ölçülen gerçek sayı kullanılır.

### 5.4 Bütçe yoksa nasıl atlanır
- Ücretli test tamamen atlanır; aynı soruyu organik yoldan cevapla: 3 videoyu aynı hafta, benzer saatlerde yayınla, her birine ayrı UTM'li bio bağlantısı veya ayrı kısa adres ver. 14 gün sonra indirme sayfası tıklamalarını karşılaştır.
- Bütçe yerine **zaman** yatırımı: S5 içerik üreticilerine (strateji 1. bölüm) kartları kaynak göstererek kullanma izni. Tek bir üretici ilişkisi küçük bir reklam bütçesinden daha uzun süre trafik getirebilir.
- Play Store ücreti için strateji 3.4'teki şeffaf destek kampanyası ("Tek kişilik takım", Konsept C) kullanılır.

---

## 6. Hızlı özet — en güçlü 3 fikir
1. **"Skor küçük, sebep büyük" maç sonu kartı (Konsept A + Kart 1):** Sıfır maliyetli, uygulamanın kendi ürettiği gerçek analizle her büyük maçtan sonra tekrar eden içerik makinesi. Pro talebini satış yapmadan ölçer.
2. **Dürüst alarm vakaları ("Alarm golü bilmez, baskıyı gösterir" — Video 3 + Kart 2):** Golle biten ve bitmeyen gerçek vakaları birlikte paylaşmak hem en paylaşılabilir anı yakalar hem de bahis/tahmin algısını baştan keser.
3. **"Bir takım. Bir bildirim. Yeter." (Konsept B + Video 2):** Bugün çalışan ücretsiz özelliği, her taraftara aynı tarafsız mesajla, 15 saniyede anlatır. Telegram/Discord gruplarında ve kısa videoda en kolay dönüşen mesaj.
