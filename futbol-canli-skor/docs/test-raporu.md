# Skor+ Test Raporu

Tarih: 2026-11-18. İncelenen commit'ler: `0af4f5a`, `fea17d2` (NBA logo kopyalama, futbol terimi bekçisi, NBA dosyası v3, Guard/Forward/Pivot mevkileri, iki takımlı box score).

## 1. Kalite kapıları

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | Geçti: 0 hata |
| `npx eslint src` | Geçti: 0 hata, 0 uyarı |
| `npm run test:functions` | Geçti: 57 geçti, 0 başarısız, 2 atlandı. İlk koşu 56/56 idi; test ajanı 1 geçen ve 2 `ignore` testi ekledi. |
| `deno check */index.ts` | Geçti: 7/7 fonksiyon (ask-assistant, generate-analysis, generate-halftime, generate-preview, process-alert, sync-matches, sync-nba) |

Eklenen test dosyası: `supabase/functions/tests/sportTerms.edge.test.ts`. Atlanan 2 test bilinen hataları belgeliyor (bulgu 3 ve 4). Düzeltmeden sonra `ignore: true` kaldırılmalı.

## 2. E2E (http://localhost:8084, önizleme modu)

`npm run e2e` geçti: 8/8 betik, sayfa hatası yok.

- ht_ui: 3 kontrol
- alerts_ui: 4 kontrol
- nba_ui: 3 kontrol (seri alarmı, box score ev, box score deplasman)
- chat_ui: 4 kontrol
- teams_ui: 5 kontrol
- account_ui: 5 kontrol
- lineup_ui: 6 kontrol (NBA kadro sekmesi yok kontrolü dahil)
- preview_ui: 2 kontrol

Ekran görüntüleri 390 px genişlikte incelendi:

- `a4-nba.png`: Özet ekranı temiz. Seri alarmı ve çeyrek tablosu doğru, taşma yok, futbol terimi yok.
- `a5-boxscore.png`: iki takım alt alta, sabit oyuncu sütunu ve yatay kaydırma doğru. TOPLAM satırı ve mevki harfleri (G/F/C) doğru. Taşma yok.
- Ekran görüntüsündeki "DESERT VİPERS" (Türkçe büyük İ) hatası, koordinatöre göre güncel kodda düzeltildi. `BoxScoreTab.tsx:118` artık `toUpperCase()` kullanıyor. Görüntü düzeltmeden önce alınmıştı.

## 3. Bulgular

### 1. [yüksek] Boş oyuncu yanıtı veren maçlar box score geri doldurmasında sürekli yeniden istenir ve ortak API kotasını tüketir

- **Yer:** `supabase/functions/sync-nba/index.ts:169`, `:173-176`, `:189-217`
- **Senaryo:** Biten bir maç için `/players/statistics?game=` boş dizi dönebilir, ya da tüm oyuncular 0 dakika gelebilir. Bu durumda `toBoxScore` `null` döner ve `storeBoxScore` hiçbir şey yazmadan `true` döner. Sayaç `n++` artar ama `box_score` NULL kalır.
- **Etkisi:** Aynı maç sonraki her canlı çalıştırmada yeniden seçilir. Canlı senkron günde 16 kez çalışır, her çalıştırmada en fazla 5 istek yapılır ve bu 3 gün sürer. Bu, günde 80 isteğe kadar çıkar. API-Football ve API-NBA günde 100 isteklik kotayı paylaşıyor. `NBA_QUOTA_RESERVE` yalnızca 5. Kota UTC 00:00'da sıfırlanır; NBA gece kotayı tüketirse aynı günün futbol senkronu (TSİ 15:00 ve sonrası) kotasız kalır.
- **Not:** Bu commit'te sınır `MAX_ENRICH - done` (≤3) yerine bağımsız 5 oldu.
- **Öneri:**
  - Boş sonucu kalıcı olarak işaretle: örneğin `box_score = []`, ya da `box_attempts` / `box_checked_at` sütunu kullan ve sorguda `.is('box_score', null)` koşulunu buna göre değiştir.
  - Boş sonucu `n` sayacına katma.
  - Geri doldurmayı kalan kotaya bağla, ya da `MAX_BOX_BACKFILL` değerini 2–3'e düşür.
- **Durum:** Düzeltildi. Boş oyuncu yanıtı geri doldurmada `box_score = []` ile işaretlenir (`_shared/nbaBox.ts` `boxScoreToStore`), `.is('box_score', null)` bir daha seçmez; boşlar `n`'e katılmaz. İlk zenginleştirmede boş yanıt işaretlenmez, geri doldurma aynı çalıştırmada o maçı atlar. `MAX_BOX_BACKFILL` 3; geri doldurma `hasNbaQuota(1 + NBA_BOX_BACKFILL_RESERVE)` (varsayılan 20) ile. `BoxScoreTab` [] için "box score yok" metni gösterir.

### 2. [orta] Logo kovası listesi bir kez hata verirse boş küme önbellekte kalır; logolar Wikimedia'ya geri döner

- **Yer:** `supabase/functions/_shared/logoMirror.ts:19-27`, `:32-37`, `sync-nba/index.ts:49`
- **Senaryo:** `storage.list('nba')` geçici bir hata döner. `mirrored` modül düzeyinde `new Set()` olarak kalır ve sıcak worker yaşadığı sürece öyle kalır. Sonraki her `upsert` → `withMirroredLogos` çağrısı satırlara API'nin Wikimedia adresini geri yazar. Android'de 403 alınır ve logolar kaybolur.
- **Etkisi:** Aynı çalıştırmada `mirrorNbaLogos` boş küme yüzünden 12 logoyu yeniden indirir ve yükler. Ardından satırları tekrar Storage adresine taşır. Logolar her çalıştırmada gidip gelir ve Wikimedia'ya gereksiz trafik gider.
- **Öneri:**
  - Hata durumunda `mirrored`'ı önbelleğe alma (`null` bırak).
  - Bilinmeyen kümede `withMirroredLogos` mevcut satırın logosunu ezmesin: upsert'ten `home_logo` / `away_logo` alanlarını çıkar. Alternatif: Storage adresi zaten yazılmışsa koru.
- **Durum:** Düzeltildi. Liste hatası önbelleğe alınmaz (`loadMirrored` → `null`). Küme bilinmiyorsa `applyMirroredLogos` logo alanlarını tüm satırlardan çıkarır (upsert kolonları satırların birleşimi olduğu için mevcut logo korunur); `mirrorNbaLogos` o çalıştırmada atlanır.

### 3. [orta] Futbol terimi bekçisi, Türkçe büyük İ/I içeren terimleri kaçırıyor (yanlış negatif)

- **Yer:** `supabase/functions/_shared/sportTerms.ts:6-7`
- **Senaryo:** JS'nin `/iu` bayrağı Türkçe İ↔i ve I↔ı eşleşmesini yapmıyor. Şu metinler yakalanmıyor (deno ile doğrulandı):
  - "İlk 11'de değişiklik yok."
  - "İLK 11"
  - "PENALTI kararı"
  - "DEVRE ARASI skor 50-48"
  - "TEKNİK DİREKTÖR"
- **Etkisi:** Cümle başındaki "İlk 11" en olası durum. NBA analizinde veya sohbet yanıtında futbol terimi kalır.
- **Öneri:** Testten önce metni `toLocaleLowerCase('tr')` ile küçült ve desenleri küçük harfle yaz. Büyük harfe duyarlı `VAR` / `xG` testi orijinal metinle kalsın.
- **Test:** `tests/sportTerms.edge.test.ts`, ilk ignore testi.
- **Durum:** Düzeltildi. Desenler küçük harf, test `toLocaleLowerCase('tr')` metinde; `VAR`/`xG` orijinal metinde. İlk ignore testi açıldı.

### 4. [düşük-orta] Bekçide yanlış pozitifler ve boşluk hassasiyeti

- **Yer:** `supabase/functions/_shared/sportTerms.ts:6`, `:13`
- **Senaryo:**
  - `NBA_NAMES = /golden state/` tek boşluk bekliyor. "Golden  State" (çift boşluk) veya "Golden\nState" metninde `gol…` eşleşir ve metin atılır.
  - Türk basketbol yayınlarında yaygın olan "korner üçlüğü" futbol terimi sayılıyor. Bu durumda doğru LLM metni şablona düşer.
  - "Golf" ve "Golan" da işaretleniyor.
  - Ters yönde, "kırmızı  kart" (çift boşluk) yakalanmıyor.
- **Öneri:**
  - Boşlukları `\s+` ile eşleştir: `golden\s+state`, `(sarı|kırmızı)\s+kart`, `teknik\s+direktör` vb.
  - `korner` için `korner(?!\s*üçl)` istisnası ekle.
  - `gol\p{L}*` yerine Türkçe ek listesi kullan: `gol(ü|e|de|den|ler\p{L}*|cü\p{L}*|ü\p{L}*)?`
- **Durum:** Düzeltildi. Çok kelimeli terimlerde `\s+` (`golden\s+state` dahil), `korner(?!\s+üçl)`, `gol` yalnız Türkçe eklerle (`ü…`, `e`, `de`, `le…/lü…`, `cü…`, `süz…`; Golf/Golan/golden geçer). İkinci ignore testi açıldı, ek testler eklendi.

### 5. [düşük] `dropFootballSentences` üretimde kullanılmıyor ve paragraf/madde yapısını bozuyor

- **Yer:** `supabase/functions/_shared/sportTerms.ts:26-32`
- **Senaryo:** Bölme yalnızca `[.!?]` ve büyük harf sınırında yapılıyor. `"Q3'te fark açıldı.\n\n- Madde: bench iyi.\n- Gol yok.\nSon."` girdisi `"Son."` döndürür. Temiz ilk cümle ve madde de atılır, satır sonları `join(' ')` ile kaybolur.
- **Not:** `dossier.ts:268` `sanitizeAnswer` aynı bölme mantığını kullanıyor. NBA sohbet yanıtı madde işaretli gelirse fazla cümle atılabilir. Yanıt <6 kelimeye düşerse soru hakkı iade edilir; bu güvenli ama yanıt kaybolur.
- **Öneri:** Kullanılmayan fonksiyonu sil, ya da önce satırlara böl (`\n`) ve sonra cümlelere böl. Satır yapısını koru.
- **Durum:** Düzeltildi. `dropFootballSentences` ve testi silindi. `sanitizeAnswer` önce satırlara, sonra cümlelere böler ve satır yapısını korur (yeni test).

### 6. [düşük] Analiz etiketleri ve çeyrek kırılmaları süzgeç sonrası boş kalabilir

- **Yer:** `supabase/functions/_shared/nbaAnalysis.ts:333`, `:340`, `:361-364`
- **Senaryo:**
  - `verdict_label` (`o.el`) bekçiden geçmiyor; LLM etiketine futbol terimi girerse doğrudan görünür.
  - `quarter_runs` filtresi 3 kırılmanın hepsini atabilir. Kart boş liste ile çizilir; boş durum metni var mı kontrol edilmeli.
  - `star` bulunamazsa ve `o.y.l` futbol terimi içerirse `headline` `''` olur.
- **Öneri:**
  - `verdict_label` için `basketballOr(o.el, …)` kullan.
  - Filtre sonrası boşsa `mt.decisive` / `mt.quarters` üzerinden deterministik bir kırılma satırı üret.
  - `headline` için skor tabanlı yedek cümle kullan.
- **Durum:** Düzeltildi. `verdict_label` `basketballOr` ile (yedek etiket türüne göre); süzgeç sonrası kırılma kalmazsa `deterministicRun` (kırılma periyodu, yoksa en büyük fark); spotlight başlığı yıldız yoksa skor cümlesi. Testler: `tests/nbaAnalysis.test.ts`.

### 7. [düşük] Skor null ise yedek başlık "0-0 kazandı" yazar

- **Yer:** `supabase/functions/_shared/nbaAnalysis.ts:315-317`, `:327-331`
- **Senaryo:** `home_score` / `away_score` null ya da eşit olabilir. Bu bozuk veya eksik senkronda olur. `hs >= as` ev sahibini kazanan sayar ve başlık "X, Y karşısında 0-0 kazandı" olur.
- **Öneri:** Skor eşit ya da null ise "X ile Y maçı ws-ls bitti" gibi nötr bir cümle kullan.
- **Durum:** Düzeltildi. `nbaResultSentence`: skor null ise "X ile Y maçı sona erdi", eşitse "X ile Y maçı a-b bitti".

### 8. [düşük] Box score gelmeyen NBA maçının dosyası hiç önbelleğe alınmaz

- **Yer:** `supabase/functions/ask-assistant/index.ts:93-94`
- **Senaryo:** API'nin oyuncu verisi hiç vermediği maçlarda (bulgu 1 ile aynı durum) ya da 0014 kurulmamışsa `box_score` hep boş kalır. Her soru dosyayı yeniden derler: 4 DB sorgusu. Token harcanmaz.
- **Öneri:** Maç bitişinden belli bir süre sonra (ör. 6 saat) box score olmadan da önbelleğe al. Alternatif: bulgu 1'deki "denendi" işaretine bak.
- **Durum:** Düzeltildi. `isNbaBoxPending`: `box_score` [] ise ya da başlamadan 9 saat (maç ~3 sa + 6 sa) geçtiyse dosya box score'suz önbelleğe alınır; `kickoff_at` seçime eklendi.

### 9. [düşük] `mirrorNbaLogos` her çalıştırmada tüm NBA maç satırlarını tarıyor; başarısız logolar sınırsız yeniden deneniyor

- **Yer:** `supabase/functions/_shared/logoMirror.ts:129-133`, `:152-168`
- **Senaryo:**
  - Sorguda tarih veya `limit` yok. Tablo büyüdükçe her 30 dakikada tam tarama yapılır; PostgREST 1000 satır sınırından sonra bazı takımlar görülmeyebilir.
  - `MAX_PER_RUN` yalnızca başarılı kopyaları sayıyor. Logosu hiçbir yoldan inmeyen takımlar için her çalıştırmada takım başına 4–5 Wikimedia isteği yapılır ve bunlar sırayla, zaman aşımı olmadan çalışır. Bu, edge fonksiyonunun süre sınırına yaklaşabilir.
- **Öneri:**
  - Satırları `distinct` takım listesi ya da son 30 gün ile sınırla.
  - Denemeleri say: `attempts >= MAX_PER_RUN` olunca dur.
  - `fetch` için `AbortSignal.timeout(8000)` kullan.
- **Durum:** Düzeltildi. Tarama son 30 gün (`kickoff_at`), deneme sayısı `MAX_PER_RUN` ile sınırlı (başarısızlar da sayılır), tüm `fetch` çağrılarında `AbortSignal.timeout(8000)`.

### 10. [düşük] Önizleme NBA verisinde "Devre arasında" ifadesi var

- **Yer:** `src/lib/data/nbaMockData.ts:127`
- **Senaryo:** Önizleme modunda NBA analiz kartında "Devre arasında 55-55 olan skor…" görünüyor. Sunucu bekçisi "devre arası"nı futbol terimi sayıyor; ekip kendi kuralıyla çelişiyor.
- **Öneri:** "İlk yarıyı 55-55 kapatan skor…" yaz.
- **Durum:** Düzeltildi. "İlk yarıyı 55-55 kapatan skor…".

### 11. [bilgi] Önizleme sohbet şablonları NBA'de futbol odaklı

- **Yer:** `src/lib/data/assistantMockData.ts:8-27`
- **Senaryo:** NBA maçında önizlemede "kırılma" veya "hakem" sorulursa yanıt "şut kalitesi", "penaltı, kırmızı kart veya VAR" der. Yalnızca önizlemede görülür.
- **Öneri:** Önizleme şablonlarını `m.sport_type === 'nba'` için ayır.
- **Durum:** Düzeltildi. `mockAnswer` NBA maçında `mockNbaAnswer`'a gider (çeyrek, rotasyon, faul, seri dili).

## 4. NBA'den erişilen arayüzde futbol terimi taraması

- `NbaAnalysisCards`, `NbaStatsBars`, `QuarterTable` ve `BoxScoreTab`: yalnızca kod yorumlarında "Kart" kelimesi var. Ekranda görünen metinde futbol terimi yok.
- `PaywallGate`, `GeneratingLoader` (NBA_STEPS) ve `AssistantChat` (chip ve placeholder): NBA dalları temiz.
  - `PaywallGate.tsx:53-54` "Teknik direktör" yalnızca futbol yer tutucusunda.
- `match/[id].tsx`: `FollowBar` ("devre arası raporu al") yalnızca futbolda gösteriliyor (`!nba` koşulu, satır 68). `StatsBars` ("xG & Şutlar") yerine NBA'de `NbaStatsBars` kullanılıyor.
- Kalan bulgular: önizleme verisi ve şablonları (bulgu 10 ve 11).

## Döngü 2

Tarih: 2026-11-18. Kapsam: tüm uygulama (edge function'lar, migration'lar/RLS, istemci, UX). Döngü 1'deki düzeltmeler yeniden raporlanmadı.

### Kalite kapıları

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | Geçti: 0 hata |
| `npx eslint src` | Geçti: 0 hata, 0 uyarı |
| `npm run test:functions` | Geçti: 69 geçti, 0 başarısız |
| `deno check */index.ts` | Geçti: 7/7 fonksiyon |
| `npm run e2e` | Geçti: 8/8 betik, sayfa hatası yok |

Eklenen test: `e2e/narrow_ui.mjs`. Liste, maç, istatistik, kadro, paywall, ayarlar ve NBA ekranlarını 360 px genişlikte açar. Yatay taşma yok, sayfa hatası yok (`n1`–`n6` ekran görüntüleri). 360 px'te "Canlı · N" çipi iki haneli sayıyla sınıra çok yakın. Büyük sistem yazı tipinde filtre satırı taşabilir; `flexWrap` veya yatay kaydırma önerilir.

### Bulgular

#### 1. [yüksek] Verisi hazır olmayan maçta AI analizi denemeleri tükenir ve analiz kalıcı olarak kilitlenir
- **Yer:** `supabase/migrations/0001_init.sql:136-147`, `supabase/functions/generate-analysis/index.ts:44`, `:51`. Aynı desen: `0005_prematch.sql:135-145` + `generate-preview/index.ts:67`.
- **Senaryo:** Maç `FT` ama `stats` NULL olabilir. Örnekler:
  - Ücretsiz planda `schedule` modu biten maçların yalnız 3'ünü zenginleştirir.
  - API biten maçta `statistics: []` döner (hazırlık maçları, düşük kapsamlı elemeler).
  - NBA'de `enrichFinished` henüz çalışmamıştır.
- **Akış:** Pro kullanıcı AI sekmesini açar. RPC `analysis_attempts`'i artırır, fonksiyon "istatistik yok" ile `failed` yazar. 3 açılış veya "Tekrar dene" sonrası `attempts >= 3` olur. İstatistik sonradan gelse bile hiçbir şey sayacı sıfırlamaz. Analiz o maç için herkese kalıcı olarak "Analiz şu an alınamıyor" gösterir; "Tekrar dene" butonu işe yaramaz.
- **Maç önü raporu:** Aynı sorun var. "İlk 11 açıklanmadı" (T-45 dk kapısı) 4 denemeyi tüketir ve her deneme 1 API isteği harcar.
- **Ek:** `generating` + 3 dk koşulunda deneme sınırı yok. Sürekli çöken bir üretim her istekte yeniden Gemini çağırır.
- **Öneri:**
  - RPC'de `stats is null` (NBA'de `stats->'metrics'`) ise sayaç artırmadan `'not_ready'` dönsün. İstemcide "veri bekleniyor" durumu gösterilsin.
  - "Veri yok" hatasında `failed` yerine `none` yazılsın, deneme iade edilsin.
  - Senkron `stats` yazınca `analysis_status='failed'` satırlarını `none / attempts=0` yapsın.
  - `generating` yeniden denemesine `attempts < 3` koşulu eklensin.
- **Durum:** Düzeltildi. `0015_quality.sql`: `request_match_analysis` istatistik yoksa (NBA'de `stats->'metrics'`) sayaç artırmadan `'not_ready'` döner; `request_match_preview` ilk 11 son 5 dk içinde denenmişse `'not_ready'` döner (maç başına 5 dk'da en fazla 1 API isteği). Takılı `generating` yeniden denemesi deneme sınırına tabi; hakkı biten takılı üretim `failed` döner. Yeni `matches_reset_ai_attempts` tetikleyicisi senkron yeni `stats` / `lineups` / `lineup_detail` yazınca `failed` satırları `none / attempts=0` yapar. `generate-analysis` ve `generate-preview` "veri yok" durumunda `failed` yerine `none` yazıp denemeyi iade eder. İstemci: "Maç verisi bekleniyor" / "İlk 11 henüz açıklanmadı" kartları + "Tekrar kontrol et".

#### 2. [yüksek] Ücretsiz planda biten maçlar saatlerce "canlı 90'" görünür
- **Yer:** `supabase/functions/sync-matches/index.ts:140-146`, `_shared/apiFootball.ts:74`, `:96-107`
- **Senaryo 1:** Canlı listeden düşen (`gone`) maçlar yalnız `getFixturesByIds` ile güncellenir. Ücretsiz planda bu çağrı çalıştırma başına en fazla 3 maç çeker. Cumartesi ~17:00 UTC'de PL, Bundesliga, Serie A ve LaLiga'dan 10–15 maç aynı anda biter. Her 30 dk'da yalnız 3'ü `FT` olur. Sonuncusu 1,5–2,5 saat "canlı 90'" kalır ve "Canlı · N" sayısını şişirir. Kota rezervi dolarsa hiçbiri güncellenmez.
- **Senaryo 2:** Son canlı çalıştırma 22:30 UTC. O anda uzatma veya penaltıda olan maç (Şampiyonlar Ligi gecesi) ertesi gün 09:00 UTC `schedule`'a kadar canlı kalır. Canlı maçlar "Bugün" listesinde de gösterildiği için ertesi sabah dünün maçı "Canlı" görünür.
- **Öneri:**
  - `gone.length > MAX_SINGLE_FETCH` olduğunda önce tek `/fixtures?date=<bugün>&timezone=Europe/Istanbul` isteğiyle (1 istek) tüm maçların durum ve skorunu `mapCore` ile güncelle. Detay için 3 maç sınırı kalsın (NBA tarafı zaten tarih sorgusu kullanıyor).
  - Son canlı çalıştırmayı DB'de canlı maç kaldıkça uzat, ya da 23:00 UTC'ye ek bir "temizlik" çalıştırması koy.
- **Durum:** Düzeltildi. `sync-matches` canlı modda listeden düşen maç sayısı `MAX_SINGLE_FETCH`'i aşınca (veya kota rezervi doluysa) başlama günü başına tek `/fixtures?date=&timezone=Europe/Istanbul` isteğiyle durum/skor günceller (`hasQuotaForStatus`: kalan ≤10 değilse). Detay (olay/istatistik) sonraki çalıştırmalarda `summary_teaser` boş biten maçlardan tamamlanır. Senaryo 2: 0015 ile 23:15 UTC'de tek ek `skor-sync-cleanup` çalıştırması. Tarih gruplama `_shared/syncUtils.ts` + `tests/syncUtils.test.ts`.

#### 3. [yüksek] Ana ekranda yükleme hatası çıkmazdır: yeniden deneme yok
- **Yer:** `src/app/index.tsx:131-132`, `src/hooks/useMatches.ts:32-40`, `:75-86`
- **Senaryo:** Uygulama ağsız veya zayıf ağda açılır. `listMatches` hata verir ve yalnız düz hata metni gösterilir. `SectionList` (ve `RefreshControl`) render edilmediği için çekip yenileme yok. Buton da yok. `load` yalnız spor değişince veya gün dönünce yeniden çalışır. Ağ gelse bile ekran hata metninde kalır; kullanıcı uygulamayı kapatıp açmak zorundadır. Hata metni İngilizce ham `PostgrestError`/`TypeError` olabilir ("Failed to fetch" / "Network request failed").
- **Öneri:**
  - Hata durumunda "Tekrar dene" butonu ve anlaşılır Türkçe metin göster ("Bağlantı yok, tekrar dene").
  - Uygulama öne gelince otomatik `load()` çağır (bkz. bulgu 4).
- **Durum:** Düzeltildi. Hata durumunda Türkçe metin (`lib/errors.ts`: ağ hatası → "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene."), "Tekrar dene" butonu ve çekip yenileme. Uygulama öne gelince otomatik yeniden yükleme (bulgu 4). Yeni e2e: `e2e/home_error_ui.mjs` (`?mockFail=list`).

#### 4. [orta] Uygulama arka plandan dönünce veri tazelenmez; kaçan Realtime olayları kaybolur
- **Yer:** `src/hooks/useMatches.ts:66-68` (AppState yalnız gün kontrolü yapıyor), `src/hooks/useMatch.ts:9-23`
- **Senaryo:** Kullanıcı uygulamayı arka plana alır, işletim sistemi WebSocket'i kapatır. Bu sırada skorlar değişir. Geri gelince kanal yeniden bağlanır ama kaçan olaylar tekrar gönderilmez. Liste ve maç ekranı çekip yenilemeye kadar eski skoru gösterir; maç ekranında yenileme de yok.
- **Öneri:** `AppState` `active` olayında `loadRef.current()` çağır. `useMatch`'e de aynı tazelemeyi ve `RefreshControl` ekle.
- **Durum:** Düzeltildi. `useMatches`: `AppState` `active` olayında liste her durumda yeniden çekilir. `useMatch`: aynı tazeleme + maç ekranında `RefreshControl`.

#### 5. [orta] Maç ekranında ağ hatası "Maç bulunamadı." gösterir; söz yanıtlanmamış reddedilir
- **Yer:** `src/hooks/useMatch.ts:15-18`, `src/app/match/[id].tsx:59-60`
- **Senaryo:** `getMatch` hata fırlatır (ağ yok, ya da push ile açılışta oturum hazır değil). `.then().finally()` zincirinde `catch` yok ve unhandled rejection oluşur. `match` null kaldığı için "Maç bulunamadı." yazar. Bu yanlış bir mesajdır ve yeniden deneme yolu yok. Metin `ScrollView`/arka plan dışında render edildiği için de stilsiz görünür.
- **Ek:** Geç dönen `getMatch` sonucu, arada gelen daha yeni Realtime satırını ezer (`setMatch(m)` birleştirme yapmıyor).
- **Öneri:** `catch` ile `error` durumu ve "Tekrar dene" ekle. Sonucu `prev` ile birleştirerek yaz (`updated_at` karşılaştırmasıyla).
- **Durum:** Düzeltildi. `useMatch` hataları yakalar (`error` + `reload`); maç ekranı ağ hatasında "Maç bulunamadı" yerine hata metni ve "Tekrar dene" gösterir (stilli, arka planlı). Sonuç `updated_at` karşılaştırmasıyla birleştirilir: geç dönen çekim daha yeni Realtime satırını ezmez.

#### 6. [orta] İlk açılışta eşzamanlı `ensureSession` çağrıları birden çok anonim kullanıcı oluşturur
- **Yer:** `src/lib/supabase.ts:40-50`. Çağıranlar aynı anda çalışır: `usePremium.tsx:23-36` (`getPremium`, `isTestUser`) ve `useFollows.tsx:35-41` (`listFollowedIds`, `listFollowedTeams`).
- **Senaryo:** İlk açılışta 4 çağrı oturum yok görür ve her biri `signInAnonymously()` çağırır. Kurulum başına 4 anonim `auth.users` kaydı oluşur; MAU ve tablo şişer. Son biten oturum kalır, önceki yanıtlar başka uid'e aittir. Supabase'in IP başına anonim giriş sınırı (varsayılan saatte 30) CGNAT arkasındaki mobil kullanıcılarda 4 kat hızlı dolar. Bu durumda "anonim oturum açılamadı" olur; takip, Pro ve asistan RPC'leri çalışmaz.
- **Öneri:** `ensureSession`'a tek uçuş (in-flight promise) önbelleği ekle: `let pending: Promise<string|null> | null`.
- **Durum:** Düzeltildi. `ensureSession` tek uçuş: eşzamanlı çağrılar aynı oturum söz'ünü paylaşır, yalnız bir `signInAnonymously()` çalışır.

#### 7. [orta] Asistan sorusu `pending`'de takılırsa hak yanar ve sohbet kalıcı olarak kilitlenir
- **Yer:** `supabase/functions/_shared/gemini.ts:34-38` (fetch zaman aşımı yok), `0008_assistant.sql:97-107`, `0009_maintenance.sql` (pending temizliği yok), `src/hooks/useAssistant.ts:52-57`, `src/components/analysis/AssistantChat.tsx:25`
- **Senaryo:** Gemini isteği askıda kalır, ya da pg_net/edge çağrısı düşer. Edge Function duvar saati sınırında öldürülür, `catch` çalışmaz ve satır `pending` kalır.
- **Sunucu tarafı:** `pending` satırı 3 haktan birini sayar (`status <> 'failed'`).
- **İstemci tarafı:** `pending` true kaldığı sürece giriş ve çipler kalıcı olarak devre dışıdır. "Maç verisine bakılıyor…" sonsuza kadar döner ve her 4 sn'de `listChat` sorgusu atılır.
- **Aynı risk:** Generate fonksiyonlarındaki Gemini çağrılarında da aynı zaman aşımı riski var.
- **Öneri:**
  - `fetch`'e `AbortSignal.timeout(25_000)` ekle.
  - `run_maintenance` (veya `ask_assistant` başı) 5 dk'dan eski `pending` satırları `failed` + iade metniyle kapatsın.
  - İstemci 2 dk'dan eski `pending`'i başarısız gibi göstersin ve yoklamayı durdursun.
- **Durum:** Düzeltildi. `_shared/gemini.ts`: deneme başına `AbortSignal.timeout(25 sn)` (`GEMINI_TIMEOUT_MS`). 0015: `ask_assistant` 2 dk'dan eski kendi `pending` sorusunu `failed` + iade metniyle kapatır (hakka sayılmaz); `run_maintenance` 5 dk'dan eski tüm `pending` satırları kapatır. İstemci 2 dk'dan eski `pending`'i başarısız gösterir ve yoklamayı durdurur.

#### 8. [orta] Ertelenen, iptal edilen veya askıya alınan maç "başlayacak maç" gibi görünür
- **Yer:** `src/lib/types.ts:168-172`, `src/components/MatchRow.tsx:45-51`, `src/app/match/[id].tsx:214-221`
- **Senaryo:**
  - `PST`, `CANC`, `ABD`, `AWD`, `WO`, `TBD` durumları ne canlı ne bitmiş sayılır. Listede ve maç başlığında yalnız başlama saati yazar ("20:00"), skor "–" olur.
  - Sunucu `SUSP`'u canlı sayar (`_shared/types.ts:133`) ama istemcinin `LIVE_STATUSES` listesinde `SUSP` yok. Askıya alınan maç istemcide "başlamamış" görünür.
  - AI sekmesi ertelenen maçta "Analiz maç bitince hazırlanır" der.
- **Öneri:** Durum etiketi eşlemesi ekle: Ertelendi, İptal, Yarıda kaldı, Askıda, Hükmen. `SUSP`'u istemci listesine ekle. Bu durumlarda zil ve AI sekmesi için uygun boş durum göster.
- **Durum:** Düzeltildi. Yeni saf modül `src/lib/status.ts` (Deno testi `tests/status.test.ts`, sunucu `LIVE` ile eşitlik dahil): `SUSP` istemcide canlı; listede ve maç başlığında Ert./İptal/Yarıda/Hükmen etiketleri, canlı rozette "Askı"/"Ara", TBD'de saat yerine "—"/"Saat belli değil". Bu durumlarda zil/takip çubuğu gizli, AI sekmesi "AI taktik analizi üretilmez" kartı gösterir.

#### 9. [orta] Takım takibi bırakılınca maç takipleri kalır; tek maçtan çıkmak mümkün değil
- **Yer:** `supabase/migrations/0010_teams.sql:48-59`, `:75-81`, `supabase/functions/sync-matches/index.ts:69`, `sync-nba/index.ts:76`
- **Senaryo 1:** Takım takip edilince takımın başlamamış maçları `match_follows`'a eklenir. Takip bırakılınca yalnız `team_follows` satırı silinir; otomatik eklenen maç takipleri kalır. Kullanıcı artık takip etmediği takımın maçları için "Maç başladı" ve devre arası bildirimleri almaya devam eder.
- **Senaryo 2:** Takımı takip eden kullanıcı bir maçın zilini kapatır. Her günlük `schedule` çalıştırmasında `follow_team_fixtures` aynı maçı `on conflict do nothing` ile yeniden ekler. Kullanıcının tercihi ertesi gün geri alınır.
- **Öneri:**
  - `match_follows`'a `source` ('manual' | 'team') kolonu ekle. Takım bırakılınca `source='team'` ve `NS` satırlarını sil.
  - Elle bırakılan maçlar için `match_unfollows` (veya `muted`) kaydı tut ve `follow_team_fixtures` bunları atlasın.
- **Durum:** Düzeltildi. 0015: `match_follows.source` ('manual' | 'team') + tek seferlik geçiş (takip edilen takımın başlamamış maçları 'team'), `match_unfollows` tablosu. Takım bırakılınca yalnız `source='team'` ve `NS` maç takipleri silinir (kullanıcının takip ettiği diğer takımın maçı kalır). Elle bırakılan maç `match_unfollows`'a yazılır; `toggle_team_follow` ve `follow_team_fixtures` bunları yeniden eklemez. Önizleme verisi aynı davranışı taklit eder.

#### 10. [orta] Ücretsiz planda vaat edilen bildirimler gelmez; NBA "maç başladı" bildirimi futbol özelliği vaat eder
- **Yer:**
  - `sync-matches/index.ts:166` ve `sync-nba/index.ts:115`: akıllı alarmlar yalnız `PAID`.
  - `_shared/teamEvents.ts:48`
  - `src/app/match/[id].tsx:196`
  - `src/app/settings.tsx:14-19`, `:53`
- **Senaryo:** Üretim ücretsiz planda çalışıyor.
  - Baskı, kırmızı kart ve NBA seri alarmları hiç üretilmez. Ayarlar ekranı bu türleri açılıp kapanabilir gösteriyor. Takip çubuğu "akıllı alarm ve devre arası raporu al" diyor.
  - Devre arası tespiti 30 dk'lık cron ile ~15 dk'lık devre arasını yaklaşık %50 olasılıkla yakalar.
  - "Maç başladı" bildirimi her kullanıcıya "Devre arası raporu ve akıllı alarmlar takipte." der. Ücretsiz kullanıcıda rapor Pro'ya kilitli, alarmlar hiç yok.
  - NBA'de aynı metin gidiyor; NBA'de devre arası raporu yok (Döngü 1 terim politikasıyla da çelişiyor).
- **Öneri:**
  - Push metnini spora ve plana göre ayır (NBA: "Seri alarmı takipte" ya da yalnız "başladı").
  - `PAID` değilken alarm satırlarını ayarlarda "yakında" olarak devre dışı göster ve takip çubuğu metnini gerçek davranışa uydur.
- **Durum:** Düzeltildi. "Maç başladı" metni `syncUtils.kickoffBody`: ücretsiz planda yalnız "X - Y başladı.", ücretli futbolda devre arası + akıllı alarm, ücretli NBA'de "Seri alarmı takipte" (NBA'de devre arası yok; testli). 0015 `api_paid()`'i istemciye açar (`useApiPaid`). Ücretsiz planda ayarlarda Baskı / Kırmızı Kart / NBA Seri "Yakında" ile devre dışı; plan bilinmiyorsa nötr not. Takip çubuğu ücretsizde "maç başlayınca bildirim al".

#### 11. [orta] Asistan girişi: klavye gönder butonunu yutar ve hatada yazılan soru kaybolur
- **Yer:** `src/app/match/[id].tsx:66` (`ScrollView`'da `keyboardShouldPersistTaps` yok, `KeyboardAvoidingView` yok), `src/components/analysis/AssistantChat.tsx:27-31`
- **Senaryo:**
  - Klavye açıkken "Sor"a ilk dokunuş yalnız klavyeyi kapatır; soru ikinci dokunuşta gider.
  - Giriş uzun `ScrollView`'un en altında. Android edge-to-edge'de klavye giriş satırını örtebilir.
  - `send` sorudan önce `setText('')` çağırır. `busy`, `invalid` veya ağ hatası dönerse kullanıcının yazdığı soru silinmiş olur.
- **Öneri:**
  - `keyboardShouldPersistTaps="handled"` ve `automaticallyAdjustKeyboardInsets` (veya `KeyboardAvoidingView`) ekle.
  - Metni yalnız `res === 'queued'` olunca temizle.
- **Durum:** Düzeltildi. Maç ekranı `ScrollView`: `keyboardShouldPersistTaps="handled"`, iOS'ta `automaticallyAdjustKeyboardInsets`, Android'de `KeyboardAvoidingView`. Soru metni yalnız `'queued'` dönünce temizlenir. Klavye davranışı gerçek cihazda doğrulanmalı.

#### 12. [orta] OTA güncellemesi açılıştan saniyeler sonra uygulamayı habersiz yeniden başlatır
- **Yer:** `src/lib/updates.ts:26-29`, `src/app/_layout.tsx:16-18`
- **Senaryo:** Mobil veride indirme 5–20 sn sürebilir. Bu arada kullanıcı maç açar, soru yazar veya bildirime dokunarak maç ekranına gelir. `reloadAsync()` uygulamayı ana ekrana sıfırlar ve yazılan metin ile gezinti kaybolur. Bildirimden açılan maç kaybolur; bu, soğuk açılış bildirim yönlendirmesini de etkisiz kılar.
- **Öneri:**
  - Yeniden yüklemeyi yalnız kısa bir süre içinde (ör. 3 sn) bittiyse ve kullanıcı hâlâ ana ekrandaysa yap.
  - Aksi halde güncellemeyi sonraki açılışa bırak, ya da "Yeni sürüm hazır, yeniden başlat" bandı göster.
  - Not: soğuk açılışta bildirim dokunuşu için `useLastNotificationResponse` / `getLastNotificationResponse` kullanılmıyor (`_layout.tsx:13` yalnız dinleyici kuruyor). Gerçek cihazda doğrulanmalı.
- **Durum:** Düzeltildi. `lib/updates.ts`: `reloadAsync` yalnız güncelleme açılıştan ≤3 sn içinde indiyse ve kullanıcı ana ekrandan ayrılmadıysa (`usePathname` / bildirim açılışı `markUserNavigated`); aksi halde sonraki açılışta uygulanır. Bildirim yönlendirmesi `useLastNotificationResponse` + `clearLastNotificationResponse` (SDK 58 `expo-notifications` 58.1.9 tipleri ve v58 dokümanıyla doğrulandı); yalnız native'de render edilir. Gerçek cihazda soğuk açılış doğrulanmalı.

#### 13. [düşük] Kalabalık maçta push alıcı sorgusu URL sınırını aşıp sessizce düşebilir
- **Yer:** `supabase/functions/_shared/notify.ts:18-31`
- **Senaryo:** `notification_prefs` ve `push_tokens` sorguları tüm takipçi uid'lerini `in.(…)` ile GET URL'ine koyar (uid başına ~37 karakter). Popüler bir derbide yüzlerce takipçide URL sınırı aşılabilir. Hatalar okunmadığı için (`tokens` null) bildirim hiç gitmez ve log da düşmez.
- **Öneri:** Alıcıları tek bir SQL RPC ile seç (join + tercih filtresi), ya da uid listesini 100'lük parçalara böl ve hataları logla.
- **Durum:** Düzeltildi. `notify.ts`: uid ve token listeleri 100'lük parçalarla sorgulanır (`syncUtils.chunk`, testli); takipçi/token/silme hataları loglanır.

#### 14. [düşük] Liste sorgusu kullanılmayan ağır JSON kolonlarını çeker
- **Yer:** `src/lib/data/supabaseSource.ts:24-28`
- **Senaryo:** Ana liste 3 günlük tüm maçlar için `events`, `stats` ve `lineups` (maç önü kadro) çekiyor. Bu kolonlar `MatchRow`'da kullanılmıyor. Mobil veride açılış yavaşlar ve gereksiz veri harcanır.
- **Öneri:** Liste için hafif kolon kümesi kullan. Ağır kolonlar yalnız `getMatch`'te çekilsin.
- **Durum:** Düzeltildi. `supabaseSource.listMatches` yalnız `LIST_COLUMNS` çeker (events, stats, lineups yok; satırda `null`). `getMatch` ağır kolonları ve 42703 geri düşüşlerini korur.

#### 15. [düşük] Sessiz hatalar ve erişilebilirlik eksikleri
- **Yer:**
  - Sessiz hatalar: `MatchRow.tsx:24`, `match/[id].tsx:192`, `:249` (`toggle(...).catch(() => {})`)
  - Eksik rol ve etiketler: `index.tsx:66-71` (Pro butonu), `:102` (filtre çipleri), `MatchRow.tsx:40` (satır)
- **Senaryo:**
  - Ağsızken zil veya yıldız dokunuşu hiçbir geri bildirim vermez; kullanıcı takip ettiğini sanar.
  - Filtre çiplerinde `accessibilityRole`/`accessibilityState` yok. Pro butonunda rol ve etiket yok. Maç satırında özet etiket yok (ekran okuyucu skorları bağlamsız okur).
- **Öneri:**
  - Hata durumunda kısa bir uyarı göster (toast veya satır içi metin).
  - Çiplere `accessibilityRole="tab"` + `selected` ekle.
  - Satıra `accessibilityLabel` ekle: "Ev 1, Deplasman 0, 58. dakika".
- **Durum:** Düzeltildi. Zil / yıldız / takip çubuğu hatası `useFollows.followError` ile 4 sn'lik uyarı (`FollowErrorNotice`, liste ve maç ekranı). Filtre çipleri `tablist`/`tab` + `selected` + etiket ("Canlı, N maç"), Pro butonu `button` + etiket, maç satırı özet etiketi ("Ev 1, Deplasman 0, 58. dakika"; web'de iç içe buton olmasın diye rol yalnız native'de). Filtre satırı `flexWrap`.

KRİTİK/YÜKSEK/ORTA SAYISI: 12 (kritik 0, yüksek 3, orta 9)

## Döngü 3

Tarih: 2026-11-18. Kapsam: Döngü 2 düzeltmelerinin regresyon incelemesi (commit edilmemiş diff, `0015_quality.sql`) + kalan sorunlar. Döngü 1–2'de raporlananlar yeniden yazılmadı.

### Kalite kapıları

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | Geçti: 0 hata |
| `npx eslint src` | Geçti: 0 hata, 0 uyarı |
| `npm run test:functions` | Geçti: 78 geçti, 0 başarısız |
| `deno check */index.ts` | Geçti: 7/7 fonksiyon |
| `npm run e2e` | Geçti: 9/9 betik, sayfa hatası yok |
| `node e2e/narrow_ui.mjs` | Geçti: 360 px'te 7 ekranda yatay taşma yok |

Eklenen test: `e2e/refresh_error_ui.mjs`. `npm run e2e`'ye eklenmedi; bulgu 1 düzelene kadar `exit 2` ile biter. Test önce listeyi yükler, sonra ağı keser ve uygulamayı öne getirir (`visibilitychange`). Sonuç: `hata kutusu=true, liste görünür=false` (`e2e/shots/r1-arka-plan-hatasi.png`).

Regresyon incelemesinde sorun bulunmayanlar:
- `ensureSession` tek uçuş: `inflight` hata ve başarıda sıfırlanıyor.
- `useMatch`: `updated_at` birleştirmesi.
- OTA: yeniden yükleme penceresi + `usePathname`.
- `useLastNotificationResponse`: yalnız native'de.
- `status.ts` etiketleri.
- `LIST_COLUMNS`: liste arayüzü düşürülen kolonların hiçbirini okumuyor.
- `hasQuotaForStatus` + tarih başına durum düzeltmesi.
- `gemini.ts` zaman aşımı.
- `ask_assistant` pending temizliği.
- `AssistantChat`: metin yalnız `queued` dönünce siliniyor.
- 0015 RPC yetkileri: `anon`/`public` kapalı; `follow_team_fixtures` yalnız `service_role`; `match_unfollows` RLS açık ve politikasız.

### Bulgular

#### 1. [orta] Arka plan yenilemesi başarısız olunca yüklü liste tam ekran hata kutusuyla değişir
- **Yer:** `src/hooks/useMatches.ts:38-40`, `:93-94`; `src/app/index.tsx:141-162`
- **Senaryo:**
  - Döngü 2 ile uygulama her öne gelişte listeyi yeniden çeker.
  - Telefon uykudan dönerken radyo henüz hazır değildir; ilk istek "Network request failed" verir.
  - `failure` set edilir. `index.tsx` `error ?` dalını listeden önce değerlendirir.
  - Az önce görünen maç listesi kaybolur, yerine "Bağlantı kurulamadı" kutusu gelir.
  - Aynı durum ağsızken çekip yenilemede ve gece yarısı zamanlayıcısında da olur.
  - e2e ile doğrulandı (`refresh_error_ui.mjs`).
- **Öneri:**
  - Hata kutusunu yalnız elde liste yokken göster (`error && data?.sport !== sport`).
  - Liste varken yenileme başarısızsa listeyi koru ve kısa bir uyarı göster (`FollowErrorNotice` benzeri).
  - Başarılı yüklemede `failure`'ı temizlemeye devam et.
- **Durum:** Düzeltildi. `useMatches` elde liste varken hatayı `refreshError` olarak ayırır (`src/hooks/useMatches.ts:98-103`); `index.tsx:149` listeyi korur ve üstünde "Liste yenilenemedi" bandı gösterir, tam ekran hata yalnız liste yokken. `e2e/refresh_error_ui.mjs` geçiyor ve `npm run e2e`'ye eklendi (uyarı + toparlanınca kalkma da doğrulanır).

#### 2. [orta] AI sekmesi istek sonrası eski `analysis_status` / `preview_status` ile yanlış kart gösterir
- **Yer:** `src/hooks/useAnalysis.ts:94-101`, `src/hooks/usePreview.ts:95-100`
- **Senaryo:** RPC `'generating'` döner ve sunucuda durum `generating` olur. İstemcideki `match.analysis_status` ise Realtime güncellemesi gelene kadar eski değerinde kalır. Türetilmiş durum bu eski değere bakar:
  - **İlk açılış:** Eski durum `none`'dır. Kullanıcı "Maç verisi bekleniyor … Deneme hakkından düşülmedi" kartını görür. Oysa deneme sayıldı ve üretim sürüyor. Bu dal Döngü 2'de eklendi.
  - **"Tekrar dene":** Eski durum `failed`'dır. Buton anında yine "Analiz üretilemedi" gösterir.
  - **Realtime kopuksa:** Yanlış kart üretim bitene kadar kalır. Güvenlik yoklaması `generating` durumunu işlemez.
  - **Maç önü raporu:** `preview_status` için de aynısı geçerli.
- **Öneri:**
  - Türetmeyi yalnız istekten SONRA gözlenen durum değişikliğine uygula. Örnek: `generating` görülene kadar `none`/`failed` yok sayılsın (`sawGenerating` ref'i).
  - Ya da RPC dönüşünde yerel `match` durumu iyimser olarak `generating` yapılsın.
- **Durum:** Düzeltildi. RPC 'generating' dönünce o anki eski durum + `updated_at` saklanır; satır değişene kadar eski `none`/`failed` "üretim sürüyor" sayılır (`src/hooks/useAnalysis.ts:61`, `:89`; `src/hooks/usePreview.ts:61`, `:91`).

#### 3. [orta] Maç önü raporu kota bekçisi olmadan maç başına ~9 API isteği harcayabilir
- **Yer:** `supabase/functions/generate-preview/index.ts:77-78`, `supabase/migrations/0015_quality.sql:121-123`
- **Senaryo:**
  - 0015 öncesi: ilk 11 yoksa en fazla 4 deneme yapılıyordu (4 istek).
  - Şimdi: "ilk 11 yok" denemesi iade ediliyor. Tek sınır 5 dk'lık kısma.
  - Sonuç: T-45 dk ile başlama arasında maç başına 9 `getLineups` isteği atılabilir.
  - API'nin kadro vermediği alt lig ve kupalar bu üst sınıra ulaşır.
  - Bir cumartesi 10 maç ~90 istek eder. Günlük 100'lük ortak kota NBA rezervini (45) de yer.
- **Ek:** `getLineups` ve (kadro bulununca) `getInjuries` öncesinde `hasQuotaForOptional()` kontrolü yok. Pro kullanıcı açılışları kota rezervini hiç dikkate almadan istek harcar.
- **Öneri:**
  - `getLineups` öncesi `hasQuotaForOptional()` kontrolü ekle. Kota yoksa istek atmadan `notReady` dön.
  - "Veri yok" denemelerine ayrı bir sayaç veya üst sınır koy (ör. maç başına en fazla 4 kadro sorgusu). Ya da kısmayı 10–15 dk'ya çıkar.
- **Durum:** Düzeltildi. `generate-preview` ilk 11 öncesi `primeQuota` (/status, kotaya sayılmaz) + `hasQuotaForOptional()`; sakatlık isteği de kotaya bağlı (`supabase/functions/generate-preview/index.ts:80-99`). `0016_quality3.sql`: maç başına en fazla 4 ilk 11 sorgusu (`preview_lineup_checks`), "veri yok" sonrası 10 dk bekleme; sınır dolunca `not_supported` (`:54`, `:67`).

#### 4. [orta] Ayarlar yüklenemezse varsayılanlar gösterilir ve ilk dokunuş kayıtlı tercihlerin üzerine yazar
- **Yer:** `src/app/settings.tsx:33-38`, `:40-51`; `src/lib/data/supabaseSource.ts:231-232`
- **Senaryo:**
  - `getNotificationPrefs` ağ hatası verir, ya da oturum açılamaz ve `DEFAULT_PREFS` döner.
  - Ekran tüm türleri açık gösterir.
  - Kullanıcı yalnız "Maç Başladı"yı kapatır. `setNotificationPrefs(next)` 5 kolonun hepsini yazar.
  - Daha önce kapattığı Devre Arası, Baskı vb. sessizce yeniden açılır. İstemediği bildirimler gelmeye başlar.
- **Ek:** Kaydetme hatası ham İngilizce metinle gösterilir (`:50`, "Failed to fetch"). `friendlyError` kullanılmıyor.
- **Öneri:**
  - Yükleme hatasında anahtarları devre dışı bırak. "Ayarlar yüklenemedi" metni ve yeniden deneme butonu göster.
  - Varsayılan değerlerle kaydetme.
  - Hata metnini `friendlyError` ile göster.
- **Durum:** Düzeltildi. Yükleme hatasında anahtarlar kilitli + "Ayarlar yüklenemedi" ve "Tekrar dene" (`src/app/settings.tsx:38-49`, `:69`, `:78-91`); oturum yoksa `getNotificationPrefs` artık hata verir (varsayılan dönmez). Kayıt hatası `friendlyError` ile (`:64`). Yeni e2e: `e2e/settings_error_ui.mjs` (`?mockFail=prefs`).

#### 5. [düşük] Liste yeniden yüklemesi `updated_at` karşılaştırmadan haritayı tümüyle değiştirir
- **Yer:** `src/hooks/useMatches.ts:36`
- **Senaryo:**
  - Öne gelme yenilemesi sürerken Realtime daha yeni bir skor satırı iletir.
  - Geç dönen `listMatches` sonucu haritayı tümüyle değiştirir ve yeni skoru eskisiyle ezer.
  - Ücretsiz planda listede bir sonraki senkrona kadar (~30 dk) eski skor kalır.
  - `useMatch` bu yarışa karşı korunuyor; `useMatches` korunmuyor.
- **Öneri:** `setData` içinde önceki haritayla `useMatch.merge` mantığıyla birleştir: `updated_at` daha yeni olan kalsın.
- **Durum:** Düzeltildi. `useMatch.merge` → dışa açık `mergeMatch`; liste yüklemesi ve Realtime güncellemesi `updated_at` ile birleşir (`src/hooks/useMatches.ts:40`, `:91`).

#### 6. [düşük] NBA satırında ekran okuyucu çeyreği "dakika" olarak okur
- **Yer:** `src/lib/status.ts:40`, `src/components/MatchRow.tsx:33-38`
- **Senaryo:** NBA'de `elapsed_minute` çeyrek numarasıdır (`_shared/nbaApi.ts:95`). Canlı NBA satırının etiketi "Lakers 80, Celtics 75, 3. dakika" olur. Bilgi yanlıştır ve Döngü 1 basketbol terim politikasıyla çelişir.
- **Öneri:** NBA'de `statusSpeech` yerine `status_detail` kullan ("3. çeyrek 04:12"). Ya da `statusSpeech`'e `sport` parametresi ekle.
- **Durum:** Düzeltildi. `statusSpeech(status, minute, sport)`: NBA'de "3. çeyrek" / "uzatma" (`src/lib/status.ts:43`, `src/components/MatchRow.tsx:34`); Deno testi eklendi.

#### 7. [düşük] AI sekmesindeki "Tekrar dene" butonlarında erişilebilirlik rolü yok
- **Yer:** `src/app/match/[id].tsx:171`, `:223`, `:254`
- **Senaryo:** Döngü 2'de eklenen "Tekrar kontrol et" butonlarında `accessibilityRole="button"` var (`:151`, `:204`). Analiz, maç önü ve devre arası hata kartlarındaki "Tekrar dene" `Pressable`'larında yok. Ekran okuyucu bunları düz metin olarak okur.
- **Öneri:** Üç butona da `accessibilityRole="button"` ekle.
- **Durum:** Düzeltildi. Üç "Tekrar dene" butonuna `accessibilityRole="button"` (`src/app/match/[id].tsx:189`, `:241`, `:272`).

#### 8. [düşük] Ayarlardan takım takibini bırakma hatası görünmez
- **Yer:** `src/app/settings.tsx:206`
- **Senaryo:**
  - `toggleTeam(t).catch(() => {})` hatayı yutar.
  - `followError` yalnız liste ve maç ekranındaki `FollowErrorNotice` ile gösterilir. Ayarlar ekranında bu bileşen yok.
  - Ağsızken "bırak" dokunuşu hiçbir şey yapmaz.
  - Kullanıcı 4 sn içinde geri dönerse uyarıyı yanlış ekranda görür.
- **Öneri:** Ayarlar ekranına `<FollowErrorNotice />` ekle.
- **Durum:** Düzeltildi. Ayarlar ekranına `<FollowErrorNotice />` (`src/app/settings.tsx:77`); "Bırak" butonu 44 pt.

#### 9. [düşük] Cihaz saati ileriyse yeni soru hemen "yanıt alınamadı" görünür
- **Yer:** `src/hooks/useAssistant.ts:60-68`
- **Senaryo:**
  - Bayatlık, cihaz saati (`Date.now()`) ile sunucunun `created_at` değeri karşılaştırılarak ölçülür.
  - Saati 2 dk'dan fazla ileri olan cihazda yeni soru anında "Yanıt alınamadı; bu soru hakkından düşülmedi" gösterir. Yoklama durur ve giriş açılır.
  - Yeni soru sunucuda `busy` döner, çünkü sunucuya göre soru hâlâ taze.
  - Realtime yanıtı sonradan gelirse ekran düzelir.
- **Öneri:** Bayatlığı yerel gözlem anından ölç: `pending`'in ilk görüldüğü zamanı istemcide sakla. Ya da sunucu saatini referans al (`ask_assistant` dönüşü veya yanıttaki `Date` başlığı).
- **Durum:** Düzeltildi. Bayatlık mesajın istemcide ilk görüldüğü andan ölçülür (`seenAt`, `src/hooks/useAssistant.ts:31`, `:75`).

#### 10. [düşük] Elle bırakılan her maç kalıcı "unfollow" kaydı bırakır; sonradan takım takibi o maçı atlar
- **Yer:** `supabase/migrations/0015_quality.sql:219-224`, `:262-267`
- **Senaryo:**
  - Kullanıcı, takımı takip etmiyorken Galatasaray maçını zil ile takip eder, sonra bırakır. `match_unfollows` satırı yazılır.
  - Ertesi gün Galatasaray'ı ☆ ile takip eder.
  - `toggle_team_follow` bu maçı eklemez; takımın en yakın maçında bildirim gelmez.
  - Oysa kullanıcının son ve açık niyeti takımı takip etmektir.
- **Öneri:** `match_unfollows`'a yalnız `source='team'` satırı silinince yaz. Ya da `toggle_team_follow` takibi başlatırken o takımın `match_unfollows` kayıtlarını temizlesin.
- **Durum:** Düzeltildi (`0016_quality3.sql`). `toggle_follow` yalnız takım kaynaklı satır silinince ya da kullanıcı maçın takımını takip ederken kayıt yazar (`:126`); `toggle_team_follow` takip başlarken o takımın kayıtlarını siler (`:172`); 0015 kuralıyla yazılmış gereksiz kayıtlar temizlenir (`:189`).

#### 11. [düşük] Takipçi sorgusu PostgREST satır sınırında (varsayılan 1000) kesilir
- **Yer:** `supabase/functions/_shared/notify.ts:25`
- **Senaryo:** `match_follows` sorgusu sayfalanmıyor. Derbide 1000'den fazla takipçi olabilir (takım takibiyle otomatik eklenenler dahil). İlk 1000 dışındakilere "Maç başladı" ve devre arası bildirimi gitmez. Hata da log da düşmez.
- **Öneri:** `.range()` ile sayfala. Ya da alıcıları tek bir SQL RPC ile seç (join + tercih filtresi + token).
- **Durum:** Düzeltildi. Takipçiler `.range()` ile 1000'lik sayfalarla okunur, sayfa sayısı ve hatalar loglanır (`supabase/functions/_shared/notify.ts:19-41`).

KRİTİK/YÜKSEK/ORTA SAYISI: 4 (kritik 0, yüksek 0, orta 4)

## Döngü 4

Tarih: 2026-11-18. Kapsam: Döngü 3 düzeltmelerinin regresyon incelemesi (commit edilmemiş diff ve `0016_quality3.sql`; 0016 prod'a uygulanmadı), kota mantığı, tasarım geçişinin arayüz ve erişilebilirlik etkisi.

Yeni bilgi: API-Sports kotaları ürün başına AYRIDIR (futbol 100/gün, NBA 100/gün; prod loglarıyla doğrulandı). Ortak kota varsayan kod bulgu sayıldı.

### Kalite kapıları

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | Geçti: 0 hata |
| `npx eslint src` | Geçti: 0 hata, 0 uyarı |
| `npm run test:functions` | Geçti: 79 geçti, 0 başarısız |
| `deno check */index.ts` | Geçti: 7/7 fonksiyon |
| `npm run e2e` | Geçti: 11/11 betik, hepsinde "hatalar: yok" |
| `node e2e/narrow_ui.mjs` | Geçti: 360 px'te yatay taşma yok; derin bağlantıdan geri dönüş OK |

Not: büyük yazı tipi web önizlemesinde test edilemez. RN-web px kullanır; tarayıcı metin yakınlaştırması ölçeklemez. Cihazda elle doğrulanmalı.

Regresyon incelemesinde sorun bulunmayanlar:
- 0016 RPC'leri `security definer` ve `set search_path = ''` kullanıyor. Tüm adlar şema nitelikli (`public.…`, `auth.uid()`).
- 0016 yetkileri: `anon`/`public` kapalı, yalnız `authenticated` açık. Tetikleyici fonksiyonu definer değil ve yetkisi kapalı.
- 0016 idempotent: `add column if not exists`, `create or replace`. Temizlik yeniden çalışınca yalnız hiçbir şeyi engellemeyen kayıtları siler.
- 0016 tek seferlik temizlik veri kaybı açısından güvenli. Silinen kayıtları (kullanıcının takip ettiği takıma ait olmayan maçlar) `follow_team_fixtures` ve `toggle_team_follow` zaten okumuyordu. Takım sonradan takip edilirse 0016 bu kayıtları zaten siler.
- `primeQuota`: `/status` günlük kotaya sayılmaz. Sonuç modül değişkeninde, örnek (instance) başına önbelleğe alınır; yalnız değer `null` iken istek atılır.
- `mergeMatch`: eşit `updated_at`'te gelen satır kazanır; eski çekim yalnız eksik alanları tamamlar.
- `notify.ts` sayfalama `order('user_id')` ile kararlı; `in.(…)` sorguları 100'lük parçalarda.
- Ayarlar hata durumu: tercihler okunamazsa varsayılanlarla kayıt yapılmıyor (e2e doğruladı).
- `LiveMinute` "Hareketi azalt" açıkken sabit. NBA `statusSpeech` çeyrek ve uzatmayı doğru okuyor.
- Kontrast: `textDim` surface üstünde 5.08:1, `textMuted` 6.0:1, `accent` ve `danger` en az 5.5:1. Dolu renkler üstünde `onFill` en az 5.9:1. Aktif gün düğmesinde (`liveGlow`, bg üstünde) `textMuted` 4.59:1.

### Bulgular

#### 1. [yüksek] Kota bekçileri ortak kota varsayıyor; iki üründe günde ~65 istek boşa ayrılıyor
- **Yer:**
  - `supabase/functions/_shared/apiFootball.ts:50-57`: `FOOTBALL_QUOTA_RESERVE` = 45, "gece NBA için".
  - `supabase/functions/_shared/nbaApi.ts:25-30`: `NBA_QUOTA_RESERVE` = 5.
  - `supabase/functions/sync-nba/index.ts:6`, `:23-24` (`NBA_BOX_BACKFILL_RESERVE` = 20, "futbol için"), `:137`.
  - `supabase/migrations/0004_quota.sql:1-7`; `GELISTIRMELER.txt` 3.10.
- **Senaryo:**
  - Futbol anahtarı yalnız futbol kotasını (100/gün) tüketir. NBA çağrıları bu sayacı düşürmez.
  - Futbolda kalan kota 45'e inince isteğe bağlı detay, maç önü ilk 11'i ve sakatlık çekimleri durur. Futbolun ~45 isteği hiç kullanılmaz.
  - NBA geri doldurması kalan 25'in altında durur ("futbol için pay"). NBA'nin ~20 isteği de boşa gider.
  - Sonuç: kota varken biten maç detayları ve maç önü raporu "kota rezervi korunuyor" diye ertelenir.
- **Öneri:**
  - `FOOTBALL_QUOTA_RESERVE` varsayılanını futbolun kendi akşam ihtiyacına göre düşür (ör. 10–15). Bu, gün sonu durum düzeltmesi ve MS detayı için yeterli.
  - `NBA_BOX_BACKFILL_RESERVE` varsayılanını küçült (ör. 5) ya da kaldır.
  - "Ortak kota" yorumlarını düzelt: `apiFootball.ts:51`, `nbaApi.ts:25`, `sync-nba/index.ts:6,23,137,197`, `nbaBox.ts:33`, `0004_quota.sql:1-7` ve GELISTIRMELER 3.10.
  - Cron sıklıkları ayrı bütçeyle yeniden hesaplanabilir.
- **Durum:** Düzeltildi (F12a ile birlikte). Yeni saf modül `supabase/functions/_shared/quota.ts:45` (`createQuotaGuard`): her ürün kendi bekçisi, çapraz rezerv yok. Varsayılanlar `quota.ts:23` (`DEFAULT_RESERVES`): futbol isteğe bağlı 45 → 6, durum tabanı 10 → 3, NBA 5, NBA geri doldurma 20 → 6. Kullanım: `_shared/apiFootball.ts:56-65`, `_shared/nbaApi.ts:31-34`, `sync-nba/index.ts:25`. "Ortak kota" yorumları düzeltildi (`apiFootball.ts:51`, `nbaApi.ts:9,25`, `sync-nba/index.ts:6,24,138,198`, `nbaBox.ts:33`, GELISTIRMELER 3.10). `0004_quota.sql` uygulanmış olduğu için değiştirilmedi; doğru bilgi `quota.ts` başlığında ve GELISTIRMELER 3.31'de. Testler: `tests/quota.test.ts` (9). Cron sıklıkları F12b'ye bırakıldı.

#### 2. [orta] Kota bekçisi devreye girince maçın 4 ilk 11 sorgu hakkından biri yanar; kullanıcı yanlış mesaj görür
- **Yer:** `supabase/functions/generate-preview/index.ts:80-83`; `supabase/migrations/0016_quality3.sql:54-56`, `:61-67`.
- **Senaryo:**
  - RPC talebi sahiplenirken `preview_lineup_checks`'i artırır.
  - Kalan kota rezervin altındaysa (bulgu 1'e göre ≤45) `generate-preview`, `getLineups` çağırmadan `notReady` döner. Deneme iade edilir, sayaç iade edilmez.
  - Kullanıcı 10 dk arayla 4 kez denerse sayaç dolar. Kota yüzünden hiç sorgu atılmamış olsa bile maç kalıcı olarak `not_supported` olur ("bu maç için maç önü analizi üretilmedi").
  - Ara denemelerde istemci "İlk 11 henüz açıklanmadı" der; gerçek neden kotadır.
- **Öneri:**
  - Kota yolunda sayacı da iade et: `preview_lineup_checks = greatest(0, preview_lineup_checks - 1)`. Bunun için kota yoluna ayrı bir `notReady` varyantı yaz.
  - İsteğe bağlı: bir neden alanı yaz; istemci "Veri kotası doldu, daha sonra tekrar dene" desin.
- **Durum:** Düzeltildi. Kota yolunda `notReady(…, refundCheck=true)` ilk 11 sorgu hakkını da iade eder (`preview_lineup_checks - 1`; `supabase/functions/generate-preview/index.ts:56`, `:93`). Kolon ayrı sorguyla okunur: 0016 kurulmamışsa yalnız iade atlanır. Neden alanı (isteğe bağlı) yapılmadı: kolon gerektirir; bulgu 1 ve 7 sonrası kota yolu nadir.

#### 3. [orta] Spor değiştirirken geç dönen eski istek yeni sporun listesini gizler; ekran sonsuz yüklenir
- **Yer:** `src/hooks/useMatches.ts:34-46`, `:97-103`.
- **Senaryo:**
  - `load` kapanışı `sport`'u yakalar ve sonucu seçili spor değişmiş olsa da `setData({ sport: <eski>, … })` ile yazar.
  - Yavaş ağda Futbol isteği sürerken NBA'ye geçilir. NBA listesi önce, Futbol listesi sonra döner.
  - `data.sport` `'football'` olur. NBA için `hasData=false`, `failed=null`, yani `loading=true`.
  - Uygulama yeniden öne gelene kadar NBA sekmesi dönen çark gösterir.
  - Eski sporun başarılı yanıtı `setFailure(null)` ile yeni sporun hata kutusunu da siler.
- **Öneri:**
  - `sportRef` ya da istek kimliği tut. Yanıt geldiğinde `sport !== sportRef.current` ise `setData` ve `setFailure` çağırma.
  - `setFailure(null)` yalnız `failure?.sport === sport` ise yapılsın.
- **Durum:** Düzeltildi. `sportRef` ile yanıt geldiğinde spor değişmişse `setData`/`setFailure` çağrılmaz; başarı yalnız aynı sporun hatasını temizler (`src/hooks/useMatches.ts:35-53`).

#### 4. [orta] Asistan: takılı kalmış eski soru her ekran açılışında girişi 2 dk kilitler (Döngü 3 `seenAt` regresyonu)
- **Yer:** `src/hooks/useAssistant.ts:31-34`, `:46`, `:72-80`; `src/components/analysis/AssistantChat.tsx:25`.
- **Senaryo:**
  - Saatler önce sorulmuş bir soru sunucuda `pending` kalmış.
  - Ekran açılınca `stamp` ona `seenAt = Date.now()` verir. Soru 2 dk (`STALE_PENDING_MS`) boyunca "bakılıyor" görünür.
  - `pending=true` olduğu için giriş ve çipler kilitlidir; 4 sn'de bir yoklama yapılır.
  - `seenAt` bileşen durumunda tutulur. Ekrandan çıkıp dönünce süre baştan başlar.
  - Döngü 3'ten önce `created_at` kullanıldığı için bu soru anında "başarısız" görünüyordu.
- **Öneri:** İlk yüklemede `now - created_at` makul saat kaymasından (ör. 10 dk) büyükse `seenAt = created_at` kullan; değilse `now`. Saati ileri cihaz sorunu çözülmüş kalır, gerçekten eski sorular hemen kapanır.
- **Durum:** Düzeltildi. `firstSeen`: `created_at` 10 dk'dan (saat kayması payı) eskiyse ilk görülme = `created_at`, değilse yerel "şimdi" (`src/hooks/useAssistant.ts:31-46`, `:59`).

#### 5. [orta] Maç satırındaki zil iOS VoiceOver'da erişilemez; etiket hangi maç olduğunu söylemiyor
- **Yer:** `src/components/MatchRow.tsx:20-23` (zil), `:50-57` (satır).
- **Senaryo:**
  - Satır `Pressable`'ı varsayılan olarak `accessible=true` ve kendi `accessibilityLabel`'ına sahip.
  - iOS bunu tek erişilebilirlik öğesi yapar. İçteki zil düğmesine VoiceOver ile odaklanılamaz; ekran okuyucu kullanıcısı listeden maç takip edemez.
  - Android ve web'de zil erişilebilir. Ancak tüm ziller aynı "Maçı takip et" etiketini taşır; hangi maç olduğu anlaşılmaz.
- **Öneri:**
  - Satıra `accessibilityActions` ile "Takip et / Takibi bırak" eylemi ekle ve `onAccessibilityAction` ile `toggle` çağır.
  - Ya da satır içeriğini ayrı bir Pressable'a al, zili onun kardeşi yap.
  - Zil etiketine takım adlarını ekle: "Galatasaray - Fenerbahçe maçını takip et".
- **Durum:** Düzeltildi. Satıra `accessibilityActions` "Takip et / Takibi bırak" + `onAccessibilityAction` (`src/components/MatchRow.tsx:63-70`); zil etiketi takım adlarını söyler: "Ev - Deplasman maçını takip et" (`:21`). `e2e/ht_ui.mjs` seçicisi güncellendi.

#### 6. [düşük] Maç önü: sayaç 4'teyken üretim çökerse kullanıcı başlama saatine kadar "üretilemedi" görür
- **Yer:** `supabase/migrations/0016_quality3.sql:54`, `:67`, `:80-84`.
- **Senaryo:**
  - 4. talepte işçi zaman aşımına uğrar ya da çöker. `preview_status='generating'` ve `preview_lineup_checks=4` kalır.
  - Satır 54 `generating`'i sınırdan muaf tutar; `update` ise `preview_lineup_checks < 4` koşuluna takılır.
  - Yeniden seçimde durum bayat `generating` olduğu için `'failed'` döner. Her "Tekrar dene" aynı hatayı verir; `not_supported` beklenirdi.
- **Öneri:** Satır 84'ten önce `if v_checks >= 4 then return 'not_supported'; end if;` ekle.
- **Durum:** Düzeltildi (0016 yerinde düzenlendi). Son seçimde sayaç da okunur; `v_checks >= 4` ise `'not_supported'` (`supabase/migrations/0016_quality3.sql:83-89`).

#### 7. [düşük] `primeQuota` önbelleği UTC gece yarısı kota sıfırlamasını görmez
- **Yer:** `supabase/functions/_shared/apiFootball.ts:57`, `:70-71`.
- **Senaryo:**
  - Sıcak kalan bir `generate-preview` örneği 23:5x UTC'de `quotaRemaining=40` öğrenir.
  - Gece yarısı kota 100'e döner. Değer `null` olmadığı için `primeQuota` tekrar sormaz.
  - `hasQuotaForOptional()` false kalır ve `getLineups` hiç çağrılmaz; değer de hiç tazelenmez.
  - Örnek geri dönüştürülene kadar her maç önü talebi reddedilir. Bulgu 2 nedeniyle her talep sayacı da yakar.
- **Öneri:** Kota değeriyle birlikte zaman damgası sakla. Değer önceki UTC gününe aitse ya da 10 dk'dan eskiyse `primeQuota` yeniden sorsun.
- **Durum:** Düzeltildi. Değer öğrenildiği anla saklanır; önceki UTC gününe aitse geçersiz, 10 dk'dan eskiyse `primeQuota` yeniden sorar (`_shared/quota.ts:14`, `:45-63`; `_shared/apiFootball.ts:73`). Testler: `tests/quota.test.ts` (gece yarısı, TTL).

#### 8. [düşük] "Bayat durum" sezgisi `updated_at`'e dayanıyor; AI durum değişiklikleri `updated_at`'i değiştirmez
- **Yer:** `src/hooks/usePreview.ts:89-91`, `:100-109`; `src/hooks/useAnalysis.ts:88-89`, `:98-106`; `supabase/migrations/0013_lineups_freshness.sql:22`, `:31-35`.
- **Senaryo:**
  - `none → generating → none` (ilk 11 yok ya da kota) veya `failed → generating → failed` gidiş-dönüşü hızlı olur.
  - `updated_at` değişmediği için durum saklanan bayat değere yeniden eşit olur. Ekran "üretiliyor" gösterir; doğru kart 10 sn'lik yoklamayla gelir.
  - Yoklama `getMatch` hatasını yakalamaz. Çevrimdışıyken 10 sn'de bir işlenmemiş promise reddi oluşur.
- **Öneri:**
  - Durum bayat değerden bir kez farklı görülünce `stale` işaretini temizle; `updated_at`'e gerek kalmaz.
  - Yoklama gövdesini `try/catch` ile sar.
- **Durum:** Düzeltildi. Bayat işaret, durum saklanan değerden bir kez farklı görülünce bırakılır; `updated_at` kullanılmaz (`src/hooks/usePreview.ts:93`, `src/hooks/useAnalysis.ts:91`). Yoklama gövdesi `try/catch` içinde; Realtime yolundaki `loadPayload` reddi yakalanır.

#### 9. [düşük] Switch kapalı izi yetersiz kontrastta; kilitli durumda neredeyse görünmez
- **Yer:** `src/app/settings.tsx:112`, `:117`; `src/theme.ts:6`.
- **Senaryo:**
  - Kapalı iz `borderStrong` (#3A4656), surface (#121821) üstünde 1.86:1. WCAG 1.4.11 en az 3:1 ister.
  - Kilitli durumda `opacity: 0.4` ile iz 1.23:1'e düşer; yalnız açık renkli başparmak görünür.
- **Öneri:** Kapalı iz için en az 3:1 bir ton kullan (ör. #5A6678, ≈3.2:1). Kilitli durumda opaklık yerine `disabled` ve açıklama metni yeterli.
- **Durum:** Düzeltildi. Yeni token `colors.trackOff` #5E6B7E (surface üstünde 3.29:1; `src/theme.ts:7`), Switch'te kullanılıyor (`src/app/settings.tsx:114-116`). Kilitli opaklık kaldırıldı; ayarlar okunamazsa bildirim kartı hiç çizilmez (tasarım B-3, `settings.tsx:93`).

#### 10. [düşük] Bazı dokunma alanları hâlâ 44 pt altında
- **Yer:** `src/components/analysis/AssistantChat.tsx:149` (öneri çipi `minHeight: 36`, `hitSlop` yok); `src/components/SegmentedTabs.tsx:47` (sekme `minHeight: 40`, `hitSlop` yok).
- **Senaryo:**
  - Tasarım geçişi 44 pt hedefliyor. `index.tsx` çipleri (40 + hitSlop 4) ve takım yıldızı (32 + hitSlop 6) hedefi karşılıyor.
  - Asistan çipleri ve maç sekmeleri karşılamıyor. Çipler alt alta sarıldığı için yanlış çipe dokunma riski var.
- **Öneri:** `minHeight: hit` kullan ya da dikey `hitSlop` ekle.
- **Durum:** Düzeltildi. Asistan çipi `minHeight: hit` (`src/components/analysis/AssistantChat.tsx:149`); sekme 40 pt + dikey `hitSlop` 2 = 44 pt (`src/components/SegmentedTabs.tsx:26`, `:40-41`).

#### 11. [düşük] Bildirim tercihleri bir parçada okunamazsa sonraki kullanıcıların "kapalı" tercihi yok sayılır
- **Yer:** `supabase/functions/_shared/notify.ts:60-66`.
- **Senaryo:**
  - Parçalı okumada bir parça hata verirse döngü `break` ile biter.
  - Sonraki parçalardaki, bildirimi kapatmış kullanıcılar da bildirim alır.
  - Eski tek sorguda da hata "tümü açık" sayılıyordu; parçalama bunu kısmi ve daha az görünür yaptı.
- **Öneri:** `break` yerine `continue` kullan. Okunamayan parçanın kullanıcılarını bu bildirimden çıkar (şüphede gönderme) ya da hatada bir kez yeniden dene.
- **Durum:** Düzeltildi. Parça hatasında bir kez yeniden okunur; yine okunamazsa o parçanın kullanıcıları bu bildirimden çıkarılır (şüphede gönderme) ve döngü sürer. Tablo/kolon yoksa eski davranış (herkes açık) korunur (`supabase/functions/_shared/notify.ts:18-20`, `:62-80`).

#### 12. [düşük] `toggle_follow` çift dokunuşta benzersizlik hatası verir
- **Yer:** `supabase/migrations/0016_quality3.sql:125-141`.
- **Senaryo:**
  - Aynı maça hızlı iki dokunuş iki RPC'yi eşzamanlı çalıştırır. İkisi de silinecek satır bulamaz ve ikisi de `insert` yapar.
  - İkincisi `duplicate key` hatası alır; istemci "takip güncellenemedi" uyarısı gösterir.
  - Sorun önceden de vardı. 0016 bu fonksiyonu zaten yeniden yazdığı için düzeltmek kolay.
- **Öneri:** `insert … on conflict (user_id, fixture_id) do nothing;` kullan.
- **Durum:** Düzeltildi (0016 yerinde düzenlendi). `insert … on conflict (user_id, fixture_id) do nothing` (`supabase/migrations/0016_quality3.sql:147-149`).

KRİTİK/YÜKSEK/ORTA SAYISI: 5 (kritik 0, yüksek 1, orta 4)

## Döngü 5

Tarih: 2026-11-18. Kapsam: Döngü 4 düzeltmelerinin regresyon incelemesi (commit edilmemiş diff, GELISTIRMELER 3.31). İncelenenler: `_shared/quota.ts` ve bağlantıları, `0016_quality3.sql` (hâlâ prod'a uygulanmadı), istemci durumları, erişilebilirlik, 360 px ve büyük yazı, Türkçe metin, belgelerde "ortak kota" kalıntısı.

### Kalite kapıları

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | Geçti: 0 hata |
| `npx eslint src` | Geçti: 0 hata, 0 uyarı |
| `npm run test:functions` | Geçti: 94 geçti, 0 başarısız (6'sı yeni: `tests/quota_edge.test.ts`) |
| `deno check */index.ts` | Geçti: 7/7 fonksiyon |
| `npm run e2e` | Geçti: 11/11 betik, hepsinde "hatalar: yok" |
| `node e2e/narrow_ui.mjs` | Geçti: 360 px'te yatay taşma yok; derin bağlantıdan geri dönüş OK |
| `node e2e/largefont_ui.mjs` (yeni) | Bulgu: 360 px ve yazı ×1,24 / ×1,3 benzetiminde tek satırlık metinler kırpılıyor (bulgu 3–5) |

Yeni testler:
- `supabase/functions/tests/quota_edge.test.ts`: kalan tam rezervde, `needed=0`, TTL sınırı, NaN/Infinity, 23:59:59.999 → 00:00 sınırı ve gece yarısını geçen geç yanıt (bulgu 2; mevcut davranışı belgeler).
- `e2e/largefont_ui.mjs`: RN-web'de fontScale yok. Görünür metinlerin `font-size`'ı `FONT_SCALE` (varsayılan 1,3) ile çarpılır, sonra `numberOfLines=1` metinlerde `scrollWidth > clientWidth` aranır. Ekran görüntüsü: `e2e/shots/lf1-mac-buyukyazi.png`.

Regresyon incelemesinde sorun bulunmayanlar:
- Kota matematiği: `allows` = `kalan − needed ≥ rezerv`. Kalan tam rezervdeyse ret, rezerv+1'de son isteğe izin. Bilinmiyorsa ya da önceki UTC gününe aitse izin. NBA geri doldurma `hasNbaQuota(1 + 6)` ile en az 12 kalanda çalışır. Testlerle doğrulandı.
- Futbol ve NBA bekçileri ayrı modül örnekleri. Çapraz rezerv yok. Başlık yoksa değer ezilmiyor.
- 0016 `request_match_preview`:
  - `checks ≥ 4` iken `generating` dışındaki her durumda `not_supported` döner.
  - Taze `generating`, `update` koşulu (`preview_lineup_checks < 4`) tutmasa da yeniden okumada `generating` döner.
  - Bayat `generating` ile dolu sayaç `not_supported` döner. Sonsuz `failed` yok.
- 0016 `toggle_follow`: `on conflict (user_id, fixture_id) do nothing`, 0006'daki birincil anahtarla eşleşiyor. `match_unfollows` eklemesi de `on conflict do nothing`.
- `generate-preview` kota yolu iadesi: `preview_attempts` ve `preview_lineup_checks` birer azalır. 0016 kurulmamışsa yalnız sayaç iadesi atlanır.
- Kicker metinleri: `ui.tsx`'te `textTransform` yok. Tüm `kicker=` dizeleri kaynakta büyük harfle yazılmış ve "İ" doğru ("İLK 11 & DİZİLİŞ", "KİLİT EŞLEŞME", "TEKNİK DİREKTÖR & KULÜBE"). `LineupTab` "YEDEKLER" de doğru. Kodda başka `textTransform` kalmadı.
- `useMatches` `sportRef`: spor değişince geç dönen eski liste ve hata yok sayılıyor. `useAssistant` `firstSeen`: 10 dk'dan eski `pending` ilk açılışta bayat sayılıyor.
- `notify.ts`: parça hatasında bir kez yeniden deneme, sonra o parça atlanır. Tablo yoksa herkes açık sayılır.
- `SegmentedTabs` 40 pt ve hitSlop ile 44 pt. Saha orta dairesi 48 px.

### Bulgular

#### 1. [orta] Devre arası kuyruğu kota rezervini aynı döngüde birden çok kez harcayabilir
- **Yer:** `supabase/functions/sync-matches/index.ts:125-133`; işçi: `supabase/functions/generate-halftime/index.ts:49` (bekçisiz `apiGet`).
- **Senaryo:**
  - Kalan 8 iken 4 maç aynı anda devre arasına girer.
  - `hasQuotaForOptional()` her turda `8 − 1 ≥ 6` sonucuyla izin verir. Kuyruğa alınan işler henüz istek atmamıştır.
  - 4 iş kuyruğa girer, işçiler 4 istek atar ve kalan 4'e düşer.
  - Futbolun günlük sabit işleri için ayrılan 6'lık rezerv yenmiş olur. Aynı saatte başlayan maçlar (cumartesi, Avrupa akşamları) bu durumu olası kılar.
- **Öneri:** `hasQuotaForOptional(needed)` dışa açılmalı ve döngüde `hasQuotaForOptional(halftimeQueued + 1)` kullanılmalı. Bir başka seçenek, işçide de `primeQuota` + `hasQuotaForOptional()` kontrolüdür.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `sync-matches/index.ts:128` `hasQuotaForOptional(halftimeQueued + 1)`; `_shared/apiFootball.ts:59` `needed` parametresi. Test: `quota_edge.test.ts` (kalan 8 → 2 iş).

#### 2. [düşük] Kota değeri yanıtın geldiği anla damgalanıyor; gece yarısını geçen yanıt ve boş başlık yanlış değer yazar
- **Yer:** `supabase/functions/_shared/apiFootball.ts:87-89`, `supabase/functions/_shared/nbaApi.ts:40-42`, `supabase/functions/_shared/quota.ts:52-56`.
- **Senaryo:**
  - Gece yarısı: istek 23:59:58Z'de gider, yanıt 00:00:02Z'de gelir. Başlıktaki dünkü kalan (ör. 2), `set(2)` ile "bugün" diye damgalanır.
  - Yeni gün kotası 100 olsa da bekçi, bir sonraki başlığa kadar isteğe bağlı çekimi reddeder. `generate-preview` 10 dk boyunca `/status` sormaz. Test: `tests/quota_edge.test.ts` son vaka.
  - Boş başlık: başlık var ama boşsa `Number('') = 0` olur. `has()` true döndüğü için `set(0)` çağrılır ve tüm isteğe bağlı çekimler durur.
- **Öneri:** `const sentAt = Date.now()` fetch'ten önce alınmalı, sonra `quota.set(rem, sentAt)` çağrılmalı. Başlık `raw?.trim()` ile boşsa yok sayılmalı.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `_shared/quota.ts:74` `remainingFromHeader` (boş/geçersiz → null); `apiFootball.ts:79,93` ve `nbaApi.ts:44` `quota.set(rem, sentAt)`. Test: `quota_edge.test.ts` iki yeni vaka.

#### 3. [orta] Büyük yazıda maç sekmesi "✦ AI Tak…" diye kırpılıyor
- **Yer:** `src/components/SegmentedTabs.tsx:29-32` (`numberOfLines={1}`; `maxFontSizeMultiplier` ve küçülme yok).
- **Senaryo:**
  - 360 px'te sekme genişliği ~80 px. Yazı ×1,24'te (iOS "xxLarge"; erişilebilirlik boyutlarının altında) "✦ AI Taktik" kırpılıyor (`largefont_ui.mjs`, `lf1-mac-buyukyazi.png`).
  - "✦" sekme adının içinde. Ekran okuyucu simgeyi okur ama "Pro" bilgisini vermez.
- **Öneri:** `adjustsFontSizeToFit` ve `minimumFontScale={0.8}` ya da `numberOfLines={2}` kullanılmalı. Pro sekmeye `accessibilityLabel={`${it.label}, Pro`}` verilmeli.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `SegmentedTabs.tsx:24` etiket "AI Taktik, Pro", `:32` `numberOfLines={2}` + ortalı. `largefont_ui.mjs` ×1,3'te kırpılma yok ve etiketi doğrular.

#### 4. [orta] Skor başlığında takım adı büyük yazıda kelime ortasından bölünüyor
- **Yer:** `src/app/match/[id].tsx:351-373` (`teamNameSize` yazı ölçeğini hesaba katmıyor).
- **Senaryo:**
  - Yazı ×1,3'te "Boğaziçi SK", "Boğazi / çi SK" diye bölünüyor (`lf1-mac-buyukyazi.png`).
  - Native'de `adjustsFontSizeToFit` en fazla %80'e küçültür. ×1,5 ve üstünde aynı bölünme beklenir.
- **Öneri:** Boyut `useWindowDimensions().fontScale` ile bölünmeli ya da `maxFontSizeMultiplier={1.2}` verilmeli. Web'de `wordBreak: 'keep-all'` kullanılmalı.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. Skor başlığı adı yazı ölçeğiyle büyümez (`[id].tsx:365` `TEAM_NAME_MAX_SCALE = 1`, `:390` `maxFontScale`). `lf1-mac-buyukyazi`: "Boğaziçi / SK" kelime sınırında.

#### 5. [düşük] Büyük yazıda olay satırlarında oyuncu adı kayboluyor
- **Yer:** `src/components/match/Timeline.tsx:84-89` (`numberOfLines={1}`); ayrıca `src/app/index.tsx:56`.
- **Senaryo:**
  - ×1,24'te "Çıkan: Tolga Sezer", "Çıkan: Hakan Çelik" ve "Penaltı incelemesi" kırpılıyor. ×1,3'te "Asist: Emre Coşar" da kırpılıyor.
  - Liste başlığında "18 Kasım Çar" da kırpılıyor.
  - Kırpılan kısım bilginin kendisi: oyuncu adı.
- **Öneri:** `numberOfLines={2}` kullanılmalı.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `Timeline.tsx:99,102` ve `index.tsx:57` `numberOfLines={2}`; liste takım adları ×1,2 sınırlı (`MatchRow.tsx`). `largefont_ui.mjs` artık hata verir ve `npm run e2e` zincirinde.

#### 6. [orta] Saha dizilişinde oyuncu işaretleri ekran okuyucuda parça parça okunuyor
- **Yer:** `src/components/match/LineupTab.tsx:73-91` (`Marker`), `:211` (saha).
- **Senaryo:**
  - VoiceOver ve TalkBack her oyuncu için "1", "6.3", "Demir" diye ayrı öğeler okur. Hangi puanın kime ait olduğu ve puan renginin anlamı kaybolur.
  - Sahadaki `accessibilityLabel="Saha dizilişi"`, `accessible` olmadan native'de etkisizdir.
- **Öneri:** `Marker`'a `accessible` ve "Demir, 1 numara, puan 6.3" biçiminde `accessibilityLabel` verilmeli.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `LineupTab.tsx:75` `markerLabel`, `:86` `accessible` + "Demir, 1 numara, puan 6.3" (numara yoksa mevki: "kaleci"…). Saha etiketi e2e için kaldı.

#### 7. [düşük] Maç satırı takip durumunu söylemiyor; erişilebilirlik eylemi sonrası geri bildirim yok
- **Yer:** `src/components/MatchRow.tsx:61-63`, `:53-55`.
- **Senaryo:**
  - VoiceOver satırı "Ev 1, Dep 0, 58. dakika" diye okur. Takip durumu yalnız eylem menüsündeki "Takibi bırak" etiketinden anlaşılır.
  - Eylem sonrası duyuru yapılmaz. Hata yalnız `FollowErrorNotice` ile görünür.
- **Öneri:** Etikete takip ediliyorsa ", takip ediliyor" eklenmeli. Başarıda `AccessibilityInfo.announceForAccessibility('Maç takip ediliyor')` / `'Takip bırakıldı'` çağrılmalı.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `MatchRow.tsx:66` etiket sonuna ", takip ediliyor"; başarıda `announceForAccessibility` (`:57`).

#### 8. [düşük] Ham İngilizce hata metni hâlâ dört yerde ekrana yazılıyor
- **Yer:** `src/hooks/usePreview.ts:78-79`, `src/hooks/useAnalysis.ts:75-76`, `src/hooks/useHalftime.ts:58-59`, `src/app/settings.tsx:191`.
- **Senaryo:** Ağ yokken "Maç önü analizi alınamadı: TypeError: Failed to fetch" ya da Postgrest mesajı görünür. Döngü 4'teki `friendlyError` geçişi bu dört yeri atlamış.
- **Öneri:** Bu yerlerde `friendlyError(e, '… alınamadı. Tekrar dene.')` kullanılmalı.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `usePreview.ts:80`, `useAnalysis.ts:76`, `useHalftime.ts:60`, `settings.tsx:193` `friendlyError`.

#### 9. [düşük] Kota yüzünden ertelenen maç önü raporu "İlk 11 henüz açıklanmadı" diyor
- **Yer:** `src/app/match/[id].tsx:215-225`; neden: `supabase/functions/generate-preview/index.ts:92-93`.
- **Senaryo:**
  - Kota rezervi korunurken ilk 11 açıklanmış olsa da kullanıcı "İlk 11 henüz açıklanmadı … Birkaç dakika sonra tekrar dene" görür.
  - Bu arada RPC 10 dk boyunca `not_ready` döner. "Birkaç dakika" içindeki denemeler sonuçsuz kalır.
- **Öneri:** Metin nedenden bağımsız olmalı ve süreyi doğru vermeli: "Maç önü analizi şu an hazırlanamıyor. ~10 dk sonra tekrar dene."
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `[id].tsx:233` "Maç önü analizi şu an hazırlanamıyor" + "~10 dk sonra tekrar dene".

#### 10. [düşük] Belgelerde kota paylaşımı hâlâ çözülmemiş soru olarak duruyor
- **Yer:** `docs/rakip-arastirmasi.md:263` ("Kota gerçekten ortak mı? Önemli belirsizlik … Doğrulanamadı") ve `:304` ("ortak mı ürün başına mı olduğu belirlenmeli").
- **Senaryo:**
  - Kodda ortak kota iddia eden yorum kalmadı.
  - `supabase/migrations/0004_quota.sql:1-2` uygulanmış migration olduğu için bilerek bırakılmış; `quota.ts:7`'de not var.
  - Rakip araştırması ise soruyu hâlâ açık gösteriyor.
- **Öneri:** İki satıra "Çözüldü (2026-11-17 prod logu): kotalar ürün başına ayrı" notu eklenmeli.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `docs/rakip-arastirmasi.md` iki satıra "Çözüldü" notu.

#### 11. [düşük] Türkçe metin: "İLK 5 VS BENCH" ve yerel ayarsız büyük harf
- **Yer:** `src/components/nba/NbaAnalysisCards.tsx:114`; `src/components/preview/PreviewCards.tsx:135`.
- **Senaryo:**
  - Kicker'da İngilizce "BENCH" kalmış; başka yerlerde "yedek" deniyor.
  - `label.toUpperCase()` yerel ayarsız. Bugünkü etiketlerde "i" yok, ama ileride eklenecek "i" "I" olur.
  - Aynı rozet satır 169'da küçük harfle gösteriliyor.
- **Öneri:** "İLK 5 VS YEDEKLER" yazılmalı. Rozette `toLocaleUpperCase('tr-TR')` kullanılmalı ya da iki yerde de küçük harf bırakılmalı.
- **Durum (Döngü 5, geliştirici):** Düzeltildi. `NbaAnalysisCards.tsx:114` "İLK 5 VS YEDEKLER"; `PreviewCards.tsx:135` `toLocaleUpperCase('tr-TR')`.

KRİTİK/YÜKSEK/ORTA SAYISI: 4 (kritik 0, yüksek 0, orta 4)


## Döngü 6

Tarih: 2026-11-18. Kapsam: Döngü 5'te eklenen F3/F4 büyüme özelliği (GELISTIRMELER 3.32): `0017_growth_invites.sql`, `src/lib/share.ts`, `src/lib/growth.ts`, `useInvite`, `ShareButton`, `InviteCard`, ayarlar / `_layout` / maç ekranı bağlantıları, `legal.ts` metni, önizleme anahtarları (`?dl=0`, `?invite=0`, `?mockFail=invite`) ve Döngü 5 düzeltmelerinin regresyonu. Öncelik: 0017'nin güvenliği ve doğruluğu.

### Kalite kapıları

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | Geçti: 0 hata |
| `npx eslint src` | Geçti: 0 hata, 0 uyarı |
| `npm run test:functions` | Geçti: 113 geçti, 0 başarısız |
| `deno check */index.ts` | Geçti: 7/7 fonksiyon |
| `npm run e2e` | Geçti: 13/13 betik (`share_ui.mjs` dahil), hepsinde "hatalar: yok" |
| `node e2e/narrow_ui.mjs` | Geçti: 360 px'te yatay taşma yok; derin bağlantıdan geri dönüş OK |
| `node e2e/growth_largefont_ui.mjs` (yeni) | Geçti: 360 px + yazı ×1,3'te davet kartı taşmıyor; "‹ Maçlar" ile "Paylaş" ayrık |
| 0017 gerçek Postgres testi (yeni, PGlite PG16) | Geçti: 28/28 kontrol. İki kontrol mevcut hatalı davranışı belgeler (bulgu 1 ve 4) |

Yeni testler:
- `supabase/sql-tests/0017_growth_invites.pglite.mjs`: 0017'yi WASM Postgres'te (PGlite) iki kez çalıştırır. `auth.users`, `auth.uid()`, `cron.schedule/unschedule`, `anon` / `authenticated` / `service_role` rolleri ve Supabase varsayılan yetkileri taklit edilir. 0001'deki `profiles` ve tetikleyici aynen kurulur. Prod'a dokunmaz. Çalıştırma: `npm i --no-save @electric-sql/pglite@0.2.17 && node supabase/sql-tests/0017_growth_invites.pglite.mjs`.
- `e2e/growth_largefont_ui.mjs`: davet kartı ve "Paylaş" başlık düğmesi, 360 px + ×1,3 yazı. Ekran görüntüleri: `e2e/shots/c6-davet-buyukyazi-360.png`, `e2e/shots/c6-paylas-buyukyazi-360.png`. `npm run e2e` zincirine eklenmedi (package.json'a dokunulmadı); eklenmesi önerilir.

Gerçek Postgres'te doğrulanan, sorun çıkmayanlar:
- Söz dizimi ve tipler: migration hatasız derleniyor. İkinci çalıştırma da hatasız (idempotent). Kısıtlar `pg_constraint` kontrolüyle tekrar eklenmiyor. Cron işi tek kalıyor (`unschedule ... where exists` + `schedule`).
- Yetkiler: `anon` üç kullanıcı RPC'sini de çağıramıyor (`permission denied`). `authenticated` için `invite_random_code`, `admin_growth_report` ve `admin_invite_leaderboard` kapalı. `user_activity_days` tablosuna doğrudan `select` ve `insert` reddediliyor. `profiles` güncellemesi 0 satır etkiliyor (UPDATE politikası yok): `invited_by`, `invite_code` ve sayaçlar istemciden yazılamıyor.
- Veri sızıntısı yok: kullanıcı `profiles`'ta yalnız kendi satırını görüyor. Başkasının kodunu ya da aktivitesini okuyamıyor. `match_chat` da yalnız kendi satırı (0008), bu yüzden `invited_by` UUID'si başka veriyle eşleştirilemiyor.
- Kurallar:
  - Kendi kodu `self`, ikinci kod `already`, 10 günlük hesap `too_late`, karşılıklı davet `not_allowed` döner.
  - 10 hatalı denemeden sonra doğru kod da `rate_limited` döner.
  - `null` ve 100 000 karakterlik kod `invalid` döner. Küçük harf ve boşluklu kod (`abc 234`) kabul edilir.
  - Kod tekrar çağrıda sabit kalır. `touch_activity` aynı gün ikinci satırı eklemez.
- Kod üretimi: alfabe 31 karakter. İstemci regex'i, SQL CHECK ve `invite_random_code` aynı. Çakışmada `unique_violation` alt işlemde yakalanıp 10 kez yeniden deneniyor (31⁶ ≈ 887 milyon kod). Aynı kullanıcı aynı anda iki kez `get_my_invite` çağırırsa ikinci `update`, `invite_code is null` koşulu yeniden değerlendirildiği için 0 satır günceller ve ilk kodu okur.
- Eşzamanlı kod girme (aynı hesap): `select ... for update` kendi satırını kilitliyor. İkinci istek bekliyor, sonra `already` dönüyor.
- `security definer` fonksiyonların hepsinde `set search_path = ''` var, tüm adlar şemayla nitelenmiş. `get_my_invite`'ın `returns table` sütun adları gövdedeki adlarla çakışmıyor.
- İstemci:
  - Paylaş canlı, devre arası, PST/CANC maçta ve `?dl=0` iken çizilmiyor. NBA uzatması `FT`'ye normalize edildiği için uzatmalı maçta da paylaşım var.
  - `matchLink` sondaki `/`'ı, mevcut sorguyu ve `#`'ı koruyor. Eski `ref`/`k` atılıyor, değerler `encodeURIComponent` ile kodlanıyor.
  - 0017 yokken kart gizleniyor, bağlantı `k`'sız gidiyor, `touch_activity` sessiz kalıyor.
  - Metinler §8 ile uyumlu ("reklamsız", §8 ana mesaj 3 ile uyumlu).
  - KVKK metninde 120 gün ve davet bilgisi var. Erişilebilirlik etiketleri var.
- Döngü 5 düzeltmeleri (kota `needed`, `remainingFromHeader`, SegmentedTabs 2 satır, büyük yazı, Timeline "Maç başlamadı", InfoStrip): kapılarda ve e2e'de regresyon yok.

### Bulgular

#### 1. [orta] 120 günlük temizlik eski davetlileri "aktif" sayısından düşürüyor; sayaç ve sıralama geriye gidiyor
- **Yer:** `supabase/migrations/0017_growth_invites.sql:105-107` (`get_my_invite` active), `:202` (leaderboard), `:212-216` (cron).
- **Senaryo:**
  - Davetli 2 gün aktif olur ve sayaç "Aktif olan: 1" gösterir.
  - 120 gün sonra cron eski günleri siler.
  - Sayaç "Aktif olan: 0"a düşer, "Kurucu Destekçi" sıralaması da değişir. Kullanıcı kazandığını düşündüğü hakkı kaybeder.
  - PGlite testinde doğrulandı: aktif 1 → 0.
- **Düzeltme:**
  - `profiles`'a `invite_active_at timestamptz` ekleyin.
  - `touch_activity`, `invited_by` doluysa ve ikinci farklı gün yazıldıysa bu alanı bir kez doldursun.
  - Sayaç ve sıralama `user_activity_days` yerine bu alanı saysın. Temizlik böylece sayacı etkilemez.
- **Durum:** Düzeltildi (0017 yerinde). `profiles.invite_active_at` (`0017_growth_invites.sql:29`); `touch_activity` bir kez yazar (`:61-96`). `get_my_invite` (`:143`) ve `admin_invite_leaderboard` bunu sayar. PGlite: temizlikten sonra aktif 6 kalıyor.

#### 2. [orta] Sahte davet önlemi zayıf: "2 farklı gün" iki dakikada sağlanıyor, koddan önceki günler de sayılıyor
- **Yer:** `supabase/migrations/0017_growth_invites.sql:105-107`, `:118-167`. Yöntem: `docs/inovasyon-onerileri.md` §4.3 Risk.
- **Senaryo:**
  - Betik anon anahtarla `signInAnonymously` çağırır, hedef kodu `redeem_invite` ile girer.
  - 23:59 ve 00:01 TSİ'de `touch_activity` çağırır. Hesap 2 dakikada "aktif davet" olur; cihaz ya da uygulama gerekmez.
  - Kod girilmeden önceki günler de sayılır (`invited_at` filtresi yok).
  - Uygulama verisini silip yeniden kurmak da yeni davetli üretir.
  - Tek sınır Supabase'in anonim oturum IP limitidir (varsayılan saatte 30).
- **Düzeltme:**
  - Aktiflik için yalnız `day > (invited_at at time zone 'Europe/Istanbul')::date` olan günleri sayın. İki gün arasında en az bir tam gün olsun (`max(day) - min(day) >= 2`).
  - Davet edene günlük üst sınır koyun (ör. 24 saatte 5 `ok`).
  - `admin_invite_leaderboard`'a "hesap açılışından ≤ 5 dk sonra kod girilen" sayısını ekleyin; elle inceleme için.
  - Supabase Auth'ta anonim oturum için CAPTCHA'yı değerlendirin.
- **Durum:** Düzeltildi. Yalnız `day > (invited_at at time zone 'Europe/Istanbul')::date` günleri, `max(day) - min(day) >= 2` (`:79-84`). Davet eden başına 24 saatte en fazla 5 yeni aktif (`:88-93`, advisory lock); fazlası sonraki açılışlara kalır. `admin_invite_leaderboard.quick_redeem` (≤ 5 dk; `:248-256`, dönüş tipi değiştiği için önce `drop function if exists`). CAPTCHA: yalnız not, uygulanmadı (Supabase Auth ayarı, elle).

#### 3. [düşük] Karşılıklı davet kontrolünde yarış: eşzamanlı A→B ve B→A ikisi de `ok`
- **Yer:** `supabase/migrations/0017_growth_invites.sql:130` (yalnız kendi satırı kilitli), `:149`, `:160`.
- **Senaryo:**
  - A, B'nin kodunu girerken B de aynı anda A'nın kodunu girer.
  - Her işlem kendi satırını kilitler, karşı satırı kilitsiz okur.
  - Karşı tarafın `invited_by` değeri henüz commit edilmemiştir, iki işlem de `null` görür.
  - İkisi de `ok` döner, karşılıklı davet oluşur.
  - Bu, READ COMMITTED kurallarından çıkarıldı. Tek bağlantılı PGlite'ta yeniden üretilemez.
- **Düzeltme:** Davet edenin satırını okumadan önce çift için işlem kilidi alın: `perform pg_advisory_xact_lock(hashtextextended(least(v_uid, v_inviter.id)::text || greatest(v_uid, v_inviter.id)::text, 0));`. Ardından davet edenin satırını yeniden okuyun. Alternatif: iki satırı UUID sırasıyla `for update` kilitleyin.
- **Durum:** Düzeltildi. `redeem_invite` çift için `pg_advisory_xact_lock(hashtextextended(least||greatest))` alır, davet edeni yeniden okur (`:201-207`); davet eden arada silindiyse `invalid`. Gerçek eşzamanlılık PGlite'ta üretilemez; test kilidin gövdede olduğunu ve sıralı karşılıklı davetin hâlâ `not_allowed` olduğunu doğrular.

#### 4. [düşük] Davet eden hesabını silerse davetli 7 gün içinde ikinci bir kod girebiliyor
- **Yer:** `supabase/migrations/0017_growth_invites.sql:45-46` (`on delete set null`), `:109`, `:132`.
- **Senaryo:**
  - B, A'nın kodunu girer.
  - A hesabını siler. B'nin `invited_by` değeri `null` olur.
  - `get_my_invite` B'ye giriş satırını yeniden gösterir. B, F'nin kodunu girer ve `ok` alır (PGlite'ta doğrulandı).
  - Aynı davetli sırayla iki hesaba sayılabilir.
- **Düzeltme:** `already` ve `can_redeem` kontrolünde `invited_at is not null` kullanın. `invited_at`, FK ile silinmez.
- **Durum:** Düzeltildi. `already` (`:172`), `invited` ve `can_redeem` (`:144-145`) `invited_at`'e bakar. PGlite: A silinince B → F `already`, `can_redeem` false.

#### 5. [düşük] KVKK: davet eden, tek davetlisinin uygulamayı en az 2 gün açtığını sayaçtan öğreniyor
- **Yer:** `supabase/migrations/0017_growth_invites.sql:105-107`. Metin: `src/lib/legal.ts:36`, `:53`, `:75`.
- **Senaryo:**
  - Davetle tek kişi gelmiştir.
  - "Aktif olan: 0 → 1" değişimi, o kişinin uygulamayı en az 2 gün açtığını davet edene söyler.
  - Kullanım günleri böylece yalnız ölçüm için işlenmiyor, üçüncü kişiye türetilmiş bilgi olarak gösteriliyor.
  - Gizlilik ve KVKK metinleri bundan söz etmiyor.
- **Düzeltme:**
  - Metne ekleyin: "Bir davet kodu girdiyseniz, sizi davet eden kişi yalnız 'aktif davetli' sayısında sayıldığınızı görebilir."
  - Alternatif: "Aktif olan"ı yalnız `total ≥ 3` iken gösterin.
  - Hukukçu kontrolü (pazarlama Ek-5) bu maddeyi de kapsasın.
- **Durum:** Düzeltildi (ikisi birden). Sunucu `active`'i yalnız `total >= 3` iken döner (`:143`); istemci de aynı kural (`supabaseSource.ts` getInvite, `InviteCard.tsx:40`, 3'ten az davetlide "Aktif olan" ve noktalar yok). Gizlilik ve KVKK metinlerine cümle eklendi (`legal.ts:36`, `:75`). Hukukçu kontrolü hâlâ gerekli. e2e: `share_ui.mjs` `?invite=few`, `account_ui.mjs` KVKK cümlesi.

#### 6. [düşük] Paylaş'a erken dokunulursa bağlantı davet kodsuz (`k=` yok) gidiyor
- **Yer:** `src/components/ShareButton.tsx:13`, `:18`; `src/hooks/useInvite.ts:97-108`.
- **Senaryo:**
  - Maç ekranı açılır; yavaş ağda `get_my_invite` henüz dönmemiştir.
  - Kullanıcı hemen "Paylaş"a basar. `code` `null` olduğu için bağlantı `k`'sız gider; davet atfı sessizce kaybolur.
  - e2e bu durumu `waitForTimeout(500)` ile atlıyor (`e2e/share_ui.mjs:38`).
- **Düzeltme:** `onPress` içinde kodu kısa süre bekleyin. Örnek: `const c = code ?? (await Promise.race([load().then((v) => v?.code ?? null), timeout(1500, null)]))`. Bunun için `load` dışa açılmalı.
- **Durum:** Düzeltildi. `ShareButton` basınca `loadInviteCode(1500)` ile kodu bekler (`ShareButton.tsx:25`, `useInvite.ts:56`). e2e'deki `waitForTimeout(500)` kaldırıldı; hemen basışta `k=ABC234` geliyor.

#### 7. [düşük] Her maç açılışında, canlı maçta bile `get_my_invite` çağrılıyor ve kod üretiliyor
- **Yer:** `src/components/ShareButton.tsx:13-15` (`useInviteCode`, görünürlük kontrolünden önce).
- **Senaryo:**
  - Canlı maç açılır, "Paylaş" çizilmez.
  - Yine de `get_my_invite` çalışır ve kodu olmayan kullanıcıya `profiles`'ta kalıcı kod yazar.
  - Davet özelliğini hiç kullanmayan herkes için veri üretiliyor: veri en aza indirme ilkesine aykırı. Ayrıca gereksiz bir RPC.
- **Düzeltme:** `useInviteCode`'u yalnız `shareKind(match)` ve `downloadUrl` doluyken çizilen iç bileşene taşıyın. Daha iyisi: kodu yalnız düğmeye basınca alın. Bu, bulgu 6'yı da çözer.
- **Durum:** Düzeltildi. Kod yalnız basınca istenir; maç açılışında `get_my_invite` çağrılmaz. `useInviteCode` kaldırıldı.

#### 8. [düşük] Aktif gün kaydı: zaman damgası RPC'den önce yazılıyor; saatlik aralık gece yarısını kaçırıyor
- **Yer:** `src/lib/growth.ts:23`, `:28-31`.
- **Senaryo:**
  - Kullanıcı 23:40'ta, sonra 00:20'de açar. Aradaki süre 60 dk'dan az olduğu için yeni gün yazılmaz; D1 ve "aktif" eksik sayılır.
  - Çevrimdışı soğuk açılışta `ensureSession` `null` döner ve RPC gitmez. Zaman damgası yine de yazıldığı için 1 saat yeniden denenmez.
- **Düzeltme:**
  - AsyncStorage'a TSİ gün anahtarını (`YYYY-MM-DD`) yazın. Aynı günse atlayın, yeni günse çağırın.
  - Anahtarı yalnız RPC hatasız dönünce yazın.
  - Bu, çağrı sayısını da günde 1'e indirir.
- **Durum:** Düzeltildi. `growth.ts:25-45`: TSİ gün anahtarı `skor.activity.lastDay`, yalnız `touchActivity()` true dönünce yazılır (`DataSource.touchActivity(): Promise<boolean>`; oturum yok / ağ hatası false). Günde 1 başarılı RPC.

#### 9. [düşük] Kod `ok` döndükten sonra yeniden yükleme başarısız olursa başarı mesajı kayboluyor
- **Yer:** `src/hooks/useInvite.ts:84`; `src/components/InviteCard.tsx:29-36`.
- **Senaryo:**
  - Kod kaydedilir ve "Teşekkürler, davet kaydedildi." görünür.
  - Ardından `reload()` çalışır, `get_my_invite` ağ hatası verir.
  - Kartın tamamı "Davet bilgisi yüklenemedi" bandına döner.
  - Kullanıcı kodun kaydedilmediğini sanıp tekrar dener ve `already` alır.
- **Düzeltme:** Başarıdan sonra önbelleği yerelde güncelleyin (`invited: true, canRedeem: false`) ve arka planda sessiz yenileyin. Alternatif: hata dalında `result` varsa onu da gösterin.
- **Durum:** Düzeltildi. `ok` sonrası `markRedeemed` (`useInvite.ts:34`): önbellek yerelde `invited: true, canRedeem: false`, sessiz arka plan yenilemesi; hata olursa yerel durum kalır.

#### 10. [düşük] Hesap silme onay metni davet bilgisinden ve kullanım günlerinden söz etmiyor
- **Yer:** `src/app/settings.tsx:180`.
- **Senaryo:**
  - Onay metni: "Pro aboneliğin, takiplerin, bildirim ayarların ve asistan soruların kalıcı olarak silinir."
  - Davet kodu, davet ilişkisi ve kullanım günleri de (cascade ile) silinir. Seni davet edenin sayacı da azalır.
  - KVKK metni ile onay metni tutarsız.
- **Düzeltme:** Onay metnine "davet kodun ve kullanım günlerin" ekleyin.
- **Durum:** Düzeltildi. `settings.tsx:180` "… asistan soruların, davet kodun, davet bilgin ve kullanım günlerin kalıcı olarak silinir." `account_ui.mjs` onay metnini doğrular.

#### 11. [düşük] Paylaşım metni, skoru boş biten maçta "0-0" yazıyor
- **Yer:** `src/lib/share.ts:158`.
- **Senaryo:**
  - Veri gecikmesinde `status_short = 'FT'` iken skorlar `null` olabilir.
  - Metin "A 0-0 B (MS)" olur, yani gerçek olmayan bir skor paylaşılır.
  - Deno ile doğrulandı.
- **Düzeltme:** Skorlardan biri `null` ise `buildShareText` `null` dönsün, ya da skor yerine "Maç sona erdi" yazsın. Bu durumu teste ekleyin.
- **Durum:** Düzeltildi. Biten maçta skorlardan biri `null` ise `buildShareText` null (`share.ts:166`); `ShareButton` görünürlüğü `buildShareText` ile, düğme çizilmez. Deno testi eklendi (gerçek 0-0 yazılır).

#### 12. [düşük] `BANNED_SHARE_TERMS` pazarlama §8'i tam kapsamıyor; e2e listesi daha da dar
- **Yer:** `src/lib/share.ts:213-234`; `e2e/share_ui.mjs:29`.
- **Senaryo:**
  - Listede eksik ifadeler: "kupon", "oran", "dakika dakika", "en hızlı", "gol bildirimi", "baskı alarmı", "en iyi", "1 numara", "türkiye'nin ilk/tek", "%100".
  - İleride metne bunlardan biri girerse test yakalamaz.
  - e2e yalnız 5 ifade arıyor.
- **Düzeltme:**
  - Listeyi §8 ile eşitleyin. Kısa kökler ("oran") için sözcük sınırı kullanın; testteki `bannedRe` zaten öyle.
  - e2e, `BANNED` yerine `BANNED_SHARE_TERMS`'ten üretilen regex'i kullansın.
- **Durum:** Düzeltildi. `BANNED_SHARE_TERMS` §8'in tamamı, 37 ifade (`share.ts:236`) + `findBannedShareTerms` (sözcük sınırlı, `:287`). Deno testi ve `e2e/share_ui.mjs:30` aynı fonksiyonu kullanır (Node .ts tip ayıklama).

#### 13. [düşük] NBA uzatmalı maç paylaşımda "(MS)", ekranda "Maç Sonu (UZ)"
- **Yer:** `src/lib/share.ts:157`. Normalize: `supabase/functions/_shared/nbaApi.ts:62`.
- **Senaryo:** NBA uzatması `status_short = 'FT'` olarak saklanıyor. Uzatma bilgisi yalnız `status_detail` ve `period`'da. Paylaşım metni uzatmayı söylemiyor, ekranla tutarsız.
- **Düzeltme:** `ShareMatch`'e `period?: number | null` ekleyin. NBA'de `period > 4` ise ek "MS, uzatma" olsun.
- **Durum:** Düzeltildi. `ShareMatch.period_scores` / `status_detail`; NBA'de çeyrek sayısı > 4 ya da "Maç Sonu (UZ)" ise "(MS, uzatma)" (`share.ts:149`). Deno testi eklendi.

KRİTİK/YÜKSEK/ORTA SAYISI: 2 (kritik 0, yüksek 0, orta 2; düşük 11). Durum: 13/13 düzeltildi (geliştirici, kalite döngüsü 6; GELISTIRMELER 3.33).

## Döngü 7

Tarih: 2026-11-18. Kapsam: Döngü 6 düzeltmeleri (GELISTIRMELER 3.33): sertleştirilmiş `0017_growth_invites.sql`, `ShareButton` / `loadInviteCode`, `growth.ts` TSİ günü, `useInvite` `markRedeemed`, `findBannedShareTerms`, NBA "(MS, uzatma)", `SkeletonList`. Ek kapsam (koordinatör): 0015, 0016 ve 0017 artık prod'da uygulanmış durumda. Yayın hedefi Google Play oldu (APK satışı yok). API-Football ~2 hafta içinde Pro plana geçiyor (7500 istek/gün).

### Kalite kapıları

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | Geçti: 0 hata |
| `npx eslint src` | Geçti: 0 hata, 0 uyarı |
| `npm run test:functions` | Geçti: 116 geçti, 0 başarısız |
| `deno check */index.ts` | Geçti: 7/7 fonksiyon |
| `npm run e2e` | Geçti: 15/15 betik (`skeleton_ui.mjs` ve `growth_largefont_ui.mjs` dahil), hepsinde "hatalar: yok" |
| `node e2e/narrow_ui.mjs` | Geçti: 360 px'te taşma yok, derin bağlantıdan geri dönüş OK |
| 0017 PGlite testi (genişletildi) | Geçti: 78/78 kontrol. 50 yeni saldırgan / sınır kontrolü eklendi. "BULGU" etiketli 6 kontrol, mevcut davranışı belgeler |
| 0001 → 0017 zincir testi (yeni) | Geçti: 39/39. Tam zincir sırayla, 0015–0017 ikinci kez ve 0017 → 0016 ters sırası hatasız |
| Prod salt okunur doğrulama | Yapılamadı: `execute_sql` (salt okunur `information_schema` sorgusu) izin sınıflandırıcısı tarafından reddedildi. Prod durumu koordinatörün bildirimine dayanıyor |

Yeni testler:
- `supabase/sql-tests/chain_0001_0017.pglite.mjs`: tüm migration'ları PGlite'ta sırayla çalıştırır. `auth`, `cron` (`schedule`, `unschedule`, `alter_job`), `net.http_post/get`, `vault.secrets` + `decrypted_secrets` + `create_secret`, `extensions.gen_random_bytes`, `storage` ve `supabase_realtime` yayını taklit edilir. `create extension pg_cron|pg_net` satırları yorum yapılır. Ayrıca şunlar denetlenir: cron işleri tekil (7 iş), `search_path`'siz `security definer` fonksiyon yok, 0017 → 0016 sırası da derleniyor. Çalıştırma: `npm i --no-save @electric-sql/pglite@0.2.17 && node supabase/sql-tests/chain_0001_0017.pglite.mjs`.
- `supabase/sql-tests/0017_growth_invites.pglite.mjs` sonuna "Döngü 7" bloğu eklendi. Kontroller:
  - TSİ sınırı: UTC 20:59:59 aynı gün, UTC 21:00 ertesi gün. Kod (T-3) 20:59 UTC'de girilirse T-2 sayılır ve davetli aktif olur. Kod 21:00 UTC'de girilirse T-2 kod günü sayılır ve davetli aktif olmaz.
  - Tekrar oynatma: aynı kod ve başka kod `already` döner. Kendi kodu küçük harf ve boşlukla girilince `self` döner. `ı` içeren kod, 5000 karakterlik girdi ve tırnaklı enjeksiyon denemesi `invalid` döner.
  - Hata sınırı: 10 hata sonrası `rate_limited`, 24 saat 1 dakika sonra `ok`. Davetli olduktan sonra `rate_limited` yerine `already` döner. 7 gün − 1 dakikada `can_redeem` ve `redeem` tutarlı.
  - Sınır: 30 uygun davetliden 24 saatte yalnız 5'i aktif olur. Sınır 23:59 sonra hâlâ dolu, yani TSİ gece yarısı sıfırlamıyor. 24:01 sonra 5 yeni aktif gelir (toplam 10). Danışma kilidi sıralı çağrıda doğru sayıyor. Gerçek eşzamanlılık PGlite'ta üretilemiyor; kilit sırası aşağıda gerekçelendirildi.
  - `invite_active_at` tekdüze: gün silme, ikinci `touch` ve tekrar kod girme alanı değiştirmiyor.
  - Lider tablosu: sıralama active azalan, sonra total azalan. Davet eden silinince satır düşüyor.
  - Silinen davet eden: davetlinin `touch` çağrısı hata vermiyor ve davetli aktif olmuyor.

Gerçek Postgres'te doğrulanan, sorun çıkmayanlar:
- Zincir: 0015 → 0016 → 0017 sırayla derleniyor. Üçü de ikinci kez hatasız çalışıyor. 0017'nin "0016'dan önce de çalışır" iddiası doğru. Tüm `security definer` fonksiyonlarda `search_path` ayarlı.
- Kilit sırası: `redeem_invite` önce kendi satırını `for update` ile kilitliyor, sonra çift danışma kilidini alıyor. Davet edenin satırını yalnız okuyor (kilitlemiyor). A→B ve B→A aynı anda gelirse ikisi farklı satır kilidi tutar, aynı danışma kilidini sırayla alır. İkincisi `not_allowed` döner. Döngüsel bekleme olmadığı için kilitlenme (deadlock) yok. `touch_activity` sınır sayımı, kilitten sonra yeni bir ifade anlık görüntüsüyle (READ COMMITTED) yapılıyor. Kilit commit'e kadar tutulduğu için 6. aktif yazılamıyor.
- Uç durumlar: TSİ sabit UTC+3. İstemci `istanbulDay` ve sunucu `Europe/Istanbul` aynı günü üretiyor.
- `findBannedShareTerms`: "Moran", "Oranje", "Kazanspor", "Kesinoglu", "Resmiye", "Canlıspor" ve "En İyilerspor" yanlış pozitif vermiyor. Davet kodu alfabesinde `I` olmadığı için kod bir yasaklı sözcük oluşturamıyor. Rakam harf sınıfında sayıldığından `oran23` de eşleşmiyor.
- İskelet: `progressbar` rolü ve "Maçlar yükleniyor" etiketi var. İç çizimler erişilebilirlikten gizli. Hareketi azalt açıkken opaklık sabit 0,8. Veri gelince ilk kartta kayma ≤ 4 pt. `useNativeDriver` kullanılıyor. e2e geçti.
- Döngü 6 düzeltmeleri (ShareButton 1,5 sn bekleme, `markRedeemed` epoch, TSİ anahtarı, NBA uzatma, SegmentedTabs ×1,2, ScoreHeader): kapılarda ve e2e'de regresyon yok.

### Bulgular

#### 1. [yüksek] Yan yüklenmiş APK kullanıcıları Play sürümüne geçemez; anonim hesap ve veriler kaybolur
- **Yer:** `app.json:13` (`com.skorplus.app`), `eas.json` `preview` profili (APK, EAS anahtar deposu).
- **Senaryo:**
  - Play App Signing varsayılan olarak Google'ın ürettiği anahtarla imzalar.
  - Aynı paket adındaki yan yüklenmiş APK'nın imzası farklıdır. Play, uygulamayı güncellemez ve "uygulama yüklenmedi" hatası verir.
  - Kullanıcı önce kaldırmak zorunda kalır. Anonim oturum, takipler, takımlar ve davet ilişkisi kaybolur (hesap kurtarma yok).
  - Erken dönem davet edenlerin "Kurucu Destekçi" sayaçları da yeni hesaplarda sıfırdan başlar.
- **Düzeltme:**
  - Play Console'da "mevcut uygulama imzalama anahtarını kullan" seçeneğini kullanın ve EAS'taki Android anahtar deposunu yükleyin (`eas credentials`). Böylece APK'dan Play'e güncelleme sorunsuz olur.
  - Bu yapılamıyorsa APK kullanıcılarına geçişi önceden duyurun. Yeni paket adı da bir seçenektir.
- **Durum:** Kullanıcı / Play Console adımı (kodla yapılamaz, geri alınamaz): Play App Signing'e mevcut EAS anahtarı (`eas credentials` → keystore → Console "Use existing app signing key"). Bkz. inovasyon §0.8 adım 1.

#### 2. [yüksek] Gizlilik Politikası ve KVKK metni hâlâ köşeli parantezli şablon; Play için herkese açık politika adresi yok
- **Yer:** `src/lib/legal.ts:8-13` (`[VERİ SORUMLUSU ADI / ŞİRKET UNVANI]`, `[İLETİŞİM E-POSTASI]`, `[ADRES]`, `[YAYIN TARİHİ]`), ekranı `src/app/legal/[doc].tsx`.
- **Senaryo:** Uygulama içinde politika yer tutucularla görünür. Play Console, uygulama içi metinle tutarlı ve herkese açık bir gizlilik politikası adresi ister. Veri sorumlusu ve iletişim bilgisi olmayan politika incelemede ret sebebidir.
- **Düzeltme:** Yer tutucuları doldurun ve metni hukukçuya kontrol ettirin. Aynı metni web'de yayınlayın (ör. indirme sayfası alan adında `/gizlilik`). Adresi Play Console'a girin ve Ayarlar'dan bağlantı verin.

- **Durum:** Kullanıcı / hukuk adımı. `src/lib/legal.ts` yer tutucuları doldurulmalı, metin web'de (ör. `/gizlilik`) yayınlanıp adresi Play Console'a girilmeli. Kod değişmedi.

#### 3. [orta] Gereksiz Android izinleri: depolama okuma/yazma ve `SYSTEM_ALERT_WINDOW`
- **Yer:** `app.json:12-24` (`android.permissions` tanımlı değil).
- **Senaryo:** `npx expo config --type introspect` çıktısındaki manifestte şu izinler var: `INTERNET`, `SYSTEM_ALERT_WINDOW`, `VIBRATE`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`. `android.permissions` boşken Expo varsayılanları ekliyor. Uygulama dosya ya da diğer uygulamaların üstünde çizim kullanmıyor. Play "Veri güvenliği" formu ve incelemesi gereksiz soru doğurur, kullanıcı güveni düşer.
- **Düzeltme:** `android.permissions` alanına yalnız gerekenleri yazın (bildirim için `POST_NOTIFICATIONS`'ı expo-notifications ekler). Ayrıca `"blockedPermissions": ["android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE", "android.permission.SYSTEM_ALERT_WINDOW"]` ekleyin. Native değişikliktir; OTA ile gelmez, Play derlemesinde yapılmalı.

- **Durum:** Düzeltildi. `app.json:22` `android.blockedPermissions` (SDK 58 app config dokümanındaki anahtar; `tools:node="remove"`). `npx expo config --type introspect`: üç izin `[remove]`, kalanlar `INTERNET`, `VIBRATE`. Native: Play derlemesinde gelir (OTA ile gelmez).

#### 4. [orta] OTA yalnız `preview` kanalına gidiyor; Play (production) derlemesi güncelleme almaz
- **Yer:** `package.json:44` (`update:apk` → `--channel preview`), `eas.json` `production.channel = "production"`, `src/lib/updates.ts:5` (yorum: "kanal: preview").
- **Senaryo:** Play'e `production` profiliyle AAB yüklenir. Sonraki `npm run update:apk` yalnız APK kullanıcılarına ulaşır. Play kullanıcıları JS düzeltmelerini almaz. Tersine, production'a yayınlanmamış bir düzeltmenin Play'de olduğu sanılabilir.
- **Düzeltme:** `"update:prod": "npx eas-cli@latest update --channel production --environment production"` ekleyin. Geçiş döneminde her OTA'yı iki kanala da yayınlayın. `EXPO_PUBLIC_DOWNLOAD_URL` EAS `production` ortamında Play mağaza adresine ayarlanmalı. `runtimeVersion: appVersion` olduğu için `version` değişince eski derlemeler yeni OTA'yı almaz; bu beklenen davranış.

- **Durum:** Düzeltildi. `package.json:45` `update:prod` (`--channel production --environment production`); geçiş döneminde her OTA `update:apk` + `update:prod`. `updates.ts:5` yorumu iki kanala göre. `eas.json`: `production.android.buildType: app-bundle`, `submit.production.android: { track: internal, releaseStatus: draft }` (kimlik bilgisi yok). `EXPO_PUBLIC_DOWNLOAD_URL` EAS `production` ortamına Play adresi olarak elle girilmeli.

#### 5. [düşük] Silinmiş hesabın süresi dolmamış oturumu: üç RPC de FK hatası fırlatıyor
- **Yer:** `supabase/migrations/0017_growth_invites.sql:71` (`touch_activity` insert), `:124` (`get_my_invite`), `:169` (`redeem_invite`).
- **Senaryo:**
  - `delete_my_account` sonrası eski JWT ≤ 1 saat geçerli kalır.
  - `touch_activity` çağrısı `user_activity_days_user_id_fkey` hatası, `get_my_invite` ve `redeem_invite` çağrıları `profiles_id_fkey` hatası verir (PGlite'ta doğrulandı, "BULGU" kontrolleri).
  - İstemci hatayı yutuyor ve veri bozulmuyor. Yalnız günlükte 500 gürültüsü oluşur ve kart "Davet bilgisi yüklenemedi" gösterebilir.
- **Düzeltme:** Üç fonksiyonun başına `if not exists (select 1 from auth.users where id = v_uid) then return; end if;` ekleyin. `redeem_invite` bu durumda `'unauthenticated'` dönmeli.

- **Durum:** Düzeltildi (0018; 0017'ye dokunulmadı). `0018_pro_api.sql:118` `touch_activity`, `:141` `get_my_invite` (satır yok), `:188` `redeem_invite` (`'unauthenticated'`) `auth.users` kontrolüyle başlar. PGlite zincir testi bölüm 6d.

#### 6. [düşük] Üçlü halka (A→B→C→A) kabul ediliyor; yalnız ikili karşılıklı davet engelli
- **Yer:** `0017_growth_invites.sql:207-210`.
- **Senaryo:** Üç hesap birbirini halka hâlinde davet eder; her biri "1 davetli" kazanır (PGlite'ta `ok`). Hesap açmak ucuz (anonim) olduğundan sıralama şişirilebilir. Aktiflik ve 5/24 saat kuralı etkiyi sınırlıyor.
- **Düzeltme:** Ödül öncesi elle inceleme yeterli. Lider tablosuna "davetlisi de bu kişiyi zincirden davet etmiş" sayısını ekleyin. İsterseniz `redeem_invite` içinde davet edenin üst zincirini (ör. 5 derinlik, özyinelemeli sorgu) `v_uid` için tarayın.

- **Durum:** Karar: 3 uzunluğa kadar halka engellendi (`0018_pro_api.sql:232`, `'not_allowed'`, hatalı deneme sayılmaz). Daha uzun halkalar ve farklı çiftlerin aynı anda kapattığı 3'lü halka kabul edilen risk (ödül öncesi elle inceleme; `quick_redeem` + aktiflik + 5/24 saat). Zincir testi 6e.

#### 7. [düşük] Lider tablosu 3 harfli önekle gruplanıyor; farklı kişiler aynı önekte ayırt edilemiyor
- **Yer:** `0017_growth_invites.sql:252` (`left(inv.invite_code, 3)`).
- **Senaryo:** 31³ = 29 791 önek var. 250 davet edende en az bir çakışma olasılığı yaklaşık %65 (doğum günü problemi). PGlite'ta `QQQ234` ve `QQQ567` iki ayrı "QQQ" satırı üretti. Telegram'da "QQQ ile başlayan kodun sahibi" iki kişiyi kapsar.
- **Düzeltme:** Önek uzunluğunu 4 yapın (923 521 önek). Ya da satıra kısa bir sıra numarası ekleyin ve kullanıcının Ayarlar'da kendi numarasını görmesini sağlayın.

- **Durum:** Düzeltildi. `admin_invite_leaderboard` önek 4 karakter (`0018_pro_api.sql:251`). Zincir testi 6f.

#### 8. [düşük] Sınıra takılan davetli yalnız ertesi günün açılışında yeniden denenir; uygulamayı bir daha açmazsa hiç sayılmaz
- **Yer:** `src/lib/growth.ts:39` + `0017_growth_invites.sql:89-93`.
- **Senaryo:** `touch_activity` sınırda sessizce döner, istemci de günün anahtarını yazar. Bu, yorumdaki "fazlası sonraki açılışlara kalır" iddiasıyla yalnız kullanıcı ertesi gün de açarsa uyumlu. Gerçek davet eden için etki küçük; 5'ten fazla gerçek davetli aynı 24 saatte nadirdir.
- **Düzeltme:** Davranışı yorumda açıkça yazın. İsterseniz admin raporuna "uygun ama sınırda bekleyen" sayısını ekleyin.

- **Durum:** Düzeltildi. Aktiflik kararı `invite_try_activate` (`0018_pro_api.sql:81`); saatlik `skor-invite-recount` (`:287`) sınırda bekleyenleri (son 60 gün) sınır boşaldıkça sayar. `growth.ts:32` yorumu. Zincir testi 6g (6 uygun → 5 aktif → 24 saat sonra 6).

#### 9. [düşük] `findBannedShareTerms` yanlış negatifleri: ASCII büyük `I`, Türkçe ekler, akıllı kesme işareti, çift boşluk
- **Yer:** `src/lib/share.ts:283-291`.
- **Senaryo:** Deno ile denendi, aşağıdakilerin hepsi `[]` (temiz) döndü:
  - ASCII büyük `I`: `IDDAA`, `TAHMIN`, `KESIN`, `GARANTI`, `RESMI`, `FIYAT`, `BIRAZDAN`. `tr` küçültmesi `I`'yı `ı` yapıyor.
  - Türkçe ekli biçimler: `tahmini`, `oranı`, `kuponu`, `canlıda`, `garantili`, `kesinlikle`, `bahisçi`.
  - Akıllı kesme işareti: `Türkiye’nin ilk`, `Play Store’da` (U+2019).
  - Boşluk farkı: `en  iyi` (çift boşluk), `en iyi` (bölünmez boşluk), `gerçek-zamanlı`.
  - Bugün yalnız test kâhini (`share.test.ts`, `share_ui.mjs`); şablon değişirse ekli biçimler sızar.
- **Düzeltme:**
  - Metni `’`→`'`, `\s+`→` ` ile normalize edin. Hem `tr` hem kök (`toLowerCase`) küçültmesini deneyin.
  - Sözcük sonunu ek almaya açık bırakın: yalnız baş sınırı + terim. Yanlış pozitifler için küçük bir izin listesi tutun (ör. `oranje`, `kazanspor`).

- **Durum:** Düzeltildi. `findBannedShareTerms` (`share.ts:330`): kesme işaretleri silinir, NBSP / çoklu boşluk / harf arası tire normalize, Türkçe + kök küçültme, baş sınırı + Türkçe ad çekim ekleri (`SUFFIX`, `:300`; fiil ekleri yok). Deno testi tüm örnekleri kapsar.

#### 10. [düşük] `findBannedShareTerms` gerçek takım adlarında yanlış pozitif veriyor
- **Yer:** `src/lib/share.ts:236-291`.
- **Senaryo:** "MC Oran 1-0 USM Alger (MS)" → `oran`, "Rubin Kazan 2-1 Zenit (MS)" → `kazan`. Pro planla kapsam genişleyip bu ligler eklenirse `share_ui.mjs` / Deno fikstürleri sahte hata verir. Uygulama davranışı etkilenmez; işlev yalnız testte kullanılıyor.
- **Düzeltme:** Kontrolü takım adları çıkarılmış metne uygulayın (`home_team` / `away_team` önce boşaltılsın). Ya da izin listesi kullanın.

- **Durum:** Düzeltildi. İzin listesi `BANNED_TERM_ALLOW` (`share.ts:308`: mc oran, rubin kazan, resmiye) + `ignore` parametresi (takım adları). Döngü 7'nin yanlış pozitif listesi ve "MC Oran" / "Rubin Kazan" Deno testinde temiz.

#### 11. [düşük] Paylaş: 1,5 sn bekleme boyunca geri bildirim ve çift basış koruması yok
- **Yer:** `src/components/ShareButton.tsx:24-34`.
- **Senaryo:** İlk basışta `get_my_invite` yavaşsa 1,5 sn hiçbir şey olmaz. Kullanıcı yeniden basar ve iki `Share.share` çağrılır; Android'de iki paylaşım sayfası art arda açılabilir.
- **Düzeltme:** `busy` ref'i ekleyin (bekleme sürerken basış yok sayılsın). Bekleme sırasında `opacity` 0,5 ya da küçük gösterge gösterin.

- **Durum:** Düzeltildi. `ShareButton.tsx:30` `busy` ref (ikinci basış yok sayılır); bekleme boyunca opaklık 0,5 + `ActivityIndicator` (`:61`), `accessibilityState.busy`.

#### 12. [düşük] Play'de yanlış ya da eski APK dili
- **Yer:**
  - `src/app/settings.tsx:143`: " · APK içi kod".
  - `src/lib/share.ts:193`: "Kurulum anlatımı burada" (yan yükleme anlatımı).
  - `src/lib/share.ts:278`: `"play store'da"` yasaklı listede; Play'de yasal ve doğru ifade olur.
  - `src/lib/updates.ts:5-8`: yorumlar APK'ya göre yazılmış.
- **Düzeltme:**
  - Metni "uygulama içi sürüm" yapın.
  - Davet metnini "Google Play'den indir: <adres>" yapın.
  - `play store'da` terimini listeden çıkarın (pazarlama §8 ile birlikte güncelleyin).

- **Durum:** Düzeltildi. `settings.tsx:147` " · uygulama içi sürüm"; davetiye "Skor+. İndir: …", Play adresiyse "Google Play'den indir: …" (`share.ts:192-199`); `"play store'da"` yasak listesinden çıktı (pazarlama Sürüm 3); `updates.ts` ve `_layout.tsx` yorumları.

### Yayın hazırlığı

- **0016 / 0017 (SQL):** hazır. Koordinatöre göre prod'da uygulandı (salt okunur doğrulamayı bu döngüde yapamadım; izin reddedildi). Zincir ve tekrar çalıştırma PGlite'ta temiz. Saldırgan senaryolarda veri bozan ya da yetki açan durum yok. Bulgu 5–7 düşük; sonraki migration'a (ör. 0018) bırakılabilir.
- **`npm run deploy:functions`:** şimdi güvenli. Fonksiyonların çağırdığı tüm RPC'ler 0001–0016'da tanımlı. 0015/0016 prod'da olduğu için yeni sütun ve fonksiyon bağımlılıkları karşılanıyor. `deno check` 7/7 ve 116 Deno testi geçti. Pro plana geçince yapılacaklar kod değişikliği değil, secret değişikliği: `API_FOOTBALL_PAID=1` (toplu `ids=` çekimi), gerekirse `API_FOOTBALL_MAX_SINGLE_FETCH`, `api_paid` yapılandırması. Kota bekçisi başlıktaki kalan değeri okuduğu için 7500'e kendiliğinden uyar. `quota.ts` / `apiFootball.ts` içindeki "100/gün" yorumları güncellenmeli.
- **Mevcut ağacın OTA'sı (`npm run update:apk`, kanal preview):** şimdi güvenli. 0017 RPC'leri prod'da olduğu için davet kartı, paylaşım kodu ve aktif gün kaydı çalışır. e2e 15/15 ve tsc/eslint temiz. `EXPO_PUBLIC_DOWNLOAD_URL` EAS `preview` ortamında tanımlı değilse Paylaş ve davet kartı gizli kalır (güvenli varsayılan). Not: bu OTA Play derlemesine ulaşmaz (bulgu 4).
- **Google Play çıkışı:** hazır değil. Engeller: bulgu 1 (imza anahtarı / APK geçişi), bulgu 2 (gizlilik politikası şablonu ve herkese açık adres), bulgu 3 (gereksiz izinler, native), bulgu 4 (production OTA kanalı).

### Play Store hazırlığı (kod düzeyi kontrol listesi)

- [x] Hedef SDK: RN 0.88 / Expo 58 → `targetSdk 36`, `compileSdk 37`, `minSdk 24`. Play'in güncel hedef API şartını karşılıyor.
- [x] Biçim: `production` profili varsayılan AAB üretir; `autoIncrement` ve `appVersionSource: remote` açık.
- [ ] `eas.json` `submit.production.android`: `serviceAccountKeyPath` ve `track` (ör. `internal`) tanımlı değil.
- [ ] İzinler: depolama ve `SYSTEM_ALERT_WINDOW` engellenmeli (bulgu 3). `POST_NOTIFICATIONS` Android 13+'ta çalışma anında istenmeli (mevcut akış korunmalı).
- [ ] Gizlilik politikası: şablon doldurulmalı, herkese açık adres Play Console'a girilmeli (bulgu 2).
- [ ] Veri güvenliği formu. Beyan edilecekler:
  - Anonim kullanıcı kimliği (Supabase Auth).
  - FCM bildirim jetonu ve bildirim tercihleri.
  - Taktik Asistan soruları (Google Gemini'ye gider; kullanıcı içeriği).
  - Kullanım günleri (120 gün) ve davet ilişkisi.
  - Abonelik durumu.
  - Şifreleme: aktarımda HTTPS. Silme: `delete_my_account` uygulama içinde var.
- [ ] Yedekleme: `android:allowBackup="true"` (varsayılan). AsyncStorage'daki Supabase oturumu Google yedeğiyle yeni cihaza taşınabilir. Bu bilinçli seçilmeli ve veri güvenliği formunda tutarlı yazılmalı.
- [ ] İmza: APK kullanıcılarının Play'e geçişi için mevcut EAS anahtarı Play App Signing'e yüklenmeli (bulgu 1).
- [ ] OTA: `production` kanalına yayın betiği (bulgu 4). Play politikası açısından JS/OTA güncellemesi, uygulamanın amacını değiştirmediği sürece kabul edilir. Açılıştan sonraki 3 sn içinde `reloadAsync` (`updates.ts:48`) yalnız ana ekranda ve kullanıcı işlem yapmadan olur; ANR riski yok, ağ hatası yutuluyor.
- [ ] İndirme adresi: `EXPO_PUBLIC_DOWNLOAD_URL` production'da Play adresi olmalı (`https://play.google.com/store/apps/details?id=com.skorplus.app`). Play adresi `?ref=&k=` sorgusunu kuruluma taşımaz; kod elle girilmeye devam eder. Otomatik için Install Referrer (`&referrer=`) native modül ister.
- [ ] APK metinleri: "APK içi kod", "Kurulum anlatımı", `play store'da` yasağı (bulgu 12).
- [ ] Çökme / ANR: e2e'de sayfa hatası yok. Ağır iş JS iş parçacığında değil. `expo-updates` ve `expo-notifications` hataları yakalanıyor. Native çökme raporlama (Sentry / Crashlytics) yok; Play Console'un Android vitals'ı tek kaynak olacak.
- [ ] Mağaza: içerik derecelendirme anketi (bahis içeriği yok: "tahmin/oran" yasaklı listesi bunu destekliyor), hedef kitle 13+, reklam yok beyanı.

KRİTİK/YÜKSEK/ORTA SAYISI: 4 (kritik 0, yüksek 2, orta 2; düşük 8). Yüksek ve ortaların tamamı Play çıkışıyla ilgili; 0016/0017, `deploy:functions` ve preview OTA için engel yok.
Durum: 10/12 kodda kapatıldı (3–12; #6 halka için karar: 3'lüye kadar engel, daha uzunu kabul edilen risk). #1 (imza anahtarı) ve #2 (gizlilik politikası) kullanıcı / Play Console adımı. Ek: `eas.json` `submit.production.android` iskeleti (kimlik bilgisi yok). Geliştirici, döngü 7; GELISTIRMELER 3.34.

## Döngü 8

Kapsam: Döngü 7 değişiklikleri (GELISTIRMELER 3.34) — ücretli plan anahtarı (0018 tetikleyici + cron, `shouldRunSync` ikinci emniyeti, `_shared/paidFlags.ts`), 7.500/gün istek bütçesi, 0018 SQL güvenliği ve davet yeniden sayımı, `findBannedShareTerms`, 9 günlük şerit, Play hazırlığı. Uygulama kaynağına dokunulmadı; yalnız test eklendi.

### Kapılar

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | 0 hata |
| `npx eslint src` | 0 hata |
| `npm run test:functions` | 133 geçti / 0 kaldı |
| `deno check */index.ts` | temiz |
| `node supabase/sql-tests/0017_growth_invites.pglite.mjs` | tümü geçti |
| `node supabase/sql-tests/chain_0001_0017.pglite.mjs` | tümü geçti (0001→0018 zinciri, 0015–0018 tekrar, 17→16 sırası, bölüm 6) |
| **YENİ** `node supabase/sql-tests/0018_paid_switch.pglite.mjs` | 30/30 geçti (aşağıda) |
| `npm run e2e` (15 betik) | 15/15 geçti (exit 0, sayfa hatası yok) |
| `node e2e/narrow_ui.mjs` | geçti (taşma yok) |
| **YENİ** `node e2e/daystrip_ui.mjs` (360 px, yazı x1,3) | 13/13 geçti |

Yeni testler:
- `supabase/sql-tests/0018_paid_switch.pglite.mjs`: jsonb biçimleri (`'"true"'` ve `1` → hata, işlem geri alınır; `'null'` → ücretsiz), aynı değeri yeniden yazmak işleri yeniden kurmaz (jobid aynı), ücretliyken 0018 tekrarı ücretli kalır, DELETE davranışı (bulgu 4), upsert'in iki yolu, `authenticated` app_config'e yazamaz (RLS, 0 satır), `anon` plan/davet fonksiyonlarını çağıramaz, 0018 sonundaki GERİ DÖNÜŞ bloğu satır satır hatasız çalışır → ücretsiz takvim, tetikleyici ve `skor-invite-recount` kalkar; ardından 0017 tekrarı, `invite_try_activate` düşürülmesi, istemcinin `api_paid()` yedeği ve 0018'in yeniden uygulanması.
- `e2e/daystrip_ui.mjs`: ücretli futbolda 9 gün, sayfa yatay taşmaz, x1,3 yazıda gün düğmelerinde kırpılma/sarma yok, +7 seçilince görünür alanda; NBA 3 gün, futbolda +5 seçiliyken NBA'e geçince Bugün; "Canlı" filtresinde tazelik notu spora göre; `?paid=0` futbol 3 gün + "~30 dk". (Not: RN-web `accessibilityState.selected`'ı `aria-selected` olarak yazmıyor; seçili gün başlık rengiyle doğrulanır. Native'de sorun değil.)

### Ücretli plan anahtarı — simülasyon (kod + PGlite)

Dört durum (DB = `app_config.api_paid`, S = secret `API_FOOTBALL_PAID`):

| DB | S | Cron (futbol) | Edge davranışı | API isteği | Sonuç |
|---|---|---|---|---|---|
| false | 0 | `*/30 12-22`, `0 9` (0004 ile birebir) | ücretsiz yol | bugünkü gibi | güvenli |
| false | 1 | aynı | gövdede cadence yok → her çağrı çalışır; ücretli yol (toplu `ids=`, 9 gün fikstür) | ~22 canlı çağrı/gün | **fırtına yok**. Ama "maç başladı" penceresi 5 dk, senkron 30 dk → bildirimler çoğunlukla kaçar (bulgu 6). Kısa tutulmalı. |
| true | 0 | `* 9-23`, `0 3,15` + `"cadence":"paid"` | canlı: yalnız :00/:30 (12–22 UTC) çalışır = 22/gün (doğrulandı, +60 sn pg_net gecikmesinde de 22). **Fikstür: 03:00 ve 15:00 hiçbir zaman ücretsiz dilim (09:00) değil → fikstür senkronu hiç çalışmaz** (bulgu 3) | canlı ücretsizle aynı | fırtına yok, ama yeni maçlar gelmez; istemci 9 gün gösterir |
| true | 1 | dakikalık | ücretli yol | bütçe aşağıda | hedef durum |

- NBA: `apply_football_sync_schedule` yalnız `skor-sync-live` / `skor-sync-schedule`'a dokunur; NBA işleri ve `skor-sync-cleanup` değişmiyor (PGlite 6c + yeni test). Yeni kodda NBA yalnız `API_NBA_PAID`'i okur (kaynak tarama testi). **Risk 1**: üretimde hâlâ eski (HEAD) `sync-nba` çalışıyorsa secret, deploy'dan ÖNCE açılırsa NBA bekçisi kapanır (bulgu 2). **Risk 2**: eski migration notları (`0006`/`0007` `cron.alter_job`) `nba-sync-live`'ı dakikalık yaptırır (bulgu 1).
- Tetikleyici: INSERT ✔, UPDATE ✔ (değer aynıysa no-op; jobid değişmez), upsert'in iki yolu ✔, DELETE ✘ (bulgu 4). `'true'::jsonb` gerekir; `'"true"'` (metin) ve `1` "cannot cast jsonb … to type boolean" ile güncellemeyi geri alır (güvenli, gürültülü hata). `'null'` → ücretsiz.
- 0018 tekrar (api_paid true iken) → takvim ücretli kalır, iş adları tekil. Geri dönüş bloğu PGlite'ta hatasız.
- pg_cron kullanımı: `cron.unschedule(jobid bigint)` + `cron.schedule(name, …)` Supabase pg_cron 1.6'da geçerli; fonksiyon security definer (sahibi `postgres`) olduğundan işler `postgres` kullanıcısıyla kurulur (`call_edge_function` vault okur). `cron.alter_job` 0018'de kullanılmıyor (doğru: iş adı + gövde birlikte değişiyor).
- Secret'lar modül yüklenirken okunur (`paidFlags.ts:30`): sıcak Edge örnekleri eski değeri birkaç dakika tutabilir → secret değişikliğinden sonra `deploy:functions` şart (prosedürde var).

### İstek bütçesi (koddan; 7.500/gün, 300/dk)

Takip edilen 16 lig (`apiFootball.ts:17`), hepsi Avrupa saatlerinde. En kötü cumartesi (~50–60 maç, 14:30–17:00 UTC arası 20+ maç aynı anda):

| Kalem | Kod | İstek/gün |
|---|---|---|
| Canlı liste `/fixtures?live=all` | `sync-matches:115`, `* 9-23` = 900 çağrı | 900 |
| Canlı detay `ids=` (20/istek) | `sync-matches:198,201`; canlı/biten maç olan dakikalar ~11:00–22:45 (~705 dk), >20 maç ~180 dk +1 | ~885 |
| Devre arası raporu | `generate-halftime:49`, maç başına 1 | ~60 |
| Maç önü raporu | `generate-preview`: ilk 11 ≤4 (0016) + sakatlık 1 + `team&last` 2 + `ids=` 1 | ≤ ~8/maç → ≤ ~480 |
| Fikstür | `0 3,15` × 9 gün + biten maç zenginleştirme | ~25 |
| Puan durumu | API'den çekilmiyor | 0 |
| Akıllı alarm | `runFootballAlerts` — ek istek yok | 0 |
| **Toplam** | | **~2.350 (tavan ~3.000)** |

300/dk: dakikalık iş en çok 1 + ⌈canlı/20⌉ ≈ 3 istek; maç önü raporları talep başına sınırlı (maç başına 10 dk arayla 4). Pratik tepe < 100/dk. Bütçe rahat. Ancak ücretli bekçi (`quota.ts:66`) hiçbir zaman durdurmuyor; `FOOTBALL_QUOTA_RESERVE=500` ücretli yolda etkisiz (bulgu 7).

### 0018 güvenlik

- Tüm yeni/değişen fonksiyonlar `security definer` + `search_path = ''` (zincir testi bölüm 4: search_path'siz definer yok).
- Yetkiler: `api_paid_for` → authenticated + service_role (anon kapalı; istemci önce anonim oturum açıyor). `apply_football_sync_schedule`, `on_api_paid_change`, `invite_try_activate`, `invite_recount_held`, `admin_invite_leaderboard` → anon/authenticated kapalı (PGlite'ta "permission denied"). service_role varsayılan yetkiyle çağırabilir (kabul edilebilir).
- `app_config` RLS açık, politika yok → istemci planı değiştiremez (doğrulandı).
- `invite_try_activate`: kural 0017 ile aynı; 5/24 saat sınırı davet eden başına advisory kilitle sıralı; `update … where invite_active_at is null` + `found` çift aktiflemeyi önler. Kilit yalnız aralık şartını geçenlerde alınır → saatlik turda kilit sayısı küçük.
- `invite_recount_held` maliyeti: son 60 günde kod girip aktif olmamış davetliler × (profil + `user_activity_days` PK aralığı) — indeksli; 10 bin davetlide bile milisaniyeler. API kotası 0.

### Play hazırlığı (yeniden kontrol)

- `expo config --type introspect`: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` → `tools:node="remove"` ✔. Ana manifestte `INTERNET`, `VIBRATE`; `POST_NOTIFICATIONS` expo-notifications kütüphane manifestinden gelir (beklenen).
- `eas.json` production: `app-bundle` ✔, `autoIncrement` + `appVersionSource: remote` ✔, `channel/environment: production` ✔; submit `internal` + `draft` ✔ (ilk yükleme Play Console'dan elle yapılmalı — API ile ilk sürüm yüklenemez).
- Açık kalan (Döngü 7): `android:allowBackup="true"`; imza anahtarı; gizlilik politikası.

### Bulgular

1. **YÜKSEK** — Eski "ücretli plana geçince" notları NBA kotasını yakar ve tetikleyiciyi atlar. `supabase/migrations/0007_alerts.sql:123-127`, `0006_halftime.sql:212-216`, `0002_pipeline.sql:78-79`, `GELISTIRMELER.txt:1021-1024` ("0006/0007 sonundaki cron.alter_job satırları … sync-nba deploy"), `docs/inovasyon-onerileri.md:135-142`. Senaryo: kullanıcı Pro'ya geçerken bu notları izler. `nba-sync-live` `* 23,0-6` olur = 480 çağrı/gece. `sync-nba` canlı modu her çağrıda koşulsuz 1 istek atar (`sync-nba/index.ts:92`) → NBA 100/gün ~01:40 UTC'de biter; o gece ve ertesi gün NBA verisi durur. `skor-sync-live`'a `alter_job` da cadence'siz eski gövdeyi dakikalık yapar (ikinci emniyet devre dışı) ve sonraki `api_paid` değişikliğinde tetikleyici tarafından ezilir. Düzeltme: bu notları silin ya da "Pro geçişi yalnız 0018 prosedürüyle; `nba-sync-live`'a DOKUNMAYIN" ile değiştirin.
2. **ORTA** — 0018 başlığındaki sıra (`0018_pro_api.sql:8-10`: önce secret (2), sonra deploy (3)). Üretimde bayrak ayrımından önceki kod çalışıyorsa (HEAD'de `_shared/nbaApi.ts:17` ve `sync-nba/index.ts:18` `API_FOOTBALL_PAID` okur) secret açıldığı an NBA bekçisi `hasNbaQuota` → hep true, 6,5 sn bekleme yok. Kutu skoru geri doldurması sınırsız çalışır; 20:00 UTC fikstür ya da 23–06 UTC canlı işine denk gelirse NBA kotası biter. Düzeltme: sıra "deploy (bayraklar kapalıyken, davranış aynı) → secret → deploy". Aşağıdaki doğrulanmış prosedür bunu uygular. Başlıktaki sıra güncellenmeli.
3. **ORTA** — DB ücretli + secret kapalı iken fikstür senkronu hiç çalışmıyor. `_shared/syncUtils.ts:99` (`schedule` yalnız 09:00) + `0018_pro_api.sql:47` (`0 3,15`). Senaryo: adım 7, adım 5'ten önce yapılır ya da geri dönüşte önce secret kapatılır. Canlı istekler doğru biçimde ücretsiz dilime iner (22/gün, doğrulandı), ama 03:00/15:00 çağrıları hep atlanır. Yeni maçlar gelmez, takım takibi yeni maçlara bağlanmaz, istemci boş 9 gün gösterir. `tests/syncUtils.test.ts:121` bu davranışı sabitliyor. 0018 başlığı (satır 14-15) "ikinci emniyet" diyerek bunu gizliyor. Düzeltme: `shouldRunSync`'te `cadence==='paid'` + secret kapalıyken `schedule` modunu her zaman çalıştırın (ücretsiz 3 gün = 3 istek, günde 2 kez = 6; 100/gün içinde) ya da ücretli takvimi `0 3,9,15` yapın. Testi güncelleyin.
4. **DÜŞÜK** — Tetikleyici DELETE'i dinlemiyor (`0018_pro_api.sql:71-73`). `api_paid` satırı silinirse cron ücretli kalır, `api_paid_for` false döner. Secret açıksa ücretli tempo sürer ve istemci ücretsiz arayüz gösterir. PGlite'ta doğrulandı. Düzeltme: `after insert or update or delete` + `coalesce(new.key, old.key)`, ya da "satırı silmeyin" notu.
5. **DÜŞÜK** — Açılıştan sonra +2…+7 günler boş. İstemci 9 günü hemen gösterir, fikstür ise ilk `0 3,15` çağrısında gelir (12 saate kadar). Düzeltme: geçişten hemen sonra elle fikstür çağrısı (prosedür adım 9) ya da tetikleyici ücretliye geçerken `call_edge_function('sync-matches', '{"mode":"schedule","cadence":"paid"}')` çağırsın.
6. **DÜŞÜK** — Secret açık + DB ücretsiz aralığında "maç başladı" bildirimleri kaybolur. `sync-matches/index.ts:128` pencereyi `PAID`'den alır (5 dk), cron ise 30 dk'lık. Maçlar :00/:30'da başlar; o anki çağrıda henüz NS, sonraki çağrıda dakika 30 > 5. Aynısı geri dönüşte R1→R2 arasında olur. Düzeltme: pencereyi gövdedeki cadence'e göre seçin (`cadence==='paid'` → 5, yoksa 35) ya da aralığı dakikalarla sınırlı tutun (prosedür).
7. **DÜŞÜK** — Ücretli planda kota freni yok. `_shared/quota.ts:66` `paid → true`. 0018 başlığı (satır 9) `FOOTBALL_QUOTA_RESERVE=500` öneriyor, ama bu değer ücretli yolda etkisiz. Bütçe ~2,4k/7,5k olduğu için bugün sorun değil. Bir hata ya da döngü olursa 7.500'ün bitmesini durduracak bir şey yok, gün içi tüm futbol verisi durur. Düzeltme: ücretli yolda da başlıktaki kalanı rezervle karşılaştırın (`rem === null || rem - needed >= reserve`).
8. **DÜŞÜK** — `FIXTURE_DAYS_AHEAD` < 7 verilirse istemci yine 9 gün gösterir (`src/lib/days.ts:16` sabit), son günler boş kalır. Düzeltme: secret'ı tanımsız bırakın (prosedürde) ya da istemci sınırı `app_config`'ten okusun.
9. **DÜŞÜK** — `findBannedShareTerms` (yalnız test yardımcısı; çalışma anını etkilemez), `src/lib/share.ts:300-302`. Yanlış negatifler (doğrulandı): ünsüz yumuşaması / ünlü düşmesi "canlılığı", "kesinliği", "bahsi", "bahse"; ayrıca "resmen", "kazandırıyor", "resmîleşti". Yanlış pozitifler: `ignore` yalnız takım adlarını kapsıyor. Oyuncu soyadları ("Mehmet Kazancı", "Ali Ödül") ve takip dışı kulüpler ("ASM Oran") yakalanıyor. Sorunsuz geçenler: Oranje, Canlıspor, Kazanspor, Rubin Kazan / RUBIN KAZAN, MC Oran, Orange Vélodrome, Karl-Anthony Towns, Alperen Şengün, "Kazanan", "Tahminen", "Kesintisiz", "Orantılı", Bodø/Glimt, Qarabağ. Düzeltme: SUFFIX'e `lığ|liğ|luğ|lüğ` + iyelik, terimlere `bahs`, `resmen`, `kazandırıyor`; testlerde golcü adlarını da `ignore`'a geçin.
10. **DÜŞÜK** — Plan bilgisi oturum boyunca önbellekte (`src/hooks/useApiPaid.ts:7`). Açık uygulamalar geçişten sonra 3 günü, geri dönüşten sonra 9 günü uygulama yeniden başlayana kadar gösterir. Düzeltme: gerek yok, ama geri dönüşte bilinmeli (prosedür notu); istenirse uygulama ön plana dönünce yenilensin.

Regresyon yok: tazelik notu spora göre doğru, NBA 3 gün, 360 px/x1,3'te şerit temiz; alarm/maç önü/devre arası e2e'leri geçti.

### Ücretli plan geçiş prosedürü — doğrulanmış sıra

Kural: hiçbir an **DB ücretli + secret kapalı** durumunda kalınmaz (fikstür durur, bulgu 3). **Secret açık + DB ücretsiz** aralığı dakikalarla sınırlı tutulur (istek fırtınası yok, yalnız "maç başladı" bildirimi kaçar). Adımlar 5–8 NBA işlerinin çalışmadığı **07:00–19:30 UTC (10:00–22:30 TSİ)** arasında, :00/:30'dan uzak bir dakikada yapılır. `0002`/`0006`/`0007` içindeki `cron.alter_job` notları **asla** çalıştırılmaz; `nba-sync-live`'a dokunulmaz.

Hazırlık (bugün, ücretsiz planda; davranış değişmez):
1. Secret kontrol: `API_FOOTBALL_PAID` ve `API_NBA_PAID` tanımsız ya da `0`. `FIXTURE_DAYS_AHEAD` tanımsız.
2. `npm run deploy:functions`. Bayrak ayrımlı kod üretime çıkar; bayraklar kapalı olduğu için istek sayısı aynı kalır. 7 fonksiyonun hepsi "Deployed" olmalı. `sync-nba` başarısızsa DUR.
3. SQL Editor'de `0018_pro_api.sql`'i çalıştırın. Doğrulama:
   `select jobname, schedule from cron.job order by 1;` → `skor-sync-live */30 12-22 * * *`, `skor-sync-schedule 0 9 * * *`, `nba-sync-live */30 23,0-6 * * *`, `nba-sync-schedule 0 20 * * *`, `skor-invite-recount 20 * * * *`.
4. OTA: `npm run update:prod` (istemci `api_paid_for`'u okur; false iken 3 gün).

Geçiş (Pro aboneliği aktif olduktan sonra):
5. `/status` (kotaya sayılmaz): `plan` Pro, `limit_day` 7500. Değilse DUR.
6. Secret: `API_FOOTBALL_PAID=1` (tam olarak `1`), `FOOTBALL_QUOTA_RESERVE=500`. `API_NBA_PAID` tanımsız/0 kalır. `FIXTURE_DAYS_AHEAD` tanımlanmaz.
7. `npm run deploy:functions` (sıcak örnekler yeni bayrağı okusun). Hemen ardından adım 8.
8. `update public.app_config set value = 'true'::jsonb, updated_at = now() where key = 'api_paid';` (`'"true"'` DEĞİL; yanlış biçim hata verir ve hiçbir şey değişmez.)
9. Doğrulama: `select jobname, schedule, command from cron.job where jobname like 'skor-sync-%' or jobname like 'nba-%' order by 1;` → `skor-sync-live * 9-23 * * *` + `"cadence":"paid"`, `skor-sync-schedule 0 3,15 * * *` + `"cadence":"paid"`. NBA satırları DEĞİŞMEMİŞ olmalı.
10. Fikstürü hemen doldurun (bulgu 5): `select public.call_edge_function('sync-matches', '{"mode":"schedule","cadence":"paid"}'::jsonb);` (9 gün = 9 istek).
11. 10 dk sonra: Edge loglarında `sync-matches live ok` her dakika, `skipped` YOK. `quota` alanı ve `/status` `current` dakikada ~2–3 artıyor. `sync-nba` logunda 6,5 sn bekleme sürüyor (NBA ücretsiz). Uygulamayı yeniden başlatın: futbolda 9 gün ve "sık güncellenir" notu görünmeli.

Geri dönüş (Pro'dan ücretsize):
- R1. `update public.app_config set value = 'false'::jsonb, updated_at = now() where key = 'api_paid';` → tetikleyici 0004 takvimine döner. Adım 9'daki sorguyla `*/30 12-22` / `0 9` ve gövdede cadence olmadığını doğrulayın.
- R2. Hemen: secret `API_FOOTBALL_PAID=0` (ya da silin) → `npm run deploy:functions`. Sıra önemli: önce secret kapatılırsa bulgu 3 durumuna düşülür.
- R3. Gerekirse 0018'in tamamı: dosya sonundaki GERİ DÖNÜŞ bloğu sırasıyla (PGlite'ta hatasız). Ardından `0017_growth_invites.sql` tekrar, sonra `drop function if exists public.invite_try_activate(uuid);`. İstemci `api_paid()` yedeğine düşer.
- Açık uygulamalar yeniden başlayana kadar 9 günü gösterebilir (bulgu 10). +2…+7 günler eski fikstürle kalır.

KRİTİK/YÜKSEK/ORTA SAYISI: 3 (kritik 0, yüksek 1, orta 2; düşük 7). Yüksek ve ortalar geçiş prosedürüyle ilgili; yukarıdaki sıra izlenirse üçü de tetiklenmez. Kod düzeltmesi önerisi: bulgu 1 (notları silmek) ve bulgu 3 (`shouldRunSync` schedule).

Yapan / zaman: test ajanı (kalite döngüsü 8), 2026-11-18 20:46 TSS

### Durum (geliştirici, Döngü 8 — GELISTIRMELER 3.35)

Not: 0018 üretimde uygulandı (Döngü 7 içeriği). 0018'de yalnız yorumlar değişti; Döngü 8 SQL'i yeni `supabase/migrations/0019_paid_switch_safety.sql` dosyasında. Kontrol listesi: `docs/ucretli-gecis.md`.

1. **Durum:** Düzeltildi. `cron.alter_job` notları 0002, 0003, 0004, 0006, 0007, 0011'den kaldırıldı (yalnız yorum satırları; uygulanmış SQL anlamı aynı). Yerine "Ücretli geçiş: yalnız 0018 prosedürü (docs/ucretli-gecis.md; 0019 gerekir); nba-sync-live'a dokunmayın." GELISTIRMELER 3.x alarm notu, 3.34 sıra, §8 B ve `docs/inovasyon-onerileri.md` §0.7 taslağı (alter_job'lu eski 0018) + F12b notu güncellendi.
2. **Durum:** Düzeltildi. `0018_pro_api.sql` başlığı (yorum) doğrulanmış sırayı yazar: deploy (bayraklar kapalı) → 0018+0019 → OTA; /status → secret → deploy → app_config; doğrulama; geri dönüş R1 → R2 → R3.
3. **Durum:** Düzeltildi. `syncUtils.shouldRunSync`: `schedule` modu her zaman çalışır (DB ücretli + secret kapalı → ücretsiz yol, 3 gün, günde 2 × 3 = 6 istek). Canlı yine 22/gün. `tests/syncUtils.test.ts` güncellendi + gün simülasyonu; PGlite: cron takvimi × `shouldRunSync` → canlı 22, fikstür 2.
4. **Durum:** Düzeltildi (0019). Tetikleyici `after insert or update or delete`; `api_paid` silinince ücretsiz takvim. PGlite doğruladı (gövdede cadence yok, çağrı yok).
5. **Durum:** Düzeltildi (0019). Ücretliye geçişte tetikleyici `call_edge_function('sync-matches', {"mode":"schedule","cadence":"paid"})` çağrısını bir kez kuyruğa alır. Aynı değer, ücretsize dönüş ve silme çağrı almaz. Çağrı hatası plan geçişini geri almaz. Prosedür adım 10 artık doğrulama (+ gerekirse elle).
6. **Durum:** Düzeltildi. `isMinutelyCadence(PAID, cadence)`: 5 dk yalnız secret açık + `"cadence":"paid"` iken; diğer durumlarda 35 dk (`sync-matches` `syncLive(minutely)`).
7. **Durum:** Düzeltildi. `quota.allows` ücretli planda da `kalan − gerekli ≥ rezerv` (ücretsiz davranış aynı). Ücretli yolda canlı maç detayı (`ids=`) `hasQuotaForOptional(⌈n/20⌉)` ile; rezervin altında yalnız biten maçlar çekilir. `tests/quota.test.ts`.
8. **Durum:** Düzeltildi (0019 + istemci). Tek kaynak `app_config.fixture_days_ahead` (varsayılan 7) + `fixture_days_ahead()` (1…7). `sync-matches` bunu okur; 0019 yoksa eski secret. İstemci `useFixtureDaysAhead` + `dayOffsetsFor(paid, ahead)`. `e2e/daystrip_ui.mjs` `?days=3` → 5 gün.
9. **Durum:** Düzeltildi. SUFFIX'e `lığ|liğ|luğ|lüğ`; `TERM_FORMS` (bahis → bahs; resmi → resmen + resmileş…; resmî → resmîleş…; kazandırır → kazandır…); izin listesine `asm oran`. Soyadlar `ignore` ile (yeni test). Döngü 8'in "sorunsuz geçenler" listesi ve "bahsetti / bahsedilen" temiz.
10. **Durum:** Düzeltildi. `useApiPaid` / `useFixtureDaysAhead`: tek `AppState` dinleyicisi; ön plana dönüşte önbellek boşalır, açık ekranlar yeniden sorar.

Kapılar (geliştirici): `tsc` 0, `eslint src` 0, `npm run test:functions` 138/138, `deno check */index.ts` 7/7, PGlite `0017` 78 OK, `0018_paid_switch` 47 OK, zincir (0001→0019) 84 OK, `npm run e2e` 16/16 (daystrip_ui zincirde, 15/15), `narrow_ui` geçti.

Durum: 10/10 kodda kapatıldı.

Yapan / zaman: geliştirici ajanı (kalite döngüsü 8), 19 Kas 00:58 TSS

## Döngü 9

Yapan / zaman: test ajanı (kalite döngüsü 9), `date`: Thu Nov 19 01:15:44 TSS 2026

Kapsam: Döngü 8 değişiklikleri (GELISTIRMELER 3.35) — `docs/ucretli-gecis.md` (kullanıcı gözüyle, harfiyen), 0019 (DELETE tetikleyicisi, ücretliye geçişte tek fikstür çağrısı, `fixture_days_ahead`), `shouldRunSync` / `isMinutelyCadence`, ücretli planda `quota.allows` rezervi, sync-matches detay freni, istemci `useFixtureDaysAhead` / `dayOffsetsFor` / `useApiPaid` AppState yenilemesi, `findBannedShareTerms` eklemeleri, uygulanmış migration'larda yorum düzenlemeleri. Uygulama kaynağına dokunulmadı; yalnız test eklendi.

### Kapılar

| Kapı | Sonuç |
|---|---|
| `npx tsc --noEmit` | 0 hata |
| `npx eslint src` | 0 hata |
| `npm run test:functions` | 138 geçti / 0 kaldı |
| `deno check */index.ts` | temiz (7/7) |
| PGlite `0017_growth_invites` | 78 OK / 0 FAIL |
| PGlite `0018_paid_switch` | 47 OK / 0 FAIL |
| PGlite `chain_0001_0017` (0001→0019) | 84 OK / 0 FAIL |
| PGlite **yeni** `0019_runbook` | 35 OK / 0 FAIL |
| `npm run e2e` (:8084) | 16/16 betik geçti |
| `node e2e/narrow_ui.mjs` | geçti |

### Uygulanmış migration'lar: yalnız yorum mu?

- 0002, 0003, 0004, 0006, 0007, 0011: HEAD ile karşılaştırıldı. `--` yorumları ve boş satırlar çıkarıldıktan sonra içerik **birebir aynı**. Yalnız yorum satırları değişmiş; sonuna yorum eklenmiş SQL satırı yok.
- 0018: git'te yok (0015–0019 izlenmiyor). Döngü 7 kopyası da bulunamadı, bu yüzden metin karşılaştırması yapılamadı. Dolaylı kanıt: Döngü 8 raporundaki satır numaraları (`:47` → şimdi 61, `:287` → şimdi 301) başlığın 14 yorum satırı büyüdüğüyle tutarlı. Döngü 7'nin `0018_paid_switch` davranış testi değişmeden geçiyor. Bkz. bulgu 6.

### Yeni test: `supabase/sql-tests/0019_runbook.pglite.mjs`

Başlangıç üretim durumudur: 0001–0018 uygulanmış, `api_paid = false`. Test önce 0019'u iki kez çalıştırır (A3). Sonra `docs/ucretli-gecis.md` içindeki 11 ```sql bloğunu **dokümandan okuyarak** sırayla çalıştırır: A4, B8, B9, B10, Notlar, R1, R3 (0019 satırları → 0018 GERİ DÖNÜŞ → 0017 tekrar → `invite_try_activate` drop). Sonuçlar:
- Dokümandaki bütün SQL kopyala-yapıştır ile hatasız çalışıyor. A4, B9 ve R1'de beklenen takvim, gövde ve tetikleyici bitleri doğru.
- B8 fikstür çağrısını tam bir kez kuyruğa alıyor. Aynı değer ve R1 ise çağrı kuyruğa almıyor.
- `api_paid` satırı silinince takvim ücretsize dönüyor. 0018 tekrarı ve ardından 0019 tekrarı ücretli takvimi koruyor.
- R3 sonunda yalnız `api_paid()` kalıyor, tetikleyici yok ve takvim 0004 hâlinde.
- Sorunlar SQL'de değil; doğrulama metinlerinde ve secret adımlarında (aşağıda).

### Bulgular

1. **YÜKSEK** — Geri dönüş `FOOTBALL_QUOTA_RESERVE=500`'ü kaldırmıyor. Ücretsiz planda isteğe bağlı futbol çekimleri kalıcı olarak durur. B6 bu secret'ı ekler, ama R2 yalnız `API_FOOTBALL_PAID=0` der. Rezerv plandan bağımsız tek bir env değeridir (`_shared/apiFootball.ts:58`, `hasQuotaForOptional` `:61`). `quota.allows` artık iki planda da `kalan − gerekli ≥ rezerv` ister (`_shared/quota.ts:66-69`). Ücretsiz planda kalan ≤ 100 < 500 olur ve `primeQuota` /status ile kalanı öğrenir. Bu yüzden şunlar hep atlanır: maç önü raporu (`generate-preview/index.ts:92,102`), devre arası kuyruğu (`sync-matches/index.ts:148`) ve biten maç tekli detayı (`:173`, `apiFootball.ts:127`). Hata yoktur; özellikler sessizce kaybolur. **Düzeltme:** R2'ye şunu ekleyin: "`FOOTBALL_QUOTA_RESERVE` secret'ını silin (varsayılan 6), sonra deploy."
2. **ORTA** — B5 komutu Windows PowerShell'de çalışmıyor ve anahtar tanımsız. PowerShell 5.1'de `curl`, `Invoke-WebRequest` takma adıdır. Doğrulandı: `Cannot bind parameter 'Headers'. Cannot convert the "x-apisports-key: " value ...` (istek gönderilmedi). `$API_FOOTBALL_KEY` yerelde hiçbir yerde tanımlı değil (`.env` ve `.env.example` içinde yok). Anahtar yalnız Supabase secret'ıdır. Kullanıcı B5'i geçemez ya da boş anahtarla "plan Pro değil" sanıp durur. **Düzeltme:** `curl.exe -s https://v3.football.api-sports.io/status -H "x-apisports-key: <API_FOOTBALL_KEY değeriniz>"` yazın. Anahtarın nereden alınacağını belirtin (API-Football panosu).
3. **ORTA** — A4'ün ikinci bloğu 3 ifade içeriyor. Supabase SQL Editor yalnız son ifadenin sonucunu gösterir. Kullanıcı yalnız `app_config` satırlarını görür. "Tetikleyicide üçü de true" ve "`fixture_days_ahead()` = 7" beklentileri ekranda doğrulanamaz. PGlite'ta üç sonuç da doğru. **Düzeltme:** Üç sorguyu üç ayrı blok yapın ya da tek `select` içinde birleştirin.
4. **ORTA** — B10'un beklenen çıktısı doğrulanamaz ve yanıltıcı. Logdaki `scheduled` gün ya da istek sayısı değil, upsert edilen **maç satırı** sayısıdır (`sync-matches/index.ts:110`). Log gün bilgisi taşımaz. Biten maç zenginleştirmesi (`ids=` partileri) yüzünden istek sayısı 9'dan fazla olabilir. `net._http_response` sorgusunda URL yok. B8'den 1–2 dk sonra dakikalık canlı çağrılar da 202 döner. "Çağrı yok / hata verdi" ayrımı bu sorguyla yapılamaz ve beklenen `status_code` (202) yazılmamış. **Düzeltme:** Beklenen şunlar olsun: `schedule ok` logu ve `"skipped":[]`. Ek olarak `public.matches` içinde `kickoff_at` İstanbul gününe göre sayım (+2…+7 günlerde satır var mı). `net._http_response` için "hepsi 202" yazın.
5. **ORTA** — B11 kontrolleri Kural 3'ün saat aralığıyla çelişiyor. Kural 3 adım 5–8'e 07:00 UTC'den izin verir. Ücretli canlı iş yalnız `* 9-23` UTC'de çalışır. B8 07:00–08:50 UTC'de yapılırsa 10 dk sonra hiç `live ok` olmaz. Kullanıcı bunu arıza sanar. "sync-nba logunda 6,5 sn bekleme" kontrolü de yapılamaz: NBA işleri 07:00–19:30 UTC'de hiç çalışmaz (Kural 3'ün kendisi bunu söyler), bekleme de loglanmaz (`_shared/nbaApi.ts:43`). Canlı maç yoksa "/status dakikada 2–3 artar" beklentisi 1'dir. **Düzeltme:** Pencereyi 09:00–19:30 UTC yapın. NBA kontrolü yerine "B9'da nba-* değişmedi" yazın. Artışı "maç yokken 1, canlı maç varken 2–3" diye yazın.
6. **DÜŞÜK** — Üretimde uygulanmış 0015–0018 git'te izlenmiyor. Bu yüzden "0018'de yalnız yorum değişti" iddiası metin olarak doğrulanamadı; yalnız dolaylı kanıt var (yukarıda). Uygulanmış SQL sürüm kontrolünde değil. **Düzeltme:** 0015–0019'u commit'leyin. Sonraki döngüde `git diff` ile karşılaştırılabilsin.
7. **DÜŞÜK** — A4 "Beklenen satırlar" 5 iş listeliyor, ama sorgu 8 satır döndürür. Fazladan dönenler: `skor-maintenance` (30 4), `skor-sync-cleanup` (15 23), `skor-growth-cleanup` (40 4). B9'daki `like 'skor-sync-%'` da listede olmayan `skor-sync-cleanup`'ı döndürür. Harfiyen okuyan kullanıcı fazla satırı hata sanabilir. **Düzeltme:** "Ek olarak şu satırlar görünür ve değişmez: …" cümlesini ekleyin.

Sorunsuz doğrulananlar:
- 0019 idempotent; `api_paid` false iken 0 çağrı.
- Tetikleyici bitleri (4/8/16) doğru.
- `old.value is distinct from 'true'` mantığı doğru.
- Geri dönüş sırası (R3) hatasız; 0017 tekrarı çalışıyor.
- İstemci tarafı doğru: 0019 yokken `fixtureDaysAhead` → 7; `api_paid_for` yokken `api_paid()` yedeği; `dayOffsetsFor` 1…7 kırpar.
- `shouldRunSync`: `schedule` her zaman çalışır. `isMinutelyCadence`: yalnız secret + cadence ile.
- `fixture_days_ahead`: authenticated ve service_role çalıştırabilir, anon çalıştıramaz.
- `findBannedShareTerms` yoklaması doğru: "CANLI SKOR", "İDDAA", "oranında" yakalanıyor; "kazanamadı", "Anlıyorum", "Kadro kesinleşti" temiz.

### Karar

**ucretli-gecis.md olduğu gibi uygulanabilir: HAYIR**

Geçiş SQL'i (A3, B8, B9, R1, R3) harfiyen doğru çalışıyor. Engelleyenler şunlar:
- Bulgu 1: geri dönüş ücretsiz planı bozar.
- Bulgu 2: B5 Windows'ta çalışmaz.
- Bulgu 3–5: doğrulama adımları yazıldığı gibi gözlenemez.

Bulgu 1–5 düzeltildikten sonra EVET.

KRİTİK/YÜKSEK/ORTA SAYISI: 5 (0 kritik, 1 yüksek, 4 orta) · düşük: 2

### Durum (geliştirici, Döngü 9 — GELISTIRMELER 3.36)

Yapan / zaman: geliştirici ajanı (döngü 9), `date`: Thu Nov 19 01:29:58 TSS 2026

- Bulgu 1 (yüksek) — **Düzeltildi (kod).** Rezerv plana göre: `quota.footballOptionalReserve(paid, FOOTBALL_QUOTA_RESERVE, FOOTBALL_QUOTA_RESERVE_PAID)`. Ücretli → `FOOTBALL_QUOTA_RESERVE_PAID` (varsayılan 500); ücretsiz → `FOOTBALL_QUOTA_RESERVE` (varsayılan 6, en fazla 50). Unutulmuş eski `FOOTBALL_QUOTA_RESERVE=500` ücretsiz planı artık kilitlemez. B6 rezerv secret'ı ayarlamaz; A1 ve R2'ye "eski `FOOTBALL_QUOTA_RESERVE` tanımlıysa silin" eklendi; Kural 7. Deno testi eklendi (plan × env × kırpma).
- Bulgu 2 (orta) — **Düzeltildi.** B5: PowerShell `Read-Host` + `curl.exe`, bash `read -rs` + `curl`; anahtar panodan, dosyaya/geçmişe yazılmaz; beklenen alanlar `"plan":"Pro"`, `"active":true`, `"limit_day":7500`; Free / token hatası → DURUN.
- Bulgu 3 (orta) — **Düzeltildi.** A4 ikinci blok tek `select` (5 sütun, tek satır). Kılavuzdaki her doğrulama bloğu tek ifade (PGlite kontrol eder).
- Bulgu 4 (orta) — **Düzeltildi.** B10: log biçimi ve alan anlamları (`scheduled` = maç satırı), `"skipped":[]`, `quota` ≈ 7.4xx; gün farkına göre futbol maçı sayımı (B8 öncesi en büyük 1, sonra 2…7); `net._http_response` sorgusu kaldırıldı (gerekçesiyle); elle çağrı koşulu.
- Bulgu 5 (orta) — **Düzeltildi.** Kural 3: 09:00–19:30 UTC. B11: `live ok` dakikada bir; `/status` maç yokken +1/dk, canlı maçta 2–3/dk; NBA log kontrolü yerine tek `select` (`nba_live`, `nba_schedule`, `nba_api_paid`).
- Bulgu 6 (düşük) — **Açık (kullanıcı).** 0015–0019 commit'i kullanıcının kararı; commit yapılmadı. 0018 başlık yorumu hâlâ `FOOTBALL_QUOTA_RESERVE=500` der; uygulanmış dosyaya dokunulmadı, geçerli kaynak `docs/ucretli-gecis.md`.
- Bulgu 7 (düşük) — **Düzeltildi.** A4 tam 8 satırlık tablo; B9 tam 5 satırlık tablo (`skor-sync-cleanup` dahil). PGlite tabloları dokümandan okuyup sorgu sonucuyla sıra dahil karşılaştırır.

Kapılar: `npx tsc --noEmit` 0 hata · `npx eslint src` 0 hata · `npm run test:functions` 139 geçti / 0 kaldı · `deno check */index.ts` temiz (7/7) · PGlite `0017_growth_invites` 78 OK, `0018_paid_switch` 47 OK, `chain_0001_0017` 84 OK, `0019_runbook` 44 OK (0 FAIL) · `npm run e2e` (:8084) 16/16 · `node e2e/narrow_ui.mjs` geçti.

### Döngü 9 — yeniden doğrulama

Yapan / zaman: test ajanı (kalite döngüsü 9, yeniden doğrulama), `date`: Thu Nov 19 01:32:05 TSS 2026

Doküman, Windows PowerShell 5.1 kullanan bir kişinin gözüyle adım adım yeniden okundu.

- **PGlite `0019_runbook`** (geliştiricinin güncellediği sürüm, 12 blok): hepsi OK.
  - Her SQL bloğu tek ifade (R3 hariç). Bulgu 3 kapandı.
  - A4 tablosu 8 satır, B9 tablosu 5 satır. Bulgu 7 kapandı.
  - B10 log biçimi kodla aynı (`"skipped":[]`).
  - Diğer PGlite testleri (0017, 0018_paid_switch, chain) exit 0. `test:functions` 139/139, `deno check` temiz.
- **B5 (bulgu 2):** PowerShell parser ile denetlendi. 0 sözdizimi hatası.
  - `curl.exe` `C:\WINDOWS\system32\curl.exe` olarak çözülüyor.
  - `"x-apisports-key: $k"` genişletilip tek argüman olarak geçiyor. Ağ isteği atılmadan echo ile kontrol edildi.
  - Anahtar yalnız `Read-Host` ile giriliyor; dosyaya yazılmıyor. bash sürümü de doğru.
- **Bulgu 1 (rezerv):** `footballOptionalReserve` artık plana göre seçiliyor (`_shared/quota.ts:47-54`, `apiFootball.ts:59-63`).
  - Ücretli planda yalnız `FOOTBALL_QUOTA_RESERVE_PAID` okunur (varsayılan 500).
  - Ücretsiz planda `FOOTBALL_QUOTA_RESERVE` okunur (varsayılan 6) ve **en fazla 50**'ye kırpılır.
  - Geri dönüşte unutulmuş `500`, 100/gün kotada isteğe bağlı çekimleri artık kalıcı durduramaz. B6 bu secret'ı artık hiç ayarlatmıyor.
  - Ücretsiz planı kalıcı kilitleyen başka yol bulunamadı. `FOOTBALL_STATUS_QUOTA_FLOOR` ayrı ve dokümanda ayarlatılmıyor.
- **Bulgu 4 ve 5:** B10 beklentileri koda uygun. Kural 3 penceresi 09:00–19:30 UTC; ücretli canlı iş bu pencerede her dakika çalışır.

Kalan (DÜŞÜK, engel değil):
- Kural 7 "rezerv secret'larını geri dönüşte değiştirmeyin" diyor; R2 ise "eski `FOOTBALL_QUOTA_RESERVE=500` varsa silin" diyor. İki talimat çelişiyor. Hangisi uygulanırsa uygulansın plan kilitlenmez, çünkü değer 50'ye kırpılır. Silinmezse ücretsiz planda isteğe bağlı çekimler kalan 50'nin altında durur. Öneri: Kural 7'ye "R2'deki eski 500 hariç" ekleyin.

**ucretli-gecis.md olduğu gibi uygulanabilir: EVET**
