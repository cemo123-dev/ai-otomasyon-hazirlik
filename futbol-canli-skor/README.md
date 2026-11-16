# Skor+ — Canlı Skor & Pro AI Taktik Analizi

Expo (SDK 58) · TypeScript · Expo Router · Supabase

- **Ücretsiz:** Avrupa ligleri ve Süper Lig canlı skorları (Supabase Realtime)
- **Pro:** Maç sonu AI taktik raporu (maç başına tek LLM çağrısı, tüm abonelerle paylaşılır)

## Çalıştırma

```bash
npm install
npx expo start          # telefonda Expo Go ile QR kodu okut, ya da "w" ile web
```

`.env` yoksa uygulama **önizleme modunda** açılır: mock veri, dakikası ilerleyen canlı
maçlar ve simüle edilen RPC/Realtime. Ana senaryo maçı: *Boğaziçi SK 0-1 Ege Yıldızı*
(%71 topla oynama, 0.62 xG). Sırasıyla paywall → "Aboneliği Başlat (Simülasyon)" →
aşamalı yükleme → 4 kartlık rapor akışını dener.

Gerçek backend için `.env.example` dosyasını `.env` olarak kopyalayıp doldur.

## Supabase kurulumu

1. Auth > Providers > **Anonymous sign-ins** ayarını aç (RPC'ler `auth.uid()` ister).
2. Vault'a iki secret ekle (SQL Editor):
   ```sql
   select vault.create_secret('https://<PROJE>.supabase.co', 'project_url');
   select vault.create_secret('<uzun-rastgele-değer>', 'internal_secret');
   ```
3. Edge Function secret'larını gir ve fonksiyonları deploy et:
   ```bash
   supabase secrets set GEMINI_API_KEY=... API_FOOTBALL_KEY=... INTERNAL_SECRET=<aynı-değer>
   # isteğe bağlı: GEMINI_MODEL=gemini-3.5-flash-lite  GEMINI_MAX_OUTPUT_TOKENS=900
   supabase functions deploy generate-analysis --no-verify-jwt
   supabase functions deploy sync-matches --no-verify-jwt
   ```
4. `supabase/migrations/0001_init.sql` ve ardından `0002_pipeline.sql` dosyasını çalıştır.
   İkinci dosya pg_cron işlerini (her dakika canlı senkron, 30 dakikada bir fikstür) ve
   analiz kuyruğu tetikleyicisini kurar.

> API-Football ücretsiz planı (100 istek/gün) dakikalık canlı senkron için yetmez.
> Canlı akış günde yaklaşık 3-4,5 bin istek yapar, bu yüzden en az "Pro" plan gerekir.

## Mimari

```
API-Football ──(cron worker, service_role)──▶ matches ──Realtime──▶ App (yalnızca okur)
                                                │
App ── rpc('request_match_analysis') ──▶ singleflight claim ──▶ analysis_jobs
                                                                     │ webhook
                                  match_analyses ◀── generate-analysis (LLM, 1×/maç)
```

| Dosya | Görev |
|---|---|
| `src/lib/supabase.ts` | İstemci yapılandırması, önizleme modu, anonim oturum |
| `src/lib/data/` | `DataSource` arayüzü: Supabase uygulaması + mock uygulaması |
| `src/hooks/useAnalysis.ts` | RPC → `paywall_blocked` / `generating` / `completed` durum makinesi |
| `src/app/` | Ekranlar: maç listesi, maç detayı (3 sekme), paywall modalı |

## Edge Functions

| Fonksiyon | Tetikleyici | Görev |
|---|---|---|
| `sync-matches` | pg_cron | API-Football → `matches`. Biten maça şablonla teaser yazar (0 token) |
| `generate-analysis` | `analysis_jobs` INSERT | Gemini ile tek seferlik taktik rapor → `match_analyses` |

Ortak kod `supabase/functions/_shared/` altında. LLM mantığı `analysis.ts`, Gemini çağrısı `gemini.ts` içinde.

## Token verimliliği

- **Singleflight:** Maç başına en fazla 1 LLM çağrısı yapılır, 10.000 abone de olsa sonuç aynıdır.
- **Lazy:** Yalnızca bir Pro kullanıcı sekmeyi açtığında üretilir. Kimsenin bakmadığı maç için harcama olmaz.
- **Ücretsiz teaser = 0 token:** `summary_teaser` worker tarafından şablonla yazılır.
- **Sayıları kod hesaplar:** xG/şut kutuları, skor durumu, TD adları ve oyuncu puanı/istatistikleri LLM'den istenmez.
- **Kompakt girdi:** Ham API JSON'u yerine yaklaşık 450 karakterlik satırlar gönderilir. Sarı kartlar elenir, yalnızca ilk 6 oyuncu girer.
- **Kısa anahtarlı JSON şeması:** `h`, `v`, `ms` gibi anahtarlar kullanılır. LLM yalnızca yorum metni yazar.
- **Ayarlar:** `thinking_level: minimal`, `max_output_tokens: 900`, `store: false`, model `gemini-3.5-flash-lite`.
- **Tahmini maliyet:** Girdi yaklaşık 650, çıktı yaklaşık 500-700 token, yani maç başına yaklaşık $0,002. Bu canlı ölçüm değil, tahmindir. Gerçek kullanım `match_analyses.input_tokens/output_tokens` kolonlarına kaydedilir.
- **Simülasyon RPC'si** (`simulate_subscription`) yalnızca test içindir. Yayından önce kaldırılmalıdır.
