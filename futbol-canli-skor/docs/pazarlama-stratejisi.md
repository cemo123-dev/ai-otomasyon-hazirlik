# Skor+ — Sıfır Bütçe Pazarlama Stratejisi (Türkiye)

> Hazırlanma tarihi: 17 Kasım 2026. Bütçe: ~0 TL (en fazla birkaç yüz TL). Ekip: tek geliştirici.
> **İşaret kuralı:** "⚠ doğrulanmalı" yazan her madde, platform kuralı / tarih / ücret gibi güncel bilgi içerir. Uygulamadan önce resmî kaynaktan kontrol edilmeli. Bu belgede uydurma istatistik yoktur. Hedef rakamlar "hedef"tir, tahmin değildir.

---

## 0. Durum özeti ve temel kararlar

**Gerçekler:**
- Ücretsiz katman bugün çalışıyor: canlı skor, Türkçe takım adları, logolar, takım/maç takibi, "maç başladı" bildirimi.
- Pro satışta değil. Pazarlamanın asıl farkı (AI analiz) şu an satılamıyor.
- Dağıtım APK. Kullanıcı "bilinmeyen kaynak" uyarısıyla karşılaşıyor. Bu, dönüşümün önündeki en büyük engel.

**Üç stratejik karar:**
1. **Ücretsiz ürünü pazarla, Pro'yu "erken erişim / bekleme listesi" olarak göster.** Hiçbir yerde "Pro'yu şimdi satın al" deme. Satılamayan şeyi vaat etmek güveni bozar.
2. **AI analiz çıktısını uygulamanın dışına taşı.** Pro satılamıyorsa bile Pro'nun ürettiği içerik (devre arası raporu, baskı alarmı metni) sosyal medyada "ücretsiz örnek" olarak paylaşılabilir. Bu hem içerik üretim maliyetini sıfırlar hem de Pro talebini ölçer.
3. **Play Store'a geçiş birinci büyüme hedefidir.** APK ile büyüme tavanı düşüktür. İlk 30 günün asıl hedefi: güvenilirlik kanıtı + Play Store kapalı test için yeterli test kullanıcısı + 25 $.

> Dürüst not: 25 $ tek seferlik bir ücret. Kanallara harcanacak emekle kıyaslandığında, sahibinin bu ücreti kendi cebinden ödemesi en hızlı yol olabilir. Aşağıdaki "25 $'ı kazanma" planı, bu seçenek yoksa veya topluluk desteği bir doğrulama sinyali olarak isteniyorsa uygulanır.

---

## 1. Hedef kitle segmentleri (öncelik sırasıyla)

### S1 — "Taktik/veri meraklısı" futbol takipçisi (birincil)
- **Kim:** xG, pas haritası, taktik analiz paylaşan X hesaplarını takip eden; Reddit r/superlig, Ekşi Sözlük'te maç başlıklarına yazan; 18-35 yaş, Android ağırlıklı.
- **Neden önce:** Pro'nun asıl hedefi. APK kurmaya teknik olarak en yatkın kitle. Paylaşım eğilimi yüksek, erken benimseyici.
- **Mesaj:** "Skoru herkes görür, nedenini sen gör. Maç bitince xG, momentum ve teknik direktör hamleleri — Türkçe, sade."
- **Kanıt biçimi:** Gerçek bir maçın devre arası raporu ekran görüntüsü.

### S2 — Bildirim yorgunu, tek takım taraftarı
- **Kim:** Kendi takımını (çoğunlukla Galatasaray, Fenerbahçe, Beşiktaş, Trabzonspor) takip eden; mevcut skor uygulamalarının reklamlı ve gürültülü bildirimlerinden sıkılmış kullanıcı.
- **Mesaj:** "Sadece senin takımın. Sadece önemli an. Reklam yok, gürültü yok." (Uygulamada reklam olmadığı doğrulanmalı; varsa bu iddia kullanılmaz.)
- **Kanıt biçimi:** Takım takibi + "maç başladı" bildirimi kısa ekran kaydı.

### S3 — NBA ve Alperen Şengün takipçisi
- **Kim:** Gece/sabah NBA maçlarını takip eden Türk basketbol izleyicisi. Türkçe NBA kaynağı az olduğu için niş ama bağlılığı yüksek.
- **Mesaj:** "Alperen sahadayken haberin olsun. NBA canlı skor, Türkçe." Pro için: "NBA seri alarmı: maç kopuyor mu, dönüyor mu?"
- ⚠ doğrulanmalı: Alperen Şengün'ün güncel takımı, sakatlık durumu ve maç takvimi.

### S4 — Avrupa gecesi ve milli maç izleyicisi (geniş kitle, düşük öncelik)
- **Kim:** Sadece büyük maçlarda (Şampiyonlar Ligi, Avrupa Ligi, Konferans Ligi'nde Türk takımları; milli maçlar) skor uygulaması açan kullanıcı.
- **Mesaj:** "Avrupa gecesinde tüm Türk takımları tek ekranda, Türkçe."
- **Not:** Bu kitle büyük ama sadakati düşük. Sadece maç günü içerikleriyle hedeflenir.

### S5 — Futbol içerik üreticileri (çarpan segment)
- **Kim:** Küçük/orta ölçekli YouTube, X, TikTok futbol yorumcuları; taraftar Telegram/Discord yöneticileri.
- **Mesaj:** "İçeriğin için hazır, Türkçe maç verisi ve taktik özet. Ücretsiz kullan, kaynak göster yeter."
- **Neden:** Tek bir üretici ilişkisi, onlarca bireysel paylaşımdan değerli olabilir.

---

## 2. Sıfır TL kanallar

Genel kurallar (tüm kanallar):
- Önce katkı, sonra tanıtım. Kabaca 4 değerli paylaşım : 1 uygulama bağlantısı oranı hedeflenir (bu bir sektör alışkanlığıdır, platform kuralı değildir).
- Tek kişi, tek gerçek hesap. Geliştirici olduğunu her tanıtım paylaşımında açıkça söyle ("Bu uygulamayı ben geliştiriyorum").
- **Yasak taktikler (asla):** sahte hesap, bot, satın alınmış takipçi/beğeni, kendi uygulamasına sahte yorum, başkası gibi yazmak, toplu DM spam'i, aynı metni onlarca gruba yapıştırmak.
- Kulüp logoları ve lig markaları **pazarlama görsellerinde kullanılmaz** (uygulama içi kullanım ayrı bir hukuki konudur, ⚠ doğrulanmalı). Görsellerde uygulama arayüzü bulanık/küçük logo ile gösterilebilir, ama öne çıkan görsel kulüp markası olmamalı.
- Bahisle ilişkilendirme yok. "Tahmin", "kupon", "kesin gol", "oran" kelimeleri kullanılmaz. Türkiye'de yasa dışı bahis reklamı ciddi hukuki risk taşır ve platformlar bu içeriği hızla kaldırır.

### 2.1 Reddit — r/superlig (ve r/soccer, r/nba, r/Turkey ikincil)
- **Ne:** (a) Bir kez "Kendi geliştirdiğim Türkçe canlı skor uygulaması, geri bildirim arıyorum" tarzı şeffaf tanıtım; (b) düzenli olarak bağlantısız, değerli içerik: büyük maç sonrası xG/momentum özeti (metin + görsel).
- **Nasıl:** Önce 2-3 hafta maç başlıklarında normal kullanıcı olarak yorum yap. Tanıtım gönderisinde ekran görüntüleri, açık kaynak/güvenlik açıklaması, geri bildirim formu bulunsun.
- **Sıklık:** Tanıtım gönderisi en fazla ayda 1. Değer içeriği haftada 1-2.
- **Dikkat:** ⚠ doğrulanmalı: r/superlig'in self-promotion kuralı ve flair zorunluluğu. Gönderiden önce moderatörlere modmail ile "uygulamamı paylaşmamda sakınca var mı" diye sor. Reddit genelinde kendi içeriğini aşırı paylaşmak spam sayılır. r/soccer'da uygulama tanıtımı büyük olasılıkla yasaktır (⚠ doğrulanmalı); orada sadece veri/analiz içeriği, bağlantısız.

### 2.2 Ekşi Sözlük
- **Ne:** "skor+" başlığı açmak yerine, var olan "canlı skor uygulaması", "en iyi maç sonucu uygulaması" gibi başlıklara bilgilendirici entry. Maç başlıklarına uygulamanın ürettiği analizden yararlanan ama kendisi değerli bir yorum.
- **Nasıl:** Geliştirici olduğunu entry içinde belirt. Bağlantıyı sade ver. Abartılı övgü yazma.
- **Sıklık:** Ayda 1-2 entry. Aynı entry'yi kopyalama.
- **Dikkat:** ⚠ doğrulanmalı: Ekşi Sözlük kurallarında reklam/tanıtım entry'leri silinme ve yazar cezası sebebidir. Çaylak hesabın entry'leri görünür olmayabilir. Kendi ürününe övgü entry'si yazmak veya başkasına yazdırmak kesinlikle yapılmaz.

### 2.3 X (Twitter) — futbol veri ve taktik topluluğu
- **Ne:** Skor+ hesabı açılır (veya geliştiricinin kişisel hesabı kullanılır; kişisel hesap güven açısından daha iyidir). İçerik: devre arası raporu kartı, maç sonu "3 maddede neden kazandı", baskı alarmı örneği.
- **Nasıl:** Büyük futbol veri hesaplarının tweetlerine **değer katan** yanıtlar ver (kendi analiz kartınla). Bağlantıyı yanıtlara değil profile/bio'ya koy. Maç sırasında tek bir canlı thread aç, gelişmeleri ona ekle.
- **Sıklık:** Maç günleri 2-4 paylaşım, diğer günler 1. Haftada 1 "bu haftanın en ilginç verisi" thread'i.
- **Dikkat:** X'te otomatik yanıt, toplu etiketleme ve otomatik takip/takipten çıkma yasaktır (⚠ doğrulanmalı: güncel otomasyon kuralları). Bağlantılı gönderilerin erişiminin düşürüldüğü iddiası yaygındır ama resmî değildir (⚠ doğrulanmalı); bağlantıyı ilk yanıtta vermek test edilebilir.

### 2.4 Telegram ve Discord taraftar grupları
- **Ne:** Grup yöneticisiyle **önce özel konuşma**: "Grubunuz için maç günü Türkçe devre arası özeti paylaşabilir miyim? İsterseniz bağlantı vermem." Kabul eden gruplara düzenli, değerli özet.
- **Nasıl:** Yönetici izni olmadan hiçbir gruba bağlantı atılmaz. Discord'da futbol/NBA sunucularının #kendi-projeni-tanıt tarzı kanalları varsa sadece orası kullanılır.
- **Sıklık:** Kabul eden grup başına maç günü 1 özet.
- **Dikkat:** İzinsiz paylaşım = ban + itibar kaybı. Bahis içerikli Telegram gruplarından uzak durulur (marka güvenliği).
- Opsiyonel: Skor+'ın kendi Telegram kanalı. Uygulamanın AI raporlarını buraya otomatik değil, elle seçilmiş olarak koy. Kanal sahiplenme ve APK güncelleme duyurusu için de kullanılır.

### 2.5 TikTok / Instagram Reels / YouTube Shorts (tek video, üç platform)
- **Ne (formatlar):**
  1. "Skoru herkes gördü, işte nedeni" — 20-30 sn. Ekranda maç sonucu, ardından 3 kısa neden (AI analizinden). Seslendirme veya metin.
  2. "Bu bildirim 5 dakika önce geldi" — baskı alarmı ekran kaydı, ardından golün gerçekleştiği bilgisi. ⚠ Sadece gerçekten olmuş vakalar kullanılır, kurgu yok.
  3. "Uygulamayı ben yaptım" geliştirici günlüğü — tek kişilik geliştirme hikâyesi. Bu tür içerik Türkiye'de güven inşa etmede güçlüdür.
- **Nasıl:** Telefon ekran kaydı + CapCut (ücretsiz sürüm, ⚠ doğrulanmalı: filigran/lisans durumu) veya benzeri ücretsiz editör. Maç görüntüsü **kullanılmaz** (telif; yayın hakkı sahipleri hızla kaldırtır). Sadece uygulama arayüzü, metin, grafik.
- **Sıklık:** Haftada 3 video, aynı video üç platforma yüklenir. Büyük maçtan sonraki 2-3 saat içinde yayın.
- **Dikkat:** Platformlarda APK bağlantısı riskli olabilir; bio bağlantısı olarak indirme sayfası verilir (⚠ doğrulanmalı: TikTok bio bağlantısı için gereken takipçi eşiği). Müzik için platformun ticari kullanım kütüphanesi seçilir.

### 2.6 YouTube (uzun format, ikincil)
- **Ne:** Ayda 1 "Haftanın taktik özeti" ekran kaydı (5-8 dk). Düşük öncelik; sadece Shorts iyi giderse.

### 2.7 Instagram (statik)
- **Ne:** Carousel: "Derbinin 5 kırılma anı" (AI raporundan). Hikâyelerde maç günü anket ("Devre arası kim değişiklik yapmalı?").
- **Sıklık:** Haftada 2 carousel.

### 2.8 Futbol forumları ve diğer
- Technopat Sosyal, DonanımHaber gibi teknoloji forumlarının "Android uygulama" bölümleri: geliştirici olarak tanıtım ve geri bildirim isteği (⚠ doğrulanmalı: forumların kendi uygulamanı tanıtma alt başlığı ve kuralları). Bu kitle APK kurmaktan çekinmez; S1 için uygundur.
- Hacker News "Show HN" veya Product Hunt: Türkçe uygulama olduğu için düşük getiri. Atlanır.
- Üniversite futbol/basketbol kulüpleri, e-posta bültenleri: S5 kapsamında, isteğe bağlı.

---

## 3. APK güven sorunu ve Play Store yol haritası

### 3.1 Ücretsiz indirme sayfası (tek sayfa, GitHub Pages veya benzeri ücretsiz statik barındırma)
İçerik sırası:
1. Başlık + tek cümle konum: "Skoru herkes görür, nedenini sen gör."
2. 4-6 gerçek ekran görüntüsü (sahte veri yok).
3. **Neden Play Store'da değil?** bölümü, dürüst dille: "Tek kişilik bir projeyim. Play Store'a geçiş için çalışıyorum. O zamana kadar APK'yı buradan dağıtıyorum."
4. **Güvenlik kanıtları:**
   - APK'nın SHA-256 özeti (her sürüm için).
   - VirusTotal tarama sonucu bağlantısı (her sürüm için yeniden).
   - İstenen izinlerin listesi ve **her iznin neden gerektiği** (ör. bildirim izni: maç başladı bildirimi için).
   - Toplanan veri: ne toplanıyor, ne toplanmıyor. Gizlilik politikası sayfası (Play Store için zaten zorunlu olacak).
   - Tüm sürümlerin aynı imza anahtarıyla imzalandığı bilgisi.
5. **Adım adım kurulum** (ekran görüntüsüyle): "Bilinmeyen kaynaklar" izninin nasıl verildiği ve kurulumdan sonra nasıl geri kapatılabileceği.
6. **SSS:**
   - "Bu uyarı neden çıkıyor?" — Android, Play Store dışındaki her uygulama için uyarı gösterir. Bu uyarı uygulamanın zararlı olduğu anlamına gelmez, kaynağın Google tarafından incelenmediği anlamına gelir.
   - "Güncellemeleri nasıl alırım?" — Uygulama içi güncelleme/duyuru mekanizması ve Telegram kanalı. (expo-updates ile OTA güncelleme varsa açıklanır; ⚠ teknik olarak doğrulanmalı.)
   - "Play Store'a gelince ne olacak?" — Geçiş planı ve verilerin taşınıp taşınmayacağı.
   - "Pro ne zaman?" — Bekleme listesi bağlantısı.
   - "Verilerim satılıyor mu?" — Net cevap.
7. Geri bildirim formu (Google Forms, ücretsiz) + bekleme listesi formu.

### 3.2 Şeffaflık seçenekleri
- **Açık kaynak (tam veya kısmi):** En güçlü güven sinyali. Ancak API anahtarları, veri sağlayıcı sözleşmesi ve ileride Pro gelirini koruma açısından riskli. Öneri: istemci kodunu açmak yerine "açık değişiklik günlüğü" (public changelog) ve açık bir issue takipçisi (GitHub Issues) kullan. Tam açık kaynak kararı geliştiriciye bırakılır.
- **Yüzü olan geliştirici:** Gerçek isim veya tutarlı bir geliştirici kimliği, kısa "ben kimim" metni. Anonim APK'ya güven çok düşüktür.
- **⚠ doğrulanmalı — kritik:** Google'ın Play dışı dağıtılan uygulamalar için geliştirici doğrulama (developer verification) zorunluluğu açıklanmıştı; bazı ülkelerde 2026'da, global olarak sonrasında yürürlüğe girmesi planlanıyordu. Türkiye'de ne zaman zorunlu olacağı ve doğrulanmamış geliştiricinin APK'sının sertifikalı Android cihazlarda kurulup kurulamayacağı hemen kontrol edilmeli. Bu zorunluluk geldiyse APK stratejisi ömrü kısalır ve Play Store geçişi acil hale gelir.

### 3.3 Alternatif ücretsiz mağazalar (ara çözüm)
- Samsung Galaxy Store, Huawei AppGallery, Uptodown, APKPure gibi mağazalar. ⚠ doğrulanmalı: her birinin geliştirici kayıt ücreti, Türkiye'den kabul durumu, inceleme süreci. Bunlar "bilinmeyen kaynak" uyarısını tamamen kaldırmaz ama "bir mağazada listelenmiş" sinyali verir.
- F-Droid: Sadece özgür yazılım ve kapalı kaynak bağımlılığı olmayan uygulamaları kabul eder; Expo + Firebase bildirimleri nedeniyle büyük olasılıkla uygun değil (⚠ doğrulanmalı).

### 3.4 Play Store'a geçiş: "25 $'ı kazanma" yol haritası
**Önemli ön bilgi (⚠ doğrulanmalı):** Yeni kişisel Play Console hesapları, üretime çıkmadan önce belirli sayıda test kullanıcısıyla belirli süre kapalı test yapmak zorunda (bilinen son kural: 12 test kullanıcısı, 14 gün kesintisiz). Ayrıca kimlik doğrulama gerekiyor. Bu, pazarlama için bir fırsattır: **ilk 30 günün topluluk hedefi, kapalı test için gönüllü bulmaktır.**

Adımlar:
1. **Bağış/destek sayfası** (1. hafta): "Skor+'ı Play Store'a taşıyalım" kampanyası. Hedef 25 $ + kur farkı (⚠ doğrulanmalı: güncel kur ve Google'ın Türkiye'den kabul ettiği ödeme yöntemi). Destek platformu seçeneği: Türkiye'den para çekmeye izin veren bir platform seçilmeli (⚠ doğrulanmalı: Buy Me a Coffee, Patreon, Ko-fi vb. platformların Türkiye'ye ödeme durumu; yerel alternatif olarak IBAN ile bağış da mümkündür ama vergi/yasal yükümlülük ⚠ doğrulanmalı).
2. **"Kurucu Destekçi" ödülü** (para karşılığı değil, teşekkür olarak): Pro çıktığında ilk X ay ücretsiz Pro, uygulama içinde "Kurucu Destekçi" rozeti, indirme sayfasında isim (izinli). Uyarı: Pro şu an satılamadığı için bu bir **teşekkür vaadidir**, satış değildir. Vaat edilen her şey yazılı olarak sınırlandırılır ve tutulabilir olmalı.
3. **Şeffaf ilerleme çubuğu**: İndirme sayfasında "Play Store hedefi: X / 25 $". Hedef dolunca bağış kapatılır, fazlası şeffafça açıklanır.
4. **Kapalı test gönüllüleri**: Bekleme listesindeki en aktif kullanıcılara "Play Store kapalı test ekibi" daveti. Gerekenden fazla gönüllü toplanır (bazıları 14 gün boyunca aktif kalmayabilir).
5. **Geçiş anı = ikinci lansman**: "Skor+ artık Play Store'da" duyurusu, tüm kanallarda en büyük tek paylaşım olur. APK kullanıcılarına uygulama içi geçiş bildirimi.
6. **Pro satışı**: Play Store'dan sonra. Ödeme altyapısı ve Google'ın abonelik politikaları (⚠ doğrulanmalı: Türkiye'de Play Billing komisyonu ve vergi) ayrıca planlanır.

---

## 4. Büyüme döngüleri

### 4.1 İçerik döngüsü: Uygulama çıktısı → paylaşılabilir kart → yeni kullanıcı
1. Uygulama her büyük maç için AI devre arası raporu ve maç sonu analizi üretir.
2. Geliştirici bunlardan en ilginç olanını seçer, **paylaşım kartına** dönüştürür (sabit şablon: Skor+ logosu, maç adı metin olarak, 3 madde, alt köşede "skorplus indirme sayfası" adresi).
3. Kart X, Instagram, Reddit, Telegram'da paylaşılır.
4. Yeni kullanıcı indirir, kendi takımını takip eder, bildirim alır.
5. **Ürün önerisi (geliştirici için, bu belgenin kapsamı dışında, kod değişikliği yapılmadı):** Uygulama içine "Paylaş" düğmesi eklenirse kartı kullanıcılar da üretir ve döngü kendiliğinden döner. Bu, en yüksek getirili tek ürün değişikliğidir.

### 4.2 Alarm döngüsü: "Bunu önceden söyledi" anları
- Baskı alarmı gerçekten golden önce geldiyse, ekran görüntüsü + saat damgası paylaşılır.
- **Kural:** Sadece gerçek vakalar. Alarmın gelip golün gelmediği vakalar da zaman zaman paylaşılır ("Alarm geldi, kaleci kurtardı"). Bu dürüstlük, "tahmin uygulaması" algısını önler ve bahisle ilişkilendirilmeyi engeller.
- Asla "gol tahmin eder" denmez. Doğru ifade: "baskıyı veriyle gösterir".

### 4.3 Maç günü takvimi (içerik planlama iskeleti)
Tarihler ⚠ doğrulanmalı (fikstürler, ertelemeler, yayın saatleri değişir). Kaynak: TFF, UEFA, NBA resmî fikstürleri.

| Olay türü | Ne zaman (genel) | İçerik |
|---|---|---|
| Süper Lig derbileri (GS-FB, FB-BJK, BJK-GS, TS ile maçlar) | Sezon boyunca, ⚠ fikstürden | Maç öncesi "Taktiksel Eşleşme" kartı (önceki gün), devre arası raporu (canlı), maç sonu 3 madde (2 saat içinde). En yüksek öncelik. |
| Avrupa gecesi (ŞL / UEL / UECL) | Salı-Perşembe akşamları, ⚠ UEFA takvimi | "Türk takımları bu gece" tek kart; maç sonu toplu özet. |
| Milli maç arası | ⚠ FIFA milli maç takvimi | Milli takım devre arası raporu. Geniş kitleye ulaşmak için en iyi an. 2026 Dünya Kupası tamamlandı; sonraki milli takvim ⚠ doğrulanmalı. |
| NBA — Alperen Şengün maçları | Türkiye saatiyle gece/sabah, ⚠ NBA fikstürü | Sabah "Gece ne oldu?" kartı (09:00 civarı, işe/okula giderken okunur). Seri alarmı örnekleri. |
| Avrupa büyük ligleri büyük maçları (El Clasico, Manchester derbisi vb.) | Hafta sonu | Sadece X ve Reddit'te veri içeriği; S1 için. |
| Sezon dönüm noktaları (devre arası, transfer dönemi) | Ara dönemler | Geliştirici günlüğü, ürün güncellemeleri, Play Store kampanyası ilerleme haberi. |

Haftalık ritim önerisi:
- **Pazartesi:** Hafta sonu özeti (en ilginç veri thread'i).
- **Salı-Perşembe:** Avrupa gecesi içerikleri.
- **Cuma:** Hafta sonu derbileri için "Taktiksel Eşleşme" ön izleme.
- **Cumartesi-Pazar:** Canlı devre arası içerikleri ve maç sonu kartları.
- **NBA:** Alperen maç sabahları, kısa kart.

---

## 5. 30 günlük uygulama takvimi

Varsayılan süre: **günde 45-60 dakika**, maç günlerinde **90 dakika** (tek kişi). Hafta içinde geliştirme işine engel olmaması için içerik üretimi "maç günü yığını" (batch) mantığıyla yapılır.

### 1. Hafta — Temel ve güven altyapısı (günde ~60 dk)
- G1: Konum cümlesi, tek paragraf "ben kimim" metni, paylaşım kartı şablonu (Canva ücretsiz veya Figma ücretsiz, ⚠ lisans kontrol).
- G2-G3: İndirme sayfası: ekran görüntüleri, SHA-256, VirusTotal, izin listesi, gizlilik politikası, SSS, kurulum adımları.
- G4: Google Forms ile geri bildirim + bekleme listesi + kapalı test gönüllüsü formu. Destek/bağış sayfası (platform Türkiye uyumluluğu doğrulandıktan sonra).
- G5: Hesaplar: X, Instagram, TikTok, YouTube, Telegram kanalı. Bio'lara indirme sayfası bağlantısı. Aynı kullanıcı adı.
- G6: Reddit r/superlig ve Ekşi Sözlük'te sadece okuma + normal katılım. r/superlig moderatörlerine modmail.
- G7: İlk 3 kısa video çekimi (geliştirici günlüğü + 2 uygulama demosu). İlk hafta sonu maçlarında canlı test: devre arası raporundan kart üretme süresini ölç.

### 2. Hafta — Yumuşak lansman (günde ~60 dk, maç günü 90 dk)
- Teknoloji forumlarında (Technopat/DonanımHaber vb.) "geliştirici olarak geri bildirim istiyorum" konusu.
- Reddit r/superlig şeffaf tanıtım gönderisi (moderatör onayı varsa).
- X'te her gün 1 paylaşım; maç günü canlı thread.
- 3 video (TikTok + Reels + Shorts'a aynı anda).
- 5 taraftar Telegram/Discord yöneticisine izin talebi (kişiselleştirilmiş, kopyala-yapıştır değil).
- Play Store kampanyası duyurusu: "Kurucu Destekçi" + kapalı test gönüllüsü çağrısı.

### 3. Hafta — İçerik döngüsü (günde ~45 dk, maç günü 90 dk)
- Her büyük maç için: ön izleme kartı + devre arası kartı + maç sonu kartı.
- Haftada 1 "haftanın verisi" X thread'i ve Reddit'te bağlantısız veri gönderisi.
- 3 video.
- 3-5 küçük futbol/NBA içerik üreticisine (S5) kişisel mesaj: "Analiz kartlarını kaynak göstererek kullanabilirsin."
- Ekşi Sözlük'te ilgili başlığa 1 bilgilendirici entry.
- Geri bildirimlerden en sık 3 şikâyeti listele, indirme sayfası SSS'ini güncelle.

### 4. Hafta — Ölç, sadeleştir, Play Store'a hazırlan (günde ~45 dk, maç günü 90 dk)
- Metrikleri (bkz. Bölüm 6) çıkar. En kötü performanslı 1-2 kanalı bırak; en iyisine süreyi kaydır.
- Bağış hedefi dolduysa Play Console hesabı açılır, kapalı test başlatılır (14 gün ⚠ doğrulanmalı). Dolmadıysa durum şeffafça paylaşılır.
- "İlk ay" geliştirici günlüğü videosu: kaç kişi denedi (gerçek sayı), neler öğrenildi, sırada ne var.
- 2. ayın planı: Play Store lansmanı + Pro bekleme listesine erken erişim.

---

## 6. Ölçüm — ücretsiz araçlarla 5 metrik

| # | Metrik | Ne ölçer | Araç (ücretsiz) | Not |
|---|---|---|---|---|
| 1 | **İndirme sayfası → APK indirme oranı** | Güven sorununun büyüklüğü | GitHub Releases indirme sayısı + sayfa ziyareti için gizlilik dostu ücretsiz analitik (ör. GoatCounter, Cloudflare Web Analytics; ⚠ ücretsiz katman doğrulanmalı) | Kanal bazında ayırmak için her kanalda farklı UTM parametresi kullan. |
| 2 | **Haftalık aktif kullanıcı (WAU) ve D7 tutma** | Ürün işe yarıyor mu | Uygulamanın kendi backend'i (ör. Supabase'deki cihaz/push token kayıtları) veya ücretsiz analitik SDK (⚠ doğrulanmalı) | Push token sayısı tek başına aktif kullanıcı değildir; son açılış zamanıyla birlikte ölçülmeli. |
| 3 | **Takım takibi yapan kullanıcı oranı** | Aktivasyon (bildirim değerine ulaşan kullanıcı) | Backend sorgusu | Takip etmeyen kullanıcı büyük olasılıkla geri dönmez. |
| 4 | **Pro bekleme listesi kayıt sayısı** | Pro talebi (satış yokken tek talep sinyali) | Google Forms | Kanal sorusu ekle: "Bizi nereden duydun?" |
| 5 | **Kanal başına paylaşım etkileşimi ve tıklama** | Hangi kanal işe yarıyor | Platformların kendi ücretsiz analitiği (X, Instagram, TikTok, YouTube Studio) + UTM | Beğeni değil, indirme sayfası tıklaması esas alınır. |

Haftalık 15 dakikalık bir tablo (Google Sheets) yeterli. Gerçek sayılar paylaşılırken yuvarlama veya şişirme yapılmaz.

---

## 7. Reklamcı ajan için özet brief

**Ürün:** Skor+ — Türkçe canlı skor + AI taktik analiz uygulaması. Android, şu an APK ile dağıtılıyor (Play Store'da değil). iOS yok.

**Ana konum (tagline):** "Skoru herkes görür, nedenini Pro üyeler görür."
Pro satışta olmadığı için kampanyada kullanılacak varyant: **"Skoru herkes görür, nedenini sen gör."** veya **"Skor değil, sebebi."**

**Ton:**
- Sakin, zeki, veriye dayalı; tribün bağırışı değil "akıllı arkadaş".
- Kulüp tarafsız. Hiçbir takım küçümsenmez, derbi içeriği iki tarafa eşit mesafede.
- Kısa cümleler, Türkçe futbol jargonu doğal kullanılır (bek-kanat, baskı, kırılma anı), İngilizce terimler sadece yerleşikse (xG).
- Dürüst ve şeffaf: tek kişilik bağımsız geliştirici hikâyesi bir güç olarak kullanılır.

**Ana mesajlar (öncelik sırasıyla):**
1. Ücretsiz, Türkçe, gürültüsüz canlı skor: Süper Lig, Avrupa'nın büyük ligleri, UEFA kupaları, milli takımlar, NBA.
2. Sadece takip ettiğin takım ve maç için, sadece önemli anda bildirim.
3. Yakında Pro: maç sonu taktik analiz, devre arası raporu, baskı alarmı. Bekleme listesine katıl.
4. Bağımsız, tek kişilik Türk geliştirici. Play Store yolculuğuna destek ol.

**Yasaklı iddialar ve ifadeler:**
- "Gol tahmin eder", "kesin", "garanti", "kazandırır", "kupon", "oran", "iddaa", "bahis" ve benzeri her türlü bahis çağrışımı.
- "Resmî uygulama", "TFF/UEFA/NBA/kulüp onaylı" veya herhangi bir kurumla ortaklık ima eden ifade.
- "En iyi", "1 numara", "en hızlı skor" gibi karşılaştırmalı/üstünlük iddiaları (ölçülmüş kanıt olmadan).
- "Şimdi Pro'ya abone ol", fiyat bilgisi (Pro satışta değil).
- "Play Store'da" (geçiş tamamlanana kadar).
- "%100 güvenli", "virüssüz garanti" (bunun yerine: "SHA-256 ve VirusTotal sonucunu kendin kontrol et").
- Uydurma kullanıcı sayısı, indirme sayısı, puan veya kullanıcı yorumu.
- Kapsamda olmayan içerik: kadın ligleri, alt yaş takımları, Basketbol Süper Ligi ve EuroLeague uygulamada yok; vaat edilmez.
- "Reklamsız" iddiası, sadece uygulamada gerçekten reklam yoksa kullanılır (⚠ doğrulanmalı).

**Görsel kurallar:**
- Kulüp logoları, lig logoları, oyuncu fotoğrafları ve maç yayın görüntüleri reklam görsellerinde kullanılmaz.
- Uygulama ekran görüntüleri gerçek olmalı; maket kullanılıyorsa "temsilîdir" notu düşülür.
- AI analiz örnekleri gerçek maçlardan gelmeli; kurgu senaryo yok.

**Hedef kanallar (öncelik sırasıyla):**
1. X (futbol veri/taktik topluluğu) — S1
2. TikTok + Instagram Reels + YouTube Shorts (tek video, üç platform) — S1, S2, S3
3. Reddit r/superlig (kurallara uygun, şeffaf) — S1
4. İzin alınmış Telegram/Discord taraftar grupları — S2, S4
5. Teknoloji forumları ve Ekşi Sözlük (düşük sıklık) — S1
6. İçerik üreticisi iş birlikleri (ücretsiz, kaynak gösterme karşılığı) — S5

**Her içerikte zorunlu:**
- Geliştirici kendi ürününü tanıtıyorsa bunu açıkça belirtir.
- Çağrı (CTA) tek ve net: "İndirme sayfasına git" veya "Bekleme listesine katıl". İkisi aynı içerikte birlikte verilmez.
- Platform kuralları paylaşımdan önce kontrol edilir; şüphede moderatöre sorulur.

**Kesinlikle yapılmayacaklar:** Sahte hesap, bot, satın alınmış takipçi/etkileşim, sahte yorum, izinsiz grup paylaşımı, toplu DM, başkası adına yazma, telifli maç görüntüsü kullanımı.

---

## Ek: Doğrulanması gereken açık konular (özet liste)
1. Google'ın Play dışı uygulamalar için geliştirici doğrulama zorunluluğunun Türkiye'deki yürürlük tarihi ve APK kurulumuna etkisi. **(En kritik.)**
2. Play Console kişisel hesap kapalı test şartı (test kullanıcısı sayısı, süre), kayıt ücreti ve Türkiye'den ödeme yöntemi.
3. Canlı skor veri sağlayıcısının ve logo kaynağının ticari kullanım/yeniden dağıtım koşulları (AI kartlarının sosyal medyada paylaşımı dahil).
4. r/superlig, Ekşi Sözlük, TikTok, X self-promotion ve otomasyon kuralları.
5. Bağış platformlarının Türkiye'ye ödeme yapıp yapmadığı ve bağış gelirinin vergisel durumu.
6. Alternatif mağazaların (Galaxy Store, AppGallery, Uptodown, APKPure) kayıt ücreti ve kabul şartları.
7. Uygulamada reklam olup olmadığı ("reklamsız" iddiası için).
8. Güncel fikstürler: Süper Lig derbileri, UEFA maç günleri, milli maç arası, Alperen Şengün'ün takımı ve maç takvimi.
9. KVKK açısından gizlilik politikası ve bekleme listesi formunda toplanan e-posta verisinin aydınlatma metni.
