# Rakip Araştırması: Canlı Skor ve Analiz Uygulamaları

Tarih: 2026-11-17 (ilk sürüm) · Güncelleme: 2026-11-18 (bölüm 5-10 eklendi)
Hazırlayan: ürün araştırma ajanı (geliştirici ajana girdi)

> **2026-11-18 güncellemesinin özeti.** İlk turdaki A/B/C maddeleri (kadro + puan, tarih şeridi, veri tazeliği) GELISTIRMELER 3.23'te yapıldı. NBA box score (3.24-3.27), maç önü "yorumcu modu" (3.25) ve APK + OTA dağıtımı (3.22) da eklendi. Bu güncelleme şu konulara bakıyor: rakiplerin NBA kapsamı, rakiplerdeki AI/LLM özellikleri, premium fiyatları, APK dağıtım emsalleri ve API-Sports'a ucuz veri alternatifleri. Yeni bulgular bölüm 5-10'da. Öneri listesi bölüm 10'da.
>
> Doğrulama notu: api-football.com ve api-sports.io sayfaları otomatik istemcilere 403 döndü. API-Sports fiyat ve kullanım şartları bu yüzden yalnız arama özetlerinden ve resmî blog yazılarından alındı. Bu maddeler "doğrulanamadı" olarak işaretli.

## Kaynakların güvenilirliği

- Birincil kaynaklar: App Store sayfaları, şirketlerin kendi blog ve SSS sayfaları ve teknoloji basını (MacRumors, 9to5Mac, Tom's Guide, Six Colors).
- Kullanıcı şikâyet örüntüleri ağırlıkla toplayıcı sitelerden geldi: unstar.app, kimola.com, marlvel.ai, onclarity.com, Trustpilot ve Şikayetvar. Bu sitelerin bir kısmı yorumları otomatik/AI ile özetliyor. Rakamlarını kesin değil, yön gösterici kabul edin.
- Reddit'te doğrudan arama sonuç vermedi. Bu yüzden Reddit'e özgü bir görüş yok.
- "Emin değilim" notları ilgili maddenin yanında yazılı.

---

## 1. Uygulama başına güçlü yönler

### FotMob
- Sade, futbola odaklı ve hızlı arayüzü var. Ciddi taraftarlar bu uygulamayı en çok sevilen "saf futbol" uygulaması olarak anıyor. ([unstar.app karşılaştırması](https://unstar.app/blog/fotmob-onefootball-espn-365scores-sofascore-football-score-apps-ranked-2026))
- Canlı xG, şut haritası ve derin istatistikler maç sayfasının içinde sunuluyor. ([FotMob: Live xG](https://www.fotmob.com/topnews/3627-live-xg-data-is-now-fotmob))
- Oyuncu puanı, Opta'nın maç başına oyuncu başına 300'den fazla istatistiğinden hesaplanıyor. Kullanıcılar maç sonu puan listesini çok kullanıyor. ([App Store](https://apps.apple.com/app/id488575683))
- Tahmini kadroyu maçtan bir gün önce, kesin kadroyu ise maç öncesinde ayrı bildirimle veriyor. Kullanıcılar tahmini kadroların "beklenenden iyi" olduğunu yazıyor. ([App Store](https://apps.apple.com/gb/app/id488575683))
- Ana ekran widget'ı ve Live Activity desteği var. Ancak bir Android yorumu widget'ın büyütülemediğinden şikâyet ediyor. ([Softpedia Android incelemesi](https://mobile.softpedia.com/android/FotMob-Android-Review-2213.html))

### SofaScore
- "Attack Momentum" adında bir grafik var. Takımın baskısını dakika dakika gösteriyor ve en çok konuşulan özellik bu. ([Sofascore: Attack Momentum](https://www.sofascore.com/news/?p=71501))
- Oyuncu puanları canlı olarak güncelleniyor. İlk puan için yaklaşık 10 dakika oyun süresi gerekiyor ve puan maç sonunda kesinleşiyor. ([Sofascore rating rehberi](https://www.sofascore.com/news/nota-sofascore-explicada))
- Oyuncu ısı haritaları ve taktik araçları fantasy oyuncuları ile taktik meraklılarına hitap ediyor. ([Sofascore vs LiveScore](https://www.sofascore.com/sk/news/sofascore-vs-livescore-which-live-score-app-should-you-use))
- Çok sporu kapsıyor ama maç sayfası tutarlı bir düzende. ([App Store](https://apps.apple.com/app/sofascore-live-score-app/id1176147574))

### Flashscore / Mackolik
- Flashscore hızlı skor güncellemesi ve hızlı bildirimleriyle övülüyor. ([App Store](https://apps.apple.com/app/id766443283))
- Ekranlar yoğun ama okunaklı. Çok ligi tek listede kolayca tarıyorsunuz. (App Store yorumlarından genel izlenim; kesin bir kaynak yok.)
- SSS sayfası şeffaf. Bildirim gelmiyorsa pil optimizasyonunu kapatmayı öneriyor ve reklamların neden olduğunu açıklıyor. ([Flashscore SSS: bildirim/çökme](https://www.flashscore.com/faq/issue), [reklam SSS](https://www.flashscore.com/faq/ads))
- Mackolik Türkiye'de güçlü bir marka. Türkçe içerik ve yerel lig derinliği sunuyor. ([App Store TR](https://apps.apple.com/tr/app/mackolik/id398157427))

### OneFootball
- Haber, video ve skoru tek bir merkezde topluyor. Çok ligi takip etmek kolay. ([unstar.app](https://unstar.app/blog/fotmob-onefootball-espn-365scores-sofascore-football-score-apps-ranked-2026))
- Uzun süreli kullanıcılar uygulamanın tutarlı olduğunu ve sürekli özellik eklendiğini söylüyor. ([Trustpilot](https://nz.trustpilot.com/review/onefootball.com))
- Transfer ve takım haberleri kişiselleştirilmiş akışta geliyor. ([App Store](https://apps.apple.com/gb/app/id382002079))

### ESPN
- Çok sporu kapsıyor: NBA box score, play-by-play ve video tek uygulamada. ([Tom's Guide, Apple Sports ile kıyas](https://www.tomsguide.com/phones/iphones/i-spent-two-weeks-using-the-apple-sports-app-heres-why-its-not-ready-for-the-big-leagues))
- Özet videolar ve ESPN+ yayınlarıyla içerik derinliği sunuyor. (Aynı kaynak.)

### theScore
- Takip edilen takım, lig ve oyunculardan kişisel bir akış kuruyor. Bu "Feed" kavramı uygulamanın kimliği. ([MacRumors](https://www.macrumors.com/2013/12/16/thescore-for-ios-updated-with-highly-customizable-news-feeds))
- Bildirim seçenekleri ayrıntılı ve özelleştirilebilir. Bildirimler zamanında geliyor. ([SportsBusiness Daily, 2014](https://www.sportsbusinessdaily.com/Daily/Issues/2014/06/03/Media/App-Review.aspx)) Bu kaynak eski. Güncel durum için not: Onclarity'ye göre kullanıcıların yaklaşık %10'u bildirimlerin bağlamsız olduğundan şikâyet ediyor. ([onclarity](https://www.onclarity.com/leaderboard/insight/thescore))
- Widget'ı kullanıcı yorumlarında övülüyor. ([App Store](https://apps.apple.com/app/id285692706))

### Apple Sports
- Minimal ve reklamsız. İncelemeler onu "medya uygulamasından çok sistem özelliği gibi" diye tanımlıyor. ([Six Colors](https://sixcolors.com/post/2024/02/simple-complexity-apples-trio-of-sports-apps/))
- Live Activities kilit ekranında ve Dynamic Island'da canlı skor gösteriyor. Ekim 2026 sürümü, oyun aralarında önemli istatistikleri de gösteriyor. ([MacRumors](https://www.macrumors.com/2024/09/16/apple-sports-app-live-activities/), [9to5Mac](https://9to5mac.com/2026/10/15/apple-sports-update-improves-live-activity-support-adds-soccer-leagues-))
- Kurulumda "favori takım/lig seç" akışı var ve tüm ekran bu seçime göre şekilleniyor. ([App Store](https://apps.apple.com/us/app/-/id6446788829))
- Bilinen eksiği video ve derinlik. "Big league için hazır değil" eleştirisi var. ([Tom's Guide](https://www.tomsguide.com/phones/iphones/i-spent-two-weeks-using-the-apple-sports-app-heres-why-its-not-ready-for-the-big-leagues))

### NBA app
- Resmi kaynak olduğu için play-by-play ve oyuncu istatistiği derin. ([App Store](https://apps.apple.com/gb/app/id484672289))
- Zayıf yönleri öne çıkıyor: çökmeler, ödeme yapan aboneyi tanımama, abonelere bile reklam ve güncellemeden sonra bozulan geri tuşu. ([kimola](https://kimola.com/reports/unlock-insights-nba-app-feedback-analysis-report-google-play-tr-148645), [marlvel](https://marlvel.ai/api/llm/apps/sports/nba-live-games-scores))

### Opta Analyst (analitik referansı)
- Canlı kazanma olasılığı modeli var. Gol ve kırmızı kart gibi olaylardan sonra güncelleniyor. ([Stats Perform: Opta Predictions](https://www.statsperform.com/opta-predictions/))
- Maç öncesinde galibiyet, beraberlik ve mağlubiyet olasılıklarını yayınlıyor. ([The Analyst](https://theanalyst.com/articles/opta-football-predictions))
- Not: Bunun ayrı bir mobil uygulaması olup olmadığını doğrulayamadım. Opta Analyst esas olarak bir web sitesi.

---

## 2. Kullanıcıların en çok şikâyet ettiği 5 konu (Skor+ bunlardan kaçınmalı)

1. **Bildirim spamı ve ayarların kalıcı olmaması.** Kullanıcılar takip etmedikleri maçlar için bildirim alıyor. Ayarlar güncellemeden sonra sıfırlanıyor. Bu, 365Scores'ta baskın örüntü ve FotMob'da da var. ([unstar.app](https://unstar.app/blog/fotmob-onefootball-espn-365scores-sofascore-football-score-apps-ranked-2026))
   - Skor+ için ders: bildirim tercihleri sunucuda (Supabase) saklanmalı ve maç ya da takım bazında olay türü seçilebilmeli.
2. **Agresif reklam ve bahis reklamı.** Yarım ekran ve tam ekran reklamlar var. Reklamsız abonelik alanlar bile reklam görüyor. Bu şikâyet Flashscore, SofaScore, OneFootball ve Mackolik'te geçiyor; Şikayetvar'da Mackolik için 373 şikâyet var. ([Flashscore SSS](https://www.flashscore.com/faq/ads), [Şikayetvar Mackolik](https://www.sikayetvar.com/mackolikcom), [kimola Mackolik](https://kimola.com/reports/unlock-insights-mackolik-app-user-feedback-report-app-store-tr-146438))
3. **Paywall kayması.** Önceden ücretsiz olan özellikler, örneğin xG ve derin istatistik, zamanla ücretli plana taşınıyor. Uygulama tekrar tekrar "yükselt" diye soruyor. ([unstar.app](https://unstar.app/blog/fotmob-onefootball-espn-365scores-sofascore-football-score-apps-ranked-2026))
   - Skor+ için ders: ücretsiz özelliği sonradan Pro'ya almayın. Paywall'u yalnız kullanıcı Pro bir özelliğe dokunduğunda gösterin.
4. **Gecikme ve yanlış veri.** Gol bildirimi TV'den sonra geliyor. Ara sıra yanlış skor ya da yanlış istatistik görünüyor. Mackolik'te "isabetli şut sayısı yanlış" şikâyetleri var. ([unstar.app](https://unstar.app/blog/fotmob-onefootball-espn-365scores-sofascore-football-score-apps-ranked-2026), [Şikayetvar](https://www.sikayetvar.com/mackolikcom/yanlis-isabetli-sut-sayisi-mackolikte-musteri-guvenini-sarsiyor))
   - Skor+ için kritik: ücretsiz planda canlı veri 30 dakikada bir geliyor. Bu gecikme gizlenirse güven kaybı kaçınılmaz. Gecikmeyi açıkça gösterin.
5. **Güncellemeden sonra regresyon, çökme ve kalabalık arayüz.** NBA app'te geri tuşu bozuldu. Flashscore'da açılışta donma raporları var. ESPN ve OneFootball'da skor, haber ve reklamla yer kavgası ediyor. ([marlvel NBA](https://marlvel.ai/api/llm/apps/sports/nba-live-games-scores), [Flashscore SSS](https://www.flashscore.com/faq/issue), [kimola ESPN](https://kimola.com/reports/unlock-insights-into-espn-app-user-feedback-and-issues-google-play-en-us-142128))

---

## 3. Skor+ için önceliklendirilmiş öneriler

Ön tespit: `supabase/functions/_shared/apiFootball.ts` maç zenginleştirmesini `/fixtures?ids=` (20'li toplu) ve `/fixtures?id=` ile yapıyor. Bu yanıtlar zaten `lineups` (formation, startXI, grid, substitutes) ve `players` (games.rating dahil) alanlarını içeriyor. Kod şu an bunlardan yalnız `home_coach`, `away_coach` ve `top_players` alanlarını çıkarıyor. Yani kadro ve oyuncu puanı listesi **ek API isteği gerektirmeden** yapılabilir.

Ek tespitler:
- `sync-matches` zaten dün, bugün ve yarın için `/fixtures?date=` çekiyor.
- Yüklü native paketler: expo-notifications, expo-blur, expo-updates ve diğerleri. `react-native-svg`, `react-native-view-shot`, `expo-sharing` ve widget kütüphanesi **yok**.
- `app.json` içinde `"userInterfaceStyle": "dark"` sabit.

Kolon açıklamaları:
- Zorluk: S küçük, M orta, L büyük.
- Kota: günlük ek API isteği tahmini.
- Native: yeni native modül veya app.json native ayarı gerekip gerekmediği. "Gerekir" ise kullanıcı yeni APK kurmalı. "Gerekmez" ise değişiklik OTA (expo-updates) ile dağıtılabilir.

| # | Öneri | Kullanıcı değeri | Zorluk | Kota (ücretsiz plan) | Native | Dokunulacak yerler |
|---|-------|------------------|--------|----------------------|--------|---------------------|
| 1 | **Kadro/diziliş görseli + maç sonu oyuncu puanları listesi** | Yüksek. FotMob ve SofaScore'un en çok kullanılan maç içi özelliği. | M | **0 ek istek.** Veri zaten gelen yanıtta. | Gerekmez. Saha View/absolute konumlama ile çizilir, SVG şart değil. | `supabase/functions/_shared/apiFootball.ts` (lineups ve players mapping), yeni migration (`matches` tablosuna `lineups jsonb`, `player_ratings jsonb`), `src/lib/data/types.ts`, `src/lib/data/supabaseSource.ts`, `src/app/match/[id].tsx` (yeni "Kadro" sekmesi), yeni `src/components/match/Lineup.tsx`, `PlayerRatings.tsx` |
| 2 | **Puan durumu** (lig tablosu, takımın satırı vurgulu) | Yüksek. Skor+'ta hiç yok ve rakiplerin hepsinde var. | M | Günde 1 kez lig başına 1 istek: `/standings?league=&season=`. Takip edilen lig sayısı kadar, yaklaşık 8-12 istek/gün. | Gerekmez | Yeni edge function `sync-standings` (veya `sync-matches` içine günlük adım), migration `standings` tablosu + RLS (okuma herkese açık), pg_cron, yeni `src/app/league/[id].tsx`, maç ekranından lige link |
| 3 | **Tarih şeridi / fikstür** (dün, bugün, yarın ve +7 gün) | Yüksek. "Bu hafta sonu kim kiminle?" sorusunun cevabı. | S-M | -1..+1 gün için 0 ek istek, veri zaten var. +2..+7 için günde 1 kez tarih başına 1 istek, yaklaşık 6/gün. | Gerekmez | `supabase/functions/sync-matches/index.ts` (günlük uzak tarih adımı), `src/hooks/useMatches.ts` (tarih parametresi), `src/app/index.tsx` (yatay tarih şeridi), `supabaseSource.listMatches(sport, date)` |
| 4 | **Veri tazeliği şeffaflığı + bildirim ince ayarı** | Yüksek güven etkisi. Şikâyet #1 ve #4'ü önler. | S | 0 | Gerekmez | Liste ve maç başlığında "Son güncelleme 14:32 · ~30 dk aralık" etiketi (`matches.updated_at`), `src/app/settings.tsx` içinde olay türü bazında seçim (gol, kırmızı, maç sonu) ve sessiz saatler. Tercihler sunucuda saklanır, push gönderen fonksiyon filtreler. |
| 5 | **Arama** (takım, lig) | Orta-yüksek. Takip edilecek takımı bulmak için gerekli. | S | 0. `teams` tablosu (0010_teams.sql) ve maç verisi DB'de. | Gerekmez | Yeni `src/app/search.tsx`, Supabase `ilike` sorgusu (Türkçe ad + orijinal ad), `index.tsx` başlığına arama ikonu |
| 6 | **Maç önü form + H2H kartı** (son 5 maç G/B/M, son karşılaşmalar) | Orta-yüksek. Maç önü taktik eşleşme (Pro) ile doğal tamamlanır. | M | DB'de biriken bitmiş maçlardan türetilirse 0. `/fixtures/headtohead` kullanılırsa maç başına 1 istek. Yalnız büyük veya takip edilen maçlar için, önbellekli. | Gerekmez | `src/components/preview/PreviewCards.tsx` veya Özet sekmesi, `supabase/functions/generate-preview` (mevcut `getLastFixtures` yardımcısı var) |
| 7 | **Paylaşım** (önce metin, sonra görsel kart) | Orta. Organik büyüme sağlar. | Metin: S. Görsel kart: L. | 0 | Metin için gerekmez (RN `Share` API). Görsel kart için `react-native-view-shot` + `expo-sharing` gerekir. | `src/app/match/[id].tsx` başlık aksiyonu. Mesaj skor, golcüler, AI özetin ilk cümlesi ve `skorplus://match/<id>` deep link içerir. |
| 8 | **Aydınlık tema** ve uzun vadede **ana ekran widget'ı** | Orta. Widget yüksek değerli ama pahalı. | Tema: M. Widget: L. | 0 | Uygulama içi tema seçimi JS ile yapılır. Sistem temasını takip etmek için `userInterfaceStyle: "automatic"` gerekir, bu native build ister. Widget native modül gerektirir (Android AppWidget). | `src/theme.ts` (renkleri token + context'e çevirme), tüm `StyleSheet` kullanımları. Widget'ı bir sonraki APK sürümüne bırakın. |

Bilinçli olarak listeye alınmayanlar:
- Canlı xG ve momentum grafiği: API-Football ücretsiz planı xG ve olay koordinatı vermiyor, 30 dakikalık canlı aralık da momentum için yetersiz.
- Live Activity: iOS'a özel ve native.
- Haber/video akışı: içerik lisansı gerekir, ayrıca kalabalık arayüz şikâyetine yol açar.

### Kota notları (doğrulanmalı)
- **Emin değilim:** API-Football ücretsiz planının içinde bulunulan sezona `/standings` erişimi verip vermediğini doğrulayamadım. Resmî sayfa "free plan gives access to the entire API" diyor, bir rehber ise "recent seasons" diyor. ([api-football.com](https://api-football.com), [başlangıç rehberi](https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide)) Uygulamaya geçmeden önce ücretsiz anahtarla tek bir `/standings?league=203&season=<güncel>` deneme çağrısı yapın. Süper Lig'in lig kimliği 203'tür; bunu da `/leagues` ile teyit edin.
- Mevcut günlük tüketim, `lastQuotaRemaining()` loglarından ölçülmeli. Öneri #2 ve #3'ün toplamı yaklaşık 15-20 istek/gün ekler. Kalan bütçe buna yetmiyorsa öncelik #3'ün -1..+1 kısmı (0 istek) ve #2'de yalnız takip edilen ligler olmalı.
- Endpoint referansları: `/standings`, `/fixtures/lineups`, `/fixtures/headtohead`, `/fixtures/players`. ([api-football v3 özeti](https://skills.sh/silkyland/thscore-api-skill/api-football-v3), [Jentic](https://jentic.com/apis/api-football.com/api-football)) Resmî şema için api-football.com/documentation-v3'e bakın.

---

## 4. İlk turda yapılacaklar

> Durum (2026-11-18): A, B ve C yapıldı (GELISTIRMELER 3.23). Fark: B'de +2..+7 gün **yapılmadı**, çünkü ücretsiz plan yalnız ±1 gün veriyor. Tablo #2 (puan durumu), #5 (arama), #6 (form/H2H), #7 (paylaşım) ve #8 (tema/widget) hâlâ açık. Bölüm 10'daki öneri listesi bunları yeniden sıralıyor.

Bu üç öneri native modül gerektirmez, OTA ile dağıtılabilir ve ücretsiz kotayı zorlamaz.

### A. Kadro/diziliş + oyuncu puanları (öneri #1, 0 ek istek)
Kabul kriterleri:
- Zenginleştirme adımı `lineups[].formation`, `startXI[].player{id,name,number,pos,grid}`, `substitutes[]` ve `coach` alanlarını, ayrıca `players[].statistics[0].games.rating/minutes` alanlarını `matches` satırına jsonb olarak yazar. Ek `apiGet` çağrısı eklenmez; bu birim testte veya fonksiyon testinde doğrulanır.
- Maç ekranında yeni bir "Kadro" sekmesi bulunur. Sekme iki takımın dizilişini saha üzerinde gösterir: forma numarası, kısa ad ve `grid` değerine göre satır/sütun. Yedekler ve teknik direktör altta liste olarak yer alır.
- Maç bittiğinde (FT, AET, PEN) oyuncu puanları listesi puana göre azalan sırada gösterilir. Maçın en iyi oyuncusu vurgulanır. Puanı olmayan veya 0 dakika oynayan oyuncu listelenmez.
- Kadro verisi yoksa sekme çökmeden "Kadrolar maçtan ~20-40 dk önce açıklanır" boş durumunu gösterir.
- NBA maçlarında sekme gösterilmez veya mevcut NBA istatistikleri bozulmaz.
- Uygulamaya native bağımlılık eklenmez. `package.json` içinde yeni native paket olmaz.

### B. Tarih şeridi / fikstür (öneri #3, -1..+1 için 0 istek, +7 gün için ~6 istek/gün)
Kabul kriterleri:
- Ana ekranın üstünde yatay bir tarih şeridi bulunur ("Dün · Bugün · Yarın · Cmt 22 Kas ..."). Varsayılan seçim "Bugün"dür.
- Tümü, Canlı, Biten ve ★Takip filtreleri seçili tarihle birlikte çalışır.
- `sync-matches`, +2..+7 günleri **günde en fazla bir kez** çeker. Bu yeni çağrılar kota korumasının (`skipped`/`quota`) içinde kalır. Kota azsa bu adım atlanır ve bugünün verisi asla etkilenmez.
- Gelecek tarihli maçlarda başlama saati Europe/Istanbul saatiyle gösterilir. Maç satırına dokununca maç ekranı açılır; takip et ve "maç başladı" bildirimi çalışır.
- Realtime aboneliği yalnız "Bugün" seçiliyken aktif kalır.

### C. Veri tazeliği etiketi + sunucu tarafı bildirim tercihleri (öneri #4, 0 istek)
Kabul kriterleri:
- Canlı maç satırında ve maç başlığında "Son güncelleme HH:MM" yazar. Ayarlar veya bilgi ikonunda "Ücretsiz veri kaynağı nedeniyle canlı skorlar ~30 dk aralıkla güncellenir" açıklaması bulunur. Gecikme gizlenmez.
- Bildirim ayarlarında olay türleri ayrı ayrı açılıp kapatılabilir: maç başladı, devre arası, maç sonu, alarmlar. İsteğe bağlı olarak sessiz saat aralığı da seçilebilir.
- Tercihler Supabase'de kullanıcıya bağlı saklanır (RLS: yalnız sahibi okur ve yazar). Uygulama güncellemesinden veya yeniden kurulumdan sonra korunur.
- Push gönderen fonksiyonlar tercihi kontrol eder. Kapalı türde bildirim gönderilmez. Takip edilmeyen maç veya takım için hiçbir bildirim gitmez. Bu kurallar test ile doğrulanır.

---

## 5. Türk kullanıcı için NBA kapsamı (2026-11-18)

Skor+'ın NBA tarafı (box score, takip, NBA analizi, NBA taktik asistanı) Türkçe arayüzle sunuluyor. Rakiplerin durumu şöyle:

| Rakip | NBA skoru | NBA box score | Türkçe arayüz | Not |
|-------|-----------|---------------|---------------|-----|
| **NBA app (resmî)** | Var | Var, en derin kaynak | **Doğrulanamadı.** Üretken AI ile yerelleştirme yalnız Fransızca, Portekizce ve İspanyolca için duyuruldu. ([NBA 2026-27 dijital deneyimler](https://www.nba.com/news/nba-digital-experiences-2026-27), [WSC Sports](https://wsc-sports.com/blog/customer-spotlight/nba-launches-genai-technology-with-wsc-sports-to-automate-multilingual-content/)) | Türkiye'de Sporx'un hazırladığı ayrı bir "NBA Türkiye" uygulaması geçmişte vardı. Güncel durumu doğrulanamadı. ([tamindir](https://www.tamindir.com/indir/nba-turkiye/amp/)) |
| **Sofascore** | Var, Türkçe sayfalar | Var. NBA için oyuncu puanı da eklendi. ([Sofascore basketbol haberleri](https://www.sofascore.com/news/tag/basketball), [Sofascore TR basketbol maç sayfası](https://www.sofascore.com/tr/basketball/match/teamleague-team/toFisuoFi)) | Var | Box score sütun düzeninin ayrıntısı doğrulanamadı. |
| **Flashscore** | Var. TR App Store sayfası NBA, Euroleague ve BSL'yi listeliyor. ([App Store TR](https://apps.apple.com/tr/app/id766443283?l=tr&mt=8)) | Oyuncu istatistiği var (genel bilgi). Ayrıntısı doğrulanamadı. | Var | — |
| **Mackolik** | Basketbol canlı sonuç sayfası var. ([mackolik basketbol](https://www.mackolik.com/basketbol/canli-sonuclar)) | **Doğrulanamadı.** NBA box score derinliğini gösteren resmî bir kaynak bulunamadı. Bir indirme sitesi "futbol ve basketbolda 800+ lig, oyuncu istatistikleri" diyor. ([tamindir](https://www.tamindir.com/indir/mackolik/)) | Var | — |
| **365Scores, AiScore** | Var, Türkçe NBA sayfaları ([365Scores TR](https://www.365scores.com/tr/basketball/league/nba-103), [AiScore TR](https://www.aiscore.com/tr/basketball)) | Kısmen | Var | — |
| **ESPN** | Var. Box score ve play-by-play derin. ([ESPN scoreboard](https://www.espn.com/nba/scoreboard/_/name/adl)) | Var | Yok (doğrulanamadı) | — |
| **FotMob** | Yok. Yalnız futbol. | — | Var | — |

Çıkarım: Türkçe NBA box score'u **Sofascore ve Flashscore zaten veriyor**. Skor+'ın NBA'de tek başına "box score var" demesi fark yaratmaz. Fark yaratabilecek tek şey **Türkçe NBA AI yorumu**. Taranan rakiplerde Türkçe NBA maç analizi veya Türkçe NBA sohbet asistanı bulunamadı. Resmî NBA app'in AskNBA asistanının hangi dilleri desteklediği doğrulanamadı.

## 6. Rakiplerde AI/LLM özellikleri (2026-11-18)

- **NBA app — AskNBA ve Game Pulse (Ekim 2026).** AskNBA resmî NBA verisiyle çalışan bir AI sohbet asistanı. Oyun, oyuncu, istatistik ve saha içi eğilim sorularını yanıtlıyor. Game Pulse canlı highlight, istatistik ve içgörüyü tek ekranda topluyor. Rapora göre NBA birden fazla LLM kullanıyor ve modelleri değiştirebiliyor. ([SVG, 2026-10-20](https://sportsvideo.org/2026/10/20/nba-app-adds-game-pulse-ai-based-chat-feature-to-keep-fans-tuned-in), [Barrett Media](https://barrettmedia.com/2026/10/19/nba-ai-features-tap-to-watch-app/), [NBA.com](https://www.nba.com/news/nba-digital-experiences-2026-27))
  - Skor+ için anlamı: Skor+'ın NBA taktik asistanının **doğrudan resmî bir rakibi var**. Ancak AskNBA'nın Türkçe desteği doğrulanamadı. Skor+ farkını Türkçe dil ve maça kilitli bağlamla korumalı.
- **ESPN — "SportsCenter for You" (beta, Temmuz 2026).** AI ile kişisel haber ve maç özeti üretiyor. ESPN 2024'ten beri AI maç özetlerini "ESPN Generative AI Services" imzasıyla ve editör kontrolüyle yayınlıyor. Bir özette yanlış tarih ve yanlış takım derecesi çıktı, grafik kaldırıldı. ([Front Office Sports](https://frontofficesports.com/espn-ai-generated-soccer-lacrosse/), [ESPN Press Room](https://espnpressroom.com/feature/enhancing-espns-game-recaps-for-underserved-sports-using-ai/), [CO/AI](https://getcoai.com/news/espn-launches-20-30-streaming-service-with-47k-live-events/))
  - Skor+ için ders: AI metni etiketlenmeli ve sayılar veriyle doğrulanmalı. Skor+ zaten sayı doğrulaması ve futbol terimi bekçisi kullanıyor (3.17, 3.26). Bu, ESPN'in yaşadığı hata türüne karşı doğru yatırım.
- **Sofascore.** Ocak 2026'da AI destekli kişisel "Feed" çıktı ve sonra tüm dillere açıldı (Türkçe dahil). Tenis için "AI Insights" Analyst paketinde. Maç öncesi AI tahmini, set kazanma olasılığı ve skor matrisi içeriyor. Futbol veya basketbol için AI maç analizi bulunamadı. ([Sofascore TR haber](https://www.sofascore.com/tr/news/sofascore-feed-goes-global-now-in-every-language), [App Store](https://apps.apple.com/ca/app/id1176147574))
- **FotMob.** Resmî bir AI maç özeti duyurusu **bulunamadı (doğrulanamadı)**. Son güncellemeler maç anlatımı, Dünya Kupası tahmin oyunu ve Lineup Builder. "FotMob AI" diyen bazı blog yazıları SEO içeriği gibi duruyor, güvenilir değil. ([App Store](https://apps.apple.com/ae/app/id488575683))
- **Mackolik ve Flashscore.** AI analiz özelliği bulunamadı (doğrulanamadı).
- **Bundesliga — "Captain" (Haziran 2026).** Resmî lig uygulamasında AWS ile geliştirilmiş AI asistan. ([SVG](https://www.sportsvideo.org/2026/06/03/bundesliga-launches-ai-assistant-captain-in-official-app-developed-with-aws/))
- **Yeni AI-öncelikli uygulamalar.** GOALLINE AI "her maçtan sonra AI maç analizi ve rapor" vaat ediyor. Kullanıcı sayısı ve kalitesi doğrulanamadı. ([App Store](https://apps.apple.com/app/id6761960713)) XbotGo Pro Soccer ve SICS Atlas gibi ürünler video tabanlı ve amatör kulüp veya scouting odaklı. Bunlar Skor+'ın rakibi değil. ([XbotGo](https://technode.global/prnasia/xbotgo-launches-pro-soccer-bringing-professional-ai-tactical-analysis-and-multi-tier-highlights-to-grassroots-football/), [Soccerment](https://fortune.com/press-releases/soccerment-launches-sics-atlas-ai-football-analysis-scouting-2026-08-20/))

Çıkarım: Büyük rakiplerde AI ya kişisel akış (Sofascore, ESPN) ya da resmî veri sohbeti (NBA, Bundesliga) biçiminde. **Türkçe, maç sonrası taktik analiz + devre arası raporu + maça kilitli sohbet** paketini sunan bir rakip bu taramada bulunamadı. Bu Skor+'ın en savunulabilir alanı.

## 7. Premium fiyatları (2026-11-18)

| Ürün | Fiyat | Ne veriyor | Kaynak / güven |
|------|-------|------------|----------------|
| Maçkolik Pro | 14,99 TL/ay (KDV dahil) | Reklamsız. Cayma hakkı yok. | [Mesafeli satış sözleşmesi](https://www.mackolik.com/static-mackolik-mesafeli-satis-sozlesmesi.html). Sayfa tarihsiz, fiyat eski olabilir. **Güncel fiyat doğrulanamadı.** |
| Flashscore+ | £3,99/ay veya £29,99/yıl; €3,99/ay veya €33,99/yıl | Reklamsız. SSS'ye göre yalnız iOS'ta. | [Flashscore duyurusu](https://www.flashscore.co.uk/news/flashscore-introduces-ad-free-flashscore-with-new-subscription-prices/xfLPIrAs), [TR duyuru](https://www.flashscore.com/news/flashscore-reklams-z-flashscore-ve-yeni-abonelik-fiyatlar-n-sunar/dhkDp1u2), [SSS](https://www.flashscore.com/faq/ads) |
| Sofascore reklamsız | Aylık ve yıllık abonelik var. Üçüncü taraf takipçi $6,49/ay ve $24,99/yıl diyor. | Reklamsız. Tenis AI Insights ayrı "Analyst" paketinde. | [Sofascore yardım](https://sofascore.helpscoutdocs.com/article/161-interstitial-full-screen-ads-explained), [apppricinglab](https://apppricinglab.com/iap/apple/1176147574). **Fiyat doğrulanamadı.** |
| FotMob | Üçüncü taraf takipçi: Standart $1,99/ay, $15,99/yıl; Aile $2,99/ay, $29,99/yıl | Reklamsız (paket içeriği doğrulanamadı) | [apppricinglab](https://apppricinglab.com/iap/apple/488575683). **Doğrulanamadı.** |
| NBA League Pass | Giriş fiyatı $19,99/ay (ABD; üçüncü taraf) | Canlı yayın. Box score ve AskNBA ücretsiz NBA app içinde. | [Subger](https://subger.com/en/service/nba-league-pass). **TL fiyatı doğrulanamadı.** |

Çıkarım: Türkiye'de rakiplerin ücretli katmanı **yalnız reklam kaldırıyor** ve Maçkolik'te çok ucuz (sözleşmeye göre 14,99 TL/ay). Skor+ Pro'nun fiyatı "reklamsız" ile değil, **AI analizi** ile gerekçelendirilmeli. Paywall metni "reklamsız" vaadine dayanmamalı.

## 8. APK ile dağıtım: emsaller ve 2026-2027 riski

- **Android geliştirici doğrulaması.** Google, Play dışından yüklenen (sideload) uygulamalar için de geliştirici kimlik doğrulaması istiyor. Zorunluluk 30 Eylül 2026'da Brezilya, Endonezya, Singapur ve Tayland'da başladı. Küresel yayılım 2027'de planlanıyor. **Türkiye için tarih doğrulanamadı.** ([Android Authority, zaman çizelgesi](https://www.androidauthority.com/android-sideloading-changes-timeline-3679204/), [Android Authority, ilk dalga](https://androidauthority.com/android-sideloading-developer-verification-first-wave-rollout-3717921), [Android Developers Blog, Mart 2026](https://android-developers.googleblog.com/2026/03/android-developer-verification.html))
  - Tam dağıtım hesabı: Android Developer Console'da tek seferlik $25. Ücretsiz "Limited Distribution" hesabı en fazla 20 cihaza dağıtıma izin veriyor. ([developer.android.com](https://developer.android.com/developer-verification), [Google destek](https://support.google.com/android-developer-console/answer/16561738))
  - Doğrulanmamış uygulamalar için uyarılı, çok adımlı ve bekleme süreli bir "gelişmiş sideload akışı" var. ADB de kullanılabiliyor. ([Engadget](https://engadget.com/apps/android-will-hide-app-sideloading-behind-a-new-one-time-security-process-184651171.html))
  - **Skor+ için anlamı:** Türkiye'de zorunluluk başlayınca doğrulanmamış Skor+ APK'sı ya kurulmaz ya da kullanıcıyı caydıran bir akıştan geçer. Paket adı (`applicationId`) ve imzalama anahtarı doğrulanmış geliştirici hesabına kaydedilmeli. Anahtar şimdiden sabit tutulmalı: EAS'in yönettiği keystore değişirse kayıt ve OTA zinciri bozulur.
- **Emsal ve itibar riski.** Türkiye'de APK ile dağıtım en çok korsan yayın ve yasa dışı bahis uygulamalarıyla anılıyor. BTK 2025'te 84.000'den fazla yasa dışı bahis sitesini engelledi. Bahis içerikli 26 uygulama BTK'ya bildirildi. ([Daily Sabah](https://www.dailysabah.com/turkiye/turkiye-blocks-over-84000-illegal-betting-websites-in-2025/news), [SIGMA](https://sigma.world/news/turkey-illegal-gambling-crackdown-84000-sites/)) TFF'nin korsan futbol yayınına erişim engeli yetkisi de var. Anayasa Mahkemesi bu yetkiyi iptal etti, iptalin yürürlük tarihi 14 Temmuz 2026. Sonrası doğrulanamadı. ([İFÖD EngelliWeb 2025](https://ifade.org.tr/en/reports/engelliweb-2025/10-turkish-football-federation/))
  - **Skor+ için ders:** "Skor uygulaması APK" kullanıcı gözünde bu kategoriye karışabilir. İndirme sayfasında şunlar açıkça yazmalı: yayın yok, bahis oranı yok, SHA-256 imza özeti, gizlilik/KVKK metni. Bahis oranı veya iddaa entegrasyonu **eklenmemeli** (bkz. bölüm 10).
- **Ödeme.** Play dışı dağıtımda Google Play Billing zorunlu değil. Ancak RevenueCat'in Android tarafı Play Billing'e dayanıyor (GELISTIRMELER 3.21 / 3.22). APK'da Pro satışı için web ödemesi (ör. iyzico veya Stripe) ve sunucu taraflı yetki gerekir. Bu bir mimari karar. Bu araştırmada fiyat ve komisyon ayrıntısı doğrulanmadı.

## 9. API-Sports'a ucuz veri alternatifleri (2026-11-18)

Mevcut durum: API-Sports ücretsiz planı spor başına 100 istek/gün veriyor ve sayaç 00:00 UTC'de sıfırlanıyor. ([API-NBA başlangıç rehberi](https://www.api-football.com/news/post/how-to-get-started-with-api-nba-the-complete-beginners-guide)) Skor+'ta futbol ve NBA bu kotayı paylaşıyor (görev tanımına göre).

| Kaynak | Ücretsiz katman | En ucuz ücretli | NBA box score | Futbol | Lisans / ToS |
|--------|-----------------|-----------------|---------------|--------|--------------|
| **API-Sports (mevcut)** | 100 istek/gün, tüm endpoint'ler; free planın sezon kısıtı belirsiz ("recent seasons") | **Pro $15/ay: 7.500 istek/gün, 300 istek/dk** (NBA ürünü). Üçüncü taraf: Ultra $25, Mega $35. | Var (`/players/statistics`); 7.500/gün ile canlıda dakikalık çekim mümkün | Var | **Doğrulanamadı.** Fiyat ve şart sayfaları 403 döndü. Planların spor başına ayrı satıldığı izlenimi var, o da doğrulanamadı. ([api-sports.io NBA](https://api-sports.io/sports/nba), [highlightly kıyas](https://highlightly.net/blogs/best-nba-apis-in-2026), [api-football.com](https://api-football.com)) |
| **balldontlie** | 5 istek/dk; yalnız takım, oyuncu ve maç. **Oyuncu istatistiği yok.** | **ALL-STAR $9,99/ay (lig başına): 60 istek/dk, "Game Player Stats" (devam eden maçta gerçek zamanlı).** GOAT $39,99/ay: 600 istek/dk, `/box_scores` ve `/box_scores/live`, play-by-play, puan durumu. | ALL-STAR'da oyuncu bazlı canlı istatistik; hazır box score uç noktası GOAT'ta | Ayrı lig aboneliği (doğrulanamadı) | Ticari kullanım şartları **doğrulanamadı**. GOAT için 7 günlük deneme var. ([balldontlie docs](https://docs.balldontlie.io/), [balldontlie.io](https://www.balldontlie.io/)) |
| **Highlightly** | 100 istek/gün; box score'un free'de olup olmadığı çelişkili | $7,99/ay'dan başlıyor, spor başına | GOAT ($39,99) gerektirebilir (çelişkili) | Ayrı ürün | Doğrulanamadı. ([Highlightly](https://highlightly.net/blogs/best-nba-apis-in-2026)) |
| **football-data.org** | 10 istek/dk; 12 turnuva; **skorlar gecikmeli**; kadro yok | €12/ay canlı skor (20/dk); **Standard €49/ay**: 30 turnuva, kadro ve kart (30/dk); İstatistik eklentisi €15/ay; xG eklentisi €30/ay | Yok | Free'deki 12 turnuvada **Süper Lig yok**. Süper Lig'in hangi pakette olduğu doğrulanamadı. | Ticari kullanım şartı doğrulanamadı. Bulunan tek resmî şart metni 2018 tarihli. ([fiyatlar](https://www.football-data.org/pricing), [politikalar](https://docs.football-data.org/general/v4/policies.html), [şartlar](https://api.football-data.org/register)) |
| **Sportmonks** | Free: yalnız Danimarka Superliga + İskoçya Premiership | "5 lig €29/ay" (ana sayfa) veya özel fiyat (plan sayfası); 14 gün deneme | Yok (futbol odaklı) | Var, 2.200+ lig | Doğrulanamadı. ([Sportmonks free plan](https://www.sportmonks.com/football-api/free-plan), [plan & fiyat](https://www.sportmonks.com/football-api/plans-pricing)) |
| **TheSportsDB** | 30 istek/dk, sonuçlar sınırlı, canlı skor yok | Single Developer $9/ay (2 dk canlı skor, 100/dk); Small Business $20/ay (120/dk) | Oyuncu box score'u doğrulanamadı (muhtemelen yok) | Temel | Kişisel ve işletme katmanı ayrı. Bu, ticari kullanım için işletme katmanı gerektiğine işaret ediyor (çıkarım). **Görsel ve logo hakları için ayrı lisans uyarısı var.** ([fiyatlar](https://www.thesportsdb.com/pricing), [kullanım şartları](https://www.thesportsdb.com/docs_terms_of_use.php)) |
| **stats.nba.com (nba_api)** | Resmî olmayan, ücretsiz | — | Var, en derin | — | **Kullanmayın.** NBA.com şartları materyallerin "public or commercial purposes" için kullanımını yasaklıyor. Bulut IP'leri (AWS vb.) pratikte engelleniyor. Supabase Edge'den de çalışmayabilir. ([NBA.com Terms](https://www.nba.com/terms), [nba_api](https://github.com/rsforbes/nba_api)) |
| **ESPN gizli API (site.api.espn.com)** | Belgesiz, ücretsiz | — | Var | Var | **Kullanmayın.** Resmî destek ve lisans yok. Üçüncü taraflar ticari üründe kullanılmamasını öneriyor. ([Zuplo rehberi](https://zuplo.com/learning-center/espn-hidden-api-guide), [sportsapis.dev](https://sportsapis.dev/espn-api)) |

Çıkarımlar:
1. **En ucuz yükseltme yolu büyük ihtimalle API-Sports Pro.** Kod tabanı zaten API-Sports'a bağlı. 7.500 istek/gün, 30 dakikalık canlı aralığı 1-2 dakikaya indirebilir. `app_config.api_paid` bayrağı (3.20) bu geçiş için hazır. Futbol ve NBA ayrı satılıyorsa toplam yaklaşık $30/ay olur (doğrulanamadı). Karar vermeden önce dashboard'daki fiyatı ve şartları (önbellekleme, yeniden dağıtım, logo kullanımı) elle okuyun.
2. **Yalnız NBA'i ucuzlatmak için balldontlie ALL-STAR ($9,99/ay)** dikkate değer. NBA'i API-Sports kotasından çıkarırsa futbola ücretsiz planda 100 isteğin tamamı kalır. Ancak oyuncu ve takım kimlikleri farklı, eşleme katmanı gerekir. Ticari şartları ayrıca okunmalı.
3. **Futbol için football-data.org ücretsiz planı Skor+'a uygun değil**: skorlar gecikmeli, Süper Lig yok, kadro yok.
4. **Logo riski.** NBA logoları tescilli marka. Wikimedia'dan aynalamak (3.26) telif durumunu değil yalnız teknik erişimi çözer. Bu araştırmada lisans durumu doğrulanmadı. Hukuki görüşe kadar logo kullanımı not edilmeli.

---

## 10. Skor+ için öneriler (öncelik sırasıyla, 2026-11-18)

**Kapatılmaya değer boşluklar**

1. **Android geliştirici doğrulamasına hazırlık (önce, düşük maliyet).** $25 tam dağıtım hesabı açın. Paket adını ve imza anahtarını kaydedin. İndirme sayfasına imza özeti, "yayın/bahis yok" notu ve KVKK bağlantısı koyun. Neden: 2027'de Türkiye'ye gelmesi beklenen zorunluluk APK kurulumunu durdurabilir (bölüm 8).
2. **Pro'yu "Türkçe AI analisti" olarak konumlandırın.** Taranan rakiplerin hiçbirinde Türkçe maç sonu taktik analizi, devre arası raporu veya maça kilitli sohbet bulunamadı. Rakiplerin ücretli katmanı yalnız reklamsızlık (bölüm 6-7). Paywall ve indirme sayfası bu farkı öne çıkarmalı. Kod gerekmez, metin işi.
3. **Puan durumu (eski tablo #2).** Tüm rakiplerde var, Skor+'ta hâlâ yok. Lig başına günde 1 istek. NBA için konferans sıralaması da aynı mantıkla eklenebilir. Ücretsiz planda `/standings` güncel sezon erişimi hâlâ doğrulanmadı. Önce tek bir deneme çağrısı yapın.
4. **Ücretli veri planına geçiş kararı (API-Sports Pro).** Canlı tazelik en büyük şikâyet konusu (bölüm 2, #4). Pro aboneliği başlayınca `api_paid=true` ile 30 dakikalık aralık kalkar. NBA'de canlı box score açılır (3.24 notu). Gelir modeli netleşmeden önce balldontlie ALL-STAR ile NBA'i ayırmak ara çözüm olabilir.
5. **Arama ve form/H2H kartı (eski #5, #6).** 0 ek istek. Maç önü AI'ın "yorumcu modu"nu (3.25) somut veriyle besler.
6. **NBA'de AI'ı derinleştirin, box score'u değil.** Box score zaten rakiplerde Türkçe var. Değer, NBA analizinde: periyot kırılmaları, bench katkısı ve son çeyrek gibi Türkçe çıkarımlar. 3.26'daki NBA dosya çıkarımları bu yönde. AskNBA Türkçeye gelirse bu fark daralır, bu yüzden hızlı olunmalı.
7. **AI metin güvenliğini koruyun ve görünür yapın.** "AI tarafından üretildi, veriye dayanır" etiketi ekleyin. Yanlış sayı için "hata bildir" düğmesi koyun. ESPN'in AI özet hatası emsal (bölüm 6).
8. **Paylaşım (eski #7, önce metin).** Organik büyüme sağlar. Play Store yokken bu kanal daha da önemli.

**Kaçınılması gerekenler**

- **Bahis oranı veya iddaa entegrasyonu.** Türkiye'de yasa dışı bahisle mücadele çok sert. APK dağıtımı zaten bu kategoriyle karışma riski taşıyor (bölüm 8). Bazı veri sağlayıcıların oran uç noktaları olsa da eklemeyin.
- **Canlı yayın, video ve highlight bağlantısı.** Korsan yayın engelleriyle aynı sepete düşme riski var ve içerik lisansı gerekir.
- **stats.nba.com ve ESPN gizli API.** Lisans dışı ve bulut IP'lerinden kırılgan (bölüm 9).
- **Ücretsiz özelliği Pro'ya taşımak.** Kadro, puan ve box score ücretsiz kalmalı (bölüm 2, #3).
- **"Reklamsız"ı Pro gerekçesi yapmak.** Maçkolik Pro'nun sözleşmedeki fiyatı 14,99 TL/ay. Bu fiyatla rekabet edilemez.
- **Canlı xG ve momentum grafiği.** API-Football ücretsiz planı xG vermiyor. Ücretli planda xG olup olmadığı doğrulanamadı. football-data.org'da xG ayrı ücretli eklenti (€30/ay).
- **Genel amaçlı sohbet botu.** Maça kilitli asistan, Bundesliga "Captain" ve AskNBA gibi resmî asistanlardan ayrışmanın yolu. Genel sohbet hem maliyetli hem de rakiplerle doğrudan çakışır.

---

## 11. Araştırma turu 3 (2026-11-18): doğrulamalar, büyüme mekanikleri, kotayla tazelik

Bu bölüm önceki bölümleri değiştirmez. Önceki "doğrulanamadı" maddelerinin güncel durumu 11.1'de.

### 11.1 Açık maddelerin doğrulaması

| Madde | Sonuç | Kaynak |
|-------|-------|--------|
| Sideload geliştirici doğrulaması, Türkiye tarihi | **Hâlâ doğrulanamadı.** Google'ın resmî rehberi yalnız 1. aşamayı tarihliyor: 30 Eylül 2026, Brezilya, Endonezya, Singapur ve Tayland. 2027 için yalnız "küresel genişleme" deniyor. Ülke listesi ve ay verilmiyor. Pratik varsayım: Türkiye 2027 içinde herhangi bir tarihte gelebilir. Hazırlık şimdiden yapılmalı. | [developer.android.com rehber](https://developer.android.com/developer-verification/guides), [Android Developers blog](https://developer.android.com/blog/posts/android-developer-verification-building-a-safer-ecosystem-together), [TechRepublic](https://www.techrepublic.com/article/news-google-android-developer-verification-september-2026/) |
| API-Sports fiyatları | **Kısmen doğrulandı (RapidAPI üzerinden).** API-Football: Pro $19 (7.500/gün), Ultra $29 (75.000/gün), Mega $39 (150.000/gün). API-NBA: Ultra $25 (20.000/gün), Mega $35 (50.000/gün). Önceki bölümdeki "NBA Pro $15 / 7.500" bilgisi api-sports.io'nun kendi sayfasından geliyor. RapidAPI fiyatları doğrudan dashboard fiyatlarından farklı olabilir. **Futbol ve NBA ayrı ürün, ayrı abonelik.** Paket indirimi bulunamadı. | [RapidAPI API-Football](https://rapidapi.com/api-sports/api/api-football/pricing), [RapidAPI API-NBA](https://rapidapi.com/de/api-sports/api/api-nba/pricing), [api-football.com/pricing](https://www.api-football.com/pricing) |
| **Kota gerçekten ortak mı?** | **Önemli belirsizlik.** Kod (0004_quota.sql, `nbaApi.ts`) futbol ve NBA'in aynı 100 istek/günü paylaştığını varsayıyor. Kaynaklar ise ürünleri ayrı listeliyor ve her birinde "100 istek/gün" yazıyor. Bu, kotanın **ürün başına** olabileceğini düşündürüyor. Doğrulanamadı. Test 2 istek tutar: aynı anahtarla `v3.football.api-sports.io/status` ve `v2.nba.api-sports.io/status` çağrılır, `requests.current` ve `limit_day` alanları karşılaştırılır. Kota ürün başınaysa bütçe fiilen 2 katıdır. | [API-NBA rehberi](https://www.api-football.com/news/post/how-to-get-started-with-api-nba-the-complete-beginners-guide), [RapidAPI API-Basketball](https://rapidapi.com/it/api-sports/api/api-basketball/pricing) **Çözüldü: kotalar ayrı (2026-11-18 üretim logları).** API-Football ve API-NBA her biri kendi 100/gün kotasına sahip (2026-11-17 logu: aynı 30 dk'da futbol 63 → 59, NBA 49 → 30); kod `supabase/functions/_shared/quota.ts`. |
| API-Sports kullanım şartları | **Kısmen.** Arama özetine göre şartlar, verinin ürünlerde kullanılması veya yayınlanması için gerekli izin ve lisansları almayı **kullanıcının sorumluluğu** sayıyor. Ayrıca yarışmalar üzerinde "herhangi bir ticari hak vermiyor". Önbellekleme, gösterim ve logo kuralları doğrulanamadı; sayfa 403 döndü. Anlamı: API-Sports veri erişimi satıyor, lig verisi ve logolar için lisans vermiyor. Ticari yayından önce hukukçu görüşü gerekir. | [api-football.com/terms](https://www.api-football.com/terms) (arama özeti) |
| AskNBA Türkçe destekliyor mu? | **Doğrulanamadı.** NBA.com duyurusunda ve SVG röportajında dil bilgisi yok. SVG, AskNBA'nın "sınırlı beta" deneyiminden söz ediyor ve video highlight'ların yolda olduğunu yazıyor. NBA'in duyurulan AI yerelleştirmesi yalnız Fransızca, Portekizce ve İspanyolca. Türkçe izine rastlanmadı. | [NBA.com](https://www.nba.com/news/nba-digital-experiences-2026-27), [SVG](https://sportsvideo.org/2026/10/20/nba-app-adds-game-pulse-ai-based-chat-feature-to-keep-fans-tuned-in), [NBA PR](https://pr.nba.com/nba-app-launches-new-digital-features-highlighted-by-multiview-ahead-of-the-2024-25-season) |

### 11.2 Play Store'suz büyüme ve elde tutma mekanikleri

Genel uyarı: Bulunan rakamların neredeyse tamamı satıcı vaka çalışması (push veya analitik şirketi). Kontrol grubu yok. Bunları kesin etki değil, yön olarak okuyun. Bahissiz tahmin oyunları için bağımsız ve ölçülmüş bir retention verisi **bulunamadı**.

| Mekanik | Ölçülen sonuç | Güven | Skor+ için uygunluk |
|---------|---------------|-------|---------------------|
| **Kişisel, olay bazlı push** | Uygulamayı indiren ve 90 gün içinde en az 1 push alan kullanıcıda retention %5'ten %10'a çıkıyor; haftalık push ile %30'a kadar (63 milyon kullanıcı, sektörler arası, 2017). Maçkolik, gol bildirim sesini "gol" sesine çevirince açılma oranı ve retention arttı diyor, yüzde vermiyor. SPORT1'de push açılma oranı %8'e kadar çıktı. | Orta (eski, satıcı) | **Yüksek.** Skor+'ta push altyapısı zaten var (FCM). Maç sesi ve takım bazlı kişiselleştirme ucuz. ([Airship 2017](https://www.airship.com/?p=15627), [Netmera Maçkolik](https://netmera.com/mackolik-case-study/), [Pushwoosh SPORT1](https://www.pushwoosh.com/blog/sport1/)) |
| **Canlı kilit ekranı / Live Activity** | TNT Sports'ta Live Activity kullanıcıları 2 kat oturum açtı; canlı izleme oturumları %25 arttı. | Orta (satıcı) | Düşük-orta. Live Activity iOS'a özel. Android karşılığı, kalıcı (ongoing) canlı skor bildirimi. ([Airship TNT](https://www.casestudies.com/company/airship/case-study/tnt-sports-boosts-live-viewing-sessions-25-with-airship)) |
| **Ana ekran widget'ı** | Gratitude uygulamasında widget kullanıcılarının retention'ı %25 daha yüksek. DAU'nun %10'u widget kullanıyor. Uygulama içi "widget'ı sabitle" düğmesi kurulum sayısını artırdı. Jetpack Glance geliştirme süresini ~%50 kısalttı. | Orta (Google blogu, tek vaka, nedensellik zayıf) | Orta. Native modül ister, yani yeni APK. Spor uygulaması verisi değil. ([Android Developers Blog, Mayıs 2026](https://android-developers.googleblog.com/2026/05/how-gratitude-widgets-boosted-user-retention-25-percent.html)) |
| **Sabah özeti (günde 1, sabit saat)** | Günde 1 bildirim alışkanlık kurmak için iyi; alışkanlık sabit saatte daha iyi oluşuyor. Sabah push'u gün boyu aktivasyonu %15 artırdı (haber yayıncıları, satıcı). Zamanlama verileri çelişkili: Pushwoosh sabah ve Cumartesi tepesi görüyor, Leanplum öğleden önce düşük etkileşim görüyor. | Düşük-orta | **Yüksek, maliyet 0.** Dünün sonuçları, bugünün takip edilen maçları ve AI özetin ilk cümlesi sabah 09:00 TSİ'de gönderilebilir. Sunucuda DB'den üretilir, API isteği yok. Ölçüm için A/B saati denenmeli. ([Twipe](https://www.twipemobile.com/3-findings-from-experiments-with-triggers-via-push-notifications-website-and-email/), [Andrew Chen / Leanplum](https://andrewchen.com/breaking-down-671-million-push-notifications-by-hour/amp/)) |
| **Davet (referral)** | Dream11'de davetle gelen trafikte dönüşüm %37, kayıt %28 daha yüksek; kanal ücretli edinimden ucuz. K-faktör = kullanıcı başına davet × davet dönüşümü; 1'in altı da anlamlı. | Orta (satıcı; ödüllü fantezi oyunu) | Orta. Play Store yokken davet bağlantısı aynı zamanda **indirme kanalı**. Ödül olarak "7 gün Pro" verilebilir. Ancak gerçek ödeme gelene kadar ödülün maliyeti yalnız AI çağrısı. ([AppsFlyer Dream11](https://www.appsflyer.com/customers/dream11/), [Tenjin K-faktör](https://tenjin.com/glossary/k-factor/)) |
| **Paylaşım kartı** | Spor uygulamasına özgü tıklama veya kurulum verisi **bulunamadı**. | — | Orta. Mekanizma davetle aynı. Kart içine indirme bağlantısı ve deep link konursa ölçülebilir. |
| **Bahissiz tahmin oyunu / skor tahmini, liderlik tablosu** | Ölçülmüş retention verisi yok. Satıcı görüşü: düz puan yerine seri (streak) ve güven çarpanı, küresel tablo yerine **arkadaş tablosu** daha iyi elde tutuyor. Bahissiz biçimler sportsbook lisansı gerektirmiyor. Hukuki dayanağı kaynakta yok. | Düşük | Orta, dikkatli. Türkiye'de ödül + tahmin, şans oyunu düzenlemesine yaklaşabilir. **Para veya maddi ödül olmadan**, yalnız rozet ve seri ile yapılmalı. Hukuki görüş doğrulanamadı. ([Game-Ace](https://game-ace.com/blog/game-predictions-in-sports/), [Predictfully](https://www.pocketgamer.biz/industry/predictfully)) |

Çıkarım: Ucuz ve 0 API isteği tutan en güçlü üçlü şu: **takım bazlı kişisel push + sabah özeti + davet/paylaşım bağlantısı.** Widget en iyi kanıta sahip ama native, yani bir sonraki APK'ya kalmalı. Tahmin oyunu kanıtı en zayıf ve hukuki riski en yüksek olan.

### 11.3 100 istek/gün ile canlı tazeliği artırmak (ücretli plan olmadan)

Mevcut durum (`0004_quota.sql`): futbol canlısı 12:00-22:59 UTC arasında sabit 30 dakikada bir çalışıyor (~22 çağrı). NBA canlısı 23:00-06:59 UTC arasında 30 dakikada bir (~16 çağrı). Cron, o saatte maç olsa da olmasa da API'yi çağırıyor.

Temel gözlem: `GET /fixtures?live=all` **tek istekle tüm canlı maçları** döndürüyor. ([API-Football: çağrı tasarrufu](https://www.api-football.com/news/post/how-to-save-calls-to-the-api), [Jentic](https://jentic.com/apis/api-sports.io/api-sports)) Yani maliyet maç sayısına değil **yoklama (poll) sayısına** bağlı. Boş saatlerde harcanmayan her istek, maçların yoğun olduğu 2 saate kaydırılabilir. API-Football'un kendi rehberi de aynı şeyi söylüyor: neyi, ne zaman ve ne sıklıkla isteyeceğine karar ver, değer getirmeyen çağrıyı yapma, önbelleği kullan, `ids` ile 20 maçı tek istekte topla. ([API-Football optimizasyon rehberi](https://www.api-football.com/news/post/how-to-optimize-api-sports-calls-and-quota-usage)) Sağlayıcıdan bağımsız iyi uygulamalar: yalnız maç canlıyken yokla, FT'de dur, yalnız gösterilen ligleri yokla, değişmeyen maçı atla, hata alınca geri çekil. ([Sportmonks iyi uygulamalar](https://docs.sportmonks.com/v3/welcome/best-practices), [Sportmonks önbellekleme](https://www.sportmonks.com/blogs/caching-and-optimisation-strategies-for-high-volume-football-api-usage/), [anwp API kullanımı](https://anwp.pro/docs/sports-api-hub/import-sync/api-usage/))

Önerilen teknikler (hepsi ücretsiz planda, kod düzeyinde):

1. **DB kapılı yoklama.** Cron her 5 dakikada bir tetiklensin. Fonksiyon önce DB'ye baksın: takip edilen ligde `[başlama − 5 dk, başlama + 130 dk]` aralığında maç var mı? Yoksa API çağrılmaz (0 istek). Kazanç: bugünkü 22 çağrının maçsız saatlere düşen kısmı.
2. **Bütçeyle hızlanan aralık.** Yoklama aralığı sabit değil, `kalan_bütçe / kalan_canlı_pencere_dakikası` formülüyle hesaplansın. Alt sınır ~4 dk, üst sınır 30 dk olsun. Örnek: Süper Lig 20:00 TSİ'de toplanırsa, gündüz harcanmayan ~25 istek 20:00-22:00 arasına konur. Bu, bu iki saatte ~5 dakikada bir güncelleme demek.
3. **Olaya bağlı ek yoklamalar.** Her maç kümesi için sabit anlara birer yoklama: başlama + 2 dk (başladı mı), + 47 dk (devre arası), + 95-115 dk (maç sonu). Devre arası raporu ve maç sonu AI'ı bu anlara bağlı olduğu için tazelik değeri en yüksek bu noktalarda. Mevcut 45-75 dk HT penceresi (3.20) bununla daralır.
4. **Takip önceliği.** Bütçe darsa yalnız takipçisi olan maçların ligleri yoklansın: `live=all` yerine `live=<ligId-ligId>` filtresi. İstek sayısı değişmez ama zenginleştirme (`ids=`) yalnız takip edilen maçlara harcanır. Takipsiz maçlar 30 dakikalık temel ritimde kalır.
5. **Değişiklik yoksa zenginleştirme yok.** `live=all` yanıtındaki skor, durum ve dakika önceki kayıtla aynıysa o maç için `/fixtures?id=` çağrılmaz. Kadro, maç başına bir kez çekilip kilitlenir; kod kısmen bunu yapıyor.
6. **NBA'de aynı mantık.** Maç saatleri `games` kaydında belli. Çeyrek sonu ve maç sonu tahmini anlarda yoklanır. Boş geceler (NBA'in az maçlı günleri) 0 istekle geçer.
7. **Şeffaflık korunsun.** Aralık artık değişken olduğu için "~30 dk" yerine son güncelleme saati ve bir sonraki tahmini güncelleme gösterilmeli ("Sonraki güncelleme ~20:45").
8. **Önce kotayı ölçün.** 11.1'deki 2 isteklik `/status` testi yapılsın. Kota ürün başınaysa NBA ve futbol bütçeleri ayrılır, ikisi de iki katına çıkar. Bu, kod yazmadan en büyük kazanç olabilir. Not: Kod `/status` çağrısının kotadan düşmediğini varsayıyor gibi; bu da doğrulanamadı.

Doğrulanamayanlar: API-Football v3'te canlı verinin hangi sıklıkla tazelendiği (eski v2 rehberi "yaklaşık dakikada bir" diyor). ETag veya koşullu istek desteği. `/status`'un kotaya sayılıp sayılmadığı.

### 11.4 İnovasyon ajanı için öneriler

1. **Kota testi + DB kapılı, bütçeye göre hızlanan zamanlayıcı (en yüksek getiri).** Önce 2 isteklik `/status` testiyle kotanın ortak mı ürün başına mı olduğu belirlenmeli. Sonra `sync-matches` ve `sync-nba` için 5 dakikalık cron + DB kapısı + `kalan_bütçe / kalan_pencere` aralığı + başlama/HT/FT ek yoklamaları yazılmalı. Native değişiklik yok, OTA ile gider. Kabul ölçütü: maç olmayan saatte 0 istek; yoğun pencerede ortalama aralık ≤ 8 dk; günlük toplam ≤ limit − yedek. **Çözüldü: kotalar ayrı (2026-11-18 üretim logları).** API-Football ve API-NBA her biri kendi 100/gün kotasına sahip (2026-11-17 logu: aynı 30 dk'da futbol 63 → 59, NBA 49 → 30); kod `supabase/functions/_shared/quota.ts`.
2. **Sabah özeti push'u (0 API isteği).** 09:00 TSİ'de takip edilen takımların dünkü sonuçları, bugünkü maç saatleri ve Pro kullanıcıya AI özetin ilk cümlesi gönderilsin. Bildirim tercihlerinde ayrı anahtar olsun (3.23'teki sunucu tarafı tercihlere eklenir). Açılma oranı ölçülmeli. Mümkünse iki saat A/B denensin.
3. **Davet ve paylaşım bağlantısı = indirme kanalı.** Maç ekranından metin paylaşımı yapılsın. Mesajda skor, AI özetin ilk cümlesi, deep link ve APK indirme sayfası olsun. Bağlantıya davet kodu eklensin. Davet eden ve edilen için "7 gün Pro" ödülü ve basit K-faktör ölçümü (davet / kurulum) yapılsın. Native gerekmez.
4. **Gol sesi + kalıcı canlı skor bildirimi (Android).** Takip edilen maç canlıyken, güncellenen tek bir "ongoing" bildirim gösterilsin; bu, Live Activity'nin Android karşılığı. Gol için özel ses kullanılsın; Maçkolik emsali var. Özel ses ve bildirim kanalı native ayar isteyebilir, bu yüzden bir sonraki APK ile planlanmalı.
5. **Widget ve tahmin oyununu ertele.** Widget'ı geliştirici doğrulamasıyla birlikte bir sonraki native APK'ya bırakın. Kanıtı en iyi olan bu, ancak maliyeti yüksek. Tahmin oyunu yapılacaksa yalnız rozet ve seri içersin, para veya maddi ödül olmasın, arkadaş tablosuyla olsun. Öncesinde hukuki görüş alınsın.

---

## 12. Araştırma turu 4 (2026-11-18): Play Store'suz para kazanma

Bağlam: Pro kodda var (`src/app/paywall.tsx`, `simulate_subscription` yalnız test hesaplarında). Uygulama yalnız APK ile dağıtılıyor. RevenueCat planlı. Bu bölüm hukuki veya mali tavsiye değildir. Vergi ve tüketici hukuku maddeleri bir mali müşavir ve avukatla teyit edilmeli.

### 12.1 Ödeme altyapısı seçenekleri

| Seçenek | Türkiye'den satıcı olarak kullanılabilir mi? | Ücret | Bireysel geliştirici / KYC | Not |
|---------|---------------------------------------------|-------|-----------------------------|-----|
| **Google Play Billing** | Yalnız Play Store'daki uygulamada. APK'da kullanılamaz. | — | — | Play'e geçince RevenueCat bunun üzerine kurulur. |
| **Stripe (doğrudan)** | **Büyük ihtimalle hayır.** Kaynakların çoğu Türkiye'nin Stripe'ın resmî ülke listesinde olmadığını söylüyor. Tek bir rehber aksini iddia ediyor. Resmî liste okunamadı, **doğrulanamadı**. Yaygın geçici çözüm ABD'de şirket kurmak; bu Skor+ ölçeği için orantısız. | — | — | ([dodopayments](https://dodopayments.com/blogs/merchant-of-record-turkey), [apicalculators TR](https://apicalculators.com/tr/blog/stripe-turkiye-komisyon-2026), [learnwithhasan](https://learnwithhasan.com/payment-gateways/country/turkey/)) |
| **RevenueCat Web Billing** | **Var ama dolaylı.** Web satın alması, kullanıcı uygulamayı açınca yetkiyi aktif ediyor. Arka uç olarak RevenueCat'in kendi motoru (Stripe tabanlı), Stripe Billing veya Paddle Billing kullanılabiliyor. Paddle entegrasyonu **davetle**. Stripe Türkiye'de yoksa bu yol pratikte Paddle'a bağlı. Sideload edilmiş (Play'siz) Android'de nasıl çalıştığı **doğrulanamadı**. | RevenueCat aylık $2.500 izlenen gelire kadar ücretsiz, sonrasında toplam gelirin %1'i (üçüncü taraf kaynaklar). İşlemci ücreti ayrı. | İşlemciye bağlı | ([RevenueCat Web](https://www.revenuecat.com/docs/web/overview), [RevenueCat Web Billing](https://production-docs.revenuecat.com/docs/web/web-billing/overview), [Paddle entegrasyonu](https://www-docs.revenuecat.com/docs/web/integrations/paddle), [ücret: apppricinglab](https://apppricinglab.com/playbook/revenuecat-review)) |
| **Paddle (Merchant of Record)** | **Muhtemel, doğrulanamadı.** Paddle'ın Türkiye sayfası Codeway, HubX ve AppNation gibi Türk şirketlerini müşteri olarak sayıyor. Ancak bunlar şirket. Bireysel veya şahıs şirketi kabulü ve ödeme (payout) koşulları **doğrulanamadı**. | 5% + $0,50 / işlem (üçüncü taraf); ödeme ücreti ayrı | Şirket belgeleri istenmesi olası (doğrulanamadı) | MoR olduğu için alıcıya faturayı ve yabancı KDV'yi Paddle üstleniyor. Türk satıcının Paddle'a keseceği faturanın niteliği (hizmet ihracatı mı?) **doğrulanamadı**. ([Paddle Türkiye](https://www.paddle.com/billing/turkey), [Paddle ülkeler](https://developer.paddle.com/concepts/sell/supported-countries-locales), [Paddle Türkiye ödemeleri](https://www.paddle.com/blog/payments-in-turkey)) |
| **Lemon Squeezy** | **Belirsiz.** Banka ödemesi listesinde Türkiye görülemedi. PayPal ödemesi 200+ ülkede var. Ancak PayPal 2016'dan beri Türkiye'de kapalı; 2026'da açıldığına dair kanıt yok. Ayrıca Lemon Squeezy 2026'da satıcılarını Stripe Managed Payments'a taşıyor. | 5% + $0,50; uluslararası ödeme ücreti kaynaklarda çelişkili | — | Skor+ için önerilmez. ([LS ülkeler](https://docs.lemonsqueezy.com/help/getting-started/supported-countries), [dodopayments LS](https://dodopayments.com/blogs/lemonsqueezy-review), [PayPal TR kapanış](https://www.finextra.com/newsarticle/28974/paypal-forced-to-shut-down-in-turkey), [CNBC-e](https://www.cnbce.com/teknoloji/paypal-world-turkiyeye-de-geri-donus-sinyali-mi-h15290)) |
| **Polar.sh** | **Doğrulanamadı.** Desteklenen ülkelerde bireylere de ödeme yapıyor (Stripe Connect Express üzerinden). Görülen listede Türkiye yok. Stripe Connect'e dayandığı için Türkiye olasılığı düşük (çıkarım). | — | Birey kabul | ([Polar ülkeler](https://polar.sh/docs/merchant-of-record/supported-countries)) |
| **iyzico** | **Evet.** Yerli lisanslı ödeme kuruluşu. Abonelik (tekrarlayan ödeme) ürünü var. | Resmî oran yayımlanmıyor, panelde görünüyor. Kaynaklarda %1,59 + 0,25 TL ile %3,99 arası çelişkili rakamlar var. **Doğrulanamadı.** | Bir karşılaştırma sitesine göre şirketi olmayan bireyler için "iyzico Link" var. Ancak düzenli satış gelir vergisi mükellefiyeti doğurur (bkz. 12.2). | ([iyzico Easy POS](https://www.iyzico.com/en/business/easy-pos), [kobitime](https://kobitime.com/sanal-pos-ucretleri-ve-sanal-pos-firmalari-2026/), [ticimax](https://www.ticimax.com/blog/iyzico-komisyon-oranlari)) |
| **PayTR** | **Evet.** "Link ile Ödeme" sanal POS'u olmayan işletmelere de açık. | Sözleşmeye ve hacme göre. Üçüncü taraf ~%1,49–1,99 diyor. **Doğrulanamadı.** | Bireysel kabul net değil. Bir kaynak vergi levhası olmayan bireyin kabulünü "hukuken net değil" diye niteliyor. | ([PayTR link ile ödeme](https://www.paytr.com/en/linkle-odeme), [birfatura](https://birfatura.com/sanal-pos-nedir-sanal-pos-komisyon-oranlari/), [ideasoft](https://www.ideasoft.com.tr/eticaret-cozum-merkezi/odeme-sistemleri/paytr/)) |

Çıkarım: Türkiye'deki bireysel bir geliştirici için **en gerçekçi ve doğrulanabilir yol, iyzico veya PayTR ile kendi web ödeme sayfası artı sunucu tarafı yetki (Supabase)**. Paddle bir seçenek olabilir ama kabul koşulları belirsiz. Stripe tabanlı her şey (RevenueCat'in kendi motoru, Lemon Squeezy, Polar) Türkiye'den satıcı için büyük ihtimalle kapalı.

### 12.2 Vergi, fatura ve KVKK yükümlülükleri

- **GVK mük. 20/B istisnası APK satışına uygulanmaz.** İstisna, mobil uygulama geliştiricinin "elektronik uygulama paylaşım ve satış platformları üzerinden" (mağazalar) elde ettiği kazancı kapsıyor. Hukuk bürosu özetine göre "mağaza dışında kazanç sağlamak" kapsam dışı. Şartlar: yalnız gerçek kişi, Türkiye'de ayrı banka hesabı, tüm hasılat bu hesaptan, bankanın %15 stopajı nihai vergi. 2026 sınırı 4. gelir dilimi; kaynaklar 5.300.000 TL diyor. Bu kapsamdaki teslimler KDV'den istisna (KDVK 17/4-a). **Sonuç: Skor+ Play Store'a çıkınca 20/B çok avantajlı olur. Web veya APK satışında olmaz.** ([Kazım Ceylan Hukuk](https://www.kazimceylan.av.tr/sosyal-medya-ve-mobil-uygulama-vergi-istisnasi), [fatiharas](https://www.fatiharas.com/gvk-mukerrer-madde-20-b-sosyal-icerik-ureticiligi-istisnasi/), [muhasebenews](https://www.muhasebenews.com/muhasebenews-haber-43436/))
- **Web satışı için şahıs şirketi (gerçek kişi ticari kazanç mükellefiyeti).** Kuruluş maliyeti kaynaklara göre 3.500–6.000 TL ile 9.500–14.900 TL arası. Kaynaklar fatura yazılımı satıcısı bloğu, **çelişkili**. GİB e-Arşiv Portalı ücretsiz. Özel entegratör seçilirse kontör ücreti var. Mali müşavir aylık ücreti **doğrulanamadı**. ([faturaport](https://faturaport.com/blog/on-muhasebe/sahis-sirketi-kurma-adimlari-2026), [faturaport maliyet kıyas](https://www.faturaport.com/blog/crm/2026-sirket-kurma-maliyetleri-nelerdir-sahis-limited-anonim-karsilastirmasi), [paraşüt](https://www.parasut.com/blog/sahis-sirketi-kurmak))
  - Alıcı bireysel tüketici olduğu için belge e-arşiv fatura olur. Bir kaynak, basit usulde 1 Ocak 2027'den itibaren tutardan bağımsız her satışın e-arşiv faturayla belgeleneceğini söylüyor. **Doğrulanamadı.** ([birfatura](https://birfatura.com/marti-tag-fatura-zorunlulugu-marti-tag-sahis-sirketi/))
  - KDV: Dijital abonelik genel orana tabi olmalı (genel oran %20). Basit usul mü bilanço/işletme esası mı uygun olur? Bu, mali müşavirin kararı. **Doğrulanamadı.**
  - Genç girişimci istisnası koşulları (yaş vb.) geliştiriciye uyuyorsa ilk yıllarda kazanç istisnası sağlayabilir. Koşullar mali müşavirle kontrol edilmeli. ([birfatura genç girişimci](https://birfatura.com/genc-girisimci-istisnasi-destegi-ve-sartlari/))
- **Tüketici hukuku.**
  - Mesafeli satış sözleşmesi ve ön bilgilendirme formu gerekli. Maçkolik'in kendi sözleşmesi örnek alınabilir. ([Maçkolik sözleşme](https://www.mackolik.com/static-mackolik-mesafeli-satis-sozlesmesi.html))
  - 14 günlük cayma hakkı var. Dijital içerik istisnası "anında ifa ve tüketici onayı" koşuluna bağlı. Kaynaklar dijital aboneliklerde cayma hakkının sürdüğünü söylüyor, istisnanın tam metni **doğrulanamadı**. 2026 yönetmelik değişikliği ve bir Danıştay kararı iddiası var, **doğrulanamadı**. ([Kazım Ceylan cayma](https://www.kazimceylan.av.tr/14-gunluk-cayma-hakki), [bilalalyar abonelik iptali](https://bilalalyar.av.tr/?p=8883), [Mesafeli Sözleşmeler Yönetmeliği](https://www.lexpera.com.tr/mevzuat/yonetmelikler/mesafeli-sozlesmeler-yonetmeligi))
  - Pratik kural: Aboneliği iptal etmek, almak kadar kolay olmalı (uygulama içinde tek düğme). Bu kuralın dayandığı yönetmelik **doğrulanamadı**, ancak şikâyet riskini azaltır.
- **KVKK.**
  - Kart verisi Skor+'a hiç gelmemeli. iyzico/PayTR barındırılan (hosted) ödeme sayfası kullanılmalı. Sunucuda yalnız sipariş kimliği, kullanıcı kimliği ve abonelik durumu tutulmalı.
  - Gizlilik metni (src/lib/legal.ts) ödeme işlemcisini ve fatura için işlenen verileri (ad, e-posta, TCKN gerekirse) eklemeli.
  - **Yurt dışına aktarım:** Paddle gibi yabancı bir MoR kullanılırsa KVKK m.9 kapsamında standart sözleşme imzalanıp Kurul'a **5 iş günü içinde** bildirim gerekir. Bildirmemenin 2026 cezası 90.308–1.806.377 TL (hukuk bürosu kaynağı, **resmî teyit yok**). Aynı konu Supabase barındırması için de geçerli olabilir. Bu ayrıca kontrol edilmeli. ([KVKK standart sözleşmeler](https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler), [Cottgroup](https://cottgroup.com/tr/blog/kvkk-gdpr/item/standart-sozlesme-bildirim-yukumlulugu-ve-yaptirimlari), [bilalalyar m.9](https://bilalalyar.av.tr/?p=101222))
  - VERBİS kayıt eşiği için 2026 güncellemesi **doğrulanamadı**.

### 12.3 TL fiyat kıyasları

| Ürün | TL fiyat | Kaynak / güven |
|------|----------|----------------|
| Maçkolik Pro (reklamsız) | 14,99 TL/ay | Tarihsiz sözleşme, **eski olabilir** ([Maçkolik](https://www.mackolik.com/static-mackolik-mesafeli-satis-sozlesmesi.html)) |
| Google AI Plus | 199,99 TL/ay | Teknoblog ([teknoblog](https://www.teknoblog.com/google-ai-turkiye-fiyatlari-plus-pro-ve-ultra-farklari/)) |
| Google AI Pro (Gemini) | 719,99 TL/ay | Teknoblog (aynı kaynak) |
| ChatGPT Plus | 999,99 TL/ay, 9.999,99 TL/yıl (2026 zammından sonra; önce 499,99 TL) | Tamindir, Teknoblog ([tamindir](https://www.tamindir.com/haber/chatgpt-plus-turkiye-fiyati-zam_109856/), [teknoblog](https://www.teknoblog.com/chatgpt-plus-fiyati-ikiye-katlandi/)) |
| TOD Süper Lig paketi | Taahhütsüz aylık ~1.590 TL; sezonluk ödemede ~479 TL/ay; 12 ay ~4.200–4.800 TL | Yeniden satıcılar ve haber; **resmî fiyat doğrulanamadı** ([Milli Gazete](https://www.milligazete.com.tr/tod-tv-ucreti-ne-kadar-2026-super-lig-paketi-kac-tl-giris-nasil-yapilir-hangi-diziler-ve-maclar-var), [digiturkburada](https://digiturkburada.com.tr/2026-2027-tod-fiyatlari.html)) |
| Sofascore / FotMob / Flashscore+ TL fiyatı | **Doğrulanamadı.** Döviz fiyatları bölüm 7'de. | — |

Çıkarım: Türkiye'de "skor uygulaması premium"u çok ucuz (reklamsızlık). "AI aboneliği" ise 200–1.000 TL/ay bandında. Skor+ Pro, bu iki bandın arasında konumlanmalı: bir sohbet botundan çok daha ucuz, reklamsızlıktan daha değerli. Aşağıdaki fiyatlar **öneri**, araştırma bulgusu değil:
- Pro aylık 59,99–79,99 TL, yıllık 499,99–599,99 TL.
- Maliyet kontrolü: Gemini çağrı maliyeti kullanıcı başına ölçülmeli. Pro'da günlük asistan soru sınırı korunmalı.

### 12.4 Play Store öncesi satış seçenekleri

| Seçenek | Artı | Hukuki sınır / risk |
|---------|------|---------------------|
| **Kurucu destekçi paketi (tek seferlik)** | Abonelik altyapısı (tekrarlayan ödeme, iptal akışı) gerekmez. iyzico/PayTR'de tek çekim yeter. Erken nakit ve sadık çekirdek kitle sağlar. | Satış yine ticari kazançtır: fatura ve şahıs şirketi gerekir. **"Ömür boyu" ifadesinden kaçının.** AI maliyeti süreklidir ve servis kapanırsa tüketici şikâyeti doğar. Süreyi tanımlayın: "2026-27 ve 2027-28 sezonları boyunca Pro" veya "24 ay". Kontenjan koyun (ör. ilk 300 kişi). Play'e geçişte bu kullanıcıların yetkisi sunucuda korunmalı. Google Play, Play dışında alınmış içeriğin uygulamada kullanılmasına genel olarak izin veriyor, ancak Play sürümünde dış ödeme bağlantısı göstermek yasak olabilir. Türkiye için güncel Play ödeme politikası **doğrulanamadı**. |
| **Bağış (Buy Me a Coffee, Patreon, IBAN)** | Kurulumu kolay | **Önerilmez.** 2860 sayılı Yardım Toplama Kanunu, internette izinsiz yardım toplamayı kapsayabilir. Her faaliyet için izin ve DERBİS izin numarası gerekiyor. İçerik üreticisi bağışının bu kapsamda nasıl değerlendirildiği **doğrulanamadı**. Bağış karşılığında Pro verilirse bu fiilen satıştır ve faturalanmalıdır. Buy Me a Coffee ve Patreon ödemeleri Stripe/PayPal'a dayanıyor, ikisi de Türkiye'de sorunlu (çıkarım). ([Lexpera 2860](https://www.lexpera.com.tr/mevzuat/kanunlar/yardim-toplama-kanunu-2860/11), [TÜSEV bilgi notu](https://tusev.org.tr/wp-content/uploads/2024/02/YardimToplamaBilgiNotu_Ulusal.pdf), [hukukihaber](https://www.hukukihaber.net/toplumsal-fayda-veya-sorun-olarak-internet-sosyal-medyada-yardim-toplama-sorulu-ve-cevapli)) |
| **Ön kayıt / bekleme listesi (ödemesiz)** | 0 TL, yasal risk yok. Talebi ölçer: "Pro çıkınca %X indirim". | Yalnız e-posta veya push tercihi toplanır; KVKK aydınlatması gerekir. |
| **Davetle Pro süresi** (bölüm 11.4 #3) | Ödeme olmadan büyüme | Ödül nakit değil, hizmet süresi. Risk düşük. |

### 12.5 Öneri: adım adım plan ve maliyetler

1. **Şimdi (0 TL, OTA).** Paywall'daki "yakında" yerine **bekleme listesi + kurucu destekçi ön kaydı** koyun ("haber ver" düğmesi + Supabase tablosu). Hedef: kaç kişinin ödemeye hazır olduğunu ölçmek. Ayrıca Gemini maliyeti kullanıcı başına loglanmalı; fiyatın tabanı budur.
2. **Talep yeterliyse (ör. 100+ kayıt): şahıs şirketi + mali müşavir.** Kuruluş ~3.500–14.900 TL (çelişkili kaynaklar). Aylık müşavir ücreti doğrulanamadı. e-Arşiv için GİB portalı ücretsiz. Mali müşavire sorulacaklar: basit usul mü işletme esası mı, KDV, genç girişimci istisnası, ileride 20/B'ye geçiş.
3. **iyzico (veya PayTR) üye işyeri başvurusu.** Komisyonu yazılı alın; kaynaklarda %1,59 + 0,25 TL ile %3,99 arasında. Barındırılan ödeme sayfası kullanın; kart verisi Skor+'a gelmez.
4. **Sunucu tarafı yetki.** Yeni edge function: ödeme sağlayıcının webhook'unu imzasıyla doğrular, `subscriptions` tablosunu yazar. `simulate_subscription` yalnız test için kalır. Uygulama, satın almayı **harici tarayıcıda** açar (`skorplus.app/pro?uid=…` gibi bir sayfa). Dönüşte deep link ile yetki tazelenir. Native modül gerekmez, yani OTA ile gider.
5. **İlk ürün: Kurucu Destekçi (tek çekim, süreli, kontenjanlı).** Abonelik ve iptal akışı gerektirmez. Ardından iyzico abonelik API'siyle aylık ve yıllık Pro eklenir. Mesafeli satış sözleşmesi, ön bilgilendirme formu ve uygulama içi tek düğmeli iptal hazırlanır. Metinler avukata kontrol ettirilir.
6. **Play Store'a çıkınca.** RevenueCat + Play Billing eklenir. Web/APK alıcılarının yetkisi Supabase'de korunur ve RevenueCat'e taşınır (RevenueCat'in API ile yetki verme yöntemi **doğrulanamadı**). Play gelirleri için **20/B istisnası** değerlendirilir (%15 stopaj, KDV istisnası). Play sürümünde dış ödeme bağlantısı gösterilmez.
7. **Paddle'ı paralel sorun, beklemeyin.** Paddle şahıs şirketini kabul ederse yurt dışı alıcılar ve KDV işi için iyi bir ikinci kanal olur (5% + $0,50). Ancak KVKK m.9 bildirimi ve fatura niteliği çözülmeden başlanmamalı.

Tahmini başlangıç maliyeti (doğrulanmış kalemler): şahıs şirketi kuruluşu ~3.500–14.900 TL + Android tam dağıtım hesabı $25 (bölüm 8). iyzico komisyonu ve müşavir ücreti doğrulanamadı. RevenueCat aylık $2.500 gelire kadar ücretsiz (üçüncü taraf).

---

## Kaynaklar
- https://unstar.app/blog/fotmob-onefootball-espn-365scores-sofascore-football-score-apps-ranked-2026
- https://www.fotmob.com/topnews/3627-live-xg-data-is-now-fotmob
- https://apps.apple.com/app/id488575683
- https://mobile.softpedia.com/android/FotMob-Android-Review-2213.html
- https://www.sofascore.com/news/?p=71501
- https://www.sofascore.com/news/nota-sofascore-explicada
- https://www.sofascore.com/sk/news/sofascore-vs-livescore-which-live-score-app-should-you-use
- https://apps.apple.com/app/id766443283
- https://www.flashscore.com/faq/ads
- https://www.flashscore.com/faq/issue
- https://apps.apple.com/tr/app/mackolik/id398157427
- https://www.sikayetvar.com/mackolikcom
- https://www.sikayetvar.com/mackolikcom/yanlis-isabetli-sut-sayisi-mackolikte-musteri-guvenini-sarsiyor
- https://kimola.com/reports/unlock-insights-mackolik-app-user-feedback-report-app-store-tr-146438
- https://nz.trustpilot.com/review/onefootball.com
- https://kimola.com/reports/unlock-insights-into-espn-app-user-feedback-and-issues-google-play-en-us-142128
- https://www.macrumors.com/2013/12/16/thescore-for-ios-updated-with-highly-customizable-news-feeds
- https://www.sportsbusinessdaily.com/Daily/Issues/2014/06/03/Media/App-Review.aspx
- https://www.onclarity.com/leaderboard/insight/thescore
- https://sixcolors.com/post/2024/02/simple-complexity-apples-trio-of-sports-apps/
- https://www.macrumors.com/2024/09/16/apple-sports-app-live-activities/
- https://9to5mac.com/2026/10/15/apple-sports-update-improves-live-activity-support-adds-soccer-leagues-
- https://www.tomsguide.com/phones/iphones/i-spent-two-weeks-using-the-apple-sports-app-heres-why-its-not-ready-for-the-big-leagues
- https://kimola.com/reports/unlock-insights-nba-app-feedback-analysis-report-google-play-tr-148645
- https://marlvel.ai/api/llm/apps/sports/nba-live-games-scores
- https://www.statsperform.com/opta-predictions/
- https://theanalyst.com/articles/opta-football-predictions
- https://api-football.com
- https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide
- https://skills.sh/silkyland/thscore-api-skill/api-football-v3

### 2026-11-18 güncellemesinde eklenen kaynaklar
- https://www.nba.com/news/nba-digital-experiences-2026-27
- https://sportsvideo.org/2026/10/20/nba-app-adds-game-pulse-ai-based-chat-feature-to-keep-fans-tuned-in
- https://barrettmedia.com/2026/10/19/nba-ai-features-tap-to-watch-app/
- https://wsc-sports.com/blog/customer-spotlight/nba-launches-genai-technology-with-wsc-sports-to-automate-multilingual-content/
- https://frontofficesports.com/espn-ai-generated-soccer-lacrosse/
- https://espnpressroom.com/feature/enhancing-espns-game-recaps-for-underserved-sports-using-ai/
- https://getcoai.com/news/espn-launches-20-30-streaming-service-with-47k-live-events/
- https://www.sofascore.com/tr/news/sofascore-feed-goes-global-now-in-every-language
- https://www.sofascore.com/news/tag/basketball
- https://www.sofascore.com/tr/basketball/match/teamleague-team/toFisuoFi
- https://sofascore.helpscoutdocs.com/article/161-interstitial-full-screen-ads-explained
- https://apps.apple.com/ca/app/id1176147574
- https://apps.apple.com/ae/app/id488575683
- https://apps.apple.com/tr/app/id766443283?l=tr&mt=8
- https://apps.apple.com/app/id6761960713
- https://www.sportsvideo.org/2026/06/03/bundesliga-launches-ai-assistant-captain-in-official-app-developed-with-aws/
- https://technode.global/prnasia/xbotgo-launches-pro-soccer-bringing-professional-ai-tactical-analysis-and-multi-tier-highlights-to-grassroots-football/
- https://fortune.com/press-releases/soccerment-launches-sics-atlas-ai-football-analysis-scouting-2026-08-20/
- https://www.mackolik.com/static-mackolik-mesafeli-satis-sozlesmesi.html
- https://www.mackolik.com/basketbol/canli-sonuclar
- https://www.tamindir.com/indir/mackolik/
- https://www.tamindir.com/indir/nba-turkiye/amp/
- https://www.365scores.com/tr/basketball/league/nba-103
- https://www.aiscore.com/tr/basketball
- https://www.espn.com/nba/scoreboard/_/name/adl
- https://www.flashscore.co.uk/news/flashscore-introduces-ad-free-flashscore-with-new-subscription-prices/xfLPIrAs
- https://www.flashscore.com/news/flashscore-reklams-z-flashscore-ve-yeni-abonelik-fiyatlar-n-sunar/dhkDp1u2
- https://apppricinglab.com/iap/apple/1176147574
- https://apppricinglab.com/iap/apple/488575683
- https://subger.com/en/service/nba-league-pass
- https://www.androidauthority.com/android-sideloading-changes-timeline-3679204/
- https://androidauthority.com/android-sideloading-developer-verification-first-wave-rollout-3717921
- https://android-developers.googleblog.com/2026/03/android-developer-verification.html
- https://developer.android.com/developer-verification
- https://support.google.com/android-developer-console/answer/16561738
- https://engadget.com/apps/android-will-hide-app-sideloading-behind-a-new-one-time-security-process-184651171.html
- https://www.dailysabah.com/turkiye/turkiye-blocks-over-84000-illegal-betting-websites-in-2025/news
- https://sigma.world/news/turkey-illegal-gambling-crackdown-84000-sites/
- https://ifade.org.tr/en/reports/engelliweb-2025/10-turkish-football-federation/
- https://www.api-football.com/news/post/how-to-get-started-with-api-nba-the-complete-beginners-guide
- https://api-sports.io/sports/nba
- https://highlightly.net/blogs/best-nba-apis-in-2026
- https://docs.balldontlie.io/
- https://www.balldontlie.io/
- https://www.football-data.org/pricing
- https://docs.football-data.org/general/v4/policies.html
- https://api.football-data.org/register
- https://www.sportmonks.com/football-api/free-plan
- https://www.sportmonks.com/football-api/plans-pricing
- https://www.thesportsdb.com/pricing
- https://www.thesportsdb.com/docs_terms_of_use.php
- https://www.nba.com/terms
- https://github.com/rsforbes/nba_api
- https://zuplo.com/learning-center/espn-hidden-api-guide
- https://sportsapis.dev/espn-api

### Araştırma turu 3'te (2026-11-18) eklenen kaynaklar
- https://developer.android.com/developer-verification/guides
- https://developer.android.com/blog/posts/android-developer-verification-building-a-safer-ecosystem-together
- https://www.techrepublic.com/article/news-google-android-developer-verification-september-2026/
- https://rapidapi.com/api-sports/api/api-football/pricing
- https://rapidapi.com/de/api-sports/api/api-nba/pricing
- https://rapidapi.com/it/api-sports/api/api-basketball/pricing
- https://www.api-football.com/pricing
- https://www.api-football.com/terms
- https://pr.nba.com/nba-app-launches-new-digital-features-highlighted-by-multiview-ahead-of-the-2024-25-season
- https://www.airship.com/?p=15627
- https://netmera.com/mackolik-case-study/
- https://www.pushwoosh.com/blog/sport1/
- https://www.casestudies.com/company/airship/case-study/tnt-sports-boosts-live-viewing-sessions-25-with-airship
- https://android-developers.googleblog.com/2026/05/how-gratitude-widgets-boosted-user-retention-25-percent.html
- https://www.twipemobile.com/3-findings-from-experiments-with-triggers-via-push-notifications-website-and-email/
- https://andrewchen.com/breaking-down-671-million-push-notifications-by-hour/amp/
- https://www.appsflyer.com/customers/dream11/
- https://tenjin.com/glossary/k-factor/
- https://game-ace.com/blog/game-predictions-in-sports/
- https://www.pocketgamer.biz/industry/predictfully
- https://www.api-football.com/news/post/how-to-save-calls-to-the-api
- https://www.api-football.com/news/post/how-to-optimize-api-sports-calls-and-quota-usage
- https://jentic.com/apis/api-sports.io/api-sports
- https://docs.sportmonks.com/v3/welcome/best-practices
- https://www.sportmonks.com/blogs/caching-and-optimisation-strategies-for-high-volume-football-api-usage/
- https://anwp.pro/docs/sports-api-hub/import-sync/api-usage/

### Araştırma turu 4'te (2026-11-18) eklenen kaynaklar
- https://dodopayments.com/blogs/merchant-of-record-turkey
- https://apicalculators.com/tr/blog/stripe-turkiye-komisyon-2026
- https://learnwithhasan.com/payment-gateways/country/turkey/
- https://www.revenuecat.com/docs/web/overview
- https://production-docs.revenuecat.com/docs/web/web-billing/overview
- https://www-docs.revenuecat.com/docs/web/integrations/paddle
- https://apppricinglab.com/playbook/revenuecat-review
- https://www.paddle.com/billing/turkey
- https://www.paddle.com/blog/payments-in-turkey
- https://developer.paddle.com/concepts/sell/supported-countries-locales
- https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- https://dodopayments.com/blogs/lemonsqueezy-review
- https://www.finextra.com/newsarticle/28974/paypal-forced-to-shut-down-in-turkey
- https://www.cnbce.com/teknoloji/paypal-world-turkiyeye-de-geri-donus-sinyali-mi-h15290
- https://polar.sh/docs/merchant-of-record/supported-countries
- https://www.iyzico.com/en/business/easy-pos
- https://kobitime.com/sanal-pos-ucretleri-ve-sanal-pos-firmalari-2026/
- https://www.ticimax.com/blog/iyzico-komisyon-oranlari
- https://www.paytr.com/en/linkle-odeme
- https://birfatura.com/sanal-pos-nedir-sanal-pos-komisyon-oranlari/
- https://www.ideasoft.com.tr/eticaret-cozum-merkezi/odeme-sistemleri/paytr/
- https://www.kazimceylan.av.tr/sosyal-medya-ve-mobil-uygulama-vergi-istisnasi
- https://www.fatiharas.com/gvk-mukerrer-madde-20-b-sosyal-icerik-ureticiligi-istisnasi/
- https://www.muhasebenews.com/muhasebenews-haber-43436/
- https://faturaport.com/blog/on-muhasebe/sahis-sirketi-kurma-adimlari-2026
- https://www.faturaport.com/blog/crm/2026-sirket-kurma-maliyetleri-nelerdir-sahis-limited-anonim-karsilastirmasi
- https://www.parasut.com/blog/sahis-sirketi-kurmak
- https://birfatura.com/marti-tag-fatura-zorunlulugu-marti-tag-sahis-sirketi/
- https://birfatura.com/genc-girisimci-istisnasi-destegi-ve-sartlari/
- https://www.kazimceylan.av.tr/14-gunluk-cayma-hakki
- https://bilalalyar.av.tr/?p=8883
- https://www.lexpera.com.tr/mevzuat/yonetmelikler/mesafeli-sozlesmeler-yonetmeligi
- https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler
- https://cottgroup.com/tr/blog/kvkk-gdpr/item/standart-sozlesme-bildirim-yukumlulugu-ve-yaptirimlari
- https://bilalalyar.av.tr/?p=101222
- https://www.teknoblog.com/google-ai-turkiye-fiyatlari-plus-pro-ve-ultra-farklari/
- https://www.tamindir.com/haber/chatgpt-plus-turkiye-fiyati-zam_109856/
- https://www.teknoblog.com/chatgpt-plus-fiyati-ikiye-katlandi/
- https://www.milligazete.com.tr/tod-tv-ucreti-ne-kadar-2026-super-lig-paketi-kac-tl-giris-nasil-yapilir-hangi-diziler-ve-maclar-var
- https://digiturkburada.com.tr/2026-2027-tod-fiyatlari.html
- https://www.lexpera.com.tr/mevzuat/kanunlar/yardim-toplama-kanunu-2860/11
- https://tusev.org.tr/wp-content/uploads/2024/02/YardimToplamaBilgiNotu_Ulusal.pdf
- https://www.hukukihaber.net/toplumsal-fayda-veya-sorun-olarak-internet-sosyal-medyada-yardim-toplama-sorulu-ve-cevapli
