# Skor+ — Sıfır Bütçe Pazarlama Stratejisi (Türkiye)

> Sürüm 2 — 18 Kasım 2026. Bütçe: ~0 TL (en fazla birkaç yüz TL). Ekip: tek geliştirici. Dağıtım: yalnız APK (EAS). Play Store hesabı (25 $) şimdilik açılmıyor.
> **İşaret kuralı:** "⚠ doğrulanmalı" yazan her madde, platform kuralı / tarih / ücret gibi güncel bilgi içerir. Uygulamadan önce resmî kaynaktan kontrol edilmeli. Bu belgede uydurma istatistik yoktur. Hedef rakamlar "hedef"tir, tahmin değildir.

## Değişiklik notu (Sürüm 1 → Sürüm 2)

- **Ürün gerçekleri güncellendi** (GELISTIRMELER.txt 3.20–3.27): NBA Box Score (ESPN/NBA yayın düzeninde tam kutu skoru), NBA logoları, basketbola özel AI dili, maç önü "yorumcu modu", açılışta otomatik OTA güncelleme, futbolda Kadro sekmesi ve Dün/Bugün/Yarın şeridi eklendi.
- **Dürüstlük düzeltmeleri:** Ücretsiz veri planında canlı skor ~30 dk aralıkla güncellenir. "Anlık skor", "en hızlı skor" dili tamamen yasaklandı. Akıllı alarm (baskı alarmı, kırmızı kart analizi) kodda var ama ücretli veri planına bağlı, bugün kapalı. Önceki sürümdeki "baskı alarmı ekran kaydı" içerik fikirleri ertelendi.
- **Konumlandırma yenilendi:** Hız değil, "Türkçe anlam" ön planda. NBA tarafı ayrı bir segment ve ayrı bir mesaj setiyle birincil hedeflerden biri oldu.
- **Play Store artık kısa vadeli hedef değil.** "25 $'ı kazanma" kampanyası ve bağış sayfası çıkarıldı. Yerine APK'ya özel büyüme taktikleri geldi: indirme sayfası, QR, WhatsApp paylaşımı, elle yürütülen davet (referral) sistemi, Telegram/Discord/Reddit Türkiye toplulukları.
- **30 günlük takvim, 4 haftalık lansman planına** dönüştü: hafta hafta somut çıktılar, sıfır/düşük bütçe.
- **Ölçüm bölümü KPI'lara** dönüştü: her KPI için tanım, kaynak ve 4. hafta hedefi.
- Paywall kodunda fiyat taslakları bulunsa da Pro satışta değil. Fiyat hiçbir pazarlama içeriğinde kullanılmaz.

---

## 0. Durum özeti ve temel kararlar

### 0.1 Bugün gerçekten çalışan (ücretsiz)
- **Futbol:** canlı skor (ücretsiz veri planı: ~30 dk aralıkla güncellenir, her maçta "Son güncelleme HH:MM" yazar), Türkçe takım adları, logolar, Dün / Bugün / Yarın tarih şeridi, Tümü / Canlı / Biten / Takip filtreleri, maç ekranında Özet, İstatistik ve **Kadro** (saha dizilişi, yedekler, teknik direktör; maç bitince oyuncu puanları ve "Maçın oyuncusu").
- **NBA:** canlı skor, çeyrek tablosu, takım istatistikleri, NBA logoları, **Box Score** (biten maçlarda): iki takım alt alta; DK, FGM, FGA, FG%, 3PM, 3PA, 3P%, FTM, FTA, FT%, OREB, DREB, REB, AST, STL, BLK, TO, PF, PTS, +/-; ilk 5'te mevki harfi (G/F/C), en skorer vurgulu, TOPLAM satırı.
- **Takip ve bildirim:** takım takibi (her maçında otomatik), maç takibi, "maç başladı" bildirimi.
- **Güncelleme:** JS değişiklikleri uygulama açılışında otomatik iner ve uygulanır (EAS Update). Kullanıcının her küçük düzeltmede yeni APK kurması gerekmez. Native değişiklikte yeni APK gerekir.
- Uygulamada reklam SDK'sı yok (kod taramasında bulunmadı). "Reklamsız" ifadesi bugün doğru; reklam eklenirse kaldırılır.

### 0.2 Kodda var, kullanıcıya bugün açık değil (Pro)
- Pro satın alınamıyor; test hesabı dışındaki kullanıcı paywall'da "Pro abonelik çok yakında" görür.
- **Futbol AI:** maç sonu taktik rapor (xG denetimi, momentum kırılma anları, teknik direktör etkisi, maçın yıldızı), maç önü "Taktiksel Eşleşme" (veri yokken dizilişten yorum yapan yorumcu modu), devre arası "Soyunma Odası Reçetesi".
- **NBA AI:** şut verimliliği (TS%), momentumun el değiştirdiği periyotlar, bench etkisi, oyuncu +/- etkisi, hücum/savunmada en etkili; futbol terimi kullanmayan basketbol dili.
- **Taktik Asistan:** maça kilitli mini sohbet, maç başına 3 soru.
- **Akıllı alarm** (baskı alarmı, kırmızı kart analizi): ücretli veri planı gerektirir; bugün kapalı.

### 0.3 Üç stratejik karar
1. **Ücretsiz ürünü pazarla, Pro'yu "bekleme listesi" olarak göster.** "Şimdi abone ol" yok, fiyat yok.
2. **AI çıktısını uygulama dışına taşı.** Geliştirici test hesabıyla ürettiği gerçek AI raporlarını (maç sonu, devre arası, NBA analizi) paylaşım kartı yapar. Bu hem içerik maliyetini sıfırlar hem de Pro talebini ölçer.
3. **APK'yı bir dezavantaj değil, "erken erişim" hikâyesi olarak anlat.** Play Store yok; güven, şeffaflık ve kolay kurulumla telafi edilir. Büyüme kişiden kişiye (WhatsApp, grup, davet) tasarlanır, mağaza keşfi beklenmez.

---

## 1. Konumlandırma

**Ana cümle:** "Skoru herkes görür, nedenini sen gör."
**Kısa varyant:** "Skor değil, sebebi."
**NBA varyantı:** "Box score İngilizce, yorum Türkçe."

**Ne olduğumuz:** Türkçe, sade, takip ettiğin takıma odaklı skor uygulaması. Futbolda kadro ve istatistik; NBA'de tam box score. Yakında: maçı Türkçe açıklayan AI analiz.

**Ne olmadığımız (ve söylemediğimiz):**
- En hızlı canlı skor değiliz. Ücretsiz veri planında güncelleme ~30 dk aralıkla.
- Tahmin / bahis uygulaması değiliz.
- Haber, video, transfer dedikodusu uygulaması değiliz.

**Farklılaştırıcılar (bugün kanıtlanabilir olanlar önce):**
1. NBA box score, Türkçe arayüzle, ESPN/NBA yayın düzeninde. Türkiye'de NBA'i Türkçe arayüzle takip edenler için nadir bir kombinasyon (⚠ doğrulanmalı: rakiplerin Türkçe NBA box score sunup sunmadığı; "tek" / "ilk" iddiası kullanılmaz).
2. Türkçe takım adları, sade arayüz, reklam yok.
3. Takım takibi + "maç başladı" bildirimi: sadece senin takımın.
4. (Yakında, bekleme listesi) Futbol ve NBA için Türkçe AI taktik analiz. NBA analizi basketbol diliyle yazılır: TS%, kırılma periyodu, bench, +/-.

---

## 2. Hedef kitle segmentleri (öncelik sırasıyla)

### S1 — Türk NBA takipçisi (birincil, yeni)
- **Kim:** Gece/sabah NBA maçlarını takip eden, sabah sonucu ve istatistiği kontrol eden Türk basketbol izleyicisi. Türk oyuncuların (ör. Alperen Şengün) maçlarına özel ilgi. ⚠ doğrulanmalı: Türk oyuncuların güncel takımları ve maç takvimi.
- **Neden önce:** Türkçe NBA kaynağı az, bağlılık yüksek. Box score bugün çalışıyor; Pro olmadan da güçlü değer var. Kitle Android ağırlıklı ve topluluklarda (Reddit, Discord, X) aktif.
- **Mesajlar:**
  - "Gece maçı kaçırdın mı? Sabah tam box score Türkçe arayüzde: FG%, 3P%, +/-, hepsi bir ekranda."
  - "İki takım alt alta, ilk 5 ve yedekler, en skorer vurgulu."
  - Bekleme listesi için: "Yakında Türkçe NBA analizi: maç hangi çeyrekte koptu, bench fark yarattı mı, kim verimliydi (TS%)."
- **Kanıt biçimi:** Gerçek bir maçın Box Score ekran görüntüsü (yatay kaydırılmış istatistik sütunlarıyla).
- **Dikkat:** Box score yalnız biten maçlarda var. "Canlı box score" denmez.

### S2 — Taktik/veri meraklısı futbol takipçisi
- **Kim:** xG ve taktik analiz paylaşan hesapları takip eden; r/superlig ve Ekşi maç başlıklarında yazan; 18-35 yaş, Android ağırlıklı.
- **Mesaj:** "Skoru herkes görür, nedenini sen gör. Kadro, diziliş, oyuncu puanları bugün; maç sonu xG ve momentum analizi yakında."
- **Kanıt biçimi:** Kadro sekmesi (saha dizilişi + puanlar) ve gerçek AI maç sonu raporundan kart.

### S3 — Bildirim yorgunu, tek takım taraftarı
- **Kim:** Kendi takımını takip eden, reklamlı ve gürültülü skor uygulamalarından sıkılmış kullanıcı.
- **Mesaj:** "Takımını seç, maç başladığında haberin olsun. Reklam yok."
- **Kanıt biçimi:** Takım takibi + "maç başladı" bildirimi kısa ekran kaydı.
- **Dikkat:** Gol bildirimi iddiası kullanılmaz; bugün çalışan bildirim "maç başladı"dır.

### S4 — Avrupa gecesi ve milli maç izleyicisi (geniş, düşük öncelik)
- **Mesaj:** "Avrupa gecesinde Türk takımlarının maçları tek listede, Türkçe."
- Sadakati düşük; sadece maç günü içerikleriyle hedeflenir.

### S5 — İçerik üreticileri ve topluluk yöneticileri (çarpan)
- **Kim:** Küçük/orta futbol ve NBA YouTube/X/TikTok hesapları; Telegram/Discord sunucu yöneticileri.
- **Mesaj:** "Maç sonu Türkçe analiz kartları hazır. Kaynak göstererek kullanabilirsin."

---

## 3. Genel kurallar (tüm kanallar)

- Önce katkı, sonra tanıtım. Kabaca 4 değerli paylaşım : 1 bağlantı (alışkanlık, platform kuralı değil).
- Tek kişi, tek gerçek hesap. Her tanıtımda "Bu uygulamayı ben geliştiriyorum" açıkça yazılır.
- **Yasak taktikler:** sahte hesap, bot, satın alınmış takipçi/etkileşim, sahte yorum, başkası gibi yazmak, toplu DM, aynı metni onlarca gruba yapıştırmak, izinsiz grup paylaşımı.
- Kulüp, lig ve NBA takım logoları **pazarlama görsellerinde öne çıkarılmaz**. Uygulama içi ekran görüntüsünde küçük görünmeleri ayrı bir konudur (⚠ doğrulanmalı: logo kullanım hakları).
- Bahisle ilişkilendirme yok: "tahmin", "kupon", "kesin", "oran", "iddaa" kullanılmaz.
- Maç yayın görüntüsü kullanılmaz (telif). Sadece uygulama arayüzü, metin, grafik.

---

## 4. APK'ya özel büyüme taktikleri

### 4.1 İndirme sayfası (tek sayfa, ücretsiz statik barındırma: GitHub Pages vb.)
APK kalıcı bir adreste barındırılır (EAS build bağlantıları süreli; GitHub Releases önerilir). İçerik sırası:
1. Başlık + konum cümlesi. Altında iki büyük düğme: **"APK'yı indir"** ve **"WhatsApp'ta paylaş"**.
2. 4-6 gerçek ekran görüntüsü: maç listesi (Dün/Bugün/Yarın), futbol Kadro, NBA Box Score, takım takibi, Ayarlar. Pro ekranı gösterilecekse "yakında" etiketiyle.
3. **"Neden Play Store'da değil?"** — dürüst dille: "Tek kişilik bağımsız bir projeyim. Şimdilik APK ile dağıtıyorum."
4. **Güvenlik kanıtları:** her sürüm için SHA-256 özeti, VirusTotal tarama bağlantısı, istenen izinler ve her iznin nedeni, toplanan/toplanmayan veri, gizlilik politikası ve KVKK metni (uygulamada şablon var; yer tutucular yayından önce doldurulmalı), tüm sürümlerin aynı anahtarla imzalandığı bilgisi.
5. **Adım adım kurulum** (ekran görüntülü): bilinmeyen kaynak izni ve kurulumdan sonra nasıl kapatılacağı.
6. **SSS:**
   - "Uyarı neden çıkıyor?" — Android, Play Store dışındaki her uygulama için uyarır; bu, uygulamanın zararlı olduğu anlamına gelmez.
   - "Güncellemeleri nasıl alırım?" — Çoğu güncelleme uygulama açılırken kendiliğinden iner ve uygulanır. Büyük sürümlerde yeni APK gerekir; Telegram kanalından ve bu sayfadan duyurulur. Ayarlar ekranında sürüm ve güncelleme tarihi görünür.
   - "Skorlar neden ~30 dk'da bir güncelleniyor?" — Ücretsiz veri kaynağı; her maçta son güncelleme saati yazar.
   - "Pro ne zaman?" — Bekleme listesi bağlantısı.
   - "Hesabımı silebilir miyim?" — Evet, Ayarlar > Hesabımı sil.
   - "Uygulamayı silersem ne olur?" — Oturum anonim; uygulama silinince takipler kaybolur (dürüst cevap).
7. Geri bildirim formu + Pro bekleme listesi formu (Google Forms).
8. Gizlilik dostu sayfa analitiği (ör. GoatCounter, Cloudflare Web Analytics; ⚠ ücretsiz katman doğrulanmalı) ve her kanal için ayrı `?ref=` / UTM parametresi.

⚠ doğrulanmalı — **kritik:** Google'ın Play dışı dağıtılan uygulamalar için geliştirici doğrulama (developer verification) zorunluluğunun Türkiye'deki yürürlük tarihi ve doğrulanmamış geliştiricinin APK'sının sertifikalı cihazlarda kurulup kurulamayacağı. Zorunluluk geldiyse APK stratejisinin ömrü kısalır.

### 4.2 QR kod
- İndirme sayfası için ücretsiz statik QR (bağlantı kısaltıcısız, doğrudan sayfa adresi; böylece servis kapanınca QR ölmez).
- Kullanım yerleri: her paylaşım kartının köşesi, kısa videoların son karesi, Telegram kanal görseli, forum gönderileri.
- Fiziksel (düşük bütçe, isteğe bağlı): üniversite basketbol/futbol kulübü panoları, maç izleme etkinlikleri için A5 çıktı. Sadece izin alınan yerlerde.
- Kanal ölçümü için QR'lar ayrı `?ref=qr-kart`, `?ref=qr-video`, `?ref=qr-afis` parametreleri taşır.

### 4.3 WhatsApp paylaşımı (birincil yayılım yolu)
Türkiye'de uygulama önerisi büyük ölçüde WhatsApp grupları ve birebir mesajla yayılır. APK için bu, mağaza keşfinin yerini tutar.
- İndirme sayfasında hazır metinli paylaşım düğmesi (`https://wa.me/?text=...`). Örnek metinler:
  - Futbol: "Türkçe, reklamsız skor uygulaması buldum. Takımını seç, maç başlayınca haber veriyor. Kurulum anlatımı sayfada: <bağlantı>"
  - NBA: "Gece NBA maçlarının tam box score'u Türkçe arayüzde: <bağlantı>"
- Paylaşılan bağlantı her zaman **indirme sayfasıdır**, doğrudan APK dosyası değil. Doğrudan APK bağlantısı güvensiz görünür ve kurulum anlatımını atlar.
- Paylaşım kartları kare/dikey formatta, WhatsApp durumuna (status) uygun boyutta hazırlanır.
- WhatsApp Kanalı (⚠ doğrulanmalı: Türkiye'de kanal açma ve keşfedilebilirlik koşulları): Telegram kanalının aynası olarak, maç sonu kartları ve sürüm duyuruları.

### 4.4 Davet (referral) sistemi — elle, kodsuz
Uygulamada davet özelliği yok. Kod değişikliği yapılmadan elle yürütülür:
1. Bekleme listesi formunda isteğe bağlı "Seni kim davet etti?" alanı (takma ad veya davet kodu).
2. Kayıt olan her kişiye kendine ait bağlantı verilir: `<indirme sayfası>?ref=<takma-ad>`. Sayfa analitiği bu parametreleri sayar.
3. **Ödül (vaat yalnız tutulabilir olanla sınırlı):** "Kurucu Destekçi" listesi. 3 kişiyi getiren, Pro çıktığında öncelikli erken erişim alır ve (izinle) indirme sayfasındaki teşekkür listesinde yer alır. Ücretsiz Pro süresi vaat edilecekse süre ve kişi sayısı yazılı olarak sınırlandırılır.
4. Haftalık sıralama Telegram kanalında paylaşılır (yalnız takma adlar; kişisel veri yok).
5. **Kurallar:** sahte kayıt, kendi kendini davet ve toplu spam ile gelen davetler sayılmaz. Bu şartlar formda yazılı olur.
6. KVKK: formda toplanan veri için aydınlatma metni (⚠ doğrulanmalı). Sadece gerekli alanlar toplanır.

**Ürün önerisi (kapsam dışı, kod değişikliği yapılmadı):** Uygulama içi "Paylaş" düğmesi ve davet bağlantısı en yüksek getirili ürün değişikliği olur. Box Score ve AI raporu için görsel paylaşım kartı GELISTIRMELER.txt D maddesinde zaten öneri olarak duruyor (yeni native build gerektirir).

### 4.5 Telegram
- **Skor+ kanalı (sahip olunan kanal):** sürüm notları, maç sonu kartları, NBA "Gece ne oldu?" sabah kartı, davet sıralaması. APK kullanıcısının güncelleme haberini aldığı ana yer.
- **Taraftar ve NBA grupları:** Önce yöneticiyle özel konuşma: "Grubunuz için maç sonu Türkçe özet paylaşabilir miyim? İsterseniz bağlantı koymam." Yönetici izni olmadan hiçbir gruba bağlantı atılmaz.
- Bahis içerikli gruplardan uzak durulur (marka güvenliği).

### 4.6 Discord
- Türk NBA ve futbol sunucularında yalnız `#kendi-projeni-tanıt` / `#paylaşım` tarzı kanallar kullanılır; yoksa moderatöre sorulur.
- İçerik: Box Score ekran görüntüsü + "Geri bildirim arıyorum, özellikle hangi istatistik eksik?" sorusu. Geri bildirim isteği tanıtımdan daha iyi karşılanır.
- Sunucularda maç gecesi düzenli aktif katılım; bağlantı sadece sorulduğunda.

### 4.7 Reddit Türkiye toplulukları
- **r/superlig:** Önce 2-3 hafta maç başlıklarında normal katılım. Sonra moderatöre modmail ile izin; izin varsa ayda en fazla 1 şeffaf tanıtım ("Kendi geliştirdiğim Türkçe skor uygulaması, geri bildirim arıyorum"). ⚠ doğrulanmalı: self-promotion kuralı ve flair.
- **r/nba ve Türk basketbol odaklı subreddit'ler:** ⚠ doğrulanmalı: Türkçe basketbol subreddit'lerinin varlığı ve kuralları. r/nba'de uygulama tanıtımı büyük olasılıkla yasaktır; orada yalnız bağlantısız veri yorumu.
- **r/Turkey, r/KGBTR gibi genel topluluklar:** ⚠ doğrulanmalı: tanıtım kuralları. Yalnız izin verilen "kendi projem" başlıklarında, geliştirici hikâyesiyle.
- Reddit genelinde kendi içeriğini aşırı paylaşmak spam sayılır.

### 4.8 Destekleyici kanallar (düşük sıklık)
- **X (Twitter):** Geliştiricinin gerçek hesabı. Maç sonu kartları, NBA sabah kartı. Bağlantı profilde. Otomasyon yok (⚠ doğrulanmalı: güncel kurallar).
- **TikTok / Reels / Shorts (tek video, üç platform):** "Gece maçının box score'u 10 saniyede", "Uygulamayı tek başıma yapıyorum" geliştirici günlüğü, "Skoru herkes gördü, işte nedeni" (gerçek AI raporundan). Bio'da indirme sayfası (⚠ doğrulanmalı: bio bağlantısı eşikleri).
- **Teknoloji forumları** (Technopat, DonanımHaber vb.; ⚠ kurallar): APK kurmaktan çekinmeyen kitle; "geliştirici olarak geri bildirim istiyorum" konusu.
- **Ekşi Sözlük:** Var olan "canlı skor uygulaması" türü başlıklara ayda en fazla 1 bilgilendirici entry, geliştirici olduğu belirtilerek (⚠ doğrulanmalı: reklam kuralları).

---

## 5. İçerik döngüleri

### 5.1 Kart döngüsü: gerçek çıktı → kart → paylaşım → indirme sayfası
1. Büyük maç biter. Geliştirici uygulamadaki gerçek veriyi (Box Score, Kadro + puanlar) veya test hesabıyla gerçek AI raporunu alır.
2. Sabit şablonlu karta dönüştürür: Skor+ adı, maç adı metin olarak, 3 madde, köşede QR + sayfa adresi.
3. Telegram kanalı → WhatsApp durumu → X → izinli gruplar.
4. Pro içeriğinden üretilen kartlarda "Pro (yakında) örneği" etiketi bulunur; CTA bekleme listesidir.

### 5.2 NBA sabah ritmi (S1)
- Türkiye saatiyle gece oynanan maçlar için sabah ~08:30-09:00 "Gece ne oldu?" kartı: skor + Box Score'dan 3 satır (en skorer, FG%, +/-). ⚠ Kart hazırlanmadan önce box score'un dolduğu kontrol edilir (yalnız biten maçlarda, senkron gecikmesiyle gelir).
- Türk oyuncu maçlarında ayrı kart (⚠ fikstür).

### 5.3 Futbol maç günü ritmi (S2-S4)
| Olay | İçerik |
|---|---|
| Süper Lig derbileri (⚠ fikstür) | Önceki gün maç önü AI kartı (Pro örneği), maç sonrası 2 saat içinde Kadro/puan kartı + AI maç sonu özeti. |
| Avrupa gecesi (⚠ UEFA takvimi) | "Türk takımları bu gece" listesi; maç sonu toplu özet. |
| Milli maç arası (⚠ takvim) | Milli takım maç sonu özeti; geniş kitleye ulaşmak için en iyi an. |

### 5.4 Ertelenen içerikler
- Baskı alarmı ve kırmızı kart analizi örnekleri: ücretli veri planına geçilene kadar kullanılmaz.
- Canlı devre arası raporunun "maç sırasında anında" paylaşımı: ücretsiz planda rapor zamanlaması tahmini pencereye bağlı. Kart yalnız rapor gerçekten devre arasında üretildiyse "devre arası" diye sunulur.

---

## 6. 4 haftalık lansman planı (sıfır / düşük bütçe)

Zaman: **günde 45-60 dk**, maç günü **90 dk**. Bütçe: 0 TL; isteğe bağlı en fazla birkaç yüz TL (A5 QR çıktısı, alan adı). Alan adı şart değil; GitHub Pages alt alanı yeterli.

### Hafta 1 — Altyapı ve güven (lansman öncesi)
- Kalıcı APK barındırma (GitHub Releases), SHA-256, VirusTotal.
- İndirme sayfası: ekran görüntüleri, kurulum adımları, SSS, izinler, gizlilik/KVKK (yer tutucular doldurulmuş), WhatsApp paylaş düğmesi, QR.
- Google Forms: geri bildirim + bekleme listesi (davet alanıyla) + KVKK aydınlatması.
- Telegram kanalı, X profili, kısa video hesapları: aynı kullanıcı adı, bio'da indirme sayfası.
- Kart şablonları (Canva/Figma ücretsiz; ⚠ lisans): futbol kartı, NBA Box Score kartı, AI "Pro örneği" kartı.
- r/superlig ve 3-5 Discord/Telegram topluluğunda okuma + normal katılım; moderatörlere izin mesajı.
- Kendi çevresinden 10-20 kişiyle "sessiz test": kurulum adımları anlaşılıyor mu? Takıldıkları yer SSS'e eklenir.
- **Çıktı:** yayında indirme sayfası, çalışan ölçüm, 3 hazır şablon, en az 10 test kurulumu.

### Hafta 2 — Yumuşak lansman (NBA önce)
- İzin veren Discord/Telegram NBA topluluklarında Box Score paylaşımı + geri bildirim isteği.
- Her NBA sabahı 1 "Gece ne oldu?" kartı (Telegram + WhatsApp durumu + X).
- Teknoloji forumunda geliştirici konusu.
- 3 kısa video: Box Score demo, takım takibi + "maç başladı" bildirimi, geliştirici günlüğü.
- Davet sistemi duyurusu: "Kurucu Destekçi" listesi.
- **Çıktı:** ilk dış kurulumlar, ilk geri bildirimler, ilk davet bağlantıları.

### Hafta 3 — Futbol ve içerik döngüsü
- r/superlig şeffaf tanıtım gönderisi (yalnız moderatör izni varsa).
- Hafta sonu büyük maçları için Kadro/puan kartı ve AI maç sonu "Pro örneği" kartı.
- 5 futbol/NBA küçük içerik üreticisine kişisel mesaj (S5): kartları kaynak göstererek kullanma teklifi.
- 3 kısa video. İlk Telegram davet sıralaması.
- Geri bildirimlerden en sık 3 sorun listelenir. Kod tarafı geliştiriciye iletilir; OTA ile gelen düzeltmeler Telegram'da "sizin isteğinizle düzeldi" diye duyurulur.
- **Çıktı:** kart döngüsü haftada en az 5 kart; en az 1 topluluk/üretici iş birliği.

### Hafta 4 — Ölç, sadeleştir, karar ver
- KPI tablosu çıkarılır (Bölüm 7). En kötü 1-2 kanal bırakılır, süre en iyi kanala kaydırılır.
- "İlk ay" şeffaf geliştirici günlüğü: gerçek kurulum sayısı, öğrenilenler, sırada ne var.
- Karar noktaları:
  - Bekleme listesi hedefi tuttuysa: Pro talebi var. Play Store / ödeme altyapısı için kaynak aramak önceliklenir.
  - Haftalık aktif kullanıcının çoğu NBA'den geliyorsa: NBA odaklı içerik payı artırılır.
  - Kurulum oranı düşükse: indirme sayfası ve kurulum anlatımı yeniden yazılır (güven sorunu).
- **Çıktı:** 2. ay planı ve kanal listesi.

---

## 7. KPI'lar (ölçülebilir, ücretsiz araçlarla)

Hedefler tek geliştiricinin sıfır bütçeli ilk ayı için **iddialı ama ulaşılabilir hedeflerdir**, tahmin değildir. Haftalık 15 dakikalık bir Google Sheets tablosu yeterli. Gerçek sayılar paylaşılırken yuvarlama veya şişirme yapılmaz.

| # | KPI | Tanım | Kaynak | 4. hafta hedefi |
|---|---|---|---|---|
| 1 | İndirme sayfası ziyareti | Tekil ziyaretçi, `ref` kırılımlı | Sayfa analitiği | 1.000 |
| 2 | Sayfa → APK indirme oranı | APK indirme / tekil ziyaret | GitHub Releases + analitik | ≥ %25 |
| 3 | Kurulum / aktif hesap | Yeni anonim hesap sayısı | Supabase (kullanıcı tablosu) | 250 |
| 4 | Aktivasyon | En az 1 takım takip eden hesap / yeni hesap | Supabase (takip tablosu) | ≥ %40 |
| 5 | Bildirim izni | Push token kaydı olan hesap / yeni hesap | Supabase (push token) | ≥ %60 |
| 6 | D7 tutma | Kurulumdan 7 gün sonra tekrar açan oranı | Supabase (son görülme / güncelleme kaydı; ⚠ ölçüm alanının varlığı doğrulanmalı) | ≥ %25 |
| 7 | NBA payı | NBA maç ekranı açan veya NBA takımı takip eden hesap oranı | Supabase (takip tablosu) | Ölçülür, hedef yok (segment kararı için) |
| 8 | Pro bekleme listesi | Form kaydı | Google Forms | 100 |
| 9 | Davet katsayısı | Davetle gelen kayıt / toplam kayıt | Form "davet eden" alanı + `ref` | ≥ %15 |
| 10 | WhatsApp paylaşımı | `ref=wa` ile gelen ziyaret | Sayfa analitiği | Toplam ziyaretin ≥ %20'si |
| 11 | Kanal etkinliği | Kanal başına sayfa tıklaması (beğeni değil) | `ref`/UTM | En iyi 2 kanal belirlenir |
| 12 | OTA erişimi | Son OTA sürümünü almış aktif cihaz oranı | EAS Update panosu (⚠ doğrulanmalı) | ≥ %80 |

Notlar:
- Push token sayısı tek başına aktif kullanıcı değildir.
- Anonim oturum nedeniyle yeniden kurulum yeni hesap gibi görünebilir; KPI 3 üst sınır olarak okunur.
- Supabase sorguları yalnız toplam sayı üretir; kişisel veri dışarı aktarılmaz.

---

## 8. Reklamcı ajan için özet brief

**Ürün:** Skor+ — Türkçe futbol ve NBA skor uygulaması. Android, APK ile dağıtılıyor (Play Store'da değil). iOS yok.

**Tagline:** "Skoru herkes görür, nedenini sen gör." NBA için: "Box score İngilizce, yorum Türkçe."

**Ton:** Sakin, zeki, veriye dayalı "akıllı arkadaş". Kulüp tarafsız. Kısa cümleler. Futbolda Türkçe futbol dili; NBA içeriğinde basketbol dili (FG%, ribaund, asist, bench, çeyrek), futbol terimi yok. Bağımsız tek kişilik geliştirici hikâyesi güç olarak kullanılır.

**Ana mesajlar (öncelik sırasıyla):**
1. NBA: biten maçların tam box score'u Türkçe arayüzde; iki takım alt alta.
2. Futbol: Türkçe takım adları, kadro ve diziliş, maç sonu oyuncu puanları.
3. Takımını takip et, maç başlayınca bildirim al. Reklam yok.
4. Yakında Pro: Türkçe AI taktik analiz (futbol ve NBA). Bekleme listesine katıl.
5. Bir kez kur; çoğu güncelleme kendiliğinden gelir.

**Yasaklı iddialar ve ifadeler:**
- "Anlık / gerçek zamanlı skor", "en hızlı skor", "dakika dakika" (ücretsiz planda ~30 dk aralıkla güncellenir).
- "Canlı box score" (yalnız biten maçlarda).
- "Gol bildirimi", "baskı alarmı", "kırmızı kart alarmı" (bugün kapalı).
- "Gol tahmin eder", "kesin", "garanti", "kazandırır", "kupon", "oran", "iddaa", "bahis".
- "Resmî uygulama", "NBA/TFF/UEFA/kulüp onaylı" veya ortaklık imaları.
- "Türkiye'nin ilk/tek", "en iyi", "1 numara" (kanıt olmadan).
- "Şimdi Pro'ya abone ol" ve her türlü fiyat (Pro satışta değil).
- "Play Store'da".
- "%100 güvenli", "virüssüz garanti" (yerine: "SHA-256 ve VirusTotal sonucunu kendin kontrol et").
- Uydurma kullanıcı/indirme sayısı, puan, yorum.
- Kapsam dışı: kadın ligleri, alt yaş takımları, Basketbol Süper Ligi, EuroLeague, iOS.

**Görsel kurallar:** Kulüp/lig/NBA logoları, oyuncu fotoğrafları ve maç görüntüleri reklam görselinde öne çıkarılmaz. Ekran görüntüleri gerçek; maket varsa "temsilîdir". AI örnekleri gerçek maçlardan; "Pro (yakında) örneği" etiketiyle.

**Hedef kanallar (öncelik sırasıyla):**
1. WhatsApp (birebir ve durum) + indirme sayfası — tüm segmentler
2. Skor+ Telegram kanalı + izinli Telegram/Discord toplulukları — S1, S3
3. Reddit Türkiye toplulukları (kurallara uygun) — S1, S2
4. X — S1, S2
5. TikTok / Reels / Shorts — S1, S3
6. İçerik üreticileri — S5

**Her içerikte zorunlu:** Geliştirici kendini açıkça belirtir. Tek CTA: "İndirme sayfasına git" veya "Bekleme listesine katıl" (ikisi birlikte değil). Platform kuralları paylaşımdan önce kontrol edilir.

**Kesinlikle yapılmayacaklar:** Sahte hesap, bot, satın alınmış etkileşim, sahte yorum, izinsiz grup paylaşımı, toplu DM, başkası adına yazma, telifli maç görüntüsü.

---

## Ek: Doğrulanması gereken açık konular
1. Google'ın Play dışı uygulamalar için geliştirici doğrulama zorunluluğunun Türkiye'de yürürlük tarihi ve APK kurulumuna etkisi. **(En kritik.)**
2. Veri sağlayıcının (API-Sports) ve logo kaynaklarının ticari kullanım ve sosyal medyada yeniden paylaşım koşulları (Box Score ve AI kartları dahil).
3. r/superlig, Türk basketbol subreddit'leri, r/Turkey, Discord sunucuları, Ekşi Sözlük, X ve TikTok tanıtım/otomasyon kuralları.
4. WhatsApp Kanalı açma koşulları ve keşfedilebilirliği.
5. Davet/bekleme listesi formu için KVKK aydınlatma metni; gizlilik politikası yer tutucularının doldurulması ve hukukçu kontrolü.
6. D7 tutma için uygulamada "son görülme" verisinin tutulup tutulmadığı; tutulmuyorsa hangi kayıttan türetileceği.
7. EAS Update panosunda sürüm erişim oranının görülebilirliği.
8. Rakiplerde Türkçe NBA box score olup olmadığı (karşılaştırmalı iddia kullanılmaması için).
9. Güncel fikstürler: Süper Lig derbileri, UEFA maç günleri, milli maç arası, Türk NBA oyuncularının takımları ve maç takvimi.
10. İleride Play Store'a geçişte kapalı test şartı (test kullanıcısı sayısı, süre) ve kayıt ücreti; bekleme listesi bu test ekibi için kaynak olarak saklanır.
