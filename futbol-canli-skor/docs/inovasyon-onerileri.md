# Skor+ — İnovasyon Önerileri (pazara çekiş odaklı)

> Sürüm 2 — 18 Kasım 2026. Hazırlayan: inovasyon ajanı. Ortak belgeler: `docs/pazarlama-stratejisi.md` (Sürüm 2.1), `docs/tasarim-rehberi.md` (1.0).
> Bu belge yalnız öneri ve geliştirici spesifikasyonu içerir. Kod, migration veya deploy yapılmadı.
> **Sürüm 2 değişiklikleri:** F3 + F4 mevcut koda göre uygulamaya hazır hâle getirildi (§4.3). Kota düzeltmesi: üretim logları futbol ve NBA'in **ayrı** 100 istek/gün kotası olduğunu gösterdi; yeni F12 "Kota ayrımı + akıllı zamanlayıcı" (§4.4) eklendi. Yeni fikirler F13-F15. Migration numaraları son dosyadan (`0016_quality3.sql`) sonra yapım sırasıyla verildi: **0017** F3+F4, **0023** F12b, **0022** F2, **0024** F1. Yeni SQL fonksiyonları `set search_path = ''` kullanır.
> **Sürüm 4 (2026-11-18, yön değişikliği):** Google Play yayını (~2-3 hafta) ve API-Football Pro (7.500/gün; NBA ücretsiz 100/gün). Yeni §0 "Play + Pro API yol haritası" önceki sıralamanın yerine geçer; migration numaraları §0.6 sonundaki tabloya göre değişti; F6 iptal; F12b yalnız NBA. Aşağıdaki Sürüm 2-3 notları tarihsel kayıttır.
> **Sürüm 3 (Döngü 3):** F12a kodda tamam (3.31). F3+F4 (0017) geliştirmede. F12b (§4.4) mevcut koda göre uygulamaya hazır: son 0023 SQL'i (geri dönüş bloğuyla), `_shared/scheduler.ts` API'si, 20 Deno vakası, entegrasyon noktaları, log kontrol planı ve pazarlama §4.9'a uygun metin değişikliği.
> **Kurallar:** Her öneri ücretsiz API-Sports planında (futbol 100 istek/gün ve NBA 100 istek/gün, **ayrı kotalar**) çalışır. Çalışmıyorsa açıkça "ücretli plan gerekir" yazar. Bahis, yayın, lisanssız veri, resmî lig/kulüp markası, uydurma sosyal kanıt yok. Kişisel veri en azda tutulur (KVKK).
> "⚠ doğrulanmalı" işareti, uygulamadan önce kontrol edilmesi gereken bilgiyi gösterir.

---

## 0. Play + Pro API yol haritası (2 hafta) — Sürüm 4

> **Yön değişikliği (kullanıcı, 2026-11-18):** Skor+ ~2-3 hafta içinde **Google Play**'de yayına girer. APK dağıtımı büyütülmez. **API-Football Pro plana geçer: 7.500 istek/gün, 300 istek/dk** ([API-Football fiyatlar](https://www.api-football.com/pricing), [rate limit](https://www.api-football.com/news/post/how-ratelimit-works)). **API-NBA ücretsiz kalır: 100 istek/gün.** 0015-0017 prod'da uygulandı (F3+F4 kodda: `src/lib/share.ts`, `src/lib/growth.ts`).
> Bu bölüm önceki bölümlerin önüne geçer. Çelişki olursa bu bölüm geçerlidir.

### 0.1 Takvimi belirleyen kısıt: Play kapalı test kuralı
2023-11-13'ten sonra açılan **kişisel** Play geliştirici hesabı, üretime çıkmadan önce **en az 12 test kullanıcısıyla 14 gün kesintisiz kapalı test** yapmalıdır. Kuruluş hesabı muaftır ama D-U-N-S numarası 30 güne kadar sürebilir; 2 haftalık hedefe daha hızlı değildir ([Google Play destek](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en), [ProAndroidDev rehberi](https://proandroiddev.com/how-to-get-12-testers-for-google-play-closed-testing-and-actually-pass-6a2ab52a0779); ⚠ hesap türü ve güncel kural Play Console'da doğrulanmalı; 2026'da "test kullanıcısı gerçekten kullanmalı" denetimi iddiası doğrulanamadı).
**Sonuç:** 14 günlük saat **en geç 2. gün** başlamazsa "2-3 hafta" tutmaz. Gerçekçi takvim: G1-G2 AAB + kapalı test, G2-G16 test, G16 üretim başvurusu, G17-G23 inceleme ve yayın. Test kullanıcısı kaynağı hazır: mevcut APK kullanıcıları, Pro bekleme listesi ve davet sayacı (pazarlama Ek-10).

### 0.2 7.500 istek/gün neyi açar (çoğu kodda hazır, bayrakla kapalı)
| Özellik | Bugün (ücretsiz) | Pro API ile | Kodda yeri |
|---|---|---|---|
| Canlı senkron | 30 dk | **Dakikalık** (`skor-sync-live` `* 9-23 * * *`) | `apiFootball.ts` `MIN_GAP_MS`=0, `PAID` yolları; cron notu 0006/0007 |
| Canlı detay (olay, istatistik, kadro, oyuncu) | Yalnız biten maç, çalıştırma başına 3 | Canlı maçlar da, `ids=` ile 20 maç = 1 istek | `sync-matches` `syncLive` `ids = PAID ? [...liveIds, ...needDetail]` |
| Akıllı alarmlar (baskı, kırmızı kart) | Kapalı ("yakında") | **Açık** | `runFootballAlerts` (`PAID`), istemci `useApiPaid` |
| Devre arası raporu | 45-75 dk tahmini pencere | **Her devre arasında**, HT dakikalık yakalanır | `syncLive` `claim_halftime_job`; `request_halftime_report` (0011) `api_paid` ise yalnız HT |
| "Maç başladı" bildirimi | İlk 35 dk içinde yakalanan | ~1 dk içinde | `notifyKickoffs` |
| Fikstür | Dün/Bugün/Yarın | **−1…+7 gün** | `syncSchedule` gün döngüsü; istemci `src/lib/days.ts` `DayOffset` |
| Puan durumu (F10) | Kota yüzünden ertelendi | **Açılır** (~45 istek/gün) | yeni |
| Maç önü AI | Son 5 maç örneği yok | `getTeamLastFixtureIds` açılır | `generate-preview` `PAID` |
| NBA | 100/gün, 30 dk | **Değişmez** (ücretsiz kalır) | `nbaApi.ts`, `sync-nba` |

**Kritik hata riski:** NBA kodu bugün futbolun bayrağını okuyor: `nbaApi.ts:18`, `sync-nba/index.ts:19` ve `teamEvents.ts:10` → `Deno.env.get('API_FOOTBALL_PAID')`. `API_FOOTBALL_PAID=1` yapılınca NBA kota bekçisi devre dışı kalır (`createQuotaGuard({ paid: true })` her isteğe izin verir) ve NBA'in 100 isteği box score geri doldurmasıyla saatler içinde bitebilir. **Bayrak açılmadan önce NBA ayrı bayrağa geçmeli** (bkz. 0.6, P0).

### 0.3 Tipik bir Cumartesi için futbol istek bütçesi (Pro, 7.500/gün)
Varsayım: izlenen liglerde (Süper Lig + 5 büyük lig) ~27 maç, başlamalar 10:30-20:00 UTC, canlı pencere ~630 dk; aynı anda en çok ~12 canlı maç (`ids=` tek istek).

| Kalem | Hesap | İstek |
|---|---|---|
| Canlı liste `/fixtures?live=all` | dakikalık, 09:00-23:59 UTC = 15 sa × 60 | 900 |
| Canlı + yeni biten detay `/fixtures?ids=` | canlı maç olan ~630 dk × 1 (zirvede 2) | ~700 |
| Fikstür −1…+7 | 9 tarih × günde 2 çalıştırma | 18 |
| Puan durumu (F10) | 16 lig günlük + maç bitince lig başına 1 (~27) | ~43 |
| Devre arası raporu | maç başına 1 | 27 |
| Maç önü AI (üst sınır: her maçta talep) | maç başına ~9 (ilk 11 ≤ 4 + sakatlık 1 + iki takımın son 5 maçı ~4) | ~243 |
| Gece temizliği (`skor-sync-cleanup`) | | ~2 |
| **Toplam** | | **~1.930** |
| Güvenlik payı ×1,5 | | **~2.900 (7.500'ün %39'u)** |

Dakikada en çok ~5-10 istek (300/dk sınırının çok altında). Cron 24 saat dakikalık çalışsa bile +540 istek (~2.470). Çarşamba UCL + Avrupa ligi akşamı benzer büyüklükte. **Sonuç: futbolda bütçe sorunu yok; akıllı zamanlayıcı futbol için gerekmez.** Rezerv: ücretli planda `FOOTBALL_QUOTA_RESERVE_PAID` (varsayılan 500; Döngü 9), ücretsiz planda `FOOTBALL_QUOTA_RESERVE` 6 kalır (beklenmedik döngüye karşı fren).
NBA (100/gün, değişmez): canlı ~16 + fikstür 3 + box score ≤ ~40 → bugünkü gibi sınırda; F12b'nin NBA kısmı hâlâ değerli.

### 0.4 F12b yeniden kapsamı: **yalnız NBA**
- **Futbol:** zamanlayıcı yok. Dakikalık cron (`* 9-23 * * *`) + `PAID` yolları yeterli. Maçsız dakikada `live=all` boş döner; günde en çok ~300 boşa istek, bütçenin %4'ü. Basitlik kazanır.
- **NBA:** §4.4'teki tasarım aynen, yalnız `sport='nba'` için. Uygulanırken 0023 SQL'inden `skor-sync-tick` satırları ve `sync_state`'in `football` satırı çıkarılır; `skor-sync-live` dakikalık işi (0018) korunur. `sync-matches` `tick()` yazılmaz. Öncelik düşer (sıra 7).

### 0.5 Play'e özel işler
| İş | Native mi | Not |
|---|---|---|
| **Play üretim build'i (AAB)** | Evet | `eas.json` `production` profili var (`channel: production`); `android.buildType` varsayılan AAB. Paket `com.skorplus.app`. |
| **İmza anahtarı kararı** | – | ⚠ Mevcut APK kullanıcılarının verisi (anonim hesap, takipler, davet kodu) korunsun diye, Play App Signing'e **mevcut EAS anahtarı yüklenmeli** ("export and upload a key"). Aksi hâlde Play sürümü APK'nın üstüne kurulamaz; kullanıcı APK'yı silmek zorunda kalır ve anonim hesabını kaybeder. |
| **Mağaza bağlantısı + install referrer** (F3 uyarlaması) | Evet | Paylaşım ve davet bağlantısı `play.google.com/store/apps/details?id=com.skorplus.app&referrer=…`. İlk açılışta Play Install Referrer okunur, davet kodu Ayarlar'da önerilir. `expo-application` `getInstallReferrerAsync()` (⚠ SDK 58 dokümanında doğrula; yoksa `react-native-play-install-referrer`). |
| **Play Billing + RevenueCat** | Evet | `react-native-purchases`. Native paket **aynı build'e** girer, özellik bayrakla kapalı başlar (ikinci native build'i önler). Webhook → `profiles.is_premium`. |
| **Uygulama içi değerlendirme** | Evet | `expo-store-review`; aynı build. |
| **Hesap silme web sayfası** | – | Play şartı: uygulama dışından silme talebi için web adresi. İndirme sayfası sitesinde tek sayfa. |
| **Gizlilik politikası URL'si + Data Safety formu** | – | `src/lib/legal.ts` yer tutucuları (`[VERİ SORUMLUSU ADI]` vb.) yayından önce doldurulur (engelleyici). Data Safety: anonim kimlik, push token, kullanım günleri, davet ilişkisi, asistan soruları (Gemini'ye iletilir). |
| **APK'ya özel parçaların kaldırılması** | Hayır | F6 "Yeni APK var" bandı **iptal**. `EXPO_PUBLIC_DOWNLOAD_URL` ve `src/lib/growth.ts` `DOWNLOAD_URL` → mağaza bağlantısı. F13 web önizlemesi (`/m/?id=`) isteğe bağlı kalır. |
| **APK → Play geçiş bandı** | Hayır (OTA) | Yalnız `preview` kanalına (APK) giden OTA'da: "Skor+ artık Google Play'de. Güncellemeleri oradan al." Play build'i `production` kanalında olduğundan bandı görmez. Native algılama gerekmez. |
| **Pazarlama yasakları** | – | "Play Store'da", "abone ol", fiyat yasakları yalnız yayın ve Billing açıldıktan sonra kalkar (pazarlama §8 güncellenmeli). |

### 0.6 Yeni sıralama (2 hafta, ilk 8)
| # | İş | I | C | E | ICE | Efor | Migration | Neden bu sırada |
|---|---|---|---|---|---|---|---|---|
| 1 | **P0 Pro API'yi aç + NBA bayrağını ayır** (dakikalık senkron, alarmlar, HT raporu, −1…+7 fikstür) | 9 | 9 | 8 | **648** | S-M | 0018 | Para ödendiği gün değer verir; NBA bayrak hatası açılıştan önce kapanmalı. |
| 2 | **P1 Play build'i + kapalı test + mağaza bağlantısı / install referrer** (tüm native paketler bu build'de) | 10 | 8 | 6 | **480** | M | Yok | 14 günlük saat 2. gün başlamalı; takvimin kritik yolu. |
| 3 | **P2 RevenueCat + Play Billing** (Pro satışı) | 9 | 7 | 5 | 315 | M-L | 0020 | Native kısmı P1 build'inde; sunucu ve paywall kapalı test sırasında biter. |
| 4 | F5 İlk açılış takım seçimi | 7 | 7 | 8 | 392 | S | Yok | Mağazadan gelen soğuk kullanıcının ilk izlenimi ve ilk puanı; P1 ile aynı OTA. |
| 5 | F10 Puan durumu (artık açık) | 7 | 8 | 6 | 336 | M | 0021 | Rakiplerin hepsinde var; mağaza yorumlarında ilk eksik olarak yazılır. |
| 6 | P3 Uygulama içi değerlendirme isteği | 6 | 7 | 9 | 378 | S | Yok | Play'de puan = keşif. Native paket P1'de; tetik mantığı OTA. |
| 7 | F2 AI Vitrini → "Pro'yu gör" hunisi | 8 | 7 | 7 | 392 | S-M | 0022 | Satış açılınca vitrin doğrudan Pro'ya yönlendirir. |
| 8 | F12b-NBA akıllı zamanlayıcı | 6 | 7 | 6 | 252 | M | 0023 | NBA hâlâ 100/gün; futbol kapsamdan çıktı. |

Sıralama ICE'ye değil **bağımlılık ve takvime** göre: 1 ve 2 paralel başlar (1 sunucu, 2 build), 3 aynı build'in native paketine dayanır, 4-6 kapalı test sırasında OTA ile gelir. Sonrası: F1 Sabah NBA özeti (0024), F7 Hata bildir, F15, F14 (Play'de Google ile giriş gelirse gereksizleşebilir), F9, F11 widget (Play ile native güncelleme kolaylaştı: 6→ yeniden değerlendirilir), F8. **F6 iptal.**

**Migration yeniden numaralandırma (Sürüm 4):** 0018 P0 Pro API · 0020 P2 RevenueCat · 0021 F10 Puan durumu · 0022 F2 AI Vitrini (eski 0020) · 0023 F12b-NBA (eski 0018) · 0024 F1 Sabah NBA özeti (eski 0021). Aşağıdaki bölümlerde numaralar buna göre güncellendi.

---

### 0.7 Spesifikasyon — P0 Pro API'yi aç + NBA bayrağını ayır (uygulamaya hazır)

> Durum (Döngü 7 geliştirici, GELISTIRMELER 3.34): **kodda tamam, prod'da kapalı.** NBA bayrağı ayrıldı (`_shared/paidFlags.ts`, `API_NBA_PAID` varsayılan kapalı; `tests/paidFlags.test.ts`). `0018_pro_api.sql` yazıldı ama aşağıdaki taslaktan iki bilinçli farkla: (1) `api_paid`'i **açmaz** (planı açma ayrı tek `update`); (2) cron'u doğrudan dakikalığa çekmez, `apply_football_sync_schedule()` + `app_config` tetikleyicisi `api_paid`'e göre kurar (false iken 0004 ile birebir) ve dakikalık gövde `cadence:'paid'` taşır; secret kapalıyken Edge ücretsiz takvim dışını atlar. Ek: Döngü 7 bulgu 5–8 (davet) aynı dosyada. İstemci: `useApiPaid(sport)`, `paidOnly: Sport`, −1…+7 gün şeridi (yalnız futbol, ücretli doğrulanınca), tazelik notu F1 (yalnız `api_paid` true). Kickoff penceresi 35/5 dk. E2E `?paid=1` / `?paid=0` / `?nbapaid=0`.

**Kullanıcı hikâyeleri:** (1) Futbol takipçisi olarak skorun maç sırasında ~1 dk içinde güncellenmesini istiyorum. (2) Takip ettiğim maçta baskı ve kırmızı kart alarmı almak istiyorum. (3) Pro kullanıcı olarak her devre arasında raporu almak istiyorum. (4) Önümüzdeki haftanın fikstürünü görmek istiyorum. (5) Geliştirici olarak NBA'in 100'lük kotasının futbol bayrağından etkilenmemesini istiyorum.

**Dokunulacak dosyalar**
| Dosya | Değişiklik |
|---|---|
| `supabase/functions/_shared/nbaApi.ts` | `const PAID = Deno.env.get('API_NBA_PAID') === '1';` ve `export const NBA_PAID = PAID;` (satır 18). |
| `supabase/functions/sync-nba/index.ts` | Satır 19: yerel `PAID` yerine `NBA_PAID` içe aktarımı. Yorum: "seri alarmı yalnız API_NBA_PAID=1". |
| `supabase/functions/_shared/teamEvents.ts` | Satır 10: `PAID` → `import { PAID as FOOTBALL_PAID } from './apiFootball.ts'; import { NBA_PAID } from './nbaApi.ts';` ve `kickoffBody({ sport, paid: sport === 'nba' ? NBA_PAID : FOOTBALL_PAID, … })`. |
| `supabase/functions/_shared/quota.ts` | `DEFAULT_RESERVES` yorumuna Pro notu; varsayılan değişmez. Döngü 9: ücretli rezerv ayrı (`footballOptionalPaid` = 500, `FOOTBALL_QUOTA_RESERVE_PAID`). |
| `supabase/functions/sync-matches/index.ts` | `syncSchedule`: `const AHEAD = envNumber(Deno.env.get('FIXTURE_DAYS_AHEAD'), PAID ? 7 : 1);` ve `for (const date of range(-1, AHEAD).map(day))`. `syncLive`: `notifyKickoffs(..., 'football', PAID ? 5 : 35)`. |
| `supabase/migrations/0018_pro_api.sql` | Yeni (aşağıda). |
| `src/lib/data/types.ts`, `supabaseSource.ts`, `mockSource.ts` | `isApiPaid(sport?: Sport)`: `rpc('api_paid_for', { p_sport })`; RPC yoksa eski `api_paid` (futbol) yedeği. |
| `src/hooks/useApiPaid.ts` | `useApiPaid(sport: Sport = 'football')`; önbellek spor başına (`Map<Sport, Promise>`). |
| `src/app/settings.tsx` | `ITEMS[].paidOnly?: Sport` (`pressure`, `red_card` → `'football'`; `nba_run` → `'nba'`); iki ayrı `useApiPaid` çağrısı. |
| `src/app/match/[id].tsx` | `useApiPaid(match.sport_type)` (satır ~298). |
| `src/lib/days.ts` | `DayOffset = -1 \| 0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 7`; `DAY_OFFSETS` `paid` ise −1…7, değilse −1…1 (`dayOffsetsFor(paid)` saf fonksiyonu). `dayLabel`: 2+ gün için "Cmt 22.11". |
| `src/app/index.tsx` | Gün şeridi yatay `ScrollView`; seçili gün görünür alana kaydırılır. Canlı filtresi notu: `paid` iken `ⓘ Maç sırasında skorlar sık güncellenir; her maçta son güncelleme saati yazar.` (dakika rakamı yok; pazarlama §4.9 aşama 1 ile aynı ruh), değilse bugünkü metin. |
| `e2e/lineup_ui.mjs` | Gün şeridi ve not metni beklentileri; mock `?paid=1` ve `?paid=0` iki senaryo (mock zaten `?paid=` destekliyor, 3.31 B-7). |

**Migration — `supabase/migrations/0018_pro_api.sql` (uygulandı) + `0019_paid_switch_safety.sql`**
> Döngü 8: buradaki eski taslak (`update api_paid` + `cron.alter_job`) KALDIRILDI; çalıştırmayın. Gerçek dosyalar `supabase/migrations/0018_pro_api.sql` (tetikleyici: `app_config.api_paid` değişince futbol cron takvimi kendiliğinden değişir) ve `0019_paid_switch_safety.sql`.
> Ücretli geçiş: yalnız 0018 prosedürü (`docs/ucretli-gecis.md`); `nba-sync-live`'a dokunmayın. `cron.alter_job` ile elle takvim değiştirmek tetikleyiciyi atlar, cadence'siz gövdeyi dakikalık yapar ve NBA kotasını (100/gün) bir gecede bitirir.
`request_halftime_report` (0011) `api_paid` true iken yalnız gerçek HT'de çalışır; değişiklik gerekmez. Ücretsiz planda kapalı `idsParamBlocked` Pro'da ilk istekte açılır (`!PAID`).

**Testler**
- Deno `tests/teamEvents_paid.test.ts` (ya da `syncUtils.test.ts` genişletmesi): `kickoffBody({ sport: 'nba', paid: false })` ve `({ sport: 'football', paid: true })` beklenen metinler (saf fonksiyon zaten `syncUtils.ts`'te).
- Deno `tests/days.test.ts`: `dayOffsetsFor(true)` 9 gün, `dayOffsetsFor(false)` 3 gün; `dayLabel(5, T)` "Pzt 24.11" biçimi; TSİ gece yarısı sınırı +7'de de doğru.
- Deno `tests/quota.test.ts`: `envNumber('500', 6)` = 500 (mevcut testlere 1 vaka).
- Deno yeni `tests/paidFlags.test.ts`: `nbaApi.ts` ve `apiFootball.ts` modül düzeyinde `Deno.env` okuduğu için ayrı süreçte: `Deno.Command` ile `API_FOOTBALL_PAID=1 API_NBA_PAID=0` ortamında küçük betik `NBA_PAID === false && PAID === true` yazar (`--allow-env --allow-run`). Bayrak karışmasını kalıcı olarak yakalar.
- E2E `lineup_ui.mjs`: `?paid=1` → 9 günlük şerit, "+7" günü seçilebilir, not metni yeni; `?paid=0` → 3 gün ve eski not. `alerts_ui.mjs`: `?paid=1` baskı/kırmızı kart anahtarı açık; NBA seri alarmı "Yakında" (NBA ücretsiz).
- **Prod log kontrolü (ilk 24 saat):** Edge loglarında `[sync-matches] live ok` dakikalık ve `quota` alanı azalan; günlük futbol kullanımı < 3.000; `[sync-nba]` `quota` alanı **NBA sayacını** gösterir ve 0'a inmez; en az bir maçta `match_alerts` satırı; HT'ye giren takip edilen maçta `halftime_jobs` 2 dk içinde.

**Elle adımlar:** API-Football Pro aboneliği aktif mi kontrol (`/status` → `plan: Pro`, `limit_day: 7500`) → secret'lar → `npm run test:functions` → `npm run deploy:functions` → 0018 → 24 saat log → OTA (`npm run update:apk` = preview kanalı; Play build çıkınca `production` kanalı da).

---

### 0.8 Spesifikasyon — P1 Play build'i + kapalı test + mağaza bağlantısı / install referrer (uygulamaya hazır)

**Kullanıcı hikâyeleri:** (1) Yeni kullanıcı olarak uygulamayı Play'den güvenle kurmak istiyorum. (2) Davet edilen kullanıcı olarak mağaza bağlantısıyla kurunca arkadaşımın kodunun hazır gelmesini istiyorum (tek dokunuşla onaylarım). (3) Mevcut APK kullanıcısı olarak verimi kaybetmeden Play sürümüne geçmek istiyorum. (4) Geliştirici olarak ikinci bir native build'e gerek kalmadan Billing ve değerlendirme paketlerinin bu build'de olmasını istiyorum.

**Native paketler (tek build):** `npx expo install expo-application expo-store-review react-native-purchases` (⚠ SDK 58 uyumlu sürümleri `expo install` seçer; `react-native-purchases` için Expo config plugin gerekip gerekmediğini RevenueCat Expo rehberinde doğrula). `react-native-purchases` bu build'de **yalnız kurulur**, `Purchases.configure` P2'ye kadar çağrılmaz.

**Dokunulacak dosyalar**
| Dosya | Değişiklik |
|---|---|
| `app.json` | `android.package` `com.skorplus.app` aynı kalır (APK'dan güncelleme için şart). `android.versionCode` EAS uzaktan (`appVersionSource: remote`) yönetir. Gereksiz izin varsa `android.blockedPermissions`. |
| `eas.json` | `build.production.android.buildType: "app-bundle"` (açıkça). `submit.production.android: { "track": "internal" }` (ilk yükleme; kapalı test kanalı Console'da). |
| `src/lib/store.ts` (yeni, saf) | `STORE_PACKAGE = 'com.skorplus.app'`; `storeUrl(ref: 'app-share' \| 'invite', code: string \| null): string` → `https://play.google.com/store/apps/details?id=com.skorplus.app&referrer=<encodeURIComponent('utm_source=skorplus&utm_medium=' + ref + (code ? '&utm_content=' + code : ''))>`; `parseReferrer(raw: string \| null): { medium: string \| null; code: string \| null }` (kod `isValidInviteCode` ile süzülür). |
| `src/lib/share.ts` | `withRef(downloadUrl, …)` çağrıları `storeUrl(...)` ile değişir; `/m/?id=` (F13) yalnız `EXPO_PUBLIC_WEB_PREVIEW_URL` tanımlıysa kullanılır. Davetiye metni: `Türkçe skor uygulaması Skor+ Google Play'de: <storeUrl> — Davet kodum: ABC234` ("reklamsız" kalır mı? Reklam kararı yoksa evet). |
| `src/lib/growth.ts` | `DOWNLOAD_URL` kaldırılır; tüketiciler `storeUrl`'e geçer. Önizleme modunda da `storeUrl` (gerçek mağaza adresi, zararsız). |
| `src/lib/installReferrer.ts` (yeni) | `readInstallReferrerOnce(): Promise<string \| null>`: yalnız Android ve `!__DEV__`; AsyncStorage `skor.referrer.checked` yoksa `Application.getInstallReferrerAsync()` → `parseReferrer` → kod varsa AsyncStorage `skor.referrer.code`; her durumda `checked=1`. Hata yutulur. Önizlemede `?referrer=` URL parametresi (e2e için). |
| `src/app/_layout.tsx` | Açılışta `readInstallReferrerOnce()` (`startActivityTracking` yanında). |
| `src/components/InviteCard.tsx` | `canRedeem` ve `skor.referrer.code` varsa üstte bant: `Seni davet eden kodu bulduk: ABC234.` + birincil düğme `Kaydet` (mevcut `redeem` akışı). Otomatik kayıt **yok** (şeffaflık). Kayıt ya da "Bu kod değil" sonrası anahtar silinir. |
| `src/app/index.tsx` | Davet kodu bekliyorsa ve `canRedeem` ise ana ekranda tek seferlik ince bant: `Davet kodun hazır. Ayarlar'da onayla.` (kapatılabilir). |
| `src/components/ApkMigrationBanner.tsx` (yeni) | `Updates.channel === 'preview'` iken: `Skor+ artık Google Play'de. Güncellemeleri oradan al.` + `Play'de aç` (`Linking.openURL(storeUrl('app-share', null))`) + `×`. Play build'i (`production` kanalı) görmez. |
| `src/lib/legal.ts` | Yer tutucular doldurulur (veri sorumlusu, e-posta, adres, tarih); "Hesap silme" bölümüne web adresi; yeni veri yok (install referrer yalnız cihazda okunur, sunucuya yalnız onaylanan davet kodu gider). |
| `.env.example` | `EXPO_PUBLIC_DOWNLOAD_URL` kaldırılır; isteğe bağlı `EXPO_PUBLIC_WEB_PREVIEW_URL`. |
| Depo dışı: hesap silme sayfası | İndirme sitesinde `/hesap-silme`: uygulama içi yol (Ayarlar > Hesabımı sil) + e-posta ile talep. Play Console'a URL. |

**Adımlar (sırayla)**
1. **G1:** Play Console hesabı (kişisel/kuruluş kararı ⚠), uygulama kaydı `com.skorplus.app`. **Play App Signing: mevcut EAS anahtarını yükle** (`eas credentials` → keystore indir → Console "Use existing app signing key"). ⚠ Bu adım geri alınamaz; APK kullanıcılarının yerinde güncellenmesi buna bağlıdır.
2. **G1:** Native paketler + yukarıdaki kod → `npx eas-cli@latest build --platform android --profile production` → `eas submit --profile production` (internal track) → iç testte duman testi.
3. **G2:** Kapalı test kanalı; Google Grubu ile ≥ 12 (öneri 20, düşenlere karşı) test kullanıcısı: APK kullanıcıları, bekleme listesi, davet sıralaması. **14 günlük saat burada başlar.** Test kullanıcısına "her gün bir kez aç" ricası (engagement denetimi iddiasına karşı ⚠).
4. **G2-G4:** Mağaza girişi: kısa/uzun açıklama (pazarlama yasak listesi; resmî logo yok), ekran görüntüleri, ikon, özellik grafiği, içerik derecelendirmesi anketi, hedef kitle (13+; `legal.ts` "13 yaşından küçük değil"), Data Safety, gizlilik URL'si, hesap silme URL'si, reklam yok beyanı.
5. **G2+:** APK kullanıcılarına `preview` kanalından OTA: geçiş bandı.
6. **G16:** Üretime başvuru; incele­me (~1-7 gün ⚠).
7. Yayın sonrası: `storeUrl` paylaşımlarının Play Console "Edinme raporları"nda `utm_source=skorplus` ile görünmesi.

**Testler**
- Deno `tests/store.test.ts` (`src/lib/store.ts` saf): `storeUrl('invite', 'ABC234')` birebir (referrer bir kez kodlanmış: `utm_source%3Dskorplus%26utm_medium%3Dinvite%26utm_content%3DABC234`); kod `null` → `utm_content` yok; `parseReferrer` kodlanmış ve kodlanmamış girdi, `utm_content=abc234` → `ABC234`, geçersiz kod (`ABC123`) → `code: null`, Play'in organik değeri `utm_source=google-play&utm_medium=organic` → `{ medium: 'organic', code: null }`, boş/`null` → iki alan `null`.
- Deno `tests/share.test.ts`: `withRef` beklentileri `storeUrl` ile güncellenir; yasaklı kelime testi davetiye metnini de kapsar ("Play Store'da" yalnız bu metinde ve yayından sonra; pazarlama onayı ⚠).
- E2E yeni `e2e/referrer_ui.mjs` (önizleme): `/?referrer=utm_source%3Dskorplus%26utm_content%3DXYZ789` → ana ekran bandı → Ayarlar'da `Seni davet eden kodu bulduk: XYZ789.` → `Kaydet` → `Teşekkürler, davet kaydedildi.`; geçersiz referrer → bant yok. `share_ui.mjs`: paylaşım metni `play.google.com/store/apps/details?id=com.skorplus.app` içerir.
- **Cihaz testi (internal track):** (a) APK kurulu cihaza Play'den güncelleme: veri (takipler, davet kodu, hesap kimliği Ayarlar'da) aynı kalır. (b) Temiz cihaz, referrer'lı bağlantıyla kurulum → ilk açılışta davet bandı (⚠ install referrer yalnız Play'den kurulumda dolar; internal test bağlantısında davranış doğrulanmalı). (c) `ApkMigrationBanner` APK'da görünür, Play build'inde görünmez. (d) Ayarlar > Gizlilik metinlerinde yer tutucu kalmadı.

**Kabul:** AAB internal track'te kurulur; APK üstüne güncelleme veri kaybetmez; paylaşım/davet metinleri mağaza bağlantısı taşır; referrer'daki geçerli kod yalnız kullanıcı onayıyla kaydedilir; kapalı test ≥ 12 kişiyle G2'de başlamıştır; `react-native-purchases` ve `expo-store-review` build'de var ama kapalı; `npm run typecheck`, `lint`, `test:functions`, `e2e` temiz.

**Açık riskler:** kapalı test saatinin kaçırılması (takvimin tek kritik yolu); imza anahtarı yüklenmezse APK kullanıcılarının veri kaybı; Data Safety ile gizlilik metni arasında tutarsızlık (Play reddi); API-Sports verisinin ticari mağaza uygulamasında kullanım şartları ⚠ (rakip §11.1).

---

## 1. Bağlam: önerileri yönlendiren içgörüler

Pazarlama ve rakip araştırmasından alınan, önerileri doğrudan şekillendiren tespitler:

| # | İçgörü | Kaynak | Ürüne etkisi |
|---|---|---|---|
| 1 | Konum "hız" değil, **"Türkçe anlam"**. Ücretsiz planda skor ~30 dk aralıkla gelir. "Anlık" dili yasak. | pazarlama §0-1 | Hız yarışına giren özellik önerilmez. Değer, biten maçın Türkçe yorumunda ve sabah özetinde. |
| 2 | **S1 Türk NBA takipçisi birincil segment.** Gece maçlarını sabah kontrol eder. | pazarlama §2, §5.2 | NBA sabah ritmine bağlı ürün (sabah özeti push'u) en güçlü tutma kaldıracı. |
| 3 | Türkçe NBA box score'u Sofascore ve Flashscore zaten veriyor. Fark yalnız **Türkçe NBA AI yorumu**. | rakip §5, §10-6 | Box score tek başına reklam vaadi olmaz. AI'ı görünür kılmak gerekir. |
| 4 | Rakiplerde Türkçe maç sonu taktik analizi, devre arası raporu ve maça kilitli sohbet bulunamadı. Ama Pro **satın alınamıyor**; kimse AI'ı görmüyor. | rakip §6, §10-2; pazarlama §0.2 | Ana farklılaştırıcı vitrine çıkmalı: sınırlı, ücretsiz "AI vitrini" + uygulama içi bekleme listesi. |
| 5 | APK dağıtımı: mağaza keşfi yok. Büyüme **WhatsApp ve kişiden kişiye**. Davet sistemi bugün elle, kodsuz. | pazarlama §4.3-4.4 | Uygulama içi paylaşım ve davet kodu "en yüksek getirili ürün değişikliği" (pazarlama §4.4 ürün önerisi). |
| 6 | Görsel paylaşım kartı yeni native build ister (`react-native-view-shot`, `expo-sharing` yok). | rakip §3 ek tespit, GELISTIRMELER 8-D | **Metin paylaşımı** React Native'in çekirdek `Share` API'siyle yapılır. Native modül gerekmez, OTA ile gelir. |
| 7 | KPI 6 (D7 tutma) için "son görülme" verisi yok. | pazarlama Ek-6, KPI tablosu | Ölçüm temeli (aktif gün kaydı) top-3'ün ilk migration'ına eklenir. |
| 8 | En büyük şikâyet: **bildirim spamı**. İkinci: reklam ve bahis. | rakip §2 | Yeni push yalnız takip edilen takıma, günde en fazla 1 kez, ayardan kapatılabilir. Reklam ve bahis yok. |
| 9 | Spor uygulamalarında kişiselleştirilmiş ve düzenli push, tutmayla güçlü ilişkili (sektör raporları, Airship). Rakamlar eski ve satıcı kaynaklı; yön olarak kullanılır, hedef olarak kullanılmaz. | [Airship spor tutma raporu](https://www.airship.com/resources/benchmark-report/how-push-notifications-impact-sports-recreation-app-retention-rates/), [Airship 2026 push benchmark](https://www.airship.com/mobile-app-push-notification-benchmarks-for-2026/) | Sabah özeti push'u, takip edilen takıma kişiselleştirilir. |
| 10 | Pro'yu "reklamsız" ile gerekçelendirmek rekabet edemez (Maçkolik Pro ucuz). | rakip §7 | Para kazanma hazırlığı AI talebini ölçmeye dayanır, fiyata değil. |

**Kod tabanından teknik gerçekler** (öneriler bunlara dayanır):
- Tablolar: `profiles`, `matches` (`box_score jsonb`, `lineups`, `kickoff_notified`), `team_follows`, `match_follows`, `push_tokens`, `notification_prefs`, `match_analyses` (futbol ve NBA, RLS: yalnız Pro okur), `app_config` (istemciye kapalı).
- Push: `_shared/notify.ts` + `_shared/push.ts` (Expo push, geçersiz token temizliği). Bildirime dokununca `fixture_id` ile maç ekranı açılır (`src/lib/notifications.ts`, `src/app/_layout.tsx`).
- Cron (UTC): futbol canlı `*/30 12-22`, NBA canlı `*/30 23,0-6`, bakım `30 4 * * *`.
- NBA box score yalnız biten maçta ve çalıştırma başına en fazla `NBA_MAX_ENRICH=3` maç zenginleşir. Gece çok maç varsa bazı box score'lar sabah geç dolar.
- Testler: `npm run test:functions` (Deno, `supabase/functions/tests/`; `src/lib` içindeki saf modüller de içe aktarılabilir, ör. `days.test.ts`). E2E: `npm run e2e` (Playwright, `EXPO_PUBLIC_PREVIEW_MODE=1` önizleme verisi).
- En yüksek migration: `0016_quality3.sql` (0015 ve 0016 kalite döngüleri). Yeni numaralar **0017**'den başlar.
- API-Sports kotası: futbol ve NBA **ayrı**, her biri 100 istek/gün (üretim logu, 2026-11-17). Kod bugün ortak varsayıp çapraz rezerv tutuyor; düzeltme F12a.

---

## 2. Özellik fikirleri (15 adet; F12-F15 Döngü 2'de eklendi)

Efor: **S** ≤ 2 gün, **M** 3-6 gün, **L** > 1 hafta (tek geliştirici). KPI numaraları pazarlama belgesi §7 tablosundandır.

### F1. Sabah NBA Özeti push'u ("Gece ne oldu?")
- **Sorun/fırsat:** S1 kullanıcısı sabah uyanınca sonucu arar. Bugün uygulama ona hiçbir şey söylemiyor; "maç başladı" bildirimi gece 03:00'te gelir ve işe yaramaz. Takip edilen NBA takımı gece oynadıysa sabah 09:45 TSİ'de tek bir kişisel push: skor + en skorer + (varsa) öne çıkan oyuncu satırı. Dokununca maç ekranı ve Box Score açılır.
- **KPI:** KPI 6 (D7 tutma), KPI 7 (NBA payı), KPI 5 (bildirim izni değer kazanır).
- **Efor:** M.
- **API kotası:** **0 istek/gün.** Yalnız DB'deki `matches` ve `box_score` okunur.
- **Veri/DB:** Migration gerekir (`0024`): `notification_prefs.nba_digest`, gönderim kaydı tablosu, cron işi. Yeni Edge Function `send-nba-digest`.
- **Risk:** Box score geç dolarsa push yalnız skorla gider (kabul edilebilir). Bildirim yorgunluğu: günde en fazla 1 push, yalnız takip edilen takım oynadıysa, ayardan kapatılır.

### F2. AI Vitrini + uygulama içi Pro bekleme listesi
- **Sorun/fırsat:** Ana farklılaştırıcı (Türkçe AI analist) bugün hiçbir gerçek kullanıcıya görünmüyor. Geliştirici haftada en fazla 3 büyük maçın gerçek AI raporunu "vitrine" alır. Bu maçlarda AI sekmesi herkese açılır, "Pro (yakında) örneği" etiketiyle. Altında tek CTA: "Pro çıkınca bana haber ver". Kayıt Supabase'de anonim tutulur; e-posta istenmez.
- **KPI:** KPI 8 (Pro bekleme listesi), dolaylı KPI 1 ve 9 (vitrin raporu paylaşılır). Pro talebi segment ve özellik bazında ölçülür (futbol mu NBA mi, hangi ekrandan).
- **Efor:** S-M.
- **API kotası:** **0 istek/gün.** Gemini maliyeti: haftada en fazla 3 rapor (mevcut boru hattı).
- **Veri/DB:** Migration gerekir (`0022`): `matches.ai_showcase`, `match_analyses` için ek okuma politikası, `pro_waitlist` tablosu, iki RPC.
- **Risk:** Pro içeriğini ücretsiz göstermek algılanan değeri düşürebilir; haftalık 3 sınırı bunu dengeler. AI hatası herkese görünür olur; mevcut sayı doğrulaması ve terim bekçisi korunur, F7 (hata bildir) sonra eklenir.

### F3. Paylaş + Davet kodu
- **Sorun/fırsat:** Büyüme WhatsApp'tan geliyor ama uygulama içinden paylaşım yok. (a) Maç ekranında "Paylaş" düğmesi: hazır Türkçe metin (skor, NBA'de en skorer ve FG%, futbolda maçın oyuncusu) + indirme sayfası bağlantısı (`?ref=app-share&k=<davet kodu>`). (b) Ayarlarda anonim, 6 karakterli kişisel davet kodu. Yeni kullanıcı ilk 7 günde kodu girer. Pazarlamanın elle yürüttüğü "Kurucu Destekçi" programı ölçülebilir hâle gelir.
- **KPI:** KPI 9 (davet katsayısı), KPI 10 (WhatsApp paylaşımı), KPI 1 (ziyaret).
- **Efor:** M.
- **API kotası:** **0 istek/gün.**
- **Veri/DB:** Migration gerekir (`0017`): `profiles.invite_code`, `invited_by`, `invited_at` + aktif gün tablosu (F4 ile aynı migration) + RPC'ler. Native modül yok (`Share` React Native çekirdeğinde), OTA ile gelir.
- **Risk:** Sahte davet (aynı kişinin anonim hesap açması). Önlem: davet ancak davet edilen kullanıcı en az 2 ayrı gün aktifse "geçerli" sayılır; hesap 7 günden eskiyse kod girilemez. Vaat yalnız tutulabilir ödülle sınırlı (öncelikli erken erişim, izinli teşekkür listesi).

### F4. Ölçüm temeli: aktif gün kaydı (D1/D7/D30)
- **Sorun/fırsat:** KPI 6 (D7) bugün ölçülemiyor. Uygulama açılışında saatte en fazla 1 kez çağrılan bir RPC, kullanıcının o gün aktif olduğunu yazar (yalnız `user_id` + tarih). Tüm diğer özelliklerin etkisi bununla ölçülür.
- **KPI:** KPI 6'yı ölçülebilir yapar; F1-F3'ün başarı ölçütleri buna dayanır.
- **Efor:** S.
- **API kotası:** 0.
- **Veri/DB:** F3 ile aynı migration (`0017`): `user_activity_days` tablosu + `touch_activity()` RPC + bakımda 120 günden eski satırların silinmesi.
- **Risk:** Düşük. KVKK: gizlilik metnine "kullanım günleri, hizmeti iyileştirmek için 120 gün tutulur" eklenir.

### F5. İlk açılış: takım seçimi (onboarding)
- **Sorun/fırsat:** Aktivasyon (≥1 takım takibi) ve bildirim izni, tutmanın ön koşulu. Bugün kullanıcı takımı kendisi bulmalı. İlk açılışta tek ekran: "Futbol mu, NBA mi, ikisi mi?" → o günlerin maçlarından çıkan takımlardan seçim (`matches` tablosundan, ek istek yok) → bildirim izni, değeri anlatılarak ("Takımın oynayınca haber verelim. Gece NBA maçlarını sabah özetleyelim.").
- **KPI:** KPI 4 (aktivasyon), KPI 5 (bildirim izni).
- **Efor:** S.
- **API kotası:** 0.
- **Veri/DB:** Migration gerekmez (mevcut `toggle_team_follow`, `register_push_token`). Yerel bayrak AsyncStorage'da.
- **Risk:** Takım listesi o haftaki maçlarla sınırlı. Arama yoksa yeni sezon/ara dönemde liste dar kalabilir.

### F6. "Yeni APK var" bandı + Güven ekranı — **Sürüm 4: iptal** (Play güncellemeleri mağazadan gelir; APK kullanıcıları için tek seferlik geçiş bandı §0.8)
- **Sorun/fırsat:** JS değişiklikleri OTA ile gelir ama native değişiklik yeni APK ister. Kullanıcı eski APK'da kalırsa yeni özellikleri (ileride görsel kart, widget) hiç görmez. Ayrıca APK'nın güven sorunu var. (a) `app_config.latest_native_version` istemciye açık bir RPC ile okunur. Kurulu native sürüm eskiyse ana ekranda kapatılabilir bant: "Yeni sürüm hazır. Kurulum anlatımı indirme sayfasında." (b) Ayarlar > "Sürüm ve güvenlik": sürüm, son OTA tarihi, istenen izinler ve nedeni, SHA-256'yı kontrol etme bağlantısı (indirme sayfası).
- **KPI:** KPI 12 (OTA/sürüm erişimi), KPI 2 (güven → indirme oranı, dolaylı).
- **Efor:** S.
- **API kotası:** 0.
- **Veri/DB:** Küçük migration: `get_public_config()` RPC (yalnız beyaz listedeki anahtarlar). Bant metni pazarlamanın yasaklı listesine uyar ("%100 güvenli" yok).
- **Risk:** Düşük.

### F7. AI etiketi + "Hata bildir"
- **Sorun/fırsat:** ESPN'in AI özet hatası emsal (rakip §6). Her AI kartında "AI tarafından üretildi, veriye dayanır" etiketi ve "Hata bildir" düğmesi. Bildirimler bir tabloya düşer. Vitrin (F2) açıldıktan sonra güven için önemli.
- **KPI:** Dolaylı tutma ve güven; vitrin raporlarının kalite ölçümü (hata bildirimi / görüntülenme).
- **Efor:** S.
- **API kotası:** 0.
- **Veri/DB:** Migration: `ai_feedback` (user_id, fixture_id, kind, note ≤ 280 karakter, created_at), RLS: yalnız ekleme.
- **Risk:** Serbest metin kişisel veri içerebilir; not alanı kısa tutulur, 90 gün sonra silinir.

### F8. Takvime ekle
- **Sorun/fırsat:** Takip edilen takımın gelecek maçını tek dokunuşla telefon takvimine ekleme. Google Takvim "şablon" bağlantısı (`https://calendar.google.com/calendar/render?action=TEMPLATE&...`) `Linking.openURL` ile açılır; native modül yok. Takvim uyarısı uygulamayı hatırlatır.
- **KPI:** KPI 6 (tutma), küçük etki.
- **Efor:** S.
- **API kotası:** 0 (fikstür zaten senkronlanıyor; ücretsiz planda yalnız dün/bugün/yarın).
- **Veri/DB:** Migration yok.
- **Risk:** Fikstür ufku kısa (yarın). Saat değişirse takvim kaydı eski kalır.

### F9. Türk oyuncu takibi (NBA oyuncu takibi)
- **Sorun/fırsat:** S1'in özel ilgisi Türk oyuncular (⚠ doğrulanmalı: güncel takımlar). Oyuncuyu takip et → oyuncunun maçı bitip box score dolunca push: "<Oyuncu>: 24 sayı, 11 ribaund, 7 asist (FG% 55)". F1'de basit hâli var (`app_config.nba_featured_players` satırı); tam hâli herhangi bir oyuncunun takibidir.
- **KPI:** KPI 6, KPI 7; paylaşılabilir içerik (F3).
- **Efor:** M.
- **API kotası:** 0. `/players/statistics?game=` yanıtı zaten çekiliyor.
- **Veri/DB:** Migration: `player_follows`. `box_score` öğelerinde oyuncu kimliği yok; `_shared/nbaBox.ts` `toBoxScore` çıktısına `player_id` eklenmeli (API yanıtında var ⚠ doğrulanmalı).
- **Risk:** Oyuncu fotoğrafı kullanılmaz (hak). İsim kamusal bilgi; sorun yok.

### F10. Puan durumu (futbol ligleri + NBA konferans)
- **Sorun/fırsat:** Tüm rakiplerde var, Skor+'ta yok (rakip §10-3). Eksikliği kullanıcıyı başka uygulamaya gönderir.
- **KPI:** KPI 6 (tutma, "her şeyi burada görüyorum").
- **Efor:** M.
- **API kotası:** **Lig başına günde 1 istek.** 4 futbol ligi + NBA = futbol kotasından ~4, NBA kotasından ~1 istek/gün (kotalar ayrı; F12 sonrası daha rahat). Ücretsiz planda güncel sezon `/standings` erişimi doğrulanmadı ⚠ (önce 1 deneme çağrısı).
- **Veri/DB:** Migration: `standings` tablosu + günlük cron.
- **Risk:** Kota baskısı; ücretli plan gelmeden lig sayısı sınırlı tutulmalı.

### F11. Ana ekran widget'ı (takımımın son/sıradaki maçı)
- **Sorun/fırsat:** Günlük görünürlük. Rakiplerde yaygın.
- **KPI:** KPI 6.
- **Efor:** L. Native modül ve yeni APK gerekir; OTA ile gelmez.
- **API kotası:** 0.
- **Veri/DB:** Migration yok.
- **Risk:** Yeni APK'yı kullanıcıya kurdurmak zor (F6 önce gelmeli). Android widget güncelleme sıklığı sınırlı.

### F12. Kota ayrımı + akıllı zamanlayıcı (Döngü 2, koordinatör bulgusu)
- **Sorun/fırsat:** Üretim logları (2026-11-17) futbol ve NBA'in **ayrı** 100 istek/gün kotası olduğunu gösterdi: aynı 30 dakikada futbol sayacı 63 → 59, NBA sayacı 49 → 30. Kod ise kotayı ortak sayıp futbolda 45 isteği NBA'e, NBA'de 20 isteği futbola ayırıyor; iki taraf da gereksiz kısılıyor. Ayrıca cron, maç olsun olmasın 30 dakikada bir API'yi çağırıyor. Öneri: (a) spor başına ayrı kota bekçisi, çapraz rezervlerin kaldırılması; (b) 5 dakikalık "tick" + DB kapısı: başlamaya 5 dk kalan, canlı ya da yeni biten maç yoksa API çağrılmaz; varsa yoklama aralığı `kalan bütçe / kalan pencere` ile 4-30 dk arasında ölçeklenir; başlama, devre arası ve maç sonu anlarında ek yoklama; bütçe darsa takip edilen maçlar önce. Kaynak: rakip araştırması §11.3-11.4.
- **KPI:** Gecikme şikâyeti (rakip §2-4) her kullanıcıda azalır → KPI 6 (D7) ve genel güven. Devre arası raporu ve "maç başladı" bildirimi zamanında gelir (KPI 5'in değeri).
- **Efor:** F12a S (yarım gün, migration yok); F12b M (3-4 gün, `0023`).
- **API kotası:** **Ek istek yok;** aynı bütçe maç saatlerine kaydırılır. Spor başına günlük üst sınır 100 − rezerv.
- **Veri/DB:** F12a yok. F12b: `sync_state` tablosu + cron değişikliği (`0023_smart_scheduler.sql`).
- **Risk:** Senkronun çekirdeğine dokunur; regresyon riski en yüksek öneri. Kota sıfırlanma saati ⚠ ve `/status`'un kotaya sayılıp sayılmadığı ⚠ doğrulanmalı. Pazarlama tazelik iddiasını 1 haftalık log kanıtı olmadan değiştirmez.

### F13. Paylaşılan maç için web önizleme sayfası (Döngü 2)
- **Sorun/fırsat:** F3 paylaşımı alıcıyı doğrudan indirme sayfasına götürür; alıcı önce skoru değil kurulum anlatımını görür. İndirme sayfasında (statik, GitHub Pages) `/m/?id=<fixture_id>` görünümü: maç adı, skor, "Son güncelleme HH:MM", tek satır öne çıkan bilgi ve altında "Skor+'ı kur" bölümü. Veri, zaten herkese açık olan `matches` okuma politikasıyla (anon anahtar APK'da da var) yalnız tek satır ve seçili kolonlarla okunur. Uygulama kuruluysa `skorplus://match/<id>` bağlantısı maçı açar.
- **KPI:** KPI 2 (sayfa → APK indirme oranı), KPI 10 (paylaşımdan gelen ziyaretin kuruluma dönüşümü).
- **Efor:** S-M (depo dışı statik sayfa + F3'te `withRef` yerine `/m/?id=` bağlantısı).
- **API kotası:** 0 (Supabase okuması).
- **Veri/DB:** Migration yok. ⚠ Supabase ücretsiz katman çıkış trafiği; sayfa yalnız 1 satır, 10 kolon okur.
- **Risk:** Logo ve resmî marka gösterilmez; skor olgusu dışında veri yeniden yayımlanmaz (API-Sports şartları ⚠). Derin bağlantı Android'de `scheme` ile çalışır, App Links gerektirmez.

### F14. Takip yedeği / taşıma kodu (Döngü 2)
- **Sorun/fırsat:** Oturum anonim; uygulama silinince veya telefon değişince takımlar, takipler ve davet kodu kaybolur (pazarlama SSS bunu dürüstçe söylüyor). Android geliştirici doğrulaması 2027'de gelirse doğrulanmamış APK için 24 saat bekleme ve geliştirici modu gibi ek adımlar gelebilir ([9to5Google, Ağu 2026](https://9to5google.com/2026/08/18/google-gradually-rolling-out-androids-advanced-sideloading-ahead-of-developer-verification/), [TechRepublic](https://techrepublic.com/article/news-google-android-sideloading-24-hour-wait)). Yeniden kurulumu zorlaşan bir dağıtımda kullanıcının birikimini korumak tutmayı korur. Öneri: Ayarlar'da "Takiplerimi taşı" → 8 karakterlik, 30 gün geçerli kod; yeni kurulumda kod girilince takım takipleri ve davet ilişkisi yeni hesaba kopyalanır. E-posta veya giriş yok.
- **KPI:** KPI 6 (yeniden kuranların kaybı), güven (SSS'te olumsuz cevabın olumluya dönmesi).
- **Efor:** S-M.
- **API kotası:** 0.
- **Veri/DB:** Migration: `follow_transfers(code pk, user_id, expires_at, used_at)` + `create_follow_transfer()` / `redeem_follow_transfer(p_code)` RPC'leri (`search_path = ''`, deneme sınırı F3'teki gibi).
- **Risk:** Kod ele geçerse takipler (kişisel veri değil, tercih) kopyalanır; kod tek kullanımlık ve süreli. Pro abonelik taşınmaz (gerçek ödeme gelince hesap bağlama ayrı iş).

### F15. Haftalık "Takımının haftası" özeti (Döngü 2)
- **Sorun/fırsat:** Kişisel dönem özetleri (Spotify Wrapped benzeri) spor uygulamalarında paylaşım ve dönüş için kullanılıyor; kanıt satıcı kaynaklı, yön olarak okunmalı ([Airship — OneFootball yıl sonu özeti](https://www.airship.com/blog/how-onefootball-builds-a-habit-of-app-engagement-with-compelling-short-form-content/), [Rover — kişisel sezon özetleri](https://www.rover.io/blog/personalized-wrapped-app-campaigns)). Pazartesi 10:00 TSİ'de takip edilen takımların geçen haftası: futbolda sonuçlar ve en yüksek puanlı oyuncu, NBA'de galibiyet-mağlubiyet ve haftanın en skorer oyuncusu. Uygulama içinde kart + F3 paylaşım metni; push isteğe bağlı ve ayardan kapatılır (haftada en fazla 1).
- **KPI:** KPI 6 (haftalık dönüş), KPI 10 (paylaşım).
- **Efor:** M (F1'in push altyapısını ve `nbaDigest` desenini yeniden kullanır).
- **API kotası:** 0 (DB'deki `matches`, `box_score`, `player_ratings`).
- **Veri/DB:** Küçük migration: `notification_prefs.weekly_recap` + gönderim kaydı. F1 sonrası.
- **Risk:** Bildirim yorgunluğu (F1 ile aynı gün gelmez); verisi eksik haftada kart gösterilmez. "Sezon özeti" iddiası yok; yalnız 7 gün.

### Bilinçli olarak önerilmeyenler
- **Skor tahmini oyunu / "kim kazanır" anketi:** Pazarlamanın yasaklı listesinde "tahmin" var; bahis algısı APK'nın güven sorununu büyütür.
- **Canlı box score, gol bildirimi, baskı alarmı:** Ücretli veri planı gerekir (`api_paid`). Plan gelince ayrıca ele alınır.
- **Highlight/video bağlantısı:** Lisans ve korsan yayın riski.
- **Genel amaçlı sohbet botu:** Maliyetli; AskNBA ile doğrudan çakışır (rakip §10, kaçınılacaklar).

---

## 3. Önceliklendirilmiş backlog (ICE)

> **Sürüm 4 notu:** Geçerli sıralama **§0.6**'dır. Bu tablo Sürüm 2-3 kaydıdır (APK + ücretsiz API varsayımı). Değişenler: F12a yapıldı; F12b yalnız NBA (sıra 8); F10 açıldı (sıra 5); F6 iptal; F13 isteğe bağlı (Play bağlantısı güven sorununu çözer).

ICE = Etki (I) × Güven (C) × Kolaylık (E), her biri 1-10. Kolaylık; efor, migration büyüklüğü ve OTA ile gelip gelmediğine göre verildi. Etki, pazarlamanın 4 haftalık planındaki KPI'lara ve her kullanıcıya dokunup dokunmadığına göre verildi. **Döngü 2:** pazarlama değerlendirmesindeki puan düzeltmeleri (F1, F2, F3) alındı; F12-F15 eklendi.

| Sıra | Özellik | I | C | E | ICE | Efor | Kota/gün | Migration | OTA ile gelir mi |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **F12a Kota ayrımı** (çapraz rezervleri kaldır) — **yapıldı** (GELISTIRMELER 3.31) | 7 | 9 | 9 | **567** | S | 0 ek; kullanılabilir bütçe artar | Yok | Evet (yalnız Edge Function deploy) |
| 2 | **F3 Paylaş + Davet kodu (F4 dahil)** | 9 | 8 | 7 | **504** | M | 0 | 0017 | Evet |
| 3 | **F2 AI Vitrini + bekleme listesi** | 9 | 7 | 8 | **504** | S-M | 0 (Gemini ≤ 3 rapor/hafta) | 0022 | Evet |
| 4 | F4 Ölçüm temeli (aktif gün) | 5 | 9 | 9 | 405 | S | 0 | 0017 (F3 ile) | Evet |
| 5 | F1 Sabah NBA Özeti push'u | 7 | 8 | 7 | 392 | M | 0 | 0024 | Evet (+ Edge Function deploy) |
| 6 | F5 İlk açılış takım seçimi | 7 | 7 | 8 | 392 | S | 0 | Yok | Evet |
| 7 | **F12b Akıllı zamanlayıcı** (DB kapısı + bütçe aralığı + olay anları) — §4.4 uygulamaya hazır | 8 | 7 | 6 | **336** | M | 0 ek; bütçe maç saatlerine kayar | 0023 | Evet (+ Edge Function deploy) |
| 8 | F6 Yeni APK bandı + Güven ekranı | 6 | 7 | 8 | 336 | S | 0 | Küçük | Evet |
| 9 | F13 Paylaşılan maç web önizlemesi | 7 | 6 | 7 | 294 | S-M | 0 | Yok | Depo dışı + OTA |
| 10 | F15 Haftalık "Takımının haftası" | 6 | 6 | 7 | 252 | M | 0 | Küçük | Evet (+ deploy) |
| 11 | F14 Takip yedeği / taşıma kodu | 5 | 7 | 7 | 245 | S-M | 0 | Var | Evet |
| 12 | F7 AI etiketi + Hata bildir | 4 | 7 | 8 | 224 | S | 0 | Küçük | Evet |
| 13 | F8 Takvime ekle (pazarlama: kes) | 4 | 6 | 9 | 216 | S | 0 | Yok | Evet |
| 14 | F9 Türk oyuncu takibi (ertele) | 7 | 6 | 5 | 210 | M | 0 | Var | Evet (+ deploy) |
| 15 | F10 Puan durumu (ertele) | 6 | 5 | 5 | 150 | M | futbol ~4, NBA ~1 | Var | Evet (+ deploy) |
| 16 | F11 Ana ekran widget'ı (ertele) | 6 | 5 | 2 | 60 | L | 0 | Yok | **Hayır, yeni APK** |

**F12 ile F3'ün sıralaması (koordinatör sorusu).** Görüşüm: F12'yi ikiye bölmek.
- **F12a önce gelmeli.** Yarım günlük, migration'sız bir değişiklik. Her kullanıcının verisini hemen iyileştirir: NBA box score geri doldurması ve futbol biten maç detayları artık yanlış rezerv yüzünden beklemez. Risk çok düşük, maliyet 0.
- **F12b, F3'ten sonra gelmeli** (koordinatörün "önce gelsin" görüşünden kısmen ayrılıyorum). Nedenler: (1) F3'ün sabit bir son tarihi var: Hafta 2 yumuşak lansmanından önce paylaşım ve D7 ölçümü hazır olmalı; F4 geç gelirse ilk kohortun verisi kalıcı olarak kaybolur. (2) F12b senkronun çekirdeğine dokunur; 3-4 gün yazım + 24 saat log gözlemi ister. Lansman haftasında senkron regresyonu en pahalı hata olur. (3) F12a, F12b'nin getirisinin bir kısmını zaten sağlar (bütçe iki katına çıkar).
- Ters görüş de makul: lansmanla gelen yeni kullanıcı ilk izlenimi tazelikten alır. Tek geliştirici F3'ü Hafta 1'in ilk yarısında bitirirse F12b Hafta 1 sonunda başlamalı, Hafta 2 içinde yayına girmeli.

**Son yapım sırası (Döngü 2):** **F12a → 0017 (F3+F4) + F5 → 0023 (F12b) → 0022 (F2) → F7 → 0024 (F1)** → F13 → F15 / F14. F6, ilk native değişiklikten hemen önce.

**Notlar:**
- F4 tek başına çekiş yaratmaz ama F1-F3'ün ölçümü için şart; bu yüzden F3'ün migration'ındadır.
- F5 migration istemez; F3 ile aynı OTA'da "yan iş" olarak çıkar (pazarlama değerlendirmesi §1).
- Migration numarası yapım sırasını izler; her migration idempotent ve birbirinden bağımsızdır. 0022 (F2) ve 0024 (F1) birbirinin nesnelerine bağlı değil; 0023 (F12b) yalnız 0001-0016'daki tablolara dayanır.

---

## 4. Geliştirici spesifikasyonları (top-3 + F12)

Ortak ilkeler:
- Üçü de **ücretli servis gerektirmez**, **ek API isteği yapmaz** ve **yeni APK gerektirmez** (yalnız JS + SQL + Edge Function). İstemci tarafı `npm run update:apk` ile OTA gider.
- Her migration, mevcut düzen gibi **idempotent** yazılır ve Supabase SQL Editor'de çalıştırılır. Sıra: migration → `npm run deploy:functions` → `npm run update:apk`. Sıra bozulursa istemci çökmeyecek şekilde yazılır (RPC yoksa sessizce atla).
- Yeni RPC'ler `security definer set search_path = ''` (0015/0016 düzeni; tüm tablo ve fonksiyon adları şemayla yazılır), `revoke ... from public, anon`, `grant ... to authenticated` (anonim oturum da `authenticated` rolündedir). F1 ve F2 taslakları da Döngü 2'de `''`'e çevrildi; adlar zaten `public.` ile yazılı.
- Bölüm sırası tarihî (F1, F2, F3); **yapım sırası §3'tedir** (F12a, F3, F12b, F2, F1).
- Önizleme modu (`EXPO_PUBLIC_PREVIEW_MODE=1`) için `src/lib/data/mockSource.ts` ve ilgili mock dosyalarına karşılıklar eklenir; e2e bunlarla çalışır.

---

### 4.1 F1 Sabah NBA Özeti push'u ("Gece ne oldu?") — migration 0024, yapım sırasında F2'den sonra

#### Kullanıcı hikâyeleri
1. NBA takımı takip eden kullanıcı olarak, takımım gece oynadıysa sabah tek bir bildirimle skoru ve en skoreri görmek istiyorum; uykumu bölmeden.
2. Kullanıcı olarak bu bildirimi Ayarlar'dan kapatabilmek istiyorum.
3. Kullanıcı olarak bildirime dokununca ilgili maçın Box Score sekmesine gitmek istiyorum.
4. Birden fazla takımım oynadıysa tek bildirimde hepsini görmek istiyorum; birden fazla bildirim istemiyorum.
5. (İsteğe bağlı) Öne çıkan oyuncu (ör. Türk oyuncu) oynadıysa onun satırını görmek istiyorum.

#### Ekranlar / UX
- **Push metni** (örnek; takım adları uygulamadaki Türkçe/İngilizce gösterimle aynı):
  - Başlık: `Gece ne oldu? 🏀` — emoji isteğe bağlı; pazarlama tonu "sakin" olduğundan emojisiz de olabilir.
  - Gövde (1 takım): `Rockets 112-105 Lakers. En skorer: J. Smith 31 sayı (FG% 52).`
  - Gövde (2+ takım): `Rockets 112-105 Lakers · Celtics 98-101 Knicks. Ayrıntı Box Score'da.`
  - Öne çıkan oyuncu satırı (varsa, sona): ` · A. Oyuncu: 24 sayı, 11 ribaund, 7 asist.`
  - Box score henüz yoksa yalnız skor gider: `Rockets 112-105 Lakers. Box score hazır olunca maç ekranında.` (pazarlama düzeltmesi: zaman vaadi yok)
  - Basketbol dili zorunlu (sayı, ribaund, asist, FG%); futbol terimi yok. `_shared/sportTerms.ts` bekçisi metne uygulanır.
- **Dokununca:** `data: { fixture_id, kind: 'nba_digest', tab: 'box' }`. `src/lib/notifications.ts` dinleyicisi `tab` parametresini de iletir; `src/app/_layout.tsx` → `router.push('/match/<id>?tab=box')`. `src/app/match/[id].tsx` arama parametresinden ilk sekmeyi seçer (bugün varsayılan `summary`).
- **Ayarlar** (`src/app/settings.tsx`, mevcut bildirim kartı): yeni anahtar `Sabah NBA özeti` — açıklama: "Takip ettiğin NBA takımı gece oynadıysa sabah 09:45 civarı tek bildirim." Varsayılan açık. `set_notification_prefs` yeni parametreyle çağrılır.
- **(Faz 2, isteğe bağlı) Ana ekran kartı** (`src/app/index.tsx`, NBA sporu seçiliyken, TSİ 06:00-14:00 arası): "Gece ne oldu?" kartı, dünkü biten NBA maçlarından takip edilenleri gösterir. Push izni olmayan kullanıcıya da değer verir. Migration gerektirmez (istemci mevcut veriden üretir).

#### Veri modeli + migration taslağı — `supabase/migrations/0024_nba_digest.sql`

```sql
-- Skor+ : Sabah NBA özeti ("Gece ne oldu?") — takip edilen NBA takımı gece oynadıysa günde en fazla 1 push.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0007, 0010, 0011 gerekir.
-- API-Sports kotası: 0 istek (yalnız DB okunur).
-- Sıra: bu dosya → npm run deploy:functions (send-nba-digest eklendi) → npm run update:apk.

-- 1) Bildirim tercihi
alter table public.notification_prefs
  add column if not exists nba_digest boolean not null default true;

-- 2) Gönderim kaydı: aynı kullanıcıya aynı gün ikinci özet gitmez (idempotens)
create table if not exists public.nba_digest_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  digest_date date not null,              -- TSİ günü
  fixture_ids bigint[] not null default '{}',
  sent_at timestamptz not null default now(),
  primary key (user_id, digest_date)
);
alter table public.nba_digest_log enable row level security;
-- İstemci politikası yok: yalnız service role (Edge Function) yazar/okur.

-- 3) Öne çıkan oyuncular (isteğe bağlı satır). Geliştirici doldurur; API'deki yazımla aynı olmalı.
insert into public.app_config (key, value)
values ('nba_featured_players', '[]'::jsonb)
on conflict (key) do nothing;

-- 4) set_notification_prefs: yeni parametre (eski imza düşürülür)
drop function if exists public.set_notification_prefs(boolean, boolean, boolean, boolean, boolean);
create or replace function public.set_notification_prefs(
  p_halftime boolean, p_pressure boolean, p_nba_run boolean, p_red_card boolean,
  p_kickoff boolean, p_nba_digest boolean default true
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  insert into public.notification_prefs
    (user_id, halftime, pressure, nba_run, red_card, kickoff, nba_digest, updated_at)
  values (auth.uid(), p_halftime, p_pressure, p_nba_run, p_red_card, p_kickoff, p_nba_digest, now())
  on conflict (user_id) do update
    set halftime = excluded.halftime, pressure = excluded.pressure, nba_run = excluded.nba_run,
        red_card = excluded.red_card, kickoff = excluded.kickoff,
        nba_digest = excluded.nba_digest, updated_at = now();
end $$;
revoke execute on function public.set_notification_prefs(boolean, boolean, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_notification_prefs(boolean, boolean, boolean, boolean, boolean, boolean) to authenticated;

-- 5) Zamanlama: 06:45 UTC = 09:45 TSİ (son NBA canlı senkronu 06:30 UTC'de biter)
select cron.unschedule(jobid) from cron.job where jobname = 'nba-digest';
select cron.schedule('nba-digest', '45 6 * * *',
  $$ select public.call_edge_function('send-nba-digest', '{}'::jsonb) $$);

-- 6) Bakım: 30 günden eski kayıtları sil (run_maintenance içine eklenecek satır)
--   delete from public.nba_digest_log where digest_date < (now() at time zone 'Europe/Istanbul')::date - 30;
```

> Not: `set_notification_prefs`'in eski 5 parametreli imzası düşürülür. Eski istemci (OTA almamış) 5 parametreyle çağırırsa PostgREST, varsayılan değerli 6. parametre sayesinde yeni fonksiyonu bulur ⚠ doğrulanmalı (PostgREST adlandırılmış parametre eşleşmesi). Bulamazsa istemci hatayı yutmalı; OTA açılışta zaten iner.

#### Edge Function / RPC değişiklikleri
- **Yeni saf modül `supabase/functions/_shared/nbaDigest.ts`** (birim testlenebilir, I/O yok):
  ```ts
  export type DigestGame = { fixture_id: number; home_team: string; away_team: string;
    home_team_id: number; away_team_id: number; home_score: number | null; away_score: number | null;
    box_score: BoxPlayer[] | null };
  export function istanbulDigestWindow(nowMs: number): { fromIso: string; toIso: string; dayKey: string };
  //   pencere: dünkü TSİ 12:00 → bugünkü TSİ 12:00 (gece maçlarını kapsar)
  export function topScorer(box: BoxPlayer[] | null): { name: string; points: number; fgPct: number | null } | null;
  export function featuredLines(games: DigestGame[], featured: string[]): string[];  // eşleşme: büyük/küçük harf ve aksan duyarsız
  export function buildDigest(games: DigestGame[], followedTeamIds: Set<number>, featured: string[]):
    { title: string; body: string; fixtureIds: number[]; primaryFixtureId: number } | null;
  //   takip edilen takımın maçı yoksa null; gövde ≤ 178 karakter (Android bildirim kesilmesi), taşarsa "+N maç" ile kısalt
  ```
- **Yeni Edge Function `supabase/functions/send-nba-digest/index.ts`:**
  1. `check_internal_secret` ile çağıranı doğrula (diğer cron fonksiyonlarındaki desen).
  2. `matches` → `sport_type='nba'`, `status_short in ('FT','AOT')` ⚠ (NBA bitiş kodlarını `nbaApi.ts` ile eşleştir), `kickoff_at` pencere içinde.
  3. Bu maçlardaki takım kimlikleriyle `team_follows` (sport_type='nba') → kullanıcı listesi.
  4. `notification_prefs.nba_digest = false` olanları çıkar (satırı olmayan = açık; `notify.ts` ile aynı kural).
  5. `nba_digest_log`'da bugünün kaydı olanları çıkar.
  6. Kullanıcı başına `buildDigest`, metne `sportTerms` bekçisi, `push_tokens` → `sendExpoPush` (toplu). Geçersiz token'ları sil.
  7. Gönderim başarılı olan kullanıcılar için `nba_digest_log` ekle (`on conflict do nothing`).
  8. Çıktı: `{ games, users, sent, skipped_no_box }` → log.
  - Push gönderim kodu `notify.ts`'teki token/prefs mantığını tekrar etmemeli: `notify.ts`'e `notifyUsers(userIds, kind, title, body, data)` çıkarılır, `notifyFollowers` onu kullanır (davranış aynı kalır).
  - `NotifyKind` tipine `'nba_digest'` eklenir.
- **`sync-nba` (isteğe bağlı, 0 ek kota):** biten maç zenginleştirme sırası, takip edilen takımların maçlarını öne alacak şekilde sıralanır (`team_follows`'ta takipçisi olan maçlar önce). Böylece `NBA_MAX_ENRICH=3` sınırında sabah özetinin box score'u dolu olur. İstek sayısı değişmez.
- **`package.json` `deploy:functions`** betiğine `send-nba-digest` eklenir.
- **İstemci:** `src/lib/data/types.ts` ve `supabaseSource.ts` bildirim tercihlerine `nba_digest`; `settings.tsx` yeni anahtar; `notifications.ts` + `_layout.tsx` + `match/[id].tsx` `tab` parametresi.

#### Kabul kriterleri
1. Takip edilen NBA takımı gece oynadıysa kullanıcı 09:45 TSİ (±5 dk) civarı **tam 1** bildirim alır; fonksiyon iki kez çalıştırılsa da ikinci bildirim gitmez.
2. Takip edilen takım oynamadıysa bildirim gitmez.
3. `nba_digest=false` kullanıcı bildirim almaz; ayar uygulama silinip kurulmadıkça kalıcıdır (sunucuda).
4. Box score varsa gövdede en skorer ve FG% vardır; yoksa yalnız skor ve "Box score hazır olunca maç ekranında." ifadesi.
5. Metinde futbol terimi yoktur (`sportTerms` testi). Metinde "canlı", "anlık" yoktur.
6. Bildirime dokununca ilgili maç Box Score sekmesinde açılır.
7. API-Sports istek sayacı fonksiyon çalışınca **artmaz** (kota bekçisi logu).
8. Ayarlar'da yeni anahtar görünür ve değiştirilince `set_notification_prefs` 6 parametreyle çağrılır.

#### Test planı
- **Deno birim (`supabase/functions/tests/nbaDigest.test.ts`):**
  - `istanbulDigestWindow`: 2026-11-18T06:45Z → pencere 2026-11-17T09:00Z..2026-11-18T09:00Z; yaz/kış saati yok (TSİ sabit UTC+3).
  - `buildDigest`: takip edilen maç yok → `null`; 1 maç + box → en skorer ve FG% içerir; 3 maç → tek gövde, ≤178 karakter, taşma "+N maç"; box null → "hazır olunca maç ekranında".
  - `topScorer`: eşit sayıda dakika/FG% ile kararlı sıralama; `fga=0` → FG% `null`.
  - `featuredLines`: "Şengün" / "Sengun" aksan duyarsız eşleşme; oynamayan (0 dk) oyuncu satırı yok.
  - Çıktı metni `sportTerms` bekçisinden temiz geçer.
- **Deno birim (`notify` refaktörü):** `notifyUsers` boş listede 0 döner (admin istemcisi sahte nesneyle).
- **E2E (`e2e/digest_ui.mjs`, önizleme modu):**
  - Ayarlar'da "Sabah NBA özeti" anahtarı görünür, kapatılıp açılır, sayfa yenilenince durum korunur (mock).
  - `/match/<nba-mock-id>?tab=box` doğrudan Box Score sekmesini açar.
  - `npm run e2e` betiğine eklenir.
- **Elle uçtan uca (gerçek proje):** test hesabıyla bir NBA takımı takip et → SQL Editor'den `select public.call_edge_function('send-nba-digest','{}')` → telefonda bildirim → tekrar çalıştır → ikinci bildirim yok → `nba_digest_log` satırı var.

#### Kullanıcının elle yapacakları
1. `supabase/migrations/0024_nba_digest.sql` dosyasını SQL Editor'de çalıştır.
2. `run_maintenance()` fonksiyonuna 30 günlük temizlik satırını ekleyen küçük migration'ı çalıştır (veya 0024 içine dahil et).
3. (İsteğe bağlı) `update public.app_config set value='["<API yazımıyla oyuncu adı>"]' where key='nba_featured_players';`
4. `npm run deploy:functions` (betikte `send-nba-digest` olduğundan emin ol).
5. `npm run update:apk` (OTA).
6. Ertesi sabah `cron.job_run_details` ve fonksiyon loglarını kontrol et.

---

### 4.2 F2 AI Vitrini + uygulama içi Pro bekleme listesi — migration 0022

#### Kullanıcı hikâyeleri
1. Ücretsiz kullanıcı olarak, Skor+'ın "Türkçe AI analiz" dediği şeyin gerçek bir örneğini uygulamada görmek istiyorum; satın almadan.
2. Ücretsiz kullanıcı olarak, beğenirsem tek dokunuşla "Pro çıkınca haber ver" demek istiyorum; e-posta vermeden.
3. Geliştirici olarak, haftada en fazla 3 maçı vitrine alabilmek ve kaç kişinin hangi ekrandan, hangi spor için listeye girdiğini görmek istiyorum.
4. Kullanıcı olarak listeden çıkabilmek istiyorum; hesabımı silersem kaydım da silinsin.

#### Ekranlar / UX
- **Ana ekran** (`src/app/index.tsx`): liste üstünde, son 7 günde vitrine alınmış maç varsa ince bant: `Haftanın açık AI analizi: <Ev> – <Deplasman>`. Dokununca `/match/<id>?tab=ai`. Bant kapatılabilir (yerel, AsyncStorage).
- **Maç satırı** (`src/components/MatchRow.tsx`): vitrin maçında küçük rozet `AI açık`.
- **Maç ekranı AI sekmesi** (`src/app/match/[id].tsx`): `match.ai_showcase === true` ise `PaywallGate` yerine doğrudan `AnalysisCards` (futbol) veya `NbaAnalysisCards` (NBA) gösterilir. Üstte sabit etiket: `Pro (yakında) örneği · Bu analiz herkese açık` ve `AI tarafından üretildi, veriye dayanır.` Altta tek CTA kartı:
  - Listede değilse: düğme `Pro çıkınca bana haber ver` → `join_pro_waitlist('showcase', sport)`.
  - Listedeyse: `Listedesin. Pro çıktığında bildirim göndereceğiz.` + küçük bağlantı `Listeden çık`.
  - Bildirim izni yoksa ek satır: `Bildirim iznin kapalı. Duyuruyu Telegram kanalından da takip edebilirsin.`
- **Paywall** (`src/app/paywall.tsx`) ve **PaywallGate** (`src/components/analysis/PaywallGate.tsx`): bugünkü "Pro abonelik çok yakında" metninin yanına aynı CTA (`source='paywall'` / `'ai_tab'`). Fiyat taslakları kullanıcıya gösterilmez (pazarlama kuralı).
- **Ayarlar**: "Pro bekleme listesi" satırı (durum + çık).
- Vitrin dışı maçlarda AI sekmesi bugünkü gibi kilitli kalır. Ücretsiz özellik Pro'ya taşınmaz; Pro özelliği sınırlı biçimde ücretsiz gösterilir (rakip §2-3 dersi).

#### Veri modeli + migration taslağı — `supabase/migrations/0022_ai_showcase.sql`

```sql
-- Skor+ : AI vitrini (haftada en fazla 3 maçın AI raporu herkese açık) + uygulama içi Pro bekleme listesi.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir. 0001, 0011 gerekir. API kotası: 0.

-- 1) Vitrin işareti
alter table public.matches add column if not exists ai_showcase boolean not null default false;
alter table public.matches add column if not exists ai_showcase_at timestamptz;
create index if not exists matches_ai_showcase_idx on public.matches (ai_showcase_at desc) where ai_showcase;

-- 2) match_analyses: vitrin maçlarının raporu her oturumlu kullanıcıya açık (mevcut Pro politikasına EK)
drop policy if exists "match_analyses: vitrin maçları herkese açık" on public.match_analyses;
create policy "match_analyses: vitrin maçları herkese açık"
  on public.match_analyses for select to authenticated
  using (exists (select 1 from public.matches m
                 where m.fixture_id = match_analyses.fixture_id and m.ai_showcase));

-- 3) Vitrine alma: yalnız SQL Editor / service role. Haftalık 3 sınırı veritabanında.
create or replace function public.set_ai_showcase(p_fixture_id bigint, p_on boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  if p_on then
    if not exists (select 1 from public.match_analyses where fixture_id = p_fixture_id) then
      return 'no_analysis';  -- önce test hesabıyla raporu üret
    end if;
    select count(*) into v_count from public.matches
     where ai_showcase and ai_showcase_at > now() - interval '7 days' and fixture_id <> p_fixture_id;
    if v_count >= 3 then return 'weekly_limit'; end if;
    update public.matches set ai_showcase = true, ai_showcase_at = now() where fixture_id = p_fixture_id;
  else
    update public.matches set ai_showcase = false where fixture_id = p_fixture_id;
  end if;
  return 'ok';
end $$;
revoke execute on function public.set_ai_showcase(bigint, boolean) from public, anon, authenticated;

-- 4) Bekleme listesi (anonim; e-posta yok)
create table if not exists public.pro_waitlist (
  user_id uuid primary key references auth.users (id) on delete cascade,
  source text not null check (source in ('showcase', 'paywall', 'ai_tab', 'settings')),
  sport text check (sport in ('football', 'nba')),
  showcase_fixture_id bigint,
  created_at timestamptz not null default now()
);
alter table public.pro_waitlist enable row level security;
drop policy if exists "pro_waitlist: kendi kaydını okur" on public.pro_waitlist;
create policy "pro_waitlist: kendi kaydını okur"
  on public.pro_waitlist for select to authenticated using (user_id = auth.uid());

create or replace function public.join_pro_waitlist(p_source text, p_sport text, p_fixture_id bigint default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  insert into public.pro_waitlist (user_id, source, sport, showcase_fixture_id)
  values (auth.uid(), p_source, p_sport, p_fixture_id)
  on conflict (user_id) do nothing;   -- ilk kaynak korunur (atıf için)
  return true;
end $$;

create or replace function public.leave_pro_waitlist()
returns boolean language sql security definer set search_path = '' as $$
  delete from public.pro_waitlist where user_id = auth.uid() returning true;
$$;

revoke execute on function public.join_pro_waitlist(text, text, bigint) from public, anon;
revoke execute on function public.leave_pro_waitlist() from public, anon;
grant execute on function public.join_pro_waitlist(text, text, bigint) to authenticated;
grant execute on function public.leave_pro_waitlist() to authenticated;

-- 5) Geliştirici raporu (SQL Editor'de):
--   select source, sport, count(*) from public.pro_waitlist group by 1, 2 order by 3 desc;
--   select showcase_fixture_id, count(*) from public.pro_waitlist where source='showcase' group by 1;
```

> Güvenlik notu: Vitrin politikası yalnız `match_analyses` için. Devre arası (`match_halftime_reports`) ve maç önü (`match_previews`) raporları kapsam dışıdır; istenirse aynı desenle ayrı politika eklenir.

#### Edge Function / RPC değişiklikleri
- Edge Function değişikliği **yok**. Rapor üretimi mevcut `request_match_analysis` → `generate-analysis` hattıyla, geliştiricinin test hesabından (Pro simülasyonu) yapılır.
- İstemci:
  - `src/lib/data/supabaseSource.ts`: `MATCH_COLUMNS`'a `ai_showcase`; yeni `getShowcaseMatches()` (`ai_showcase=true`, `ai_showcase_at` son 7 gün); `getWaitlistStatus()`, `joinWaitlist()`, `leaveWaitlist()`. Analiz okuma fonksiyonu vitrin maçında da çağrılır (RLS izin verir).
  - `src/lib/data/types.ts` / `src/lib/types.ts`: `Match.ai_showcase?: boolean`.
  - Yeni hook `src/hooks/useWaitlist.ts`.
  - `match/[id].tsx`, `PaywallGate.tsx`, `paywall.tsx`, `index.tsx`, `MatchRow.tsx`, `settings.tsx`: yukarıdaki UX.
  - RPC yoksa (migration çalışmamışsa) CTA gizlenir, hata kullanıcıya gösterilmez.
- Gizlilik metni (`src/lib/legal.ts`): "Pro bekleme listesine katılırsan hesap kimliğin ve katıldığın ekran kaydedilir; e-posta istenmez. Listeden çıkınca veya hesabını silince kayıt silinir."

#### Kabul kriterleri
1. Pro olmayan kullanıcı vitrin maçında AI raporunu tam görür; vitrin dışı maçta kilit bugünkü gibi durur.
2. Vitrin raporunda "Pro (yakında) örneği" ve "AI tarafından üretildi" etiketleri her zaman görünür.
3. `set_ai_showcase` 7 gün içinde 4. maç için `weekly_limit` döner; raporu olmayan maç için `no_analysis` döner; `authenticated` rolü çağıramaz.
4. "Pro çıkınca bana haber ver" tek dokunuşla kaydeder; ikinci dokunuş çift kayıt oluşturmaz; durum yeniden açılışta korunur.
5. "Listeden çık" kaydı siler. Hesap silme (`delete_my_account`) kaydı siler (cascade).
6. Hiçbir ekranda fiyat, "abone ol" veya "satın al" yazmaz.
7. Ana ekran bandı yalnız son 7 günde vitrin varsa görünür ve kapatılabilir.

#### Test planı
- **Deno birim:** saf yardımcı `src/lib/showcase.ts` → `isShowcaseActive(match, nowMs)` (7 gün sınırı) ve `waitlistCopy(state, hasPush)` (metinlerde yasaklı kelime yok: "abone ol", "fiyat", "TL", "kesin", "garanti") → `supabase/functions/tests/showcase.test.ts`.
- **SQL elle kontrol (SQL Editor, test projesi veya dal):**
  - 3 maçı vitrine al → 4. `weekly_limit`.
  - Pro olmayan test kullanıcısı JWT'siyle `select * from match_analyses where fixture_id=<vitrin>` → 1 satır; vitrin dışı → 0 satır.
  - `select public.set_ai_showcase(1, true)` `authenticated` rolüyle → izin hatası.
- **E2E (`e2e/showcase_ui.mjs`, önizleme modu; mock'a bir vitrin maçı eklenir):**
  - Ana ekranda bant görünür → dokun → AI sekmesi açık, etiketler var.
  - "Pro çıkınca bana haber ver" → "Listedesin" durumu → "Listeden çık" → düğme geri gelir.
  - Vitrin dışı maçta `PaywallGate` görünür ve aynı CTA vardır.
  - Sayfa metninde "abone ol" ve "₺/TL" geçmez.
  - Mevcut `ht_ui.mjs`, `alerts_ui.mjs` Pro kilidi senaryoları bozulmaz (regresyon).

#### Kullanıcının elle yapacakları
1. `0022_ai_showcase.sql` dosyasını SQL Editor'de çalıştır.
2. `npm run update:apk` (OTA). Edge Function deploy gerekmez.
3. Her hafta: test hesabıyla büyük maçın AI raporunu üret, raporu oku ve sayıları kontrol et, sonra `select public.set_ai_showcase(<fixture_id>, true);`.
4. Haftalık KPI tablosuna `pro_waitlist` sorgusunu ekle.
5. Pro çıktığında listeye duyuru push'u için ayrı, küçük bir fonksiyon yazılır (bugün kapsam dışı).

---

### 4.3 F3 Paylaş + Davet kodu, F4 aktif gün dahil — migration 0017, ilk özellik (F12a'dan sonra) — **uygulamaya hazır**

> **Uygulama durumu (2026-11-18, kalite döngüsü 5): F3 + F4 YAPILDI, prod'a uygulanmadı.** `supabase/migrations/0017_growth_invites.sql` (bu SQL + 2 ek: `user_activity_days` tablosundan anon/authenticated yetkileri kaldırıldı; `redeem_invite` biçim dışı kodu sorgulamadan hatalı deneme sayar), `src/lib/share.ts` (+ `matchLink`, tasarım tur 2 §D-1), `src/lib/growth.ts` (`getDownloadUrl()`), `src/hooks/useInvite.ts`, `ShareButton.tsx`, `InviteCard.tsx`, Deno `tests/share.test.ts` (16), `e2e/share_ui.mjs`. Spesifikasyondan farklar: paylaşım bağlantısı `withRef` yerine `matchLink` (`/m/?id=…&ref=app-share&k=…`); `get_my_invite` ağ hatasında `null` yerine hata fırlatır (kart içinde "Davet bilgisi yüklenemedi" bandı; yalnız RPC yoksa `null`); `redeemMessage` ek alanlar (`result`, `tone`, `closeInput`) döndürür. Bekleyen: 0017'yi SQL Editor'de çalıştırma + SQL kontrol listesi, EAS'ta `EXPO_PUBLIC_DOWNLOAD_URL`, hukukçu kontrolü (gizlilik/KVKK), indirme sitesinde `/m/` yönlendirmesi. Ayrıntı: GELISTIRMELER.txt 3.32.
> Durum: Döngü 2'de mevcut koda göre yeniden yazıldı. Okunan kaynaklar: `src/app/_layout.tsx`, `src/app/match/[id].tsx`, `src/app/settings.tsx`, `src/lib/supabase.ts`, `src/lib/data/{types,supabaseSource,mockSource,index}.ts`, `src/lib/{types,status,days,legal,errors}.ts`, `src/hooks/useApiPaid.ts`, `src/theme.ts`, `src/components/ui.tsx`, `supabase/migrations/0001`, `0012`, `0015_quality.sql`, `0016_quality3.sql`, `supabase/functions/_shared/sportTerms.ts`, `e2e/account_ui.mjs`, `e2e/nba_ui.mjs`, `docs/tasarim-rehberi.md` §3.6, §3.11, §5.1, §5.3, §6, ve aşağıdaki "Pazarlama değerlendirmesi".
> Migration: **`0017_growth_invites.sql`** (son dosya `0016_quality3.sql`). Native modül yok; tamamı OTA ile gider.

#### Döngü 1'den değişenler (karar özeti)
| Konu | Eski | Yeni | Neden |
|---|---|---|---|
| Canlı maçta Paylaş | "Son güncelleme" ile gösterilir | **Gizli** | Pazarlama değerlendirmesi §2; tasarım §5.1 |
| Futbol öne çıkan satır | `Maçın oyuncusu: X (8,4)` | `En yüksek puan: X (8,4)` | Resmî ödül imasi (pazarlama §8) |
| Davet ödülü metni | "öncelikli erken erişim" | "Pro satışa açılmadan önce denemeye davet edilirsin." | Tutulabilir vaat (pazarlama §4.4) |
| RPC'ler | `get_my_invite_code` + `my_invite_stats` | Tek `get_my_invite()` (kod + sayaç + durum) | Ayarlar ekranı için tek istek |
| `search_path` | `public` | `''` (boş), tüm adlar şemayla | 0015/0016 düzeni |
| Bakım | `run_maintenance()` yeniden tanımı | Ayrı cron işi `skor-growth-cleanup` | 0015'teki uzun fonksiyonu kopyalamamak |
| Deneme sınırı | yok | Hesap başına günde 10 hatalı kod | Kod tahmini (brute force) |
| Örnek kod | `ABC123` | `ABC234` | Alfabede `1`, `0`, `I`, `L`, `O` yok |

#### Kullanıcı hikâyeleri
1. Kullanıcı olarak biten ya da başlamamış bir maçı WhatsApp'ta hazır Türkçe metinle paylaşmak istiyorum.
2. Kullanıcı olarak kendi davet kodumu görmek, davetiye göndermek ve kaç kişinin kodumla geldiğini görmek istiyorum.
3. Yeni kullanıcı olarak ilk 7 günde beni davet edenin kodunu girebilmek istiyorum. Zorunlu değil.
4. Geliştirici olarak hangi davetlerin gerçek olduğunu (davetli ≥ 2 farklı gün aktif) ve D1/D7 tutmayı SQL Editor'den ölçmek istiyorum.

#### Dokunulacak dosyalar
| Dosya | Durum | Değişiklik |
|---|---|---|
| `supabase/migrations/0017_growth_invites.sql` | yeni | Aşağıdaki SQL. |
| `src/lib/share.ts` | yeni, **saf** (React Native içe aktarmaz; Deno test eder) | Paylaşım ve davet metinleri, kod doğrulama, sonuç mesajları. |
| `src/lib/growth.ts` | yeni | `DOWNLOAD_URL`, `startActivityTracking()`. |
| `src/lib/data/types.ts` | değişir | `InviteState`, `RedeemResult`; `DataSource`'a 3 metot. |
| `src/lib/data/supabaseSource.ts` | değişir | 3 metot (RPC). |
| `src/lib/data/mockSource.ts` | değişir | 3 metot + `deleteAccount` sıfırlaması. |
| `src/hooks/useInvite.ts` | yeni | Oturum başı önbellekli davet durumu + `redeem`. |
| `src/components/ShareButton.tsx` | yeni | Başlık sağı "Paylaş" düğmesi. |
| `src/components/InviteCard.tsx` | yeni | Ayarlar davet kartı (tasarım §5.3). |
| `src/app/match/[id].tsx` | değişir | `Stack.Screen options.headerRight`. |
| `src/app/settings.tsx` | değişir | `<FollowedTeams />` ile `<AccountCard />` arasına `<InviteCard />`. |
| `src/app/_layout.tsx` | değişir | `startActivityTracking()` efekti. |
| `src/lib/legal.ts` | değişir | Gizlilik + KVKK: kullanım günleri, davet bilgisi, saklama süresi. |
| `supabase/functions/tests/share.test.ts` | yeni | Deno birim testleri. |
| `e2e/share_ui.mjs` | yeni | Playwright senaryosu. |
| `package.json` | değişir | `e2e` betiğine `&& node e2e/share_ui.mjs`. |
| `e2e/README.md` | değişir | Tabloya `share_ui.mjs` satırı. |
| `.env.example` | değişir | `EXPO_PUBLIC_DOWNLOAD_URL=` satırı (değer yok). |

#### Migration — `supabase/migrations/0017_growth_invites.sql` (son hâl)

```sql
-- Skor+ : F3 + F4 — aktif gün kaydı (D1/D7 ölçümü) ve anonim davet kodu.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0001–0016 gerekir.
-- Sıra serbest: RPC'ler yoksa istemci davet kartını ve paylaşım bağlantısındaki kodu gizler,
-- touch_activity hatasını yutar. Edge Function değişikliği yok. API-Sports kotası: 0.
-- KVKK: yalnız anonim hesap kimliği, TSİ günü ve davet ilişkisi. E-posta / telefon / cihaz bilgisi yok.

-- ─────────────────────────────────────────────── 1) aktif gün kaydı (F4)
create table if not exists public.user_activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,                                   -- Europe/Istanbul günü
  primary key (user_id, day)
);
create index if not exists user_activity_days_day_idx on public.user_activity_days (day);
alter table public.user_activity_days enable row level security; -- politika yok: yalnız RPC'ler

-- Dönüş yok. Oturumsuz çağrı sessizce hiçbir şey yapmaz. Günde kullanıcı başına en fazla 1 satır.
create or replace function public.touch_activity()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.user_activity_days (user_id, day)
  values (auth.uid(), (now() at time zone 'Europe/Istanbul')::date)
  on conflict do nothing;
end $$;
revoke execute on function public.touch_activity() from public, anon;
grant execute on function public.touch_activity() to authenticated;

-- ─────────────────────────────────────────────── 2) davet alanları (F3)
-- profiles'ta istemci için yalnız "kendi kaydını okur" politikası var (0001); insert/update politikası
-- yok. Bu alanları yalnız aşağıdaki security definer RPC'ler yazar.
alter table public.profiles add column if not exists invite_code text;
alter table public.profiles add column if not exists invited_by uuid;
alter table public.profiles add column if not exists invited_at timestamptz;
alter table public.profiles add column if not exists invite_fail_count smallint not null default 0;
alter table public.profiles add column if not exists invite_fail_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_invited_by_fkey') then
    alter table public.profiles add constraint profiles_invited_by_fkey
      foreign key (invited_by) references auth.users (id) on delete set null;
  end if;
  -- Alfabe: ABCDEFGHJKMNPQRSTUVWXYZ23456789 (0, 1, I, L, O yok)
  if not exists (select 1 from pg_constraint where conname = 'profiles_invite_code_format') then
    alter table public.profiles add constraint profiles_invite_code_format
      check (invite_code is null or invite_code ~ '^[A-HJKMNP-Z2-9]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_not_self_invited') then
    alter table public.profiles add constraint profiles_not_self_invited
      check (invited_by is null or invited_by <> id);
  end if;
end $$;

create unique index if not exists profiles_invite_code_key
  on public.profiles (invite_code) where invite_code is not null;
create index if not exists profiles_invited_by_idx
  on public.profiles (invited_by) where invited_by is not null;

-- Yardımcı: 6 karakterlik rastgele kod (güvenlik anahtarı değildir; benzersizlik indeksle sağlanır)
create or replace function public.invite_random_code()
returns text language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
    from generate_series(1, 6);
$$;
revoke execute on function public.invite_random_code() from public, anon, authenticated;

-- Ayarlar kartının tek isteği: kod (yoksa üretir) + sayaç + kod girme hakkı.
-- active = davetlinin user_activity_days'te en az 2 farklı günü var.
-- can_redeem = henüz davet kodu girmemiş ve hesap 7 günden yeni.
create or replace function public.get_my_invite()
returns table (code text, total int, active int, invited boolean, can_redeem boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_try int := 0;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  select p.invite_code into v_code from public.profiles p where p.id = v_uid;
  while v_code is null loop
    v_try := v_try + 1;
    if v_try > 10 then
      raise exception 'invite_code_unavailable';
    end if;
    begin
      update public.profiles p set invite_code = public.invite_random_code()
       where p.id = v_uid and p.invite_code is null;
    exception when unique_violation then
      null; -- çakışma: yeni kodla tekrar dene
    end;
    select p.invite_code into v_code from public.profiles p where p.id = v_uid;
  end loop;

  return query
  select v_code,
         (select count(*)::int from public.profiles i where i.invited_by = v_uid),
         (select count(*)::int from public.profiles i
           where i.invited_by = v_uid
             and (select count(*) from public.user_activity_days d where d.user_id = i.id) >= 2),
         p.invited_by is not null,
         p.invited_by is null and p.created_at >= now() - interval '7 days'
    from public.profiles p
   where p.id = v_uid;
end $$;
revoke execute on function public.get_my_invite() from public, anon;
grant execute on function public.get_my_invite() to authenticated;

-- Dönüş: 'ok' | 'already' | 'too_late' | 'invalid' | 'self' | 'not_allowed' | 'rate_limited' | 'unauthenticated'
-- Kod büyük/küçük harf ve boşluk duyarsız. Hatalı kod hesap başına 24 saatte en fazla 10 kez denenir.
create or replace function public.redeem_invite(p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_me public.profiles%rowtype;
  v_inviter public.profiles%rowtype;
  v_code text;
begin
  if v_uid is null then
    return 'unauthenticated';
  end if;
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  select * into v_me from public.profiles where id = v_uid for update;

  if v_me.invited_by is not null then
    return 'already';
  end if;
  if v_me.created_at < now() - interval '7 days' then
    return 'too_late';
  end if;
  if v_me.invite_fail_count >= 10 and v_me.invite_fail_at > now() - interval '24 hours' then
    return 'rate_limited';
  end if;

  v_code := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  if v_code = v_me.invite_code then
    return 'self';
  end if;

  select * into v_inviter from public.profiles where invite_code = v_code;
  if not found then
    update public.profiles
       set invite_fail_count = case when invite_fail_at > now() - interval '24 hours'
                                    then invite_fail_count + 1 else 1 end,
           invite_fail_at = now()
     where id = v_uid;
    return 'invalid';
  end if;
  -- Karşılıklı davet (A→B, B→A) sayılmaz
  if v_inviter.invited_by = v_uid then
    return 'not_allowed';
  end if;

  update public.profiles
     set invited_by = v_inviter.id, invited_at = now(), invite_fail_count = 0, invite_fail_at = null
   where id = v_uid;
  return 'ok';
end $$;
revoke execute on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;

-- ─────────────────────────────────────────────── 3) geliştirici raporları (yalnız SQL Editor)
-- Hiçbir istemci rolüne açık değil (PostgREST'ten çağrılamaz).
-- Örnek: select public.admin_growth_report('2026-11-20', '2026-11-26');
create or replace function public.admin_growth_report(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with c as (
    select p.id, (p.created_at at time zone 'Europe/Istanbul')::date as d0, p.invited_by
      from public.profiles p
     where (p.created_at at time zone 'Europe/Istanbul')::date between p_from and p_to
  )
  select jsonb_build_object(
    'cohort', count(*),
    'invited', count(*) filter (where c.invited_by is not null),
    'd1', count(*) filter (where exists (
            select 1 from public.user_activity_days a where a.user_id = c.id and a.day = c.d0 + 1)),
    'd7', count(*) filter (where exists (
            select 1 from public.user_activity_days a
             where a.user_id = c.id and a.day between c.d0 + 7 and c.d0 + 13)),
    'note', 'd7 = kurulumdan sonraki 7-13. günlerden birinde aktif. Kohort bitişinden en az 14 gün sonra yorumlayın.'
  )
  from c;
$$;
revoke execute on function public.admin_growth_report(date, date) from public, anon, authenticated;

-- Kurucu Destekçi adayları: kodun yalnız ilk 3 karakteri (Telegram sıralaması için)
create or replace function public.admin_invite_leaderboard()
returns table (code_prefix text, total int, active int)
language sql stable security definer set search_path = '' as $$
  select left(inv.invite_code, 3),
         count(*)::int,
         count(*) filter (where (select count(*) from public.user_activity_days d where d.user_id = p.id) >= 2)::int
    from public.profiles p
    join public.profiles inv on inv.id = p.invited_by
   group by inv.invite_code
   order by 3 desc, 2 desc;
$$;
revoke execute on function public.admin_invite_leaderboard() from public, anon, authenticated;

-- ─────────────────────────────────────────────── 4) saklama: kullanım günleri 120 gün
-- run_maintenance() (0015) yeniden tanımlanmaz; ayrı ve küçük bir cron işi.
select cron.unschedule('skor-growth-cleanup')
 where exists (select 1 from cron.job where jobname = 'skor-growth-cleanup');
select cron.schedule('skor-growth-cleanup', '40 4 * * *',
  $$ delete from public.user_activity_days
      where day < (now() at time zone 'Europe/Istanbul')::date - 120 $$);
```

> Notlar: `delete_my_account()` `auth.users` satırını siler; `profiles` ve `user_activity_days` cascade ile gider, bu hesabın davet ettiklerinde `invited_by` NULL olur. `profiles.created_at` 0001'de var. ⚠ Doğrulanmalı: Supabase anonim oturum açma hız sınırı (IP başına saatlik). Sahte davet riski bu sınıra ve "≥ 2 farklı gün aktif" kuralına dayanır.

#### RPC imzaları (istemci sözleşmesi)
| RPC | Parametre | Dönüş (supabase-js) | Hata |
|---|---|---|---|
| `touch_activity` | – | `null` | Yok sayılır (konsola uyarı). |
| `get_my_invite` | – | `[{ code: string, total: number, active: number, invited: boolean, can_redeem: boolean }]` (dizi, tek satır) | Hata veya boş dizi → `null` (kart gizlenir). |
| `redeem_invite` | `{ p_code: string }` | `'ok' \| 'already' \| 'too_late' \| 'invalid' \| 'self' \| 'not_allowed' \| 'rate_limited' \| 'unauthenticated'` | Ağ hatası → `throw` (kart `friendlyError` gösterir). |
| `admin_growth_report`, `admin_invite_leaderboard` | – | yalnız SQL Editor | İstemciden çağrılamaz. |

#### İstemci kodu

**`src/lib/data/types.ts`** (eklenecekler):
```ts
export type InviteState = { code: string; total: number; active: number; invited: boolean; canRedeem: boolean };
export type RedeemResult =
  | 'ok' | 'already' | 'too_late' | 'invalid' | 'self' | 'not_allowed' | 'rate_limited' | 'unauthenticated';

// interface DataSource içine:
  /** F4: bugünü aktif gün olarak işaretler (0017 yoksa sessizce atlanır) */
  touchActivity(): Promise<void>;
  /** F3: davet kodu + sayaç. null = 0017 kurulmadı / çevrimdışı (kart gizlenir) */
  getInvite(): Promise<InviteState | null>;
  redeemInvite(code: string): Promise<RedeemResult>;
```

**`src/lib/data/supabaseSource.ts`** (`isApiPaid` düzeniyle):
```ts
    async touchActivity() {
      if (!(await ensureSession())) return;
      const { error } = await sb.rpc('touch_activity');
      if (error) console.warn('[growth] touch_activity:', error.message); // 0017 yoksa da akış sürer
    },

    async getInvite() {
      if (!(await ensureSession())) return null;
      const { data, error } = await sb.rpc('get_my_invite');
      if (error) return null;
      const r = (Array.isArray(data) ? data[0] : data) as
        | { code?: string; total?: number; active?: number; invited?: boolean; can_redeem?: boolean }
        | undefined;
      if (!r?.code) return null;
      return { code: r.code, total: r.total ?? 0, active: r.active ?? 0, invited: !!r.invited, canRedeem: !!r.can_redeem };
    },

    async redeemInvite(code) {
      await ensureSession();
      const { data, error } = await sb.rpc('redeem_invite', { p_code: code });
      if (error) throw error;
      return data as RedeemResult;
    },
```

**`src/lib/data/mockSource.ts`** (önizleme; e2e bu değerlere dayanır):
```ts
const MOCK_INVITE: InviteState = { code: 'ABC234', total: 4, active: 2, invited: false, canRedeem: true };
let invite = { ...MOCK_INVITE };
// ...
    async touchActivity() {},
    async getInvite() { return { ...invite }; },
    async redeemInvite(raw) {
      const code = normalizeInviteInput(raw);            // src/lib/share.ts
      if (invite.invited) return 'already';
      if (code === invite.code) return 'self';
      if (code === 'XYZ789') { invite = { ...invite, invited: true, canRedeem: false }; return 'ok'; }
      return 'invalid';
    },
// deleteAccount() içine: invite = { ...MOCK_INVITE };
```

**`src/lib/share.ts`** (saf; yalnız `./status` ve `./types` tiplerini içe aktarır):
```ts
import { isFinished, isLive, isOff } from './status';
import type { Match, NbaBoxLine, PlayerRating } from './types';
import type { RedeemResult } from './data/types';

export type ShareMatch = Pick<Match,
  'sport_type' | 'home_team' | 'away_team' | 'home_score' | 'away_score' | 'status_short' | 'kickoff_at' | 'box_score' | 'player_ratings'>;
export type ShareKind = 'finished' | 'upcoming';

export const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** Boşlukları atar, büyük harfe çevirir (Türkçe i/ı sorunu yok: alfabe yalnız ASCII) */
export function normalizeInviteInput(raw: string): string;      // ' abc 234 ' → 'ABC234'
export function isValidInviteCode(code: string): boolean;        // /^[A-HJKMNP-Z2-9]{6}$/
/** Yalnız biten (FT/AET/PEN) ve başlamamış (NS/TBD) maç paylaşılır; canlı/ertelenen/bilinmeyen → null */
export function shareKind(m: Pick<Match, 'status_short'>): ShareKind | null;
/** URL API ile: mevcut sorgu ve # korunur; code null ise k eklenmez */
export function withRef(downloadUrl: string, ref: 'app-share' | 'invite', code: string | null): string;
/** "En skorer: J. Smith 31 sayı, FG% 52" — sıralama: sayı ↓, dakika ↓, ilk sıra; fga = 0 ise FG% yazılmaz */
export function topScorerLine(box: NbaBoxLine[] | null | undefined): string | null;
/** "En yüksek puan: A. Yılmaz (8,4)" — ondalık virgül, tek basamak */
export function topRatingLine(ratings: PlayerRating[] | null | undefined): string | null;
/** "bugün 21:45" | "yarın 00:30" | "20.11 21:45" — TSİ (UTC+3, yaz saati yok) */
export function kickoffLabel(kickoffIso: string, nowMs: number): string;
export function buildShareText(m: ShareMatch, o: { downloadUrl: string; inviteCode: string | null; nowMs: number }): string | null;
export function buildInviteText(downloadUrl: string, code: string): string;
export function redeemMessage(r: RedeemResult): { text: string; ok: boolean };
/** Pazarlama §8 yasaklı ifadeler; testler ve geliştirme denetimi için */
export const BANNED_SHARE_TERMS: readonly string[];
```
`buildShareText` satır kuralları (tasarım §5.1; satır yoksa boş satır kalmaz):

| Durum | Satır 1 | Satır 2 (varsa) | Satır 3 |
|---|---|---|---|
| NBA bitti, box var | `<Ev> <s>-<s> <Dep> (MS)` | `topScorerLine` | `Box score Skor+'ta: <url>` |
| NBA bitti, box yok/boş | aynı | – | `Skor ve istatistik Skor+'ta: <url>` |
| Futbol bitti, puan var | `… (MS)` / `(MS, uzatma)` / `(MS, penaltılar)` | `topRatingLine` | `Kadro ve puanlar Skor+'ta: <url>` |
| Futbol bitti, puan yok | aynı | – | `Maç özeti Skor+'ta: <url>` |
| Başlamadı (iki spor) | `<Ev> – <Dep>, <kickoffLabel>` | – | `Skor+'ta takip ediyorum: <url>` |

`<url>` = `withRef(downloadUrl, 'app-share', inviteCode)`. Takım adları `Match` içindeki (zaten `localizeTeams` ile Türkçeleştirilmiş) adlardır.

**`src/lib/growth.ts`**:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { dataSource } from './data';
import { PREVIEW_MODE } from './supabase';

/** İndirme sayfası. EAS ortam değişkeni (gizli değil). Önizlemede e2e için sabit örnek adres. */
export const DOWNLOAD_URL: string | null =
  process.env.EXPO_PUBLIC_DOWNLOAD_URL?.trim() || (PREVIEW_MODE ? 'https://ornek.invalid/skorplus' : null);

const KEY = 'skor.activity.lastTouch';
const GAP_MS = 60 * 60_000; // saatte en fazla 1 RPC
let started = false;

async function touchThrottled(): Promise<void> {
  try {
    const last = Number(await AsyncStorage.getItem(KEY)) || 0;
    if (Date.now() - last < GAP_MS) return;
    await AsyncStorage.setItem(KEY, String(Date.now()));
    await dataSource.touchActivity();
  } catch {
    /* ölçüm akışı durdurmaz */
  }
}

/** Soğuk açılış + arka plandan dönüş. D7 için ertesi gün açılışlar da sayılır. */
export function startActivityTracking(): () => void {
  if (started) return () => {};
  started = true;
  void touchThrottled();
  const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void touchThrottled(); });
  return () => { sub.remove(); started = false; };
}
```

**`src/hooks/useInvite.ts`** (`useApiPaid` önbellek desenine benzer):
```ts
let cached: Promise<InviteState | null> | null = null;
export function useInvite(): {
  invite: InviteState | null; loading: boolean;
  redeem(code: string): Promise<{ text: string; ok: boolean }>;  // redeemMessage; ağ hatasında friendlyError(e, 'Kod kaydedilemedi. Tekrar dene.')
  reload(): void;                                                 // cached = null + yeniden çek
};
/** ShareButton için: yalnız kodu döndürür, kart yokken de paylaşım çalışır (k'siz) */
export function useInviteCode(): string | null;
```
`redeem` sonucu `ok` ise `reload()` (sayaç ve `canRedeem` güncellenir). `deleteAccount` sonrası `AccountCard` mevcut akışta ekranı yeniler; `useInvite` önbelleği de `cached = null` ile sıfırlanır (`resetInviteCache()` dışa aktarılır, `AccountCard` silme başarısından sonra çağırır).

**`src/components/ShareButton.tsx`** (tasarım §5.1):
```tsx
export function ShareButton({ match }: { match: Match }) {
  const code = useInviteCode();
  if (!DOWNLOAD_URL || !shareKind(match)) return null;
  const onPress = async () => {
    const message = buildShareText(match, { downloadUrl: DOWNLOAD_URL, inviteCode: code, nowMs: Date.now() });
    if (!message) return;
    try { await Share.share({ message }); } catch { /* kullanıcı kapattı / web'de destek yok */ }
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Maçı paylaş" hitSlop={4} onPress={onPress}
      style={({ pressed }) => [{ minWidth: hit, minHeight: hit, justifyContent: 'center', paddingHorizontal: space(2) }, pressed && { opacity: 0.7 }]}>
      <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '700' }}>Paylaş</Text>
    </Pressable>
  );
}
```

**`src/app/match/[id].tsx`** — mevcut satır:
```tsx
<Stack.Screen options={{ title: match.league_name, ...backOptions() }} />
```
yeni:
```tsx
<Stack.Screen options={{ title: match.league_name, ...backOptions(), headerRight: () => <ShareButton match={match} /> }} />
```
(`ShareButton` görünürlüğü kendi içinde: canlı, ertelenen/iptal ve `DOWNLOAD_URL` yoksa `null`.)

**`src/components/InviteCard.tsx`** (tasarım §5.3; `Card`, `CardTitle`, `type`, `font.mono`, §3.6 düğmeleri):
- `invite === null` veya `DOWNLOAD_URL === null` → `null` (kart yok).
- Kod kutusu: `accessibilityLabel={`Davet kodun ${invite.code.split('').join(' ')}`}`; `selectable`.
- "Davetiye gönder" → `Share.share({ message: buildInviteText(DOWNLOAD_URL, invite.code) })`.
- Giriş alanı yalnız `invite.canRedeem`; "Kaydet" `isValidInviteCode(normalizeInviteInput(value))` olana kadar pasif (`opacity 0.4`, `accessibilityState={{ disabled: true }}`).
- Sonuç metni `accessibilityLiveRegion="polite"`.

**`src/app/settings.tsx`** — `return` içinde:
```tsx
      <FollowedTeams />
      <InviteCard />
      <AccountCard />
```

**`src/app/_layout.tsx`** — `applyUpdateOnLaunch` efektinin yanına:
```tsx
  // F4: aktif gün ölçümü (saatte en fazla 1 RPC; hata akışı durdurmaz)
  useEffect(() => startActivityTracking(), []);
```

#### Arayüz metinleri (son hâl; pazarlama §8 ve tasarım §5.3, §6 ile uyumlu)
| Yer | Metin |
|---|---|
| Başlık düğmesi | `Paylaş` (a11y: `Maçı paylaş`) |
| Kart kicker / başlık | `DAVET` / `Arkadaşını davet et` |
| Kod etiketi | `Davet kodun` |
| Birincil düğme | `Davetiye gönder` |
| Sayaç | `Davetinle gelen: {total} · Aktif olan: {active}` (0 da yazılır) |
| Açıklama 1 | `Aktif 3 davet → Pro satışa açılmadan önce denemeye davet edilirsin.` |
| Açıklama 2 | `Aktif: uygulamayı en az 2 farklı gün açan davetli.` |
| Kod girme başlığı | `Davet kodun var mı?` |
| Kod girme düğmesi | `Kaydet` |
| `ok` | `Teşekkürler, davet kaydedildi.` (`live`) |
| `invalid` | `Kod bulunamadı.` (`danger`) |
| `self` | `Kendi kodunu giremezsin.` |
| `too_late` | `Davet kodu yalnız ilk 7 günde girilebilir.` |
| `already` | `Bu hesapta zaten bir davet kodu kayıtlı.` |
| `not_allowed` | `Bu kod bu hesapta kullanılamaz.` |
| `rate_limited` | `Çok fazla deneme yapıldı. Yarın tekrar dene.` |
| `unauthenticated` / ağ | `friendlyError(e, 'Kod kaydedilemedi. Tekrar dene.')` |
| Davetiye metni | `Türkçe, reklamsız skor uygulaması. Kurulum anlatımı burada: <url>?ref=invite&k=ABC234 — Uygulamayı açınca davet kodum: ABC234` |

Kullanılmayacaklar: "ücretsiz Pro", süre, fiyat, "abone ol", "anlık", "canlı", "Maçın oyuncusu", "resmî", "kesin", "garanti", "tahmin", "birazdan". "Reklamsız" bugün doğru; reklam kararı alınırsa önce davetiye metni değişir.

**Gizlilik metni (`src/lib/legal.ts`, `PRIVACY`)** — "Topladığımız veriler" listesine, "Taktik Asistan soruları" maddesinden sonra:
```
• Kullanım günleri: Uygulamayı hangi günlerde açtığınız (yalnız tarih; saat, ekran veya konum yok). Kaç kişinin uygulamaya geri döndüğünü ölçmek için.
• Davet bilgisi: Size ait rastgele davet kodu; bir davet kodu girdiyseniz sizi davet eden hesabın isimsiz kimliği.
```
"Saklama süresi" paragrafına: `Kullanım günleri 120 gün sonra otomatik silinir. Davet bilgisi hesabınız silinene kadar saklanır.` KVKK metninin veri kategorileri ve saklama bölümlerine aynı iki madde eklenir. ⚠ Hukuki dayanak (meşru menfaat) hukukçuya sorulur (pazarlama Ek-5).

#### Kabul kriterleri
1. Biten ve başlamamış maçta başlıkta "Paylaş" görünür; canlı, ertelenen/iptal maçta ve `EXPO_PUBLIC_DOWNLOAD_URL` boşken görünmez.
2. Paylaşım metni tablodaki satır düzenine birebir uyar; bağlantı indirme sayfasıdır ve `ref=app-share` içerir; kod varsa `k=<kod>`.
3. NBA metninde futbol terimi yoktur (`hasFootballTerm` false). Hiçbir metin `BANNED_SHARE_TERMS` içermez.
4. Davet kodu ilk `get_my_invite` çağrısında oluşur, sonra değişmez; `^[A-HJKMNP-Z2-9]{6}$` biçimindedir.
5. `redeem_invite` sonuçları: geçerli → `ok`; tekrar → `already`; kendi kodu → `self`; bilinmeyen → `invalid`; 7 günden eski hesap → `too_late`; A↔B karşılıklı → `not_allowed`; 24 saatte 10 hatalı denemeden sonra → `rate_limited`. Girdi büyük/küçük harf ve boşluk duyarsız.
6. Sayaç gerçek değeri gösterir; "aktif" yalnız ≥ 2 farklı gün aktif davetliyi sayar.
7. `touch_activity` kullanıcı başına günde en fazla 1 satır yazar; istemci saatte en fazla 1 kez çağırır; hata kullanıcıya gösterilmez.
8. `anon` rolü hiçbir yeni RPC'yi çağıramaz; `authenticated` `admin_*` fonksiyonlarını ve `invite_random_code`'u çağıramaz; istemci `profiles` davet alanlarını doğrudan yazamaz.
9. 0017 kurulmamışken uygulama çalışır: kart gizli, Paylaş `k`'siz çalışır, konsolda yalnız uyarı.
10. Native modül eklenmez; `npm run update:apk` ile mevcut APK'lara gelir. `npm run typecheck` ve `npm run lint` temiz.

#### Test planı

**Deno birim — `supabase/functions/tests/share.test.ts`** (`../../../src/lib/share.ts` ve `../_shared/sportTerms.ts` içe aktarılır; `days.test.ts` düzeni). Sabitler: `U = 'https://x.dev/skor'`, `NOW = Date.parse('2026-11-18T09:00:00Z')`.

| # | Test | Beklenen |
|---|---|---|
| 1 | `normalizeInviteInput(' abc 234 ')` | `'ABC234'` |
| 2 | `isValidInviteCode`: `'ABC234'`, `'ABC123'`, `'ABCO23'`, `'ABC23'` | true, false (1), false (O), false (5 karakter) |
| 3 | `shareKind`: FT, AET, PEN, NS, TBD, 1H, HT, PST, `'Q3'` | finished×3, upcoming×2, null×4 |
| 4 | `withRef(U, 'app-share', 'ABC234')` | `https://x.dev/skor?ref=app-share&k=ABC234` |
| 5 | `withRef('https://x.dev/?lang=tr#kur', 'invite', null)` | `https://x.dev/?lang=tr&ref=invite#kur` |
| 6 | NBA FT, box: J. Smith 31 sayı, fgm 11, fga 21 | `Lakeshore Comets 104-99 Desert Vipers (MS)\nEn skorer: J. Smith 31 sayı, FG% 52\nBox score Skor+'ta: https://x.dev/skor?ref=app-share&k=ABC234` |
| 7 | Eşit sayı: dakikası çok olan önce | Doğru oyuncu |
| 8 | `fga = 0` | `En skorer: X 2 sayı` (FG% yok) |
| 9 | NBA FT, `box_score: []` ve `null` | 2 satır; son satır `Skor ve istatistik Skor+'ta: …` |
| 10 | Futbol FT, `rating 8.4` / `7` | `En yüksek puan: A. Yılmaz (8,4)` / `(7,0)` |
| 11 | Futbol FT, puan yok | 2 satır; `Maç özeti Skor+'ta: …` |
| 12 | AET / PEN | `(MS, uzatma)` / `(MS, penaltılar)` |
| 13 | NS, kickoff `2026-11-18T18:45Z` | `Ev – Dep, bugün 21:45\nSkor+'ta takip ediyorum: …` |
| 14 | NS, kickoff `2026-11-18T21:30Z` (TSİ 00:30, ertesi gün) | `yarın 00:30` |
| 15 | NS, kickoff `2026-11-20T18:45Z` | `20.11 21:45` |
| 16 | 1H ve PST | `buildShareText` → `null` |
| 17 | Tüm fikstür çıktıları | `BANNED_SHARE_TERMS` yok (`toLocaleLowerCase('tr')`, kelime sınırı `(^|[^a-zçğıöşü])terim([^a-zçğıöşü]|$)`) |
| 18 | NBA çıktıları | `hasFootballTerm(text) === false` |
| 19 | `buildInviteText(U, 'ABC234')` | Davetiye metni birebir |
| 20 | `redeemMessage` her sonuç | Tablodaki metin ve `ok` bayrağı; yalnız `ok` için `ok: true` |

**SQL elle kontrol (SQL Editor; pgTAP yok).** `auth.uid()` taklidi için işlem içinde:
```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<A-uuid>","role":"authenticated"}';
select * from public.get_my_invite();            -- kod üretildi, total 0
select * from public.get_my_invite();            -- aynı kod
select public.redeem_invite('<A kodu>');         -- 'self'
select public.redeem_invite('zzzzzz');           -- 'invalid'
select public.admin_growth_report(current_date, current_date); -- izin hatası beklenir
rollback;
```
Kontrol listesi: A ve B iki test hesabı → B `redeem_invite(lower(' a-kodu '))` → `ok`, tekrar → `already`; A, B'nin kodunu girer → `not_allowed`; B'nin `created_at`'i 8 gün geri (yalnız test projesinde) → `too_late`; 11 hatalı kod → 11. `rate_limited`; `touch_activity()` iki kez → 1 satır; `set local role anon` ile her RPC → izin hatası; `update public.profiles set invite_code='AAAAAA'` (`authenticated`) → 0 satır (politika yok). Rol `postgres` iken `admin_growth_report` ve `admin_invite_leaderboard` sonuç döner.

**E2E — `e2e/share_ui.mjs`** (Playwright, önizleme modu, `account_ui.mjs` iskeleti):
```js
await p.addInitScript(() => {
  window.__shared = [];
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: (d) => { window.__shared.push(d); return Promise.resolve(); },
  });
});
const lastShared = () => p.evaluate(() => { const d = window.__shared.at(-1); return d?.text ?? d?.message ?? ''; });
```
⚠ Doğrulanmalı: react-native-web `Share.share`, `navigator.share`'e `{ title, text: message, url }` geçirir. Geçirmiyorsa `lastShared` `message` alanını da okuduğu için test yine çalışır.

Senaryolar:
1. **NBA biten:** NBA sekmesine geç (`nba_ui.mjs` adımı), `Lakeshore Comets` maçını aç → `getByLabel('Maçı paylaş')` → metin `/\(MS\)/`, `/En skorer: .+ \d+ sayı/`, `/ref=app-share/`, `/k=ABC234/` içerir; `/canlı|anlık/i` içermez. Ekran görüntüsü `f3-paylas-nba.png`.
2. **Futbol biten (9001):** metin `/En yüksek puan: .+ \(\d+,\d\)/` içerir; `/Maçın oyuncusu/` içermez.
3. **Canlı maç:** `getByLabel('Maçı paylaş')` sayısı 0.
4. **Başlamamış maç:** metin `/Skor\+'ta takip ediyorum: /` ve `/(bugün|yarın|\d{2}\.\d{2}) \d{2}:\d{2}/` içerir.
5. **Ayarlar kartı:** `getByLabel('Bildirim ayarları')` → `Arkadaşını davet et`, `ABC234`, `Davetinle gelen: 4 · Aktif olan: 2` görünür; `Davetiye gönder` → metin `/ref=invite&k=ABC234/` ve `/davet kodum: ABC234/` içerir. Ekran görüntüsü `f3-davet.png`.
6. **Kod girme:** `zzz` yaz → `Kaydet` pasif; `abc 234` → `Kendi kodunu giremezsin.`; `QWE234` → `Kod bulunamadı.`; `XYZ789` → `Teşekkürler, davet kaydedildi.` ve giriş alanı kaybolur.
7. **Dar ekran (360 pt):** Ayarlar'da `document.documentElement.scrollWidth <= 360`.
8. **Regresyon:** `account_ui.mjs` hesap silme sonrası kart yeniden `ABC234` ve sayaç `4 · 2` gösterir (mock sıfırlanır); `narrow_ui.mjs` geçer.

#### Kullanıcının elle yapacakları
1. `supabase/migrations/0017_growth_invites.sql` dosyasını SQL Editor'de çalıştır.
2. Yukarıdaki SQL kontrol listesini test hesaplarıyla bir kez çalıştır.
3. EAS `preview` ortamında `EXPO_PUBLIC_DOWNLOAD_URL` değişkenini indirme sayfası adresiyle tanımla (gizli değil). `.env`'e de ekle.
4. İndirme sayfasında `?k=` varsa "Davet kodun: XXXXXX. Uygulamayı açınca Ayarlar > Arkadaşını davet et bölümüne yaz." kutusu (depo dışı).
5. Gizlilik/KVKK metnini güncelle; hukukçu kontrolü ⚠.
6. `npm run test:functions`, `npm run typecheck`, `npm run lint`, `npm run e2e` → `npm run update:apk`.
7. Haftalık KPI tablosu: `select public.admin_growth_report(<pazartesi>, <pazar>);` ve `select * from public.admin_invite_leaderboard();`.

---

### 4.4 F12 Kota ayrımı + akıllı zamanlayıcı — **Sürüm 4: yalnız NBA, migration 0023** (futbol Pro API ile dakikalık cron kullanır, §0.4)

> Sürüm 4 kapsam notu: Uygularken `0023` SQL'inden `skor-sync-tick` satırlarını ve `sync_state` `football` satırını çıkarın; `skor-sync-live` dakikalık işi (0018) korunur; `sync-matches` `tick()` yazılmaz. `scheduler.ts` API'si ve testleri aynen kalır (futbol `DEFAULT_CFG` ileride ücretsiz plana dönüş için). F12a yapıldı (3.31). F12b (NBA) migration 0023 — **uygulamaya hazır**.

> Durum (Döngü 3): **F12a kodda tamam** (GELISTIRMELER 3.31: `_shared/quota.ts` `createQuotaGuard`, spor başına bekçi, rezervler 6 / 3 / 5 / 6, UTC gece yarısı sıfırlaması, 10 dk TTL). Bu bölüm **F12b**'yi mevcut koda göre uygulamaya hazır hâle getirir.
> Okunan kaynaklar: `supabase/functions/sync-matches/index.ts` (`Deno.serve`, `syncSchedule`, `syncLive`), `sync-nba/index.ts` (`Deno.serve`, `syncSchedule`, `syncLive`, `enrichFinished`, `backfillBoxScores`, `mirrorLogosSafe`), `_shared/quota.ts`, `_shared/apiFootball.ts` (`quota`, `hasQuotaForOptional`, `lastQuotaRemaining`, `primeQuota`, `apiGet`), `_shared/nbaApi.ts` (`quota`, `hasNbaQuota`, `lastNbaQuota`, `nbaGet`, `normalizeStatus`), `_shared/types.ts` (`LIVE`, `FINISHED`), `_shared/teamEvents.ts` (`notifyKickoffs`), `tests/quota.test.ts`, migration'lar `0002` (`call_edge_function`), `0004`, `0006`/`0007` (ücretli plan `cron.alter_job` notları), `0009`, `0015`, `0016`, `0017`, `src/app/index.tsx`, `e2e/lineup_ui.mjs`, pazarlama §4.9 ve KPI 13.
> Son migration dosyası `0017_growth_invites.sql`; bu iş **`0023_smart_scheduler.sql`**.

#### Bugünkü durum (değişecek olan)
| İş (pg_cron, UTC) | Kaynak | Ne yapar | Kota |
|---|---|---|---|
| `skor-sync-live` `*/30 12-22 * * *` | 0004 | `sync-matches` `{mode:'live'}` → `syncLive()` | Maç olsun olmasın 22 çağrı/gün, her biri ≥ 1 istek |
| `nba-sync-live` `*/30 23,0-6 * * *` | 0004 | `sync-nba` `{mode:'live'}` → `syncLive()` + `enrichFinished()` + `mirrorLogosSafe()` | 16 çağrı/gün |
| `skor-sync-schedule` `0 9 * * *`, `nba-sync-schedule` `0 20 * * *` | 0004 | Fikstür | Değişmez |
| `skor-sync-cleanup` `15 23 * * *` | 0015 | Geç biten futbol maçı için tek `live` çalıştırması | Değişmez (ileride kaldırılabilir) |
| `skor-maintenance` `30 4`, `skor-growth-cleanup` `40 4` | 0009, 0017 | Bakım | API yok |

Sorunlar: (1) Maçsız saatlerde istek harcanır. (2) Maç saatinde aralık sabit 30 dk; devre arası ve maç sonu 30 dk geç yakalanabilir. (3) NBA'de Türkiye gündüzüne kalan maç (ör. hafta sonu erken maçları, 17:00-23:00 UTC) hiç canlı yoklanmaz.

#### Tasarım kararları
| Karar | Seçim | Gerekçe |
|---|---|---|
| Karar nerede? | Edge Function'da, saf `_shared/scheduler.ts` | Deno testli. SQL'de karar test edilemez. |
| Tetik | Her spor için 5 dakikalık `tick`; NBA 2 dk kaydırmalı | Boşta 0 API isteği. Edge çağrısı ~2 × 288/gün (⚠ ücretsiz katman sınırını doğrula; çok altında olmalı). |
| Eşzamanlılık | DB'de atomik `claim_sync_poll` | Uzun süren yoklama ile sonraki tick çakışmaz. |
| Kalan kota | `sync_state.remaining` + futbolda bayatsa `primeQuota` | Yeni Edge örneğinde bellek boş. `generate-halftime` / `generate-preview` de futbol kotası harcar; 10 dk'dan eski değer `/status` ile tazelenir. |
| Kota sıfırlanması | Sonraki UTC gece yarısı | `_shared/quota.ts` ile aynı varsayım (⚠ API panosunda doğrula). |
| Ölçüm | `sync_poll_log` tablosu (14 gün) | KPI 13 (tazelik medyanı) sorguyla ölçülür; fonksiyon logu 1 gün sonra kaybolabilir. |
| NBA zenginleştirme | Yoklama olmayan tick'te en fazla 30 dk'da bir "yalnız zenginleştirme" | Biten maçın box score'u canlı liste isteği harcamadan gelir. |
| Ücretli plan | `paid` → her tick yoklar; cron dakikalık yapılır | 0006/0007'deki `alter_job` notları Döngü 8'de kaldırıldı. Futbolun ücretli geçişi yalnız 0018 prosedürüyle (`docs/ucretli-gecis.md`); NBA ücretsiz kaldıkça `nba-*` işlerine dokunulmaz. |

#### Migration — `supabase/migrations/0023_smart_scheduler.sql` (son hâl)

```sql
-- Skor+ : F12b — DB kapılı, bütçeye göre hızlanan canlı senkron ("tick").
-- Futbol (API-Football) ve NBA (API-NBA) kotaları AYRIDIR, her biri 100 istek/gün (bkz. _shared/quota.ts).
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0001–0017 gerekir.
-- SIRA ÖNEMLİ: önce `npm run deploy:functions` (mode=tick bilen sync-matches / sync-nba), SONRA bu dosya.
-- Ters sırada eski sürüm {"mode":"tick"}'i 'live' sayar ve 5 dk'da bir API çağırır (kota ~3 saatte biter).
-- Geri dönüş: dosya sonundaki GERİ DÖNÜŞ bloğu.

-- ─────────────────────────────────────────────── 1) zamanlayıcı durumu
create table if not exists public.sync_state (
  sport text primary key check (sport in ('football', 'nba')),
  last_poll_at timestamptz,          -- son API yoklaması (claim anı)
  last_enrich_at timestamptz,        -- NBA: son "yalnız zenginleştirme" çalıştırması
  last_reason text,                  -- son karar: no_window | wait | interval | milestone | ...
  last_gap_min numeric,              -- son hesaplanan aralık (dk)
  next_due_at timestamptz,           -- tahmini sonraki yoklama (F12c "Sonraki güncelleme" için)
  remaining int,                     -- son bilinen kalan kota (x-ratelimit-requests-remaining)
  remaining_at timestamptz,          -- remaining'in öğrenildiği an
  updated_at timestamptz not null default now()
);
alter table public.sync_state enable row level security; -- politika yok: yalnız service role
insert into public.sync_state (sport) values ('football'), ('nba') on conflict (sport) do nothing;

-- Yoklama günlüğü (KPI 13 tazelik ölçümü ve log kontrolü). 14 gün tutulur.
create table if not exists public.sync_poll_log (
  id bigserial primary key,
  sport text not null check (sport in ('football', 'nba')),
  polled_at timestamptz not null default now(),
  reason text not null,              -- interval | milestone | detail | paid | enrich | manual
  gap_min numeric,
  remaining_before int,
  remaining_after int,
  live_count int,                    -- yoklamada canlı dönen maç sayısı
  requests int                       -- remaining_before - remaining_after (biliniyorsa)
);
create index if not exists sync_poll_log_sport_time_idx on public.sync_poll_log (sport, polled_at desc);
alter table public.sync_poll_log enable row level security; -- politika yok

-- ─────────────────────────────────────────────── 2) service-role RPC'leri
-- Aday maçlar: [şimdi − 8 sa, p_until] arasında başlayanlar + takip ve detay ihtiyacı (tek sorgu)
create or replace function public.sync_candidates(p_sport text, p_until timestamptz)
returns table (fixture_id bigint, kickoff_at timestamptz, status_short text, followed boolean, needs_detail boolean)
language sql stable security definer set search_path = '' as $$
  select m.fixture_id,
         m.kickoff_at,
         m.status_short,
         exists (select 1 from public.match_follows f where f.fixture_id = m.fixture_id),
         case
           when p_sport = 'football' then m.status_short in ('FT', 'AET', 'PEN') and m.summary_teaser is null
           else m.status_short = 'FT' and (m.stats is null or m.box_score is null)
         end
    from public.matches m
   where m.sport_type = p_sport
     and m.kickoff_at between now() - interval '8 hours' and p_until;
$$;

-- Atomik sahiplenme: son yoklamadan bu yana p_min_gap_sec geçtiyse last_poll_at'i yazar ve true döner.
-- Çakışan iki tick'ten yalnız biri API'yi çağırır.
create or replace function public.claim_sync_poll(p_sport text, p_min_gap_sec int, p_reason text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.sync_state
     set last_poll_at = now(), last_reason = p_reason, updated_at = now()
   where sport = p_sport
     and (last_poll_at is null or last_poll_at <= now() - make_interval(secs => p_min_gap_sec));
  return found;
end $$;

create or replace function public.claim_sync_enrich(p_sport text, p_min_gap_sec int)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.sync_state
     set last_enrich_at = now(), updated_at = now()
   where sport = p_sport
     and (last_enrich_at is null or last_enrich_at <= now() - make_interval(secs => p_min_gap_sec));
  return found;
end $$;

-- Karar ve kota kaydı (yoklama olsun olmasın her tick'te çağrılır; remaining null ise eskisi korunur)
create or replace function public.record_sync_state(
  p_sport text, p_reason text, p_gap_min numeric, p_next_due_at timestamptz, p_remaining int
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.sync_state
     set last_reason = p_reason,
         last_gap_min = p_gap_min,
         next_due_at = p_next_due_at,
         remaining = coalesce(p_remaining, remaining),
         remaining_at = case when p_remaining is null then remaining_at else now() end,
         updated_at = now()
   where sport = p_sport;
end $$;

create or replace function public.log_sync_poll(
  p_sport text, p_reason text, p_gap_min numeric, p_before int, p_after int, p_live int
)
returns void language sql security definer set search_path = '' as $$
  insert into public.sync_poll_log (sport, reason, gap_min, remaining_before, remaining_after, live_count, requests)
  values (p_sport, p_reason, p_gap_min, p_before, p_after, p_live,
          case when p_before is not null and p_after is not null then greatest(p_before - p_after, 0) end);
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.sync_candidates(text, timestamptz)',
    'public.claim_sync_poll(text, int, text)',
    'public.claim_sync_enrich(text, int)',
    'public.record_sync_state(text, text, numeric, timestamptz, int)',
    'public.log_sync_poll(text, text, numeric, int, int, int)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- ─────────────────────────────────────────────── 3) cron: sabit 30 dk → 5 dk tick
select cron.unschedule(jobname) from cron.job
 where jobname in ('skor-sync-live', 'nba-sync-live', 'skor-sync-tick', 'nba-sync-tick', 'skor-sync-log-cleanup');

select cron.schedule('skor-sync-tick', '*/5 * * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"tick"}'::jsonb) $$);
-- NBA 2 dk kaydırmalı: iki fonksiyon aynı anda uyanmaz
select cron.schedule('nba-sync-tick', '2-59/5 * * * *',
  $$ select public.call_edge_function('sync-nba', '{"mode":"tick"}'::jsonb) $$);
select cron.schedule('skor-sync-log-cleanup', '50 4 * * *',
  $$ delete from public.sync_poll_log where polled_at < now() - interval '14 days' $$);
-- skor-sync-schedule (0004), nba-sync-schedule (0004), skor-sync-cleanup (0015) aynen kalır.

-- ─────────────────────────────────────────────── NOT: ücretli plan
-- Döngü 8: futbol ücretli geçişi yalnız 0018 prosedürü (docs/ucretli-gecis.md). Bu taslak futbol satırlarını
-- çıkararak uygulanır (§0.4); nba-sync-tick YALNIZ API-NBA ücretli plana geçtiğinde (API_NBA_PAID=1) dakikalık yapılır:
--   select cron.alter_job((select jobid from cron.job where jobname = 'nba-sync-tick'),  schedule := '* * * * *');

-- ─────────────────────────────────────────────── GERİ DÖNÜŞ (elle; 0004 ritmine döner)
-- select cron.unschedule(jobname) from cron.job where jobname in ('skor-sync-tick', 'nba-sync-tick');
-- select cron.schedule('skor-sync-live', '*/30 12-22 * * *',
--   $$ select public.call_edge_function('sync-matches', '{"mode":"live"}'::jsonb) $$);
-- select cron.schedule('nba-sync-live', '*/30 23,0-6 * * *',
--   $$ select public.call_edge_function('sync-nba', '{"mode":"live"}'::jsonb) $$);
-- Tablolar ve fonksiyonlar zararsızdır; kalabilir. Edge Function'lar mode=live'ı aynen destekler.
-- İstemci metni (index.tsx) aşama 0'a ("~30 dk aralıkla") OTA ile geri alınır.
```

#### `_shared/scheduler.ts` — API (saf; yalnız `./types.ts`'ten `LIVE`, `FINISHED` içe aktarır)

```ts
import { FINISHED, LIVE } from './types.ts';

export type Sport = 'football' | 'nba';
/** pre: başlamadı (NS/TBD) · live: canlı/devre arası · finished: bitti · off: ertelendi/iptal/bilinmiyor */
export type Phase = 'pre' | 'live' | 'finished' | 'off';
export function phaseOf(sport: Sport, status: string): Phase;
//   football: NS|TBD → pre; LIVE dizisi → live; FINISHED → finished; diğer → off
//   nba (nbaApi.normalizeStatus): NS → pre; LIVE|HT → live; FT → finished; diğer → off

export type Candidate = {
  fixtureId: number;
  kickoffMs: number;
  status: string;
  followed: boolean;       // match_follows'ta en az 1 kayıt
  needsDetail: boolean;    // futbol: biten + teaser yok; NBA: FT + (stats veya box_score yok)
};

export type SchedulerCfg = {
  minGapMin: number;       // en sık yoklama
  maxGapMin: number;       // en seyrek yoklama (bugünkü ritim)
  preKickoffMin: number;   // pencere başlangıcı: başlama − bu kadar
  spanMin: number;         // pencere sonu: başlama + bu kadar (DB'de hâlâ "pre" ise)
  stuckExtraMin: number;   // DB'de canlı görünen maç için span'e ek süre
  detailWindowMin: number; // biten + detayı eksik maç bu süre boyunca maxGap ritminde yoklanır (yalnız futbol)
  milestonesMin: number[]; // başlamadan sonra olay yoklamaları (dk)
  reserve: number;         // tick'in dokunmayacağı kota (günün sabit işleri)
  costPerPoll: number;     // bir yoklamanın ortalama istek maliyeti
  lowBudget: number;       // (kalan − rezerv) bunun altındaysa takipsiz pencereler maxGap'te
  enrichGapMin: number;    // NBA "yalnız zenginleştirme" en sık aralığı
};

export const DEFAULT_CFG: Record<Sport, SchedulerCfg> = {
  football: { minGapMin: 4, maxGapMin: 30, preKickoffMin: 5, spanMin: 135, stuckExtraMin: 60, detailWindowMin: 240,
              milestonesMin: [2, 50, 115, 125], reserve: 6, costPerPoll: 1.5, lowBudget: 20, enrichGapMin: 30 },
  nba:      { minGapMin: 4, maxGapMin: 30, preKickoffMin: 5, spanMin: 165, stuckExtraMin: 60, detailWindowMin: 0,
              milestonesMin: [5, 75, 140, 155], reserve: 11, costPerPoll: 1.3, lowBudget: 20, enrichGapMin: 30 },
};
// NBA reserve 11 = DEFAULT_RESERVES.nbaOptional (5) + nbaBoxBackfill (6): zenginleştirme payı tick'e yedirilmez.
// Futbol milestone'ları: +2 başladı, +50 devre arası (HT ~+47..+63), +115 ve +125 maç sonu (uzatmalar dahil).
// NBA milestone'ları ⚠ ilk hafta loglarıyla ayarlanır (devre arası ~+70..+85, bitiş ~+135..+155).

/** Kota sıfırlanması: bir sonraki UTC gece yarısı (quota.ts utcDay ile aynı varsayım) */
export function nextUtcMidnight(nowMs: number): number;

export type Window = { fixtureId: number; startMs: number; endMs: number; followed: boolean; kind: 'live' | 'detail' };
/** Adayların yoklama pencereleri ('off' ve detaysız biten maçlar pencere üretmez) */
export function windowsOf(c: Candidate[], sport: Sport, cfg: SchedulerCfg): Window[];
//   pre:      [k − preKickoffMin, k + spanMin], kind 'live'
//   live:     [k − preKickoffMin, k + spanMin + stuckExtraMin], kind 'live'
//   finished && needsDetail && detailWindowMin > 0: [k, k + spanMin + detailWindowMin], kind 'detail'

/** [fromMs, toMs) içinde pencerelerin birleşim uzunluğu (dk); çakışmalar bir kez sayılır */
export function unionMinutes(w: Window[], fromMs: number, toMs: number): number;

/** (afterMs, untilMs] aralığına düşen olay anları; followedOnly ise yalnız takip edilen maçlar */
export function milestonesBetween(c: Candidate[], sport: Sport, cfg: SchedulerCfg,
                                  afterMs: number, untilMs: number, followedOnly: boolean): number[];

export type PollReason =
  | 'paid' | 'no_window' | 'budget_exhausted' | 'too_soon' | 'milestone' | 'interval' | 'detail' | 'wait';

export type PollInput = {
  sport: Sport;
  nowMs: number;
  lastPollMs: number | null;
  remaining: number | null;   // bugünkü (UTC) kalan kota; bilinmiyorsa null
  candidates: Candidate[];
  paid: boolean;
  cfg?: Partial<SchedulerCfg>;
};

export type PollDecision = {
  poll: boolean;
  reason: PollReason;
  gapMin: number | null;      // uygulanan aralık (dk); no_window / budget_exhausted'ta null
  nextDueMs: number | null;   // tahmini sonraki yoklama (log ve F12c için)
  activeWindows: number;
  budget: number | null;      // remaining − reserve
};

export function decidePoll(i: PollInput): PollDecision;

/** NBA: yoklama yapılmayan tick'te yalnız zenginleştirme çalışsın mı? */
export function shouldEnrichOnly(i: { nowMs: number; lastEnrichMs: number | null; candidates: Candidate[];
                                       cfg?: Partial<SchedulerCfg> }): boolean;
//   true ⇔ adaylarda needsDetail && phase 'finished' olan maç var ve (lastEnrich yok veya ≥ enrichGapMin önce)
```

**`decidePoll` algoritması (sırayla; ilk eşleşen karar döner):**
1. `paid` → `{ poll: true, reason: 'paid', gapMin: 1 }`.
2. `wins = windowsOf(...)` içinde `startMs ≤ now ≤ endMs` olanlar. Boşsa → `no_window`; `nextDueMs` = gelecekteki en erken pencere başlangıcı (yoksa `null`).
3. `budget = remaining === null ? null : remaining − reserve`. `budget !== null && budget < costPerPoll` → `budget_exhausted`.
4. `elapsed = lastPollMs === null ? ∞ : (now − lastPollMs) / 60000`. `elapsed < minGapMin` → `too_soon`.
5. `low = budget !== null && budget < lowBudget`. `milestonesBetween(cands, …, lastPollMs ?? now − maxGapMin·60000, now, low)` boş değilse → `milestone`.
6. Aralık: yalnız `detail` pencereleri aktifse `gap = maxGapMin`. `budget === null` ise `gap = maxGapMin`. Aksi hâlde `kalanOlay = milestonesBetween(cands, …, now, reset, low).length`, `hak = (budget − kalanOlay · costPerPoll) / costPerPoll`, `pencereDk = unionMinutes(wins + gelecek pencereler, now, reset)`; `hak ≤ 0` ise `gap = maxGapMin`, değilse `gap = clamp(pencereDk / hak, minGapMin, maxGapMin)`. `low` ve aktif `live` pencerelerinin hiçbiri `followed` değilse `gap = maxGapMin`.
7. `elapsed ≥ gap` → `interval` (yalnız detail aktifse `detail`), değilse `wait`. `nextDueMs = lastPollMs + gap`.

Örnek: 17:00 UTC'de tek maç, kalan 66, rezerv 6 → bütçe 60; kalan olay 4 → hak (60 − 6) / 1,5 = 36; pencere 135 dk → 3,75 → **4 dk**. Kalan 26 → bütçe 20 → hak (20 − 6)/1,5 ≈ 9,3 → **~15 dk**.

#### Deno testleri — `supabase/functions/tests/scheduler.test.ts` (16 vaka)
Sabitler: `T0 = Date.UTC(2026, 10, 18, 17, 0)` (20:00 TSİ başlama), `m = (dk) => T0 + dk·60000`, `fb(status, opts)` aday üretici.

| # | Vaka | Beklenen |
|---|---|---|
| 1 | `phaseOf`: futbol NS, TBD, 1H, HT, ET, P, FT, AET, PEN, PST, CANC; NBA NS, LIVE, HT, FT, `'X'` | pre, pre, live×4, finished×3, off×2; pre, live, live, finished, off |
| 2 | Aday yok | `no_window`, `poll` false, `nextDueMs` null |
| 3 | NS, başlamaya 10 dk | `no_window`, `nextDueMs = m(−5)` |
| 4 | NS, başlamaya 4 dk, `lastPollMs` null, kalan 66 | `poll` true, `interval` |
| 5 | Canlı, son yoklama 2 dk önce | `too_soon` |
| 6 | Canlı, son yoklama `m(44)`, şimdi `m(51)` (50 geçildi), kalan 26 | `milestone` |
| 7 | Bütçe aralığı: tek maç, kalan 66, şimdi `m(0)` | `gapMin` 4 |
| 8 | Bütçe aralığı: kalan 26 | `gapMin` ∈ [14, 16] |
| 9 | İki pencere (14:00 ve 17:00 UTC) şimdi 14:00, kalan 66 | Birleşim ≈ 280 dk; `gapMin` iki pencereli hesapla eşleşir ve tek pencereli hâlden büyüktür |
| 10 | Çakışan iki maç (aynı saat) | `unionMinutes` 140 (280 değil) |
| 11 | Kalan 7, rezerv 6 (bütçe 1 < 1,5) | `budget_exhausted` |
| 12 | Kalan `null` | `gapMin` 30; son yoklama 25 dk önce → `wait`, 31 dk önce → `interval` |
| 13 | Düşük bütçe (kalan 20) + aktif maç takipsiz | `gapMin` 30; aynı maç takipli → ölçekli (< 30) |
| 14 | Düşük bütçe: takipsiz maçın HT anı geçildi | `milestone` değil; takipli olsa `milestone` |
| 15 | DB'de canlı (takılı), `m(190)` | aktif (pencere sonu 135 + 60 = `m(195)`); `m(200)` → `no_window` (takılı canlı sonsuza dek yoklanmaz) |
| 16 | Futbol FT + `needsDetail`, `m(300)` | yalnız `detail` penceresi → `gapMin` 30, `reason` `detail`; `m(380)` → `no_window` |
| 17 | Gece yarısı: NBA maçı 23:30 UTC, şimdi 23:40 | `unionMinutes(now, reset)` 20 dk ile sınırlı; `nextUtcMidnight` doğru |
| 18 | `paid` | Her durumda `poll` true, `reason` `paid` |
| 19 | `shouldEnrichOnly`: NBA FT + needsDetail, son zenginleştirme 10 dk önce → false; 31 dk → true; needsDetail yok → false | — |
| 20 | `cfg` kısmi ezme (`{ minGapMin: 2 }`) diğer varsayılanları korur | — |

Mevcut `quota.test.ts`, `quota_edge.test.ts`, `syncUtils.test.ts`, `status.test.ts` değişmeden geçer.

#### Entegrasyon noktaları
| Dosya | Fonksiyon | Değişiklik |
|---|---|---|
| `_shared/scheduler.ts` | yeni | Yukarıdaki saf API. |
| `_shared/syncState.ts` | yeni (I/O, `admin`) | `readSyncState(sport): Promise<{ lastPollMs; lastEnrichMs; remaining; remainingAtMs } \| null>` · `loadCandidates(sport, untilMs): Promise<Candidate[]>` (`rpc('sync_candidates')`) · `claimPoll(sport, minGapSec, reason): Promise<boolean>` · `claimEnrich(sport, minGapSec): Promise<boolean>` · `recordState(sport, d: PollDecision, remaining: number \| null)` · `logPoll(sport, reason, gapMin, before, after, liveCount)`. Tablo/RPC yoksa `null`/`false` döner ve `console.warn` yazar. |
| `_shared/apiFootball.ts` | yeni dışa aktarım | `export const seedQuota = (rem: number, atMs: number) => quota.set(rem, atMs);` (yeni Edge örneği `sync_state`'teki değerle başlar). `primeQuota` aynen kullanılır. |
| `_shared/nbaApi.ts` | yeni dışa aktarım | `export const seedNbaQuota = (rem: number, atMs: number) => quota.set(rem, atMs);` |
| `sync-matches/index.ts` | `Deno.serve` | `mode === 'tick' ? tick() : mode === 'schedule' ? syncSchedule() : syncLive()`. `live` elle tetikleme ve `skor-sync-cleanup` için aynen kalır. |
| `sync-matches/index.ts` | yeni `tick()` | Aşağıdaki akış. |
| `sync-matches/index.ts` | `syncLive()` | Dönüşte `live: liveIds.size` zaten var; değişiklik yok. |
| `sync-nba/index.ts` | `Deno.serve` | `mode === 'tick'` → `nbaTick()`; diğer modlar bugünkü zincirle (`enrichFinished`, `mirrorLogosSafe`). |
| `sync-nba/index.ts` | yeni `nbaTick()` | Aynı akış; `poll` ise `syncLive()` + `enrichFinished()` + `mirrorLogosSafe()`; değilse `shouldEnrichOnly` → `claimEnrich('nba', 30·60 − 30)` → yalnız `enrichFinished()` (canlı liste yok, `log_sync_poll` reason `enrich`). |
| `_shared/teamEvents.ts` | `notifyKickoffs` | Değişiklik zorunlu değil. Futbol `maxMinute` 35 kalır (eski sürüme dönüşte de güvenli). |
| `package.json` | `deploy:functions` | Değişmez (aynı fonksiyonlar). |

**`tick()` akışı (futbol; NBA aynı, `seedNbaQuota`/`lastNbaQuota`, `primeQuota` yok):**
```ts
async function tick() {
  const now = Date.now();
  const state = await readSyncState('football');
  if (!state) return { tick: 'no_state' };                       // 0023 kurulmadı: API çağrılmaz
  if (state.remaining !== null && state.remainingAtMs !== null && utcDay(state.remainingAtMs) === utcDay(now)) {
    seedQuota(state.remaining, state.remainingAtMs);
  }
  if (!PAID && (state.remainingAtMs === null || now - state.remainingAtMs > QUOTA_TTL_MS)) await primeQuota(KEY);
  const remaining = lastQuotaRemaining();                         // bugünkü değer ya da null
  const candidates = await loadCandidates('football', nextUtcMidnight(now));
  const d = decidePoll({ sport: 'football', nowMs: now, lastPollMs: state.lastPollMs, remaining, candidates, paid: PAID });
  await recordState('football', d, remaining);
  if (!d.poll) return { tick: d.reason, gap: d.gapMin, next: d.nextDueMs && new Date(d.nextDueMs).toISOString() };
  const minGapSec = PAID ? 50 : DEFAULT_CFG.football.minGapMin * 60 - 30;
  if (!(await claimPoll('football', minGapSec, d.reason))) return { tick: 'claimed_elsewhere' };
  const before = lastQuotaRemaining();
  const r = await syncLive();
  const after = lastQuotaRemaining();
  await recordState('football', d, after);
  await logPoll('football', d.reason, d.gapMin, before, after, r.live);
  return { tick: d.reason, gap: d.gapMin, ...r };
}
```
(`utcDay` ve `QUOTA_TTL_MS` `_shared/quota.ts`'ten.)

#### Log kontrol planı
**A. Yayın günü (deploy + migration'dan sonraki ilk 2 saat):**
1. `select jobname, schedule, active from cron.job order by jobname;` → `skor-sync-tick`, `nba-sync-tick`, `skor-sync-log-cleanup` var; `skor-sync-live`, `nba-sync-live` yok.
2. `select * from cron.job_run_details where jobid in (select jobid from cron.job where jobname like '%-tick') order by start_time desc limit 20;` → hepsi `succeeded`.
3. Edge Function loglarında `[sync-matches] tick ok` satırları; maçsız saatte `"tick":"no_window"`.
4. `select * from public.sync_state;` → `last_reason`, `next_due_at`, `remaining` doluyor.

**B. İlk 24 saat (kabul kapısı; aşama 1 metni ancak bu geçerse yayına girer):**
```sql
-- Spor başına günlük yoklama ve istek sayısı (UTC günü)
select sport, polled_at::date as gun, count(*) as yoklama, sum(requests) as istek,
       min(remaining_after) as en_dusuk_kalan
  from public.sync_poll_log group by 1, 2 order by 2 desc, 1;

-- Canlı maç varken ardışık yoklama aralıkları (dk): medyan ve %90 (KPI 13'ün sunucu tarafı)
with p as (
  select sport, polled_at, live_count,
         extract(epoch from polled_at - lag(polled_at) over (partition by sport order by polled_at)) / 60 as ara_dk
    from public.sync_poll_log where reason <> 'enrich'
)
select sport,
       percentile_cont(0.5) within group (order by ara_dk) as medyan_dk,
       percentile_cont(0.9) within group (order by ara_dk) as p90_dk,
       count(*) as n
  from p where live_count > 0 and ara_dk is not null and polled_at > now() - interval '24 hours'
 group by 1;

-- Neden dağılımı
select sport, reason, count(*) from public.sync_poll_log
 where polled_at > now() - interval '24 hours' group by 1, 2 order by 1, 3 desc;
```
Kabul eşikleri: (1) spor başına günlük istek ≤ 100 − rezerv ve `en_dusuk_kalan` ≥ rezerv; (2) maç olmayan saatlerde `sync_poll_log` satırı yok (yalnız `enrich`); (3) futbol maç günü medyan ≤ 10 dk (bütçe izin verdiğinde; pazarlama KPI 13 hedefi); (4) en az bir takip edilen maçta `milestone` kaydı başlama, devre arası ve maç sonu anlarına düşüyor; (5) `budget_exhausted` kararı yok ya da yalnız gece yarısına < 1 saat kala.

**C. 7 gün (pazarlama §4.9 aşama 2 kapısı):** B'deki medyan sorgusu 7 günlük pencereyle, spor başına. Ayrıca istemci tarafı tazelik: `matches.updated_at` yalnız son değeri tuttuğu için KPI 13 bu tablodan ölçülür (canlı maç olan yoklamalar = "Son güncelleme" değişimleri). Sonuç pazarlamaya verilir; "genellikle ~X dk" metni X = yukarı yuvarlanmış medyan.

**Geri dönüş tetikleyicileri:** spor başına günlük istek > 94, bir günde iki kez `budget_exhausted` (gece yarısından > 1 saat önce), ya da canlı maçta 30 dk'dan uzun yoklama boşluğu (`ara_dk > 35`, `budget_exhausted` olmadan). Bunlardan biri olursa migration sonundaki GERİ DÖNÜŞ bloğu çalıştırılır ve istemci metni aşama 0'a döner.

#### İstemci metni (pazarlama §4.9)
| Yer | Şimdi (aşama 0) | Aşama 1 (F12b yayında, B kapısı geçti) |
|---|---|---|
| `src/app/index.tsx` Canlı filtresi notu (`styles.freshNote`) | `ⓘ Ücretsiz veri kaynağı nedeniyle canlı skorlar ~30 dk aralıkla güncellenir; her maçta son güncelleme saati yazar.` | `ⓘ Maç saatlerinde daha sık güncellenir; her maçta son güncelleme saati yazar.` |
| `src/components/MatchRow.tsx:110`, `src/app/match/[id].tsx:352` (yalnız kod yorumu) | `ücretsiz planda canlı skor ~30 dk'da bir güncellenir` | `canlı skor aralığı maç saatlerinde bütçeye göre 4-30 dk (F12b); gecikme gizlenmez` |
| `e2e/lineup_ui.mjs:29` | `getByText('~30 dk aralıkla güncellenir', …)` | `getByText('Maç saatlerinde daha sık güncellenir', { exact: false })` |

Kurallar: aşama 1 metninde dakika rakamı, "en geç", "anlık", "dakika dakika" yok. Rakip karşılaştırması yok. Metin değişikliği ayrı bir OTA'dır ve **B kapısı geçtikten sonra** yayınlanır (sunucu değişikliğinden önce değil). Aşama 2 ("genellikle ~X dakikada bir") yalnız C kapısından sonra ve pazarlamanın onayıyla. İndirme sayfası SSS'i aynı gün güncellenir (pazarlama §4.9).

#### Kabul kriterleri
1. Maç penceresi dışında hiçbir tick API isteği yapmaz (`sync_poll_log`'da satır yok, yalnız NBA `enrich`).
2. Spor başına günlük istek kendi 100'ünü aşmaz; tick rezervin altına inmez (`budget_exhausted`'ta durur).
3. Takip edilen maçta başlama +2, devre arası +50 ve maç sonu +115/+125 anlarından sonraki ilk tick yoklar (bütçe ≥ rezerv iken).
4. İki tick çakışırsa yalnız biri yoklar (`claimed_elsewhere`).
5. 0023 kurulmadan deploy edilen sürüm `mode=live` ile eskisi gibi çalışır; `mode=tick` gelirse `no_state` döner ve API çağırmaz.
6. `npm run test:functions` (yeni 20 vaka dahil) ve `npm run typecheck` temiz.
7. GERİ DÖNÜŞ bloğu çalıştırılınca 0004 ritmi geri gelir; Edge Function değişikliği gerekmez.

#### Kullanıcının elle yapacakları (sıra önemli)
1. `npm run test:functions` → `npm run deploy:functions` (tick bilen sürüm).
2. `0023_smart_scheduler.sql` dosyasını SQL Editor'de çalıştır.
3. Log kontrol planı A (2 saat) ve B (24 saat).
4. B geçerse: `index.tsx` + `lineup_ui.mjs` metin değişikliği → `npm run e2e` → `npm run update:apk`. Pazarlamaya "aşama 1" bilgisi.
5. 7 gün sonra C sorgusu → pazarlamaya medyan.
6. API panosunda kota sıfırlanma saatini doğrula (⚠ UTC gece yarısı varsayımı).

---

## 5. Pazarlama ile ortak notlar

Tüm mesajlar pazarlama belgesi §8 yasaklı listesine göre kontrol edildi: "anlık/gerçek zamanlı/canlı box score" yok, fiyat ve "abone ol" yok, "ilk/tek/en iyi" yok, bahis dili yok, uydurma sayı yok. Her içerikte tek CTA kuralı korunur.

### F1 — Sabah NBA Özeti
- **Lansman mesajı (Telegram/X/WhatsApp durumu):**
  "Gece NBA maçını kaçırdın mı? Takımını Skor+'ta takip et; sabah tek bir bildirimle skor ve en skorer gelsin. Ayrıntı Box Score'da. Bildirimi istersen Ayarlar'dan kapatırsın." CTA: **İndirme sayfasına git** (`?ref=tg-digest` / `?ref=x-digest`).
- **Kısa video fikri:** Sabah kilit ekranında bildirim → dokun → Box Score (gerçek ekran kaydı).
- **Dikkat:** "Maç biter bitmez", "anında" denmez. Saat "sabah 09:45 civarı" diye verilir. Box score bazen geç dolar; "her zaman tam box score" denmez.
- **Ölçüm:**
  - Bildirim açılma: push `data.kind='nba_digest'` ile açılan maç ekranı → istemci `touch_activity` ile aynı gün aktiflik (ayrı olay tablosu yoksa: digest gönderilen kullanıcıların aynı gün `user_activity_days` oranı).
  - D7 (KPI 6): NBA takımı takip eden kohort ile etmeyen kohort karşılaştırılır.
  - Kapatma oranı: `notification_prefs.nba_digest=false` / digest alan kullanıcı. %20'yi geçerse metin veya saat gözden geçirilir (hedef değil, alarm eşiği).
  - NBA payı (KPI 7): `team_follows` sport_type='nba' oranı haftalık.

### F2 — AI Vitrini + bekleme listesi
- **Lansman mesajı:**
  "Skoru herkes görür, nedenini sen gör. Bu hafta <maç> için Türkçe AI analizini herkese açtık: maç nerede koptu, kim fark yarattı. Pro (yakında) örneği. Beğenirsen uygulamada 'Pro çıkınca haber ver'e dokun." CTA: **Bekleme listesine katıl** (uygulama içi; indirme sayfasında Google Forms aynı kalır).
- **Kart döngüsüyle bağ (pazarlama §5.1):** Vitrine alınan rapor, "Pro (yakında) örneği" etiketli karta dönüşür. Kart ile uygulamadaki rapor aynı metindir (tutarlılık, dürüstlük).
- **Dikkat:** "Tahmin eder", "kesin" yok. "AI tarafından üretildi, veriye dayanır" etiketi kartta da bulunur. Fiyat yok. Vitrin haftada en fazla 3 maç; "her maç ücretsiz AI" denmez.
- **Ölçüm:**
  - KPI 8: `pro_waitlist` toplam + Google Forms toplamı (çift sayımı önlemek için ayrı raporlanır).
  - Vitrin dönüşümü: `source='showcase'` kayıt / vitrin maçını açan kullanıcı (istemci olay tablosu yoksa: vitrin haftasındaki aktif kullanıcıya oranla yaklaşık).
  - Segment talebi: `sport` kırılımı → Pro'nun önce futbol mu NBA mi odaklı çıkacağı kararına girdi.
  - Kalite: F7 geldikten sonra vitrin raporu başına hata bildirimi.

### F3 — Paylaş + Davet kodu
- **Lansman mesajı:**
  "Artık maçı uygulamadan tek dokunuşla paylaşabilirsin. Ayarlar'da kendi davet kodun var. Arkadaşın kurup kodunu girerse ve uygulamayı en az 2 farklı gün açarsa davetin aktif sayılır. 3 aktif davette Pro satışa açılmadan önce denemeye davet edilirsin." (Süre, fiyat ve "ücretsiz Pro" yok.) CTA: **İndirme sayfasına git**.
- **Kurallar (pazarlama §4.4 ile aynı):** sahte kayıt ve kendi kendini davet sayılmaz; haftalık sıralama Telegram'da yalnız takma ad veya kodla, kişisel veri olmadan. Kod kullanıcıya ait anonim bir dizedir; sıralamada kodun yalnız ilk 3 karakteri gösterilebilir.
- **Dikkat:** Paylaşım metinleri logo veya resmî marka içermez. Bağlantı her zaman indirme sayfasıdır.
- **Ölçüm:**
  - KPI 10: sayfa analitiğinde `ref=app-share` ve `ref=invite` ziyaretleri.
  - KPI 9: `profiles.invited_by` dolu yeni hesap / tüm yeni hesap (haftalık).
  - Davet kalitesi: davetli hesapların D7'si, davetsizlerle karşılaştırılır.
  - Sayfa → kurulum: `ref=invite` ziyareti / aynı hafta `redeem_invite='ok'` sayısı (yaklaşık; APK kurulumunda mağaza atıfı yok).

### Açık konular (pazarlama ile birlikte doğrulanacak)
1. API-Sports verisinin paylaşım metninde (skor, en skorer) yeniden paylaşım koşulları ⚠ (pazarlama Ek-2). Metin yalnız temel olgu içerir; tablo veya tam box score paylaşılmaz.
2. Davet ve aktiflik verisi için KVKK aydınlatma metni ve hukukçu kontrolü ⚠.
3. Öne çıkan oyuncu listesindeki isimler ve takımlar (F1 isteğe bağlı satır) ⚠ güncel kadro.
4. Google'ın Play dışı geliştirici doğrulaması (rakip §8): F1-F3 OTA ile gelir ama yeni kurulumu etkilemez; zorunluluk gelirse büyüme kanalı F3 dahil zayıflar. Bu belgedeki hiçbir öneri o riski çözmez.

---

## Kaynaklar

- Proje içi: `docs/pazarlama-stratejisi.md` (Sürüm 2), `docs/rakip-arastirmasi.md`, `docs/reklam-fikirleri.md`, `docs/test-raporu.md`, `GELISTIRMELER.txt` §8, `supabase/migrations/0001-0016`, `docs/tasarim-rehberi.md`, `supabase/functions/_shared/notify.ts`, `teamEvents.ts`, `nbaBox.ts`, `src/lib/notifications.ts`, `src/app/*`.
- [Airship — Push bildirimlerinin spor uygulamalarında tutmaya etkisi (benchmark)](https://www.airship.com/resources/benchmark-report/how-push-notifications-impact-sports-recreation-app-retention-rates/) — yön göstergesi; rakamlar eski ve satıcı kaynaklı.
- [Airship — Mobile App Push Notification Benchmarks for 2026](https://www.airship.com/mobile-app-push-notification-benchmarks-for-2026/)
- [Airship — Cavaliers ve Kings'in push ile taraftar etkileşimi](https://airship.com/?p=1046)
- [Expo dokümanı — React Native Share API](https://docs.expo.dev/versions/latest/react-native/share/) (metin/bağlantı paylaşımı native modül gerektirmez)
- [Expo dokümanı — expo-sharing (SDK 58)](https://docs.expo.dev/versions/v58.0.0/sdk/sharing/) (dosya/görsel paylaşımı içindir; görsel kart için ileride yeni APK gerekir)
- [9to5Google — Android "advanced flow" sideload kademeli yayılımı (Ağu 2026)](https://9to5google.com/2026/08/18/google-gradually-rolling-out-androids-advanced-sideloading-ahead-of-developer-verification/) — doğrulanmamış geliştirici için 24 saat bekleme; F14 gerekçesi.
- [TechRepublic — Doğrulanmamış uygulamalarda 24 saat bekleme](https://techrepublic.com/article/news-google-android-sideloading-24-hour-wait)
- [Airship — OneFootball kısa içerik ve yıl sonu özeti](https://www.airship.com/blog/how-onefootball-builds-a-habit-of-app-engagement-with-compelling-short-form-content/) — F15 için yön göstergesi (satıcı kaynağı).
- [Rover — Takımların kişisel sezon özetleri](https://www.rover.io/blog/personalized-wrapped-app-campaigns) — F15 (satıcı kaynağı).
- Rakip araştırması §11.3-11.4 (kotayla tazelik, DB kapılı yoklama) — F12 kaynağı.

- [Google Play destek — yeni kişisel hesaplar için test şartları](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) (12 test kullanıcısı / 14 gün; §0.1)
- [ProAndroidDev — 12 test kullanıcısı rehberi](https://proandroiddev.com/how-to-get-12-testers-for-google-play-closed-testing-and-actually-pass-6a2ab52a0779)
- [API-Football fiyatlar](https://www.api-football.com/pricing) ve [rate limit](https://www.api-football.com/news/post/how-ratelimit-works) (Pro: 7.500/gün, 300/dk; RapidAPI listesinde farklı dakika sınırı görünüyor)
---

## Pazarlama değerlendirmesi

> Hazırlayan: pazarlama ajanı, 18 Kasım 2026. Bakış açısı: `docs/pazarlama-stratejisi.md` §6 (4 haftalık lansman planı) ve §7 (KPI'lar). Bu bölüm yalnız değerlendirme içerir. Kod yapılmadı.

### 1. ICE sıralaması: görüş ve son yapım sırası

İlk üçün seçimine katılıyorum: F1, F2, F3 (F4, F3'ün içinde). Ancak 4 haftalık plan ve KPI'lar açısından **sıra değişmeli**. Tek geliştirici, Hafta 2 yumuşak lansmanından önce üç özelliği birden bitiremez. Öncelik, lansmandan önce hazır olması gereken ve her yeni kullanıcıya etki eden özelliğe verilmeli.

**Puan düzeltmeleri:**

| Özellik | Önceki I×C×E | Düzeltilmiş I×C×E | Gerekçe |
|---|---|---|---|
| F3 Paylaş + Davet (F4 dahil) | 9×7×7 = 441 | **9×8×7 = 504** | Ana dağıtım kanalı WhatsApp (strateji §4.3). Metin paylaşımı çekirdek `Share` API'siyle yapılır; teknik güven yüksek. F4 olmadan KPI 6 (D7) ölçülemez ve ilk kohortun verisi kaybolur. |
| F2 AI Vitrini | 8×7×8 = 448 | **9×7×8 = 504** | Rakip araştırması §5: Türkçe NBA box score'u Sofascore ve Flashscore zaten veriyor. Gerçek fark yalnız Türkçe AI. Vitrin olmadan NBA mesajı rakipte de bulunan bir özelliğe dayanır. |
| F1 Sabah NBA Özeti | 8×8×7 = 448 | **7×8×7 = 392** | Tutma kaldıracı olarak güçlü. Ama etkisi NBA takımı takip eden kitle kadar ve bu kitle 4 haftalık pencerede henüz küçük. Etkisi lansmandan sonra büyür. |
| F5 İlk açılış takım seçimi | 7×7×8 = 392 | 7×7×8 = 392 (değişmedi) | Top-3'e girmiyor. Ama F3 ile aynı OTA'da "yan iş" olarak çıkmalı (S efor, migration yok). KPI 4 ve 5'i her kurulumda etkiler ve F1'in kitlesini büyütür. |

F3 ile F2 eşit puanda. Eşitliği bağımlılık bozar: F3 lansmandan önce gerekir (paylaşım ve ölçüm), F2 ise Hafta 3 içerik döngüsünde gerekir.

**Son yapım sırası (geliştirici için):**

1. **F3 Paylaş + Davet kodu, F4 ölçüm temeli dahil** (`0017`). Hedef: Hafta 1 sonu, en geç Hafta 2 başı. Zaman kalırsa F5 aynı OTA'da.
2. **F2 AI Vitrini + uygulama içi bekleme listesi** (`0022`). Hedef: Hafta 3'ün hafta sonu maçlarından önce.
3. **F1 Sabah NBA Özeti push'u** (`0024`; Döngü 2'de `0023`'den yeniden numaralandı). Hedef: Hafta 4. İlk etkisi Hafta 4 KPI ölçümünde görülür.

Migration numarası ile kurulum sırası aynı olmak zorunda değil; her migration idempotent. ⚠ Geliştirici doğrulamalı: `0022`, `0024`'de oluşan hiçbir nesneye bağlı değil.

### 2. Top-3 için ifade riskleri (strateji §8 yasaklı listesine göre)

#### F3 — Paylaş + Davet (skor içeren paylaşım metni)

| Metin / durum | Risk | Öneri |
|---|---|---|
| Canlı maçta paylaşım (`Son güncelleme HH:MM` ile) | §4.3 içinde çelişki var: Ekranlar "yalnız biten veya başlamamış maç" diyor, aynı satır ve Kabul/Test bölümü canlı maç metninden söz ediyor. Canlı skor ~30 dk eski olabilir; alıcı onu anlık skor sanar. | **Canlı maçta Paylaş düğmesini gizle.** En basit ve yasaklı listeyle tam uyumlu çözüm. Canlı paylaşım ücretli veri planına kadar ertelenir. |
| `Maçın oyuncusu: X (8,4)` | Puan veri sağlayıcısından geliyor. Dışarıda resmî bir ödül gibi okunabilir (resmîlik imaları yasak). | Paylaşım metninde `En yüksek puan: X (8,4)` yaz. Uygulama içi etiket ayrı konu; paylaşım metni bağlamsız dolaşır. |
| `Türkçe, reklamsız skor uygulaması` (davetiye) | Bugün doğru. Ama metin koda gömülü; reklam eklenirse OTA gelene kadar yanlış kalır. | Kalabilir. Reklam kararı alınırsa önce bu metin değişir. |
| `Aktif 3 davet → öncelikli erken erişim` | "Erken erişim" tanımsızsa tutulamayan vaat olur veya "ücretsiz Pro" diye anlaşılır. | Ayarlar kartına tek cümlelik tanım: "Pro satışa açılmadan önce denemeye davet edilirsin." Süre ve fiyat yok. "Ücretsiz Pro" hiçbir yerde geçmez. |
| Skor ve en skorer satırı | Veri sağlayıcısının yeniden paylaşım koşulu ⚠ (strateji Ek-2). | Metin temel olguyla sınırlı kalsın: skor + tek oyuncu satırı. Tablo veya tam box score paylaşılmaz. Öneri bu hâliyle uygun. |
| Kulüp adları metinde | Olgusal kullanım; logo yok. | Değişiklik yok. |

#### F2 — AI Vitrini ("Pro (yakında) örneği")

| Metin / durum | Risk | Öneri |
|---|---|---|
| `Pro (yakında) örneği` | "Yakında" tarihsiz bir vaat. Uzarsa güveni aşındırır. | Etiket kalabilir. **Hiçbir yerde tarih verilmez.** Pro 8 hafta içinde çıkmazsa etiket `Pro önizlemesi` olur. |
| `Listedesin. Pro çıktığında bildirim göndereceğiz.` | Kesin vaat. Bildirim izni kapalı kullanıcıya push gidemez. Duyuru fonksiyonu "bugün kapsam dışı". Tutulamayabilir. | `Listedesin. Pro çıktığında uygulamada duyuracağız.` Bildirim izni açıksa ek satır: `Bildirimle de haber vereceğiz.` Duyuru fonksiyonu Pro satışından **önce** yazılır; bu bir yayın ön koşuludur. |
| Vitrine maç önü raporunun ("Kırılma Senaryosu") alınması | Maç önü senaryo metni dışarıda "tahmin" gibi okunabilir. Bahis çağrışımı en ağır risk. | **Vitrine yalnız maç sonu analizi alınır** (futbol veya NBA). Maç önü raporu vitrine ve paylaşım kartına girmez. |
| AI metninin kendisi | Yasaklı kelimeler ("kesin", "garanti") AI çıktısında geçebilir. Vitrin herkese açık; hata da herkese görünür. | Geliştirici vitrine almadan önce raporu okur (§4.2 elle adım 3). `waitlistCopy` testi yalnız arayüz metnini denetliyor; vitrine alınan rapor için de aynı yasaklı kelime denetimi önerilir. F7 "Hata bildir" vitrinden kısa süre sonra gelmeli. |
| Lansman mesajı ("herkese açtık") | Uygun. | "Her maç ücretsiz AI" veya "ücretsiz Pro" diye genişletilmez. Haftada en fazla 3 maç sınırı mesajlarda da korunur. |
| Fiyat | Paywall kodunda fiyat taslakları var. | Kabul kriteri 6 ve e2e "₺/TL" kontrolü doğru; korunmalı. |

#### F1 — Sabah NBA Özeti

| Metin / durum | Risk | Öneri |
|---|---|---|
| `Box score birazdan hazır olur.` | **Yanlış olabilir.** Taslağa göre son NBA senkronu 06:30 UTC'de biter, özet 06:45 UTC'de gider. Sonraki NBA senkronu 23:00 UTC'de çalışır. Box score o gün gündüz hiç dolmayabilir. | `Box score hazır olunca maç ekranında.` Zaman vaadi yok. |
| Lansman mesajı: "sabah tek bir bildirimle skor ve en skorer gelsin" | En skorer satırı box score'a bağlı; her zaman gelmez. | "skor ve (hazırsa) en skorer". §5'teki "her zaman tam box score denmez" kuralı lansman metnine de uygulanır. |
| Başlık `Gece ne oldu? 🏀` | Sorun yok. | Değişiklik yok. |
| Öne çıkan oyuncu satırı | Oyuncu–takım bilgisi güncel olmalı ⚠. Fotoğraf yok; isim kamusal. | `app_config` listesi sezon başında ve takas döneminde kontrol edilir. |
| Saat ("09:45 civarı") | Uygun. | "Maç biter bitmez" / "anında" denmez. |

### 3. Kesilecek veya ertelenecek özellikler

| Özellik | Karar | Gerekçe |
|---|---|---|
| F11 Ana ekran widget'ı | **Ertele** (ilk zorunlu native sürüme veya Play Store'a kadar) | Yeni APK gerektirir. Lansman ayında kullanıcıya yeniden kurulum yaptırmak en pahalı adım. Efor L. |
| F10 Puan durumu | **Ertele** (ücretli veri planına kadar) | Günde ~5 istek; ortak kota zaten ~80/100 (Döngü 2 notu: kotalar ayrı çıktı, bkz. F12; erteleme kararı yine geçerli). Kota taşarsa skor senkronu zarar görür. Farklılaştırıcı değil. |
| F8 Takvime ekle | **Kes** (şimdilik) | Ücretsiz planda fikstür ufku yalnız yarın. KPI etkisi küçük. F1 ve F5 aynı tutma hedefine daha güçlü hizmet eder. |
| F9 Türk oyuncu takibi | **Ertele** (F1 verisinden sonra) | F1'in "öne çıkan oyuncu" satırı ilk ihtiyacı karşılar. Tam hâli `box_score`'a `player_id` eklemeyi gerektirir. Önce F1 kapatma oranı ve KPI 7 görülmeli. |
| F6 Yeni APK bandı + Güven ekranı | **Ertele** (ilk native değişiklikten hemen önceye) | Şu an tüm güncellemeler OTA ile geliyor; bandın göstereceği bir şey yok. Güven bilgisi şimdilik indirme sayfasında (strateji §4.1). |
| F7 AI etiketi + Hata bildir | **Kesme; F2'den hemen sonra** | Etiket F2'de zaten var. "Hata bildir" vitrin açılınca güven için gerekli. |
| F5 İlk açılış takım seçimi | **Kesme; F3 ile birlikte yan iş** | Bkz. bölüm 1. |

### 4. `docs/pazarlama-stratejisi.md` üzerinde yapılan güncellemeler (Sürüm 2.1, en az değişiklik)

- **Değişiklik notu:** Sürüm 2.1 satırı eklendi.
- **§1 Konumlandırma:** NBA varyantı ve farklılaştırıcı #1 düzeltildi. Rakip araştırması §5'e göre Türkçe NBA box score rakiplerde de var; box score artık "temel özellik", farklılaştırıcı değil. Fark: Türkçe AI yorumu (vitrinle görünür).
- **§4.4 Davet:** F3 yayına girince elle yürütülen sistemin yerini uygulama içi davet kodu alır; form alanı yedek kalır.
- **§6 4 haftalık plan:** her haftaya geliştirici hedefi eklendi: H1 F3+F4 (+F5), H2 Paylaş/davetle lansman, H3 AI Vitrini, H4 Sabah NBA Özeti ve ölçüm.
- **§7 KPI:** KPI 6 ve KPI 9'un kaynağı F4/F3 tablolarına bağlandı. Vitrin dönüşümü ve F1 kapatma oranı izleme sinyali olarak eklendi.
- **§8 Yasaklı ifadeler:** "ücretsiz Pro", "birazdan / maç biter bitmez" ve tarihli Pro vaadi eklendi. NBA tagline'ı §1 ile eşitlendi.
- **Ek:** D7 açık konusu F4'e bağlandı.

---

## Pazarlama değerlendirmesi (tur 2)

> Hazırlayan: pazarlama ajanı, 18 Kasım 2026. Sürüm 2 yapım sırasını (F12a → F3+F4+F5 → F12b → F2 → F7 → F1) kabul ediyorum. F12b'nin F3'ten sonra gelmesi lansman riskini azaltır; F12a'nın en başa alınması maliyetsiz bir kazançtır. Strateji Sürüm 2.2'ye işlendi (§4.9 tazelik mesajı, §6, §7 KPI 13-14).

**F12 için bir düzeltme:** §4.4'teki pazarlama notu "~30 dk" yerine "en geç ~30 dk" öneriyor. Bu da garanti değil: `budget_exhausted` durumunda güncelleme kota sıfırlanana kadar durur. Strateji §4.9 bu yüzden dakika rakamını yalnız ölçülmüş medyanla ve "genellikle" kelimesiyle izin veriyor. Ana ekrandaki "~30 dk aralıkla güncellenir" notu (`src/app/index.tsx`) F12b yayına girince değiştirilmeli. Yoksa uygulama ile pazarlama çelişir.

### F13 — Paylaşılan maç için web önizleme sayfası: **Tut, değiştir, öne al (F2'den sonra, F1'den önce olabilir)**
- **Neden tut:** F3 paylaşımının dönüşüm adımı. Alıcı kurulum anlatımından önce skoru görür; KPI 2 ve KPI 10'a doğrudan etki. Sayfa indirme sitesinin parçası; büyük kısmı depo dışı statik iş, pazarlama tarafı da üstlenebilir.
- **Değişiklik 1 — bağlantı biçimi baştan:** F3, bağlantıyı ilk günden `/m/?id=<id>&ref=app-share&k=<kod>` biçiminde üretsin. `/m/` sayfası hazır değilken bu adres indirme sayfasına yönlendirsin. Böylece F13 sonradan gelince OTA gerekmez ve eski paylaşımlar da önizlemeye kavuşur.
- **Değişiklik 2 — içerik sınırı:** yalnız maç adı (metin), skor, durum (MS / başlamadı / devam ediyor) ve **belirgin** "Son güncelleme HH:MM". Logo, tablo, box score yok (API-Sports şartları ⚠). Canlı maçta "Skor son güncelleme saatindeki durumdur" notu; "canlı" rozeti yok.
- **Değişiklik 3 — kurulum bölümü:** sayfanın altında indirme sayfasının güven kiti (SHA-256, VirusTotal, kurulum adımları) aynen yer alır. "Bağlantı her zaman indirme sayfasıdır" kuralı korunur; `/m/` indirme sitesinin bir sayfası sayılır.
- **Değişiklik 4 — arama motoru:** `noindex`. Maç sayfalarının dizine girmesi veri yeniden yayımı gibi görünür ve şartlar açısından risklidir.
- Derin bağlantı (`skorplus://`) "Uygulamada aç" düğmesi olarak kalsın; otomatik yönlendirme yapılmasın (uygulama yüklü değilse hata ekranı güven bozar).

### F15 — Haftalık "Takımının haftası" özeti: **Tut, değiştir, 4 haftalık pencerenin dışına ertele**
- **Neden ertele:** F1 (günlük) + "maç başladı" + F15 (haftalık) birlikte bildirim yorgunluğu riski taşır. Rakiplerde bir numaralı şikâyet bildirim spamı (rakip §2). Önce F1'in kapatma oranı görülmeli. Kapatma oranı %20'nin altındaysa F15 push'u açılır.
- **Değişiklik 1 — önce uygulama içi kart:** ilk sürüm push'suz; ana ekranda pazartesi günleri kart + F3 paylaşım metni. Push ikinci adım, varsayılan **kapalı** ve isteğe bağlı.
- **Değişiklik 2 — ifade:** "Haftanın oyuncusu" denmez (resmî ödül gibi okunur); "Haftanın en yüksek puanı" / "Haftanın en skoreri". Pazarlamada "Wrapped" kelimesi kullanılmaz (başka bir şirketin ürün adı). "Sezon özeti" denmez; yalnız 7 gün.
- **Değişiklik 3 — boş hafta:** maçı olmayan veya verisi eksik takım için kart hiç görünmez (öneride var; korunmalı). Ara dönemde "bu hafta maç yok" kartı da gösterilmez.
- Değer: paylaşılabilir haftalık içerik, Telegram pazartesi ritmine (strateji §5) iyi uyar.

### F14 — Takip yedeği / taşıma kodu: **Tut, tetikleyiciye bağla**
- **Neden tut:** SSS'teki tek dürüst ama olumsuz cevabı ("silince takipler kaybolur") olumluya çevirir. Android geliştirici doğrulaması yeniden kurulumu zorlaştırırsa tutmayı korur.
- **Neden şimdi değil:** Yeni APK aynı imzayla eskisinin üstüne kurulur ve veriyi silmez. Kayıp yalnız silme veya telefon değişiminde olur. İlk ayda kullanıcı az ve takip birikimi küçük.
- **Tetikleyici:** şu üç durumdan biri olursa F14, F1'den sonraki ilk iş olur: (a) geliştirici doğrulamasının Türkiye tarihi netleşir; (b) yeniden kurulum gerektiren bir sürüm planlanır (imza değişikliği vb.); (c) geri bildirimde "takiplerim kayboldu" en sık 3 şikâyete girer.
- **Değişiklik 1 — ad karışıklığı:** davet kodu (F3, paylaşılır) ile taşıma kodu (gizli tutulur) farklı görünmeli. Taşıma kodu ekranında "Bu kodu kimseyle paylaşma; takiplerini kopyalar." uyarısı. Biçim farkı önerilir (örn. davet 6 karakter, taşıma 8 karakter + tire).
- **Değişiklik 2 — davet sayımı:** taşıma, davet ilişkisini yeni hesaba **taşımalı, kopyalamamalı**. Eski hesap davet sayısında ikinci kez sayılmamalı. Aksi hâlde "Kurucu Destekçi" sayaçları şişer (KPI 9 bozulur, sahte davet kapısı açılır).
- **Değişiklik 3 — ifade:** "Takiplerini yeni telefona taşı." Söylenmez: "hesap yedeği", "bulut yedek", "verilerin güvende", "Pro'n taşınır".
- KVKK: taşıma kodu ve kullanım zamanı gizlilik metnine eklenir (30 gün saklama).

### Özet sıra (pazarlama görüşü)
F12a → F3+F4+F5 → F12b → F2 → F7 → F1 → **F13** → F15 (önce uygulama içi kart) → F14 (tetikleyiciyle; tetikleyici erken gelirse F13'ün önüne geçer).
