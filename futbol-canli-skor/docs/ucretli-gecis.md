# Ücretli API planına geçiş — kontrol listesi (API-Football Pro)

Sürüm: Döngü 9 (test ajanının doğruladığı sıra + 0019 + Döngü 9 düzeltmeleri). Kaynaklar: `docs/test-raporu.md` "Döngü 8" / "Döngü 9", `supabase/migrations/0018_pro_api.sql` (üretimde uygulandı), `supabase/migrations/0019_paid_switch_safety.sql`, GELISTIRMELER 3.34 / 3.35 / 3.36.

Kapsam: yalnız **futbol** ücretli plana geçer (7.500 istek/gün). **NBA ücretsiz kalır** (100/gün).

## Kurallar (okumadan başlamayın)

1. Hiçbir an **DB ücretli + secret kapalı** durumunda kalmayın. Bu durumda Döngü 8 kodu fikstürü yine çeker, ama canlı veri 30 dakikada bir gelir.
2. **Secret açık + DB ücretsiz** aralığını dakikalarla sınırlı tutun. İstek fırtınası olmaz, ama "maç başladı" bildirimleri kaçabilir.
3. Adım 5–8'i **09:00–19:30 UTC (12:00–22:30 TSİ)** arasında yapın. Bu saatlerde NBA işleri çalışmaz ve ücretli canlı iş (`* 9-23` UTC) her dakika çalışır; B11 kontrolleri ancak bu pencerede gözlenir. :00 ve :30'dan uzak bir dakika seçin.
4. **`nba-sync-live`'a dokunmayın.** Hiçbir `cron.alter_job` komutu çalıştırmayın. Eski migration notları (0002/0006/0007) kaldırıldı. O notlar NBA kotasını bir gecede bitirir ve tetikleyiciyi atlar.
5. `app_config.api_paid` değerini yalnız `'true'::jsonb` / `'false'::jsonb` ile yazın. `'"true"'` (metin) hata verir ve hiçbir şey değişmez.
6. `FIXTURE_DAYS_AHEAD` secret'ını tanımlamayın. Gün sayısı `app_config.fixture_days_ahead` satırındadır (0019, varsayılan 7). Edge ve uygulama aynı değeri okur.
7. Kota rezervi secret'larını geçişte ve geri dönüşte **değiştirmeyin** (tek istisna: R2'deki eski `FOOTBALL_QUOTA_RESERVE=500` varsa silinir). Döngü 9'dan beri rezerv plana göre seçilir: ücretsiz planda `FOOTBALL_QUOTA_RESERVE` (varsayılan 6, en fazla 50), ücretli planda `FOOTBALL_QUOTA_RESERVE_PAID` (varsayılan 500). İkisi de tanımsız kalabilir.
8. API anahtarını hiçbir dosyaya yazmayın, commit'lemeyin, sohbete yapıştırmayın. B5'te yalnız terminal isteminde girilir.

SQL komutları Supabase Dashboard → SQL Editor'de çalıştırılır. Secret'lar Dashboard → Edge Functions → Secrets'tan (ya da `npx supabase secrets set … --project-ref hcihjovckgojhtoemkpc`) ayarlanır.

## A. Hazırlık (bugün, ücretsiz planda — davranış değişmez)

- [ ] **A1. Secret kontrolü.** `API_FOOTBALL_PAID` ve `API_NBA_PAID` tanımsız ya da `0` olmalı. `FIXTURE_DAYS_AHEAD` tanımsız olmalı. Eski kılavuzdan kalan bir `FOOTBALL_QUOTA_RESERVE` secret'ı tanımlıysa (ör. `500`) silin; ücretsiz plan varsayılanı 6'dır.
- [ ] **A2. Fonksiyonları dağıtın (bayraklar kapalıyken).**
  ```
  npm run deploy:functions
  ```
  7 fonksiyonun hepsi "Deployed" olmalı. `sync-nba` başarısızsa **DURUN**. Bu adım bayrak ayrımlı kodu ve Döngü 8 düzeltmelerini üretime çıkarır. Bayraklar kapalı olduğu için istek sayısı değişmez.
- [ ] **A3. 0019'u çalıştırın.** 0018 zaten uygulandı. `supabase/migrations/0019_paid_switch_safety.sql` dosyasının tamamını SQL Editor'de çalıştırın. Dosya tekrar çalıştırılabilir; `api_paid` false iken API isteği atmaz.
- [ ] **A4. Doğrulayın.** İki ayrı sorgu; her birini ayrı çalıştırın (SQL Editor yalnız son ifadenin sonucunu gösterir).
  ```sql
  select jobname, schedule from cron.job order by 1;
  ```
  Beklenen: tam **8 satır**, bu sırayla:

  | jobname | schedule |
  |---|---|
  | `nba-sync-live` | `*/30 23,0-6 * * *` |
  | `nba-sync-schedule` | `0 20 * * *` |
  | `skor-growth-cleanup` | `40 4 * * *` |
  | `skor-invite-recount` | `20 * * * *` |
  | `skor-maintenance` | `30 4 * * *` |
  | `skor-sync-cleanup` | `15 23 * * *` |
  | `skor-sync-live` | `*/30 12-22 * * *` |
  | `skor-sync-schedule` | `0 9 * * *` |

  Bu tabloyu not edin: B9 ve B11 ona göre karşılaştırır. Geçiş yalnız `skor-sync-live` ve `skor-sync-schedule` satırlarını değiştirir; diğer 6 satır hiç değişmez.
  ```sql
  select
    (select (tgtype & 4) > 0 and (tgtype & 8) > 0 and (tgtype & 16) > 0
       from pg_trigger where tgname = 'app_config_api_paid_schedule') as tetikleyici_tam,
    public.fixture_days_ahead() as gun_fonksiyonu,
    (select value from public.app_config where key = 'api_paid') as api_paid,
    (select value from public.app_config where key = 'nba_api_paid') as nba_api_paid,
    (select value from public.app_config where key = 'fixture_days_ahead') as fixture_days_ahead;
  ```
  Beklenen: tek satır → `tetikleyici_tam` = `true`, `gun_fonksiyonu` = `7`, `api_paid` = `false`, `nba_api_paid` = `false`, `fixture_days_ahead` = `7`. `tetikleyici_tam` boş (NULL) ya da `false` ise 0019 eksik uygulanmıştır: A3'ü tekrarlayın. Sonuç yine aynıysa **DURUN**.
- [ ] **A5. OTA.** Geçiş dönemi süresince iki kanala da gönderin:
  ```
  npm run update:apk
  npm run update:prod
  ```
  Uygulama planı `api_paid_for` ile, gün sayısını `fixture_days_ahead` ile okur. Plan false iken 3 gün gösterir.

## B. Geçiş (Pro aboneliği aktif olduktan sonra)

- [ ] **B5. Planı doğrulayın.** `/status` kotaya sayılmaz.

  Anahtar: API-Football panosu (dashboard.api-football.com) → hesap sayfasındaki API anahtarı. Supabase'deki `API_FOOTBALL_KEY` secret'ıyla aynı değerdir; Supabase secret'ı geri göstermez, bu yüzden panodan kopyalayın. Yerelde `.env` / `.env.example` içinde **yoktur** ve olmamalıdır.

  **Windows PowerShell 5.1** (`curl` orada `Invoke-WebRequest` takma adıdır; `curl.exe` yazın). Üç satırı sırayla çalıştırın. İlk satır anahtarı sorar: panodan kopyaladığınız değeri olduğu gibi yapıştırıp Enter'a basın. `Read-Host` ile girilen değer komut geçmişine yazılmaz.
  ```
  $k = Read-Host 'API-Football anahtari'
  curl.exe -s https://v3.football.api-sports.io/status -H "x-apisports-key: $k"
  Remove-Variable k
  ```
  **bash / Git Bash** (aynı akış; `read -rs` girilen değeri ekranda göstermez):
  ```
  read -rs -p 'API-Football anahtari: ' K; echo
  curl -s https://v3.football.api-sports.io/status -H "x-apisports-key: $K"
  unset K
  ```
  Yanıt tek satır JSON'dur. Beklenen alanlar (diğer alanlar önemsiz):
  ```
  {"get":"status", ..., "response":{"account":{...},"subscription":{"plan":"Pro","end":"...","active":true},"requests":{"current":<sayı>,"limit_day":7500}}}
  ```
  `"plan":"Pro"`, `"active":true` ve `"limit_day":7500` görünmeli. `"plan":"Free"` / `"limit_day":100` görünüyorsa ödeme henüz işlenmemiştir. `"errors":{"token":...}` görünüyorsa anahtar yanlış yapıştırılmıştır. Her iki durumda **DURUN**. Anahtarı hiçbir dosyaya kaydetmeyin.
- [ ] **B6. Secret'ları ayarlayın.**
  - `API_FOOTBALL_PAID=1` (tam olarak `1`). Bu adımda ayarlanacak **tek** secret budur.
  - `FOOTBALL_QUOTA_RESERVE` ve `FOOTBALL_QUOTA_RESERVE_PAID` ayarlanmaz (Kural 7). Ücretli planda rezerv kendiliğinden 500'dür.
  - `API_NBA_PAID` tanımsız ya da `0` kalır.
  - `FIXTURE_DAYS_AHEAD` tanımlanmaz.
- [ ] **B7. Fonksiyonları yeniden dağıtın.** Sıcak örnekler secret'ı modül yüklenirken okur; dağıtım şarttır.
  ```
  npm run deploy:functions
  ```
  Hemen ardından B8'e geçin.
- [ ] **B8. Planı açın.**
  ```sql
  update public.app_config set value = 'true'::jsonb, updated_at = now() where key = 'api_paid';
  ```
  Tetikleyici futbol cron'unu dakikalık takvime geçirir. 0019 ile fikstür senkronunu da **bir kez** kuyruğa alır.
- [ ] **B9. Takvimi doğrulayın.**
  ```sql
  select jobname, schedule, command from cron.job
   where jobname like 'skor-sync-%' or jobname like 'nba-%' order by 1;
  ```
  Beklenen: tam **5 satır** (`command` sütunu uzundur; yalnız `cadence` kısmına bakın):

  | jobname | schedule | command içinde |
  |---|---|---|
  | `nba-sync-live` | `*/30 23,0-6 * * *` | A4'tekiyle aynı (değişmedi) |
  | `nba-sync-schedule` | `0 20 * * *` | A4'tekiyle aynı (değişmedi) |
  | `skor-sync-cleanup` | `15 23 * * *` | `{"mode":"live"}` (değişmedi; `cadence` yok, bu doğru) |
  | `skor-sync-live` | `* 9-23 * * *` | `"cadence":"paid"` |
  | `skor-sync-schedule` | `0 3,15 * * *` | `"cadence":"paid"` |

  A4'teki diğer 3 satır (`skor-growth-cleanup`, `skor-invite-recount`, `skor-maintenance`) bu sorguda görünmez ve değişmez.
- [ ] **B10. Fikstür doldu mu?** B8 fikstür senkronunu bir kez kuyruğa aldı. İş arka planda 1–2 dakika sürer.

  **1) Log.** B8'den 2–3 dakika sonra Dashboard → Edge Functions → `sync-matches` → Logs'ta `schedule ok` satırını arayın. Beklenen biçim:
  ```
  [sync-matches] schedule ok {"scheduled":<N>,"enriched":<E>,"skipped":[],"quota":<Q>}
  ```
  - `scheduled` = 9 günde (dün … +7) upsert edilen **maç satırı** sayısıdır; gün ya da istek sayısı değildir. Takip edilen liglerde genelde onlarca–birkaç yüz arasıdır. `0` olmamalı.
  - `"skipped":[]` boş olmalı. İçinde tarih varsa o günler reddedilmiştir (plan henüz Pro değil ya da geçici API hatası).
  - `quota` = Pro kotasında kalan istek. 7.500'e yakın olmalı (ör. 7.4xx). 100'ün altındaysa plan Pro değildir: **DURUN**.
  - `enriched` istatistiği eksik biten maç sayısıdır; `0` da olabilir. Bu partiler yüzünden istek sayısı 9'dan fazla olabilir.
  - `schedule atlandı: ücretsiz plan takvimi dışında` satırı görünüyorsa secret etkin değildir: B6 ve B7'yi tekrarlayın, sonra aşağıdaki elle çağrıyı yapın.

  **2) Veri.** Bugüne göre gün farkı başına futbol maçı sayısı:
  ```sql
  select (kickoff_at at time zone 'Europe/Istanbul')::date
         - (now() at time zone 'Europe/Istanbul')::date as gun_farki,
         count(*) as mac
    from public.matches
   where sport_type = 'football' and kickoff_at >= now() - interval '1 day'
   group by 1 order by 1;
  ```
  Ücretsiz planda (B8'den önce) en büyük `gun_farki` 1'dir. B10'da `gun_farki` 2…7 olan satırlar görünmeli. Maç olmayan günler listede hiç görünmez; bu normaldir. 2…7 arasında hiç satır yoksa fikstür çekilmemiştir.

  **Elle çağrı (yalnız gerekirse).** 3 dakika içinde `schedule ok` görünmediyse ya da `gun_farki` ≥ 2 satırı yoksa bir kez çalıştırın:
  ```sql
  select public.call_edge_function('sync-matches', '{"mode":"schedule","cadence":"paid"}'::jsonb);
  ```
  Sonuç tek bir sayıdır (pg_net istek kimliği). 2–3 dakika sonra log ve veri sorgusunu tekrarlayın.

  Not: `net._http_response` URL tutmaz. Dakikalık canlı çağrılar da `202` döndüğü için fikstür çağrısını oradan ayırt edemezsiniz. Bu yüzden kontrol log ve veri sorgusuyla yapılır.
- [ ] **B11. B8'den 10 dakika sonra kontrol edin** (Kural 3 penceresi içinde, 09:00–19:30 UTC).
  - `sync-matches` logunda `live ok` her dakika bir kez görünmeli (10 dakikada yaklaşık 10 satır). `live atlandı` satırı ve `kota rezervi korunuyor` uyarısı görünmemeli.
  - `live ok` satırındaki `quota` alanı her dakika azalır. `/status` → `requests.current` (B5'teki komut) artar: canlı maç yokken **dakikada 1** (yalnız canlı liste), canlı maç varken **dakikada 2–3** (canlı liste + detay partisi; yeni biten maç varsa +1). 10 dakikada canlı maç yoksa yaklaşık +10 beklenir.
  - NBA değişmedi mi? NBA işleri bu saatlerde çalışmaz; log kontrolü yerine şu sorguyu çalıştırın:
    ```sql
    select
      (select schedule from cron.job where jobname = 'nba-sync-live') as nba_live,
      (select schedule from cron.job where jobname = 'nba-sync-schedule') as nba_schedule,
      (select value from public.app_config where key = 'nba_api_paid') as nba_api_paid;
    ```
    Beklenen: tek satır → `*/30 23,0-6 * * *`, `0 20 * * *`, `false`.
  - Uygulamayı arka plana alıp öne getirin (Döngü 8: plan ön plana dönüşte yenilenir). Futbolda 9 gün ve "sık güncellenir" notu görünmeli.

Beklenen bütçe: en kötü cumartesi yaklaşık 2.350 istek/gün (tavan yaklaşık 3.000 / 7.500). Kalan istek 500'ün (`FOOTBALL_QUOTA_RESERVE_PAID` varsayılanı) altına inerse isteğe bağlı çekimler (canlı maç detayı, maç önü, devre arası) durur. Canlı skor ve fikstür devam eder.

## C. Geri dönüş (Pro'dan ücretsize)

Sıra önemlidir: önce DB, sonra secret.

- [ ] **R1. Planı kapatın.**
  ```sql
  update public.app_config set value = 'false'::jsonb, updated_at = now() where key = 'api_paid';
  ```
  Tetikleyici 0004 takvimine döner. B9'daki sorguyla doğrulayın: `*/30 12-22 * * *` ve `0 9 * * *`, gövdede `cadence` **yok**.
- [ ] **R2. Hemen secret'ı kapatın.** `API_FOOTBALL_PAID=0` yapın ya da silin. Eski `FOOTBALL_QUOTA_RESERVE` secret'ı tanımlıysa (ör. eski kılavuzdan kalan `500`) onu da silin; ücretsiz plan varsayılanı 6'dır. (Döngü 9 kodu ücretsiz planda bu değeri en fazla 50'ye kırpar, ama silmek doğru durumdur.) `FOOTBALL_QUOTA_RESERVE_PAID` tanımlıysa kalabilir; ücretsiz planda okunmaz. Ardından:
  ```
  npm run deploy:functions
  ```
  Secret'ı R1'den önce kapatmayın.
- [ ] **R3. Yalnız gerekirse: migration'ları da geri alın.** Önce 0019:
  ```sql
  drop function if exists public.fixture_days_ahead();
  delete from public.app_config where key = 'fixture_days_ahead';
  ```
  Ardından 0018'in sonundaki GERİ DÖNÜŞ bloğunu sırasıyla çalıştırın:
  ```sql
  drop trigger if exists app_config_api_paid_schedule on public.app_config;
  update public.app_config set value = 'false'::jsonb where key = 'api_paid';
  select public.apply_football_sync_schedule();
  drop function if exists public.on_api_paid_change();
  drop function if exists public.apply_football_sync_schedule();
  drop function if exists public.api_paid_for(text);
  select cron.unschedule('skor-invite-recount');
  drop function if exists public.invite_recount_held();
  delete from public.app_config where key = 'nba_api_paid';
  ```
  Sonra `supabase/migrations/0017_growth_invites.sql` dosyasını yeniden çalıştırın. En son şunu çalıştırın:
  ```sql
  drop function if exists public.invite_try_activate(uuid);
  ```
  Uygulama `api_paid()` yedeğine düşer (3 gün). Bu sıra PGlite testinde hatasız çalışır.
- Uygulamalar planı ön plana dönüşte yeniden okur. +2…+7 günlerde eski fikstür kalabilir; bu günler ücretsiz planda şeritte görünmez.

## Notlar

- 0018 yeniden çalıştırılırsa ardından 0019'u da çalıştırın. Aksi halde tetikleyici DELETE korumasını kaybeder.
- Gün sayısını değiştirmek için (1–7):
  ```sql
  update public.app_config set value = '5'::jsonb, updated_at = now() where key = 'fixture_days_ahead';
  ```
  Edge bir sonraki fikstür senkronunda bu değeri kullanır. Uygulama ön plana dönüşte okur.
- `api_paid` satırını silmeyin. Silinirse 0019 takvimi ücretsize döndürür. Secret açık kalırsa durum R1 sonrası ile aynıdır: R2'yi uygulayın.
