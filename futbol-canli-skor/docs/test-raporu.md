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
