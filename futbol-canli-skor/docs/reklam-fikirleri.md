# Skor+ — Reklam ve Kreatif Fikirler (Türkiye, ~0 TL)

> **Değişiklik notu — 18 Kasım 2026**
> - Yeni **7. bölüm** eklendi: güncel özelliklere (GELISTIRMELER 3.20–3.27) göre yeni kreatif turu.
>   - 7.1 Özellik doğruluk tablosu: hangi özellik ücretsiz, hangisi Pro (Pro henüz satışta değil, "yakında").
>   - 7.2 **Ticari marka ve logo kuralı** (yeni, zorunlu): reklam kreatiflerinde resmî NBA, lig ve kulüp logosu ya da markası kullanılmaz.
>   - 7.3 Üç yeni kısa video: NBA box score + Türkçe AI analizi, futbol devre arası raporu, taktik asistan sohbeti.
>   - 7.4 Beş statik gönderi/hikâye metni. CTA: "APK'yı indir" + QR/bağlantı yer tutucusu.
>   - 7.5 Sıfır bütçe organik plan (2 hafta).
>   - 7.6 ₺1000–3000 ücretli test planı. 5. bölümdeki 500–1000 TL planın yerine geçer; 5.1'deki "önce Play Store kaydı" önerisi geçerliliğini korur.
>   - 7.7 APK kurulumunu ölçme: UTM, kanal başına bağlantı sayacı, kanal başına APK dosyası, backend'de yeni hesap sayısı.
> - 0. bölümdeki kontrol listesine 9. soru eklendi: marka/logo kuralı.
> - Eski bölümler silinmedi. Eski Video 4 (NBA) ve 2.7 (indirme sayfası) hâlâ geçerli. 2.7'deki "Yakında: skorun nedeni" maddesi de doğru: AI özellikleri uygulamada hazır ama Pro satın alınamıyor.

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
9. Kreatifte resmî NBA, lig veya kulüp logosu, takım logosu, forma/renk kimliği ya da markayı slogan gibi kullanan bir ifade var mı? Varsa çıkar. Ekran kaydındaki takım logoları bulanıklaştırılır. Ayrıntı: 7.2.

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

> 18 Kasım notu: Güncel ücretli test planı **7.6** (₺1000–3000), ölçüm planı **7.7**. 5.1'deki "önce Play Store kaydı" önerisi geçerli.

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
4. **(18 Kasım) "Gece maçının tam kutu skoru, sabah kahvenle." (Video N1 + S1):** Bugün çalışan, ücretsiz ve yeni NBA box score'u sabah penceresinde anlatır. Ücretli testte ilk aday budur. Ayrıntı 7. bölümde.

---

## 7. Yeni kreatif turu — 18 Kasım 2026 (güncel özelliklere göre)

> Bu bölüm GELISTIRMELER.txt 3.20–3.27'ye göre yazıldı. 0. bölümdeki kontrol listesi (9 soru) ve alarm dili kuralı burada da geçerlidir.

### 7.1 Özellik doğruluk tablosu — reklamda ne söylenebilir?

Pro şu an satın alınamaz. Uygulama APK ile dağıtılıyor ve Play Store'da değil. Test hesapları dışındaki kullanıcılar paywall'da **"Pro abonelik çok yakında"** görür (3.21, 3.22). Bu yüzden Pro özellikleri reklamda her zaman **"Pro · yakında"** etiketiyle anılır. "Hemen kullan", "şimdi aç" veya fiyat yazılmaz.

| Özellik | Durum | Reklamda nasıl söylenir |
|---|---|---|
| Canlı skor, Dün / Bugün / Yarın şeridi | Ücretsiz | "Dün, bugün, yarın: tek ekranda." |
| Takım takibi + "Maç başladı" bildirimi | Ücretsiz | "Takımını seç, maç başlayınca haber gelsin." |
| "Son güncelleme HH:MM" damgası | Ücretsiz | "Verinin ne zaman güncellendiğini görürsün." Canlı veri ~30 dk aralıkla güncellenir. "Anlık" veya "saniye saniye" **denmez**. |
| Futbol Kadro sekmesi: diziliş, yedekler, teknik direktör; maç sonu oyuncu puanları ve "Maçın oyuncusu" | Ücretsiz (veri varsa) | "Maç bitince oyuncu puanları." |
| NBA çeyrek skorları, "Kısa bakış", "Kırılma anı" | Ücretsiz (veri varsa) | "Maç hangi çeyrekte kırıldı?" |
| NBA Box Score: iki takım alt alta; DK, FGM/FGA/FG%, 3PM/3PA/3P%, FTM/FTA/FT%, OREB/DREB/REB, AST, STL, BLK, TO, PF, PTS, +/-; TOPLAM satırı | Ücretsiz, **yalnız biten maçlarda** | "Gece maçının tam kutu skoru sabah hazır." **Canlı box score yok**, "canlı" denmez. |
| Maç sonu AI taktik analizi (futbol + NBA, Türkçe, NBA'de basketbol diliyle) | Pro · yakında | "Maç sonu Türkçe taktik analiz. Pro'da, yakında." |
| Maç önü AI raporu (veri azsa dizilişten okuma) | Pro · yakında | "Maç önü: dizilişten kilit bölge." "Tahmin" denmez. |
| Devre arası "Soyunma Odası Reçetesi" | Pro · yakında | "Devre arasında ikinci yarı için hamleler." |
| Akıllı alarmlar (baskı alarmı vb.) | Pro · yakında | 0. bölümdeki alarm dili kuralı geçerli. |
| Taktik asistan sohbeti: maç başına 3 soru, yanıt yalnız o maçın verisine dayanır | Pro · yakında | "Bu maç hakkında sor. Yanıt yalnız bu maçın verisinden." |

**Söylenmeyecekler:** "Canlı box score", "anlık skor", "AI kazananı bilir", "tahmin", "her ligi kapsar", "Play Store'da". Ölçülmemiş kullanıcı sayısı veya puan yazılmaz. Sahte yorum, sahte kullanıcı görüşü veya "kullanıcılarımız diyor ki" kartı **yoktur**. Gerçek bir kullanıcı alıntısı ancak yazılı izinle, kelimesi kelimesine ve kaynağıyla kullanılabilir.

### 7.2 Ticari marka ve logo kuralı (zorunlu)

**Kural: Reklam kreatiflerinde resmî NBA, lig, federasyon veya kulüp ticari markası ve logosu kullanılmaz.** Bu kural ücretli ve organik bütün kreatifler için geçerlidir.

- **Logo yok:** NBA logosu, lig/kupa logoları, kulüp armaları ve NBA takım logoları kreatife konmaz. Uygulama maç ekranlarında gerçek takım logolarını gösterir (NBA logoları 3.26'dan beri Storage'dan gelir). Bu yüzden **ekran kaydı ve ekran görüntülerinde logolar bulanıklaştırılır** veya logo alanı kırpılır.
- **Görsel kimlik yok:** Forma, takım renk paleti, resmî font, kupa görseli, oyuncu fotoğrafı ve maç yayın görüntüsü kullanılmaz.
- **Taklit yok:** Kreatif bir kulübün, ligin veya yayıncının resmî hesabı ya da duyurusu gibi görünmez. "Resmî", "lisanslı", "onaylı", "partner" denmez. Hesap adı, kullanıcı adı ve hashtag'ler marka adı içermez (ör. `@skorplus_nba` olmaz).
- **Adlar yalnız betimleyici metin olarak:** "NBA", lig ve takım adları yalnız içeriği betimlemek için düz metinle yazılabilir. Örnek: "NBA maçlarının box score'u Türkçe arayüzde". Ad başlıkta marka/slogan gibi büyütülmez ve logo yerine stilize edilmez.
- **Ücretli reklamda daha sıkı:** Ücretli kreatiflerde takım/kulüp adı geçmez. Lig adı yalnız gövde metninde, betimleyici olarak geçer. Başlıkta "gece basketbolu", "Avrupa gecesi", "derbi akşamı" gibi genel ifadeler kullanılır. ⚠ doğrulanmalı: Meta ve TikTok reklam politikalarının üçüncü taraf ticari markası içeren reklam metnine yaklaşımı.
- **Temsilî ekran seçeneği:** Logosuz, temiz bir arayüz demosu gerekirse geliştirme build'indeki örnek veri modu kullanılabilir (kurgusal takımlar, ör. `e2e/shots` ekranları). Bu durumda köşeye **"Temsilî ekran · örnek veri"** yazılır. Bu ekranlar gerçek maç sonucu veya gerçek AI çıktısı gibi sunulmaz.
- **Sabit dipnot** (kreatifte yer varsa kreatifte, her zaman açıklama metninde): "Skor+ bağımsız bir uygulamadır; hiçbir lig, kulüp veya federasyonla bağlantılı değildir."

### 7.3 Üç yeni kısa video (TikTok / Reels / Shorts)

Ortak kurallar:
- 2.2'deki üretim kuralları geçerli: 9:16, altyazı açık, ticari kullanıma uygun ses, maç görüntüsü yok.
- 7.2 geçerli: logolar bulanık.
- Köşeli parantezli alanlar gerçek maçtan ve uygulamanın gerçek çıktısından doldurulur.
- Pro özellik gösteriliyorsa ekranda küçük ve sürekli bir **"Pro · yakında"** etiketi durur.
- AI çıktısı test hesabında üretilmiş gerçek çıktıdır. Metin düzeltilmez. Kısaltılırken anlamı değiştirilmez.

**Video N1 — "Gece maçı, sabah kutu skoru" (NBA, 25 sn)**
Hedef: S3 (NBA / basketbol takipçisi). Ana mesaj: Box score ücretsiz, Türkçe analiz Pro'da yakında.

| Saniye | Sahne | Ekran yazısı | Seslendirme |
|---|---|---|---|
| 0-3 | Sabah saati görünen kilit ekranı (ör. 08:10) | "Gece basketbol vardı. Sen uyudun." | "Gece maç vardı, sen uyudun." |
| 3-7 | Skor+ ana ekranı, "Dün" sekmesi, biten maç satırı (logolar bulanık) | "Skor hazır." | "Skor hazır." |
| 7-14 | Maç ekranı, "Box Score" sekmesi: iki takım tablosu alt alta; yatay kaydırma ile FG%, 3P%, +/- sütunları; en skorer oyuncu vurgulu | "Tam kutu skoru: FG%, 3P%, ribaund, +/-" | "İki takımın tam kutu skoru, alt alta." |
| 14-17 | TOPLAM satırına yakınlaştırma | "Takım toplamı tek satırda." | — |
| 17-23 | "AI Taktik" sekmesi: maç sonu Türkçe analizden 1 cümle vurgulu; köşede "Pro · yakında" | "[Analizden gerçek 1 cümle, ör. kırılma periyodu]" | "Maçın neden öyle bittiğini Türkçe anlatıyor. Bu kısım Pro'da, yakında." |
| 23-25 | Kapanış kartı + QR | "Box score ücretsiz. APK'yı indir." | "Bağlantı profilde." |

- Açıklama metni: "Biten NBA maçlarının box score'u ücretsiz. Maç sonu Türkçe taktik analiz Pro'da, yakında. Skor+ bağımsız bir uygulamadır. APK: [kısa-bağlantı]?utm_source=tiktok&utm_campaign=n1"
- Dikkat: Box score yalnız biten maçlarda var. "Canlı" denmez. Oyuncu adları ekranda kalabilir; oyuncu fotoğrafı eklenmez.

**Video N2 — "15 dakikalık soyunma odası" (futbol devre arası, 20 sn)**
Hedef: S1 (taktik/veri meraklısı). Ana mesaj: Devre arasında ikinci yarı için somut hamleler.

| Saniye | Sahne | Ekran yazısı | Seslendirme |
|---|---|---|---|
| 0-3 | Maç ekranı, skor + yeşil "İY" rozeti (logolar bulanık) | "Devre arası. [skor]." | "Devre arası." |
| 3-6 | Siyah geçiş | "Soyunma odasında ne konuşuluyor?" | "Soyunma odasında ne konuşuluyor?" |
| 6-12 | "AI Taktik" sekmesi: "SOYUNMA ODASI REÇETESİ" rozeti, başlık ve ilk yarı özeti | "[Raporun gerçek başlığı]" | "[Raporun ilk yarı özeti, sade dille]" |
| 12-17 | "İkinci yarıda ne olmalı? — Hamleler" kartları aşağı kaydırılır | "[Gerçek hamle 1] / [Gerçek hamle 2]" | "İkinci yarı için iki hamle." |
| 17-20 | Kapanış kartı + QR, köşede "Pro · yakında" | "Devre arası raporu: Pro'da, yakında. Uygulama ücretsiz: APK'yı indir." | "Bağlantı profilde." |

- Kural: Video ikinci yarıdan sonra yayınlanırsa yalnız "tuttu" vakaları seçilmez. Rapor "tahmin" değil "öneri" olarak sunulur. "Bu hamle yapıldı ve gol geldi" türünde sebep-sonuç iddiası kurulmaz.
- Ücretli sürümde takım adları ses ve yazıdan çıkarılır; skor kalır (7.2).

**Video N3 — "Maça soru sor" (taktik asistan, 25 sn)**
Hedef: S1 + S3. Ana mesaj: Yanıt genel internetten değil, yalnız o maçın verisinden gelir.

| Saniye | Sahne | Ekran yazısı | Seslendirme |
|---|---|---|---|
| 0-3 | Biten maç ekranı, skor | "Maç bitti. Bir sorum var." | "Maç bitti, aklımda bir soru var." |
| 3-9 | "Taktik asistana sor" kutusu; öneri çipine dokunma: "Maçın kırılma anı neydi?" | "Maçın kırılma anı neydi?" | — |
| 9-14 | Gerçek yanıt balonu | "[Gerçek yanıt]" | "[Yanıtın ilk cümlesi]" |
| 14-19 | İkinci soru (futbolda "Teknik direktör hamleleri işe yaradı mı?", NBA'de uygulamadaki basketbol önerisi) ve "Yorumum: …" ile başlayan gerçek yanıt | "Yorumsa, yorum olduğunu söylüyor." | "Yorumsa, yorum olduğunu söylüyor." |
| 19-22 | Alt not yakın plan: "Yanıtlar yalnız bu maçın verisine dayanır." ve soru sayacı | "Maç başına 3 soru. Sadece bu maçın verisi." | "Maç başına üç soru, sadece bu maçın verisi." |
| 22-25 | Kapanış kartı + QR, köşede "Pro · yakında" | "Taktik asistan: Pro'da, yakında. APK'yı indir." | "Bağlantı profilde." |

- Dikkat: `e2e/shots/c1-sohbet.png` içindeki "Önizleme modundasın…" yanıtı videoda **gösterilmez**. Bu bir geliştirme ekranıdır. Kayıt test hesabında, gerçek bir maçta yapılır.
- Yanıtta hata veya yazım bozukluğu varsa o çekim kullanılmaz. Metin düzeltilip gerçekmiş gibi gösterilmez.
- "Yorumum:" ile başlayan bir yanıt çekimde yoksa 14-19 sn sahnesi çıkarılır. Video 20 sn'ye iner.

### 7.4 Beş statik gönderi / hikâye metni

Ortak kurallar:
- Görsel: gerçek ekran görüntüsü (logolar bulanık) veya "Temsilî ekran · örnek veri" etiketli demo ekranı.
- CTA her zaman tek: **"APK'yı indir"**. Altında `[QR: indirme-sayfası?utm_source=…&utm_campaign=…]` ve `[kısa-bağlantı]`.
- Hikâye formatında QR yerine bağlantı çıkartması kullanılır.
- Ölçü: gönderi 4:5, hikâye 9:16.
- Her açıklamada 7.2'deki bağımsızlık dipnotu yer alır.

**S1 — Box score (ücretsiz, NBA)**
- Başlık: **"Gece maçının tam kutu skoru, sabah kahvenle."**
- Gövde: "İki takım alt alta. FG%, 3P%, ribaund, asist, +/-. Biten her NBA maçında, Türkçe arayüzde, ücretsiz."
- CTA: **APK'yı indir** · [QR] · [kısa-bağlantı]
- Görsel: Box score sekmesi, TOPLAM satırı görünür.

**S2 — Maç sonu analiz (Pro · yakında)**
- Başlık: **"Skor değil, sebebi."**
- Gövde: "Maç bitince Türkçe taktik analiz: maçın nerede kırıldığını gör. Basketbolda basketbol diliyle. Analiz Pro'da, yakında. Canlı skor ve takım takibi bugünden ücretsiz."
- CTA: **APK'yı indir** · [QR] · [kısa-bağlantı]
- Görsel: Gerçek maç sonu analiz ekranı, köşede "Pro · yakında".

**S3 — Devre arası raporu (Pro · yakında)**
- Başlık: **"Devre arası 15 dakika. İkinci yarı için hamleler hazır."**
- Gövde: "Soyunma Odası Reçetesi: ilk yarının özeti ve ikinci yarı için somut hamleler. Tahmin değil, ilk yarının verisinden okuma. Pro'da, yakında."
- CTA: **APK'yı indir** · [QR] · [kısa-bağlantı]
- Görsel: "SOYUNMA ODASI REÇETESİ" rozeti ve "Hamleler" kartı.

**S4 — Takım takibi (ücretsiz)**
- Başlık: **"Bir takım. Bir bildirim. Yeter."**
- Gövde: "Takımını seç. Maçı başladığında haber gelsin. Dün, bugün, yarın tek ekranda. Futbol ve NBA, Türkçe ve ücretsiz."
- CTA: **APK'yı indir** · [QR] · [kısa-bağlantı]
- Görsel: "Takip et" düğmesi ve gerçek "Maç başladı" bildirimi (kilit ekranı).

**S5 — Taktik asistan (Pro · yakında)**
- Başlık: **"Maça soru sor. Cevap maçın kendi verisinden."**
- Gövde: "Maçın kırılma anı neydi? Hamleler işe yaradı mı? Maç başına 3 soru. Yanıt yalnız o maçın verisine dayanır; yorumsa yorum olduğunu söyler. Pro'da, yakında."
- CTA: **APK'yı indir** · [QR] · [kısa-bağlantı]
- Görsel: Sohbet kutusu, soru sayacı ve alt not görünür.

> APK güven notu (hikâye son karesi veya ilk yorum): "Play Store'da henüz değil. İndirme sayfasında SHA-256 özeti ve tarama bağlantısı var." Bu not 2.7'deki güven bölümüne bağlanır.

### 7.5 Sıfır bütçe organik plan (2 hafta, günde ~45-60 dk)

Ritim:
- NBA maçları Türkiye saatiyle gece veya sabaha karşı biter. NBA içeriği **sabah 07:30-09:30** arasında paylaşılır.
- Futbolda devre arası raporu maç sırasında kaydedilir. Video **maç bitiminden sonra 1-2 saat** içinde paylaşılır.
- Avrupa gecesi ve hafta sonu Süper Lig en yoğun pencerelerdir.

| Gün | İş | Kanal | UTM kampanyası |
|---|---|---|---|
| 1 | İndirme sayfasına kanal başına kısa bağlantılar ve sayaç (7.7), bio bağlantıları, 7.2 dipnotu | Tümü | — |
| 2-3 | Video N1'i bir gece maçından çek, sabah paylaş | TikTok + Reels + Shorts (aynı video) | `n1` |
| 3 | Statik S1 (box score) | Instagram gönderi + hikâye, X | `s1` |
| 4-5 | Hafta içi Avrupa maçında devre arası raporunu kaydet; Video N2 | Kısa video + X (rapor ekranı + 2 cümle) | `n2` |
| 6 | Statik S4 (takım takibi); izin alınmış Telegram/Discord grupları (2.6 izin mesajı) | Telegram, Discord | `s4` |
| 7 | Haftalık gözden geçirme: kanal başına tıklama, indirme ve yeni hesap sayısı (7.7) | — | — |
| 8-9 | Video N3 (asistan sohbeti), NBA veya futbol | Kısa video | `n3` |
| 10 | Statik S2 + S5, carousel olarak (2.3 formatı) | Instagram | `s2`, `s5` |
| 11 | Reddit veya Ekşi: bilgilendirici tek içerik, 2.4/2.5 kurallarıyla (ayda en fazla 1) | Reddit veya Ekşi | `reddit` / `eksi` |
| 12-13 | Hafta sonu maçında Video N2'yi başka bir maçla tekrar çek; S3 hikâyesi | Kısa video, hikâye | `n2b`, `s3` |
| 14 | Sonuç tablosu: en çok yeni hesap getiren 2 içerik seçilir ve 7.6 için aday olur | — | — |

Organik kurallar:
- Aynı video üç platforma gider. Açıklama ve UTM platforma göre değişir.
- Yorumlara geliştirici kendi adıyla cevap verir ("Bu uygulamayı ben geliştiriyorum"). Başka hesaplardan övgü yazılmaz.
- Rakip uygulamanın adı ve ekranı gösterilmez.

### 7.6 Küçük ücretli test planı (₺1000–3000)

> Önce 5.1'e bak: Play Console kayıt ücreti karşılanmadıysa bütçenin bir kısmını oraya ayırmak daha kalıcı etki verebilir. ⚠ doğrulanmalı: güncel kayıt ücreti ve kur.

**Neden "trafik" hedefi:** Uygulama mağazada değil. "Uygulama yükleme" kampanya hedefi genelde mağaza bağlantısı ister (⚠ doğrulanmalı). Reklam doğrudan `.apk` dosyasına değil, **indirme sayfasına** gider. Kampanya hedefi: bağlantı tıklaması veya açılış sayfası görüntüleme. ⚠ doğrulanmalı: Meta ve TikTok'un harici APK indirme sayfasına giden reklamlar için politikası, minimum günlük bütçe, Türkiye fatura/vergi koşulları.

**Kreatif:** Yalnız 7.5'te organik olarak en iyi giden 2-3 içerik kullanılır. Sıfırdan reklam üretilmez. Ücretli kreatiflerde takım/kulüp adı yoktur ve logolar bulanıktır (7.2).

| Bütçe | Yapı | Süre |
|---|---|---|
| **₺1000** | Tek platform: Meta (Instagram Reels + Hikâye). 2 kreatif × ₺350 test, kalan ₺300 kazanana | 7 gün test + 3 gün kazanan |
| **₺2000** | Meta ₺1400 (3 kreatif) + TikTok ₺600 (organikte en iyi giden 1 video) | 7 gün test + 7 gün kazanan |
| **₺3000** | Meta ₺1800 (3 kreatif: N1, N2 veya N3, S4) + TikTok ₺900 + ₺300 yedek (kazanana veya NBA sabah penceresine) | 7 gün test + 7 gün kazanan |

**Hedefleme:**
- Konum: Türkiye. Dil: Türkçe. Yaş: 18-34. İkinci aşamada 35-44 için ayrı reklam seti.
- Cihaz: **yalnız Android**. APK iOS'ta çalışmaz. Platform destekliyorsa işletim sistemi hedefi kullanılır.
- İlgi alanları: futbol, basketbol, NBA, spor istatistikleri, fantezi spor.
- Ayrı reklam seti: basketbol ilgisi + sabah 07:00-10:00 gösterimi (Video N1, S1).
- **Hariç tutma:** bahis, şans oyunları, iddaa ve kumar ilgi alanları (platform izin veriyorsa). Reklam metni 0. bölümdeki kontrol listesinden geçer.
- Zamanlama: futbolda maçtan 2-3 saat önce ve maç bitiminden sonraki 3 saat; NBA'de sabah.
- Yerleşim: Reels, Hikâye ve TikTok akışı. Masaüstü yerleşimleri kapalı.

**Durdurma ve karar kuralları:**
- 3. gün: Bir kreatifin sayfa ziyareti başı maliyeti diğerlerinin yaklaşık 2 katıysa o kreatif kapatılır.
- 7. gün: Hiç APK indirmesi gelmediyse test durur ve kalan bütçe saklanır. Bu durumda sorun büyük olasılıkla reklamda değil, indirme sayfasının güven bölümündedir (2.7).
- Karar metriği **yeni hesap başı maliyet**tir (7.7). Beğeni ve izlenme karar metriği değildir.
- Sonuçlar gerçek sayılarla tabloya yazılır. Hedef sayı uydurulmaz. İlk test, sonraki testler için referanstır.

### 7.7 APK kurulumu nasıl ölçülür?

Play Store olmadığı için mağaza yönlendirme verisi (install referrer) yoktur. Ölçüm dört katmanda yapılır: **tıklama → sayfa ziyareti → APK indirme → ilk açılış (yeni hesap)**.

1. **UTM'li bağlantılar (ziyaret):** Her kanal ve her kreatif için ayrı bağlantı kullanılır. Örnek: `[indirme-sayfası]/?utm_source=tiktok&utm_medium=video&utm_campaign=n1`. Ücretli reklamda `utm_medium=paid`. Sayfadaki gizlilik dostu ücretsiz analitik (GoatCounter veya Cloudflare Web Analytics; ⚠ ücretsiz katman doğrulanmalı) ziyaretleri kaynağa göre sayar. Sayfa çerez kullanıyorsa KVKK metni güncellenir.
2. **Kanal başına bağlantı sayacı (indirme tıklaması):** "APK'yı indir" düğmesi doğrudan dosyaya gitmez. Kanal etiketli bir yönlendirme yoluna gider: `[indirme-sayfası]/dl?src=tiktok-n1`. Bu yol tıklamayı sayar ve sonra APK'ya yönlendirir. Sayfa, gelen UTM değerini düğmenin `src` değerine aktarır. Ücretsiz seçenekler: analitik aracının olay sayımı (ör. GoatCounter event) veya ücretsiz katmanlı bir kısa bağlantı servisi. ⚠ doğrulanmalı: servisin ücretsiz limitleri ve gizlilik koşulları.
3. **Kanal başına APK dosyası (gerçek indirme):** Aynı APK, GitHub Releases'a kanal adıyla birden çok kez yüklenebilir: `skorplus-1.x-tiktok.apk`, `skorplus-1.x-instagram.apk`, `skorplus-1.x-site.apk`. GitHub her dosyanın indirme sayısını ayrı tutar (Releases API, `download_count`). Dosyalar bit bit aynıdır. SHA-256 özeti de aynıdır; sayfada tek özet yazılır. Not: Drive gibi başka barındırmalarda dosya başına sayaç güvenilir olmayabilir.
4. **İlk açılış (gerçek kurulum):** Uygulama ilk açılışta anonim hesap açar (3.21). Supabase'de günlük yeni anonim hesap sayısı, kurulup **açılan** uygulama sayısının en yakın göstergesidir. Kampanya günleri, kampanya öncesi 7 günle karşılaştırılır. Yeni hesap / APK indirme oranı, "bilinmeyen kaynak" uyarısında kaybedilen kullanıcıyı gösterir. Not: Hesap silme sonrası açılan yeni anonim hesap da sayılır; bu küçük bir sapmadır.
5. **Aktivasyon ve tutma:** Takım takip eden yeni hesap oranı ve D7 tutma (son açılış zamanı). Ayrıntı 5.3'teki tabloda.

| Katman | Kaynak | Kanal ayrımı |
|---|---|---|
| Tıklama | Reklam paneli / platform analitiği | Kreatif bazında |
| Sayfa ziyareti | GoatCounter / Cloudflare + UTM | Kanal ve kreatif |
| İndirme tıklaması | `/dl?src=` sayacı | Kanal ve kreatif |
| APK indirme | GitHub Releases, dosya başına `download_count` | Kanal (dosya adı) |
| Kurulum + ilk açılış | Supabase, günlük yeni anonim hesap sayısı | Yalnız zaman bazında; kanal ayrımı yok |

> Geliştiriciye not (kod değişikliği yapılmadı, yalnız fikir): Kurulumu kanala bağlamak için ilk açılışta tek soruluk, atlanabilir bir "Bizi nereden duydun?" ekranı düşünülebilir. Bu ekran bugün uygulamada **yoktur**. Reklamda veya raporda varmış gibi anılmaz.

**Paylaşım kuralı:** "X kişi indirdi" gibi bir sayı yalnız ölçülen gerçek değerle ve ölçüm kaynağıyla paylaşılır. İndirme sayısı "kullanıcı sayısı" diye sunulmaz.
