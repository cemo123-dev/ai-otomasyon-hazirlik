# Skor+ Tasarım Rehberi

Sürüm 1.0 · 18 Kasım 2026 · Hazırlayan: UI/UX tasarım ajanı
Kapsam: Expo SDK 58 / React Native uygulaması (koyu tema). Bu belge kod değiştirmez; geliştirici ajanın uygulayacağı yönü ve değişiklik listesini verir.

Kaynaklar: `src/theme.ts`, `src/components/**`, `src/app/**`, `e2e/shots/*.png`, `docs/pazarlama-stratejisi.md` (§8 yasaklı ifadeler), `docs/inovasyon-onerileri.md` (F1, F2, F3).

Ekran görüntüsü adları `e2e/shots/` altındadır (ör. `t1-liste.png`). Görüntüler 2x çözünürlüktedir (780 px = 390 pt; `n*` dosyaları 360 pt).

---

## 1. Tasarım ilkeleri

1. **Önce skor, sonra anlam.** Bir maç satırında göz sırası: durum (canlı/saat) → skor → takımlar → AI rozeti. AI yüzeyi skoru asla bastırmaz.
2. **Dürüst veri.** Veri ~30 dk gecikmeli olabilir. "Son güncelleme HH:MM" her canlı skorun yanında okunur kalır. Arayüzde "anlık", "canlı box score", "kesin", "garanti", "tahmin" geçmez. Henüz çalışmayan özellik "yakında" etiketiyle ve pasif görünür.
3. **Bir renk, bir anlam.** Yeşil = canlı / olumlu. Altın = yalnız Pro ve AI. Kırmızı = tehlike / kırmızı kart / silme. Turuncu (uyarı) = bilgi bandı ve NBA seri alarmı. Mavi/turuncu takım renkleri yalnız ev/deplasman ayrımı içindir.
4. **Tek elle, dar ekranda.** 360 pt genişlik, yazı ölçeği 1.3 ve 44 pt dokunma alanı varsayılan test koşuludur. Hiçbir metin kelime ortasından bölünmez.
5. **Sakin hareket.** Yalnız canlı nokta nabız atar. Metin yanıp sönmez. Tüm animasyonlar `useNativeDriver` ile opacity/transform kullanır ve "Hareketi azalt" açıkken durur.

---

## 2. Tasarım token'ları

Tüm token'lar `src/theme.ts` içinde kalır. Yeni dosya açılmaz. Mevcut adlar korunur; değişen değerler aşağıda **kalın** yazılmıştır.

### 2.1 Renk paleti ve kontrast

Kontrast oranları WCAG 2.1 formülüyle hesaplandı. AA eşiği: normal metin 4.5:1, büyük metin (≥18.66 px kalın veya ≥24 px) ve arayüz bileşenleri 3:1.

| Token | Bugün | Öneri | `bg` #0A0E14 üzerinde | `surface` #121821 | `surfaceAlt` #18202B | Not |
|---|---|---|---|---|---|---|
| `bg` | #0A0E14 | değişmez | – | – | – | Ekran zemini |
| `surface` | #121821 | değişmez | – | – | – | Kart zemini |
| `surfaceAlt` | #18202B | değişmez | – | – | – | Kart içi kutu, basılı durum |
| `border` | #232D3A | değişmez | 1.39 | 1.28 | 1.18 | Yalnız dekoratif ayırıcı |
| `borderStrong` | yok | **#3A4656 (yeni)** | 2.02 | 1.86 | 1.71 | Etkileşimli öğe kenarı (çip, gün düğmesi, Switch kapalı izi). Etiket metni zaten tanımladığı için 3:1 şartı aranmaz. |
| `text` | #E8EDF3 | değişmez | 16.43 | 15.14 | 13.93 | Birincil metin |
| `textMuted` | #8A97A8 | değişmez | 6.51 | 6.00 | 5.52 | İkincil metin. `proGlow` zemininde 4.45: orada kullanılmaz. |
| `textDim` | #5B6878 | **#7D8A9C** | 3.40 → **5.51** | 3.14 → **5.08** | 2.89 → **4.68** | **AA başarısız → geçer.** "Son güncelleme", box score başlıkları, yasal metin, bildirim notu bu rengi kullanıyor. |
| `live` | #2BE37A | değişmez | 11.39 | 10.50 | 9.66 | Canlı dakika, canlı skor, birincil yeşil düğme |
| `liveGlow` | rgba(43,227,122,0.18) | değişmez | (#103426 eşdeğeri: `live` 8.03, `text` 11.57, `textMuted` 4.59) | | | Seçili gün, gol satırı |
| `accent` | #4C8DFF | değişmez | 6.04 | 5.57 | 5.12 | Bağlantı, odak |
| `home` | #4C8DFF | değişmez | 6.04 | 5.57 | 5.12 | Ev sahibi. Üzerine metin: `bg` (6.04). Beyaz 3.20: **kullanılmaz**. |
| `away` | #FF7A45 | değişmez | 7.48 | 6.89 | 6.34 | Deplasman. Üzerine metin: `bg` (7.48). Beyaz 2.59: **kullanılmaz**. |
| `pro` | #F5C451 | değişmez | 11.88 | 10.95 | 10.07 | Yalnız Pro / AI |
| `proGlow` | rgba(245,196,81,0.14) | değişmez | (surface üstünde #323028: `text` 11.23, `pro` 8.12) | | | Pro kart içi kutu, AI yanıt balonu |
| `danger` | #FF4D5E | değişmez | 5.96 | 5.50 | 5.06 | Hata, kırmızı kart, silme |
| `warning` | #FFC53D | **#FFA23A** | 9.65 | 8.89 | 8.19 | Altından ayrışan turuncu-amber. Bugün `pro` ile karışıyor (`t1-liste.png`: ÖNİZLEME rozeti ile "Pro'ya geç" aynı renkte). |
| `onFill` | yok | **#0A0E14 (yeni, `bg` takma adı)** | – | – | – | Dolu renkli zemin üstündeki metin (yeşil, altın, mavi, turuncu, kırmızı) |

Dolu düğmelerde metin kontrastı: `onFill` / `live` 11.39, `onFill` / `pro` 11.88, `onFill` / `danger` 5.96. Hepsi geçer.

Kural: Renkli metin (`live`, `pro`, `danger`, `warning`, `accent`) hiçbir zaman 11 px altında kullanılmaz.

### 2.2 Tipografi ölçeği

`src/theme.ts` içine `type` nesnesi eklenir. Sistem yazı tipi kalır (yeni font yüklenmez).

```ts
export const type = {
  display:  { fontSize: 34, lineHeight: 40, fontWeight: '900' }, // Skor başlığı
  title1:   { fontSize: 26, lineHeight: 32, fontWeight: '900' }, // Paywall başlığı
  title2:   { fontSize: 21, lineHeight: 27, fontWeight: '900' }, // AI rapor manşeti
  title3:   { fontSize: 17, lineHeight: 22, fontWeight: '800' }, // CardTitle
  headline: { fontSize: 15, lineHeight: 20, fontWeight: '700' }, // Takım adı, ayar satırı başlığı
  body:     { fontSize: 15, lineHeight: 22, fontWeight: '400' }, // AI gövde metni
  bodySm:   { fontSize: 14, lineHeight: 20, fontWeight: '400' }, // Sohbet, alarm gövdesi
  label:    { fontSize: 13, lineHeight: 18, fontWeight: '700' }, // Sekme, çip, durum sütunu
  caption:  { fontSize: 12, lineHeight: 17, fontWeight: '500' }, // Açıklama, meta
  micro:    { fontSize: 11, lineHeight: 15, fontWeight: '700' }, // Kicker (BÜYÜK HARF, letterSpacing 1.1), tablo başlığı
} as const;
```

Kurallar:
- En küçük boyut 11 px. İstisna: box score mevki harfi (`pos`) 10 px kalabilir; kadro puan rozeti 9 → **10 px**.
- Rakamlar her yerde `fontVariant: ['tabular-nums']` (`font.mono`).
- Yazı ölçeği: skor (`display`), box score hücreleri ve kadro sahası `maxFontSizeMultiplier={1.3}` alır. Diğer metinler sınırsız ölçeklenir.
- Kicker metinleri `textTransform: 'uppercase'` ile yazılır. Türkçe büyük harf için kaynak metin zaten Türkçe karakterli olmalı ("İ", "Ş"); RN `uppercase` dönüşümü `i → I` hatası yapabilir. Kicker sabit metinleri koda büyük harfle yazılırsa daha güvenli olur.

### 2.3 Boşluk ölçeği

Mevcut `space(n) = n * 4` kalır. Kullanılacak adımlar: `space(1)`=4, `space(2)`=8, `space(3)`=12, `space(4)`=16, `space(5)`=20, `space(6)`=24, `space(8)`=32, `space(10)`=40, `space(16)`=64. Yarım adımlar (`1.5`, `2.5`, `3.5`) yalnız çip ve rozet iç boşluğunda kalır.

Ritim:
- Ekran kenar boşluğu: `space(4)` = 16.
- Kartlar arası: `space(4)` = 16 (maç ekranı) / `space(3)` = 12 (liste lig grupları).
- Kart iç boşluğu: `space(4)`; kart içi öğeler arası `space(3)`.
- Liste satırı: dikey `space(3)`, yatay `space(4)`.

### 2.4 Köşe yarıçapı

`radius = { sm: 8, md: 12, lg: 16, xl: 22 }` kalır. **Eklenir:** `pill: 999`. Kod içindeki `borderRadius: 999` ve `borderRadius: 12` sabitleri `radius.pill` ve `radius.md` olur.

| Öğe | Yarıçap |
|---|---|
| Kart, lig grubu | `lg` 16 |
| Skor başlığı kartı | `xl` 22 |
| Segmentli sekme kabı | `md` 12; içteki sekme `sm` 8 |
| Düğme (blok) | `md` 12 |
| Çip, rozet, hap düğme | `pill` |

### 2.5 Yükselti ve kenarlar

Koyu temada gölge yerine katman rengi kullanılır: `bg` < `surface` < `surfaceAlt`. Gölge yalnız AI yükleniyor "orb" öğesinde kalır.

| Durum | Kenar |
|---|---|
| Normal kart | 1 px `border` |
| Pro / AI kartı | 1 px `pro` (`Card accent`) |
| Seçili çip / gün | 1 px `live` (gün), dolu `text` (filtre çipi) |
| Etkileşimli, seçili değil | 1 px `borderStrong` |
| Canlı maç satırı | sol 3 px `live` şerit (bkz. 3.1) |

### 2.6 Dokunma ve hareket sabitleri

`src/theme.ts` içine eklenir:

```ts
export const hit = 44; // en küçük dokunma alanı (pt)
export const motion = { fast: 150, base: 220, pulse: 650 } as const;
```

---

## 3. Bileşen özellikleri

### 3.1 MatchRow (`src/components/MatchRow.tsx`)

Ortak düzen: `[durum 48 pt | NBA 76 pt] [takımlar flex] [skor min 28 pt] [zil 44 pt]`. Satır en az 64 pt yüksek.

| Varyant | Durum sütunu | Skor | Takım adı | Ek |
|---|---|---|---|---|
| **Canlı** | Yeşil nabız noktası + dakika (`label`, `live`, metin sabit; yalnız nokta yanıp söner) | `live`, `fontWeight 900`, 16 px | `text` 600 | Sol kenarda 3 px `live` şerit (satır `borderLeftWidth: 3, borderLeftColor: colors.live`, `paddingLeft` 13). Altta "Son güncelleme HH:MM" (`caption`, `textDim`). |
| **Bitti (MS)** | "MS" `label`, `textMuted` | `text` 800; kaybeden `textMuted` 500 | Kaybeden `textMuted` | AI rozeti: "✦ AI Analiz Hazır" (`pro`). Zil yok. |
| **Başlamadı** | Saat `label`, `text` (bugün `textMuted`; saat birincil bilgi olduğu için `text` olur) | "–" `textDim` | `text` 600 | "✦ Maç Önü AI Hazır" rozeti (varsa). Zil var. |
| **Ertelendi / iptal** | Kısa etiket (`offLabel`), `warning` 12 px, tek satır | "–" `textDim` | `textMuted` | Zil yok. Satır opacity değişmez (okunurluk). |
| **Saat belli değil (TBD)** | "—" yerine "Saat ?" değil, **"Belirsiz"** `caption` `textMuted` | "–" | `text` | – |

Zil: 44×44 kutu, ortalı 18 px simge. Kapalı durumda 🔕 yerine soluk 🔔 (`opacity 0.4`); kırmızı çizgili simge kaldırılır, "kapalı" anlamı `accessibilityLabel` ile verilir.

Lig grubu: başlık `surface`, üst köşe `lg`. **Son satırın altı da `lg` yarıçapla kapanır** (bugün açık kalıyor: `t1-liste.png`, `l1-yarin.png`).

### 3.2 Skor başlığı (`ScoreHeader` + `TeamSide`, `src/app/match/[id].tsx`)

- Kap: `surface`, `radius.xl`, `padding space(5)`, `alignItems: 'flex-start'` (bugün `center`: takım adı iki satıra inince logolar farklı yükseklikte kalıyor, `h1-kilit.png`, `n2-mac-360.png`).
- Orta sütun `alignSelf: 'center'`, `flexShrink: 0`.
- Skor: `display` 34 px. Herhangi bir skor ≥ 100 ise (NBA) **30 px**. `maxFontSizeMultiplier 1.3`.
- Takım adı: `headline` 15/800, `numberOfLines={2}`, `adjustsFontSizeToFit`, `minimumFontScale={0.8}`. Android'de `textBreakStrategy="simple"`. Hedef: "Lakesho re …" gibi kelime ortası kırılma olmaz (`n6-nba-360.png`).
- "☆ Takip et" hapı: `numberOfLines={1}`, `minHeight 32`, `hitSlop 6` (toplam ≥ 44). 360 pt'de iki satıra kırılmaz.
- Durum satırı: canlı → `LiveMinute`; bitti → "Maç Sonu" `label` `textMuted`; başlamadı → saat `title3` `text`.

### 3.3 Sekmeler (`src/components/SegmentedTabs.tsx`)

- Kap: `surface`, `radius.md`, `padding 4`, kenar `border`.
- Sekme: `minHeight 40` (kap ile toplam 48), `label` 13/700.
- Seçili: `surfaceAlt` zemin + `text`. Pro sekmesi seçili: `proGlow` zemin + `pro` metin, "✦ " öneki.
- 4 sekme 360 pt'de sığar (`n2-mac-360.png`). 5. sekme eklenirse yatay kaydırmaya geçilir; etiket kısaltılmaz.

### 3.4 Kartlar (`Card`, `CardTitle` — `src/components/ui.tsx`)

- `Card`: `surface`, `radius.lg`, `padding space(4)`, `gap space(3)`, kenar `border`. Pro kartta `accent={colors.pro}`.
- `CardTitle`: kicker `micro` (`textMuted`, büyük harf, letterSpacing 1.1), başlık `title3`.
- Kart içinde ikinci kart kullanılmaz; iç kutu `surfaceAlt` + `radius.md`.

### 3.5 Rozet ve çipler

| Öğe | Stil |
|---|---|
| `Badge` (bilgi) | Hap, 1 px renkli kenar, `micro` 11/800 (bugün 10 px → **11 px**), `paddingH 8`, `paddingV 3`. |
| `Badge filled` | Dolu renk, metin `onFill`. |
| Filtre çipi (Tümü/Canlı/Biten/Takip) | `minHeight 40`, `paddingH 14`, `label` 13/700; pasif: `surface` + `borderStrong`; seçili: `text` zemin + `onFill` metin. "Canlı" çipinde yeşil nokta 6 px. |
| Gün düğmesi | `minHeight 48`; seçili: `liveGlow` + `live` kenar + başlık `live`. |
| Alarm türü etiketi | Renk anlamı: baskı = `danger`, kırmızı kart = `danger` (bugün `pro`, **değişir**), NBA seri = `warning`, maç başladı = `live`. |

### 3.6 Düğmeler

| Tür | Zemin | Metin | Ölçü | Kullanım |
|---|---|---|---|---|
| Birincil | `live` | `onFill`, 15/800 | `minHeight 48`, `radius.md` | Tekrar dene, Kaydet |
| İkincil | `surfaceAlt`, 1 px `borderStrong` | `text`, 14/700 | `minHeight 44`, `radius.md` | Tekrar kontrol et, Listeden çık |
| Pro | `pro` | `onFill`, 15/900 | `minHeight 48`, `radius.md` | Pro kilidi, bekleme listesi |
| Pro hap (başlık) | saydam, 1 px `pro` | `pro`, 13/800 | `minHeight 36` + `hitSlop 4` | Ana ekran sağ üst |
| Tehlike | saydam, 1 px `danger` | `danger`, 14/800 | `minHeight 48` | Hesabımı sil |
| Metin bağlantısı | – | `accent` 14/700 | dokunma alanı 44 | "Listeden çık", "Gizlilik Politikası" |

Basılı durum: `opacity 0.7` veya `surfaceAlt` zemin. Pasif: `opacity 0.4` + `accessibilityState={{ disabled: true }}`.

### 3.7 Boş / hata / yükleniyor durumları

- **Yükleniyor (liste):** Ortadaki `ActivityIndicator` yerine 3 iskelet lig kartı (her biri 2 satır, `surface` blok, `surfaceAlt` çubuklar). Opacity 0.5 ↔ 1, 900 ms, native driver. "Hareketi azalt" açıkken sabit.
- **Yükleniyor (AI):** `GeneratingLoader` kalır (altın orb + adım listesi). Zaman vaadi yazmaz ("birazdan" yok).
- **Hata (tam ekran):** Sırayla: simge "⚠" 28 px `warning` → başlık `title3` "Maçlar yüklenemedi" → gövde `bodySm` `textMuted` (hata metni) → Birincil "Tekrar dene" → `caption` "Aşağı çekerek de yenileyebilirsin." Bugün tek satır metin + düğme var (`e1-hata.png`).
- **Boş liste:** Başlık `headline` + açıklama `bodySm` `textMuted` + ikincil düğme. Örnek: Canlı filtrede maç yoksa "Şu an canlı maç yok" + düğme "Tüm maçlar". Takip filtresinde: "Takip ettiğin maç yok" + "🔔 zil veya ☆ Takip et ile ekleyebilirsin."
- **Arka plan hatası (veri var, yenileme başarısız):** Liste üstünde ince bant (`FollowErrorNotice` stili), içerik kalır (`r1-arka-plan-hatasi.png` davranışı korunur).

### 3.8 Box score tablosu (`src/components/nba/BoxScoreTab.tsx`)

- Sabit ad sütunu 140 pt; diğer sütunlar yatay kaydırılır.
- **Sütun sırası:** `DK, PTS, REB, AST, FG%, 3P%, FT%, FGM, FGA, 3PM, 3PA, FTM, FTA, OREB, DREB, STL, BLK, TO, PF, +/-`. Gerekçe: Türk NBA izleyicisi ilk bakışta sayı/ribaund/asist arar; bugün PTS 19. sütunda, 360 pt'de görünmüyor (`a5-boxscore.png`).
- PTS sütunu `fontWeight 900`.
- Kaydırma ipucu: `showsHorizontalScrollIndicator` **true** + tablonun altına `caption` `textDim`: "Tabloyu yana kaydır →".
- Başlık satırı `micro` `textDim` (yeni değerle 5.08:1). Satır yüksekliği 34 → **36**, `maxFontSizeMultiplier 1.3`.
- Takımın en skoreri: ad `pro` değil **`text` + "★" öneki**. Altın Pro'ya ayrılmıştır.
- TOPLAM satırı üst kenar `borderStrong`, `fontWeight 900`.

### 3.9 AI analiz kartları (`AnalysisCards`, `NbaAnalysisCards`, `PreviewCards`, `HalftimeCards`)

- İlk kart (manşet) `Card accent={colors.pro}` + `Badge` "✦ AI …". Sonraki kartlar normal kenarlı; yalnız kicker'ları `pro`. Bugün her kart altın kenarlı (`p1-macönü.png`); altın etkisini kaybediyor.
- Manşet `title2`, gövde `body` (opacity 0.92 kaldırılır; `text` zaten yeterli).
- Her AI raporunun sonunda tek satır `caption` `textMuted`: "AI tarafından üretildi, maç verisine dayanır. Hata görürsen bildir." (F7 ile bağlantı sonra eklenir).
- Takım etiketleri ev `home`, deplasman `away` renginde; aynı kartta ikisi de bulunur.

### 3.10 Sohbet balonları (`src/components/analysis/AssistantChat.tsx`)

- Kullanıcı: sağa yaslı, `maxWidth 85%`, `surfaceAlt` zemin + 1 px `borderStrong`, `bodySm` 600, köşe `md` (sağ alt köşe 4).
- AI: sola yaslı, `maxWidth 92%`, `proGlow` zemin, metin **yalnız `text`** (`textMuted` `proGlow` üstünde 4.45: kullanılmaz), köşe `md` (sol alt köşe 4). Balon üstünde `micro` `pro` "✦ AI".
- Hata yanıtı: `surfaceAlt` + `danger` 12 px açıklama.
- Soru hakkı sayacı ("0/3 soru") sağ üstte `label` `pro`. Hak bitince giriş alanı gizlenir, yerine `caption` açıklama.
- Gönder düğmesi `minHeight 44`.

### 3.11 Ayar satırları (`src/app/settings.tsx`)

- Satır: `minHeight 64`, `paddingV space(3)`, başlık `headline`, açıklama `caption` `textMuted`.
- Switch: `trackColor={{ true: colors.live, false: colors.borderStrong }}`, `thumbColor={colors.text}`, `ios_backgroundColor={colors.borderStrong}`. Bugün Android açık durumda yeşil iz + teal başparmak var (`a1-ayarlar.png`, `n5-ayarlar-360.png`).
- "Yakında" satırı: başlık `textMuted`, Switch pasif, açıklama yerine `caption` `warning`: "Yakında: canlı veri altyapısı genişleyince açılacak."
- Bağlantı satırı (Gizlilik, KVKK): `minHeight 48`, sağda "›" `textDim`.
- Hesap kimliği: `caption` `textDim`, `selectable`.

---

## 4. Öncelikli değişiklik listesi (geliştirici için)

Tümü OTA ile gönderilebilir. Yeni paket veya native modül yok. Kullanılan API'ler: React Native çekirdeği (`Share`, `AccessibilityInfo`, `Switch`, `Animated`) ve `package.json`'da olan `expo-router`, `expo-blur`, `@react-native-async-storage/async-storage`.

Not: `expo-clipboard` ve `expo-linear-gradient` **yok**. "Kopyala" ve degrade gerektiren öneri yapılmamıştır.

| # | Öncelik | Ekran / bileşen | Dosya | Bugünkü sorun (görüntü) | Değişiklik (değerler) | Efor |
|---|---|---|---|---|---|---|
| 1 | P0 | Tema | `src/theme.ts` | `textDim` #5B6878 `surface` üstünde 3.14:1, AA başarısız ("Son güncelleme", box score başlıkları: `t1-liste.png`, `a5-boxscore.png`) | `textDim: '#7D8A9C'`. Ayrıca ekle: `borderStrong: '#3A4656'`, `onFill: '#0A0E14'`, `radius.pill: 999`, `hit = 44`, `motion`, `type` (§2.2). `warning: '#FFA23A'`. | S |
| 2 | P0 | Ana liste lig grubu | `src/app/index.tsx` | Grubun son satırının alt köşeleri kare; kart kapanmıyor (`t1-liste.png`, `l1-yarin.png`) | `renderSectionFooter` → `<View style={{ height: space(2), backgroundColor: colors.surface, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, marginBottom: space(3) }} />` | S |
| 3 | P0 | Canlı dakika | `src/components/ui.tsx` (`LiveMinute`) | Dakika metni de 0.25 opaklığa kadar yanıp sönüyor; okunmuyor | `liveText` opacity animasyonu kaldırılır (yalnız `liveDot` nabız). `still` (HT/SUSP/INT) ise nokta da sabit `opacity 1` (bugün nokta İY'de de yanıp sönüyor, `h1-kilit.png`). `AccessibilityInfo.isReduceMotionEnabled()` true ise döngü başlatılmaz. Nokta 7 → 8 px. | S |
| 4 | P0 | Canlı satır vurgusu | `src/components/MatchRow.tsx` | Canlı satır yalnız yeşil rakamla ayrışıyor (`l2-canli.png`) | Canlıda `row` stiline `borderLeftWidth: 3, borderLeftColor: colors.live, paddingLeft: space(4) - 3`; `score` canlıda `fontWeight: '900'`, `fontSize: 16`. Başlamamış maç saati `color: colors.text`. | S |
| 5 | P0 | Kadro sahası | `src/components/match/LineupTab.tsx` | Forma numarası beyaz, turuncu üstünde 2.59:1, mavi üstünde 3.20:1. Puan rozeti 9 px ve üst satırdaki ismin üstüne biniyor (`l3-kadro.png`, `n3-kadro-360.png`: "Sezer", "Demir") | `shirtText.color: colors.onFill`; `ratingDotText.fontSize: 10`; `ratingDot: { top: -6, right: -16 }`; `marker` stiline `paddingTop: space(2)`; `half.gap: space(2)`. Saha metinlerine `maxFontSizeMultiplier={1.2}`. | S |
| 6 | P0 | Skor başlığı | `src/app/match/[id].tsx` (`ScoreHeader`, `TeamSide`, styles) | Ad iki satıra inince logolar hizasız (`h1-kilit.png`, `n2-mac-360.png`); 360 pt'de "Lakesho re …" ve "Takip / et" kırılıyor (`n6-nba-360.png`) | `scoreCard.alignItems: 'flex-start'`; `scoreMid: { alignSelf: 'center', flexShrink: 0 }`; skor ≥100 ise `fontSize: 30`; `team` metnine `adjustsFontSizeToFit minimumFontScale={0.8} textBreakStrategy="simple"`; takip hapı metnine `numberOfLines={1}`, `star.minHeight: 32`, `hitSlop={6}`. | S |
| 7 | P0 | Dokunma alanları | `src/app/index.tsx`, `src/components/MatchRow.tsx`, `src/components/SegmentedTabs.tsx` | "Pro'ya geç" ~30 pt, ayar dişlisi ~26 pt, çipler ~36 pt, zil ~16 pt + hitSlop | `proBtn.minHeight: 36` + `hitSlop={4}`; `settingsBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }`; `chip.minHeight: 40` + `hitSlop={{ top: 2, bottom: 2 }}`; `bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }`; `SegmentedTabs.tab.minHeight: 40`. | S |
| 8 | P0 | Alarm renk anlamı | `src/components/alerts/AlertsFeed.tsx` | Kırmızı kart alarmı altın (`pro`) çiziliyor; Pro kilidiyle karışıyor (`t2-mac.png`, `a2-alarmlar.png`) | `KIND_COLOR.red_card: colors.danger`; `nba_run: colors.warning` (yeni turuncu). Pro kilit bağlantısı (`link`) altın kalır. | S |
| 9 | P0 | Ayar Switch'leri | `src/app/settings.tsx` | Android'de teal başparmak + yeşil iz; kapalı iz zeminde kayboluyor (`a1-ayarlar.png`) | `trackColor={{ true: colors.live, false: colors.borderStrong }}`, `thumbColor={colors.text}`, `ios_backgroundColor={colors.borderStrong}`. | S |
| 10 | P0 | Ana ekran başlığı | `src/app/index.tsx` | ÖNİZLEME rozeti başlığın ortasında yüzüyor; 360 pt'de tarih iki satır (`n1-liste-360.png`) | Rozeti marka bloğunun içine taşı: `Skor+` altındaki satır `row` olur → `[tarih][ÖNİZLEME rozeti]`, `gap space(2)`. Tarih `numberOfLines={1}`. | S |
| 11 | P1 | Pro hapı metni | `src/app/index.tsx` | "Pro'ya geç" satışta olmayan bir ürünü satın alınabilir gösteriyor; tırnak işareti ´ eğik görünüyor | Test kullanıcısı değilse etiket **"✦ Pro · yakında"**; test kullanıcısında "Pro'ya geç" kalır (düz apostrof `'`). Aktif Pro'da "✦ PRO" kalır. | S |
| 12 | P1 | Takip bandı metni | `src/app/match/[id].tsx` (`FollowBar`) | "akıllı alarmlar açık" diyor; ücretsiz veri planında baskı/kırmızı kart alarmı kapalı (`h1-kilit.png`) | `useApiPaid()` false ise: kapalı "🔔 Maçı takip et · maç başlayınca bildirim al", açık "🔔 Takip ediliyor · maç başlayınca bildirim gelir". Paid ise bugünkü metin. | S |
| 13 | P1 | Box score | `src/components/nba/BoxScoreTab.tsx` | PTS 19. sütunda, 360 pt'de görünmüyor; kaydırılabildiği belli değil; en skorer altın (`a5-boxscore.png`) | `COLS` sırası §3.8; `showsHorizontalScrollIndicator` true; altına "Tabloyu yana kaydır →"; `ROW_H = 36`; hücrelere `maxFontSizeMultiplier={1.3}`; en skorer adı `text` + "★ ". | S |
| 14 | P1 | Derin bağlantıda geri | `src/app/match/[id].tsx` | Bildirimden açılan maç ekranında geri oku yok, başlık yalnız lig adı (`a4-nba.png`, `p1-macönü.png`, `c1-sohbet.png`) | `Stack.Screen options.headerLeft`: `router.canGoBack()` false ise "‹ Maçlar" metin düğmesi (`accent` 15/700, 44 pt), `router.replace('/')`. | M |
| 15 | P1 | Hata / boş durum | `src/app/index.tsx` | Hata tek cümle + düğme; boş durum yalnız metin (`e1-hata.png`) | §3.7 düzeni: simge + başlık + gövde + düğme + çekme ipucu. Boş "Canlı" → ikincil düğme "Tüm maçlar" (`setFilter('all')`). | S |
| 16 | P1 | Sohbet | `src/components/analysis/AssistantChat.tsx` | Soru ve yanıt balonları ayırt edici değil; AI etiketi yok (`c1-sohbet.png`) | §3.10: kullanıcı balonu `borderStrong` kenar + sağ alt köşe 4; AI balonu üstünde "✦ AI" `micro` `pro`, sol alt köşe 4; `send.minHeight: 44`. | S |
| 17 | P1 | AI kartları altın yoğunluğu | `src/components/preview/PreviewCards.tsx`, `HalftimeCards.tsx` | Her kart altın kenarlı; vurgu kayboluyor (`p1-macönü.png`, `h2-rapor.png`) | Yalnız ilk (manşet) kart `accent={colors.pro}`; diğerleri normal `Card`, kicker `pro`. Kilitli eşleşme kartı `accent={colors.warning}` → normal kenar. | S |
| 18 | P1 | Rozet ve küçük metin | `src/components/ui.tsx` | `badgeText` 10 px | `fontSize: 11`, `letterSpacing: 0.5`. | S |
| 19 | P2 | Liste yükleniyor | `src/app/index.tsx` + yeni `SkeletonList` (aynı dosyada veya `src/components/`) | Boş ekranda tek dönen simge | §3.7 iskelet; native driver opacity. | M |
| 20 | P2 | Tipografi geçişi | `ui.tsx`, `MatchRow.tsx`, `[id].tsx`, `settings.tsx` | Boyutlar dosyalara dağınık (9-34 px, 14 farklı değer) | `type` token'larını yayarak kullan; davranış değişmez. | M |
| 21 | P2 | Önizleme bandı | `src/app/index.tsx` | Önizleme uyarı kartı listeyi 190 pt aşağı itiyor (`t1-liste.png`) | Tek satır: "⚠ Örnek veri · gerçek maç değil" + "Ayrıntı" aç/kapa. Renk `warning` kenar. (Yalnız önizleme kipinde görünür.) | S |
| 22 | P2 | Liste satırı tazelik metni | `src/components/MatchRow.tsx` | Her canlı satırda "Son güncelleme" tekrar ediyor | Kalır (dürüstlük ilkesi). Yalnız `textDim` yeni değerle okunur olur. Değişiklik yok; bilinçli karar. | – |

---

## 5. Yaklaşan özellik arayüzleri

Bütün metinler `docs/pazarlama-stratejisi.md` yasaklı listesine uyar: "anlık", "canlı box score", "kesin", "garanti", "tahmin", "abone ol", fiyat, tarihli Pro vaadi, "ücretsiz Pro", "Maçın oyuncusu", "resmî" yok. Kulüp, lig veya NBA logosu paylaşım içeriğine girmez.

### 5.1 Paylaş düğmesi + paylaşım metni (F3)

**Yer:** Maç ekranı üst çubuğu sağ (`Stack.Screen options.headerRight`). Metin düğmesi "Paylaş" (`accent` 15/700), 44×44 dokunma alanı. Simge kullanılmaz (emoji paylaş simgesi platformlar arası tutarsız).

**Görünürlük:**
- Görünür: biten (`MS`) ve başlamamış maç.
- Gizli: canlı maç, ertelenen/iptal maç, `EXPO_PUBLIC_DOWNLOAD_URL` boşsa.

**Davranış:** `Share.share({ message })` (React Native çekirdeği). Başarı sonrası toast yok (sistem sayfası yeter).

**Metin düzeni** (`src/lib/share.ts`, satır sırası sabit):

```
<Ev> <ev skoru>-<dep skoru> <Deplasman> (MS)
<öne çıkan satır>
<eylem cümlesi>: <indirme sayfası>?ref=app-share&k=<KOD>
```

| Durum | Örnek |
|---|---|
| NBA bitti | `Rockets 112-105 Lakers (MS)` / `En skorer: J. Smith 31 sayı, FG% 52` / `Box score Skor+'ta: <bağlantı>` |
| Futbol bitti | `Ev 2-1 Deplasman (MS)` / `En yüksek puan: X (8,4)` / `Kadro ve puanlar Skor+'ta: <bağlantı>` |
| Başlamadı | `Ev – Deplasman, bugün 21:45` / `Skor+'ta takip ediyorum: <bağlantı>` |

Kurallar: öne çıkan satır yoksa satır atlanır (boş satır kalmaz). NBA metninde futbol terimi, futbol metninde basketbol terimi yok. Bağlantı her zaman indirme sayfası.

### 5.2 AI vitrini + Pro bekleme listesi (F2)

**Ana ekran bandı** (liste üstünde, filtre çiplerinin altında):
- Yükseklik 44, `surface`, sol 3 px `pro` şerit, `radius.md`.
- Metin `label` `text`: "✦ Haftanın açık AI analizi: Ev – Deplasman" + sağda "›". Sağ uçta "×" kapat (44×44, `textMuted`). Kapatma AsyncStorage'da tutulur.

**MatchRow rozeti:** `Badge` "✦ AI açık", `color={colors.pro}`. Vitrin maçında "AI Analiz Hazır" rozetinin yerini alır (iki rozet yan yana çıkmaz).

**Maç ekranı AI sekmesi (vitrin maçı):**
1. Rapor üstünde sabit bilgi kutusu: `surfaceAlt`, `radius.md`, `padding space(3)`.
   - Satır 1 `micro` `pro`: "PRO (YAKINDA) ÖRNEĞİ · HERKESE AÇIK"
   - Satır 2 `caption` `textMuted`: "AI tarafından üretildi, maç verisine dayanır."
2. Rapor kartları (§3.9).
3. Rapor altında CTA kartı (`Card accent={colors.pro}`):
   - Kicker: "SKOR+ PRO"
   - Başlık `title3`: "Pro çıkınca haber al"
   - Gövde `bodySm` `textMuted`: "Maç sonu AI analizi, maç önü eşleşme ve taktik asistan Pro'da olacak."
   - Listede değilse → Pro düğmesi "Pro çıkınca bana haber ver".
   - Listedeyse → `bodySm` `text`: "✓ Listedesin. Pro çıktığında uygulamada duyuracağız." Bildirim izni varsa ek `caption`: "Bildirimle de haber vereceğiz." Altında metin bağlantısı "Listeden çık" (`accent`).
   - Bildirim izni yoksa ek `caption` `textMuted`: "Bildirim iznin kapalı. Duyuruyu Telegram kanalından da takip edebilirsin."
- Vitrine yalnız maç sonu analizi alınır. Maç önü raporu vitrine girmez.

**Paywall** (`src/app/paywall.tsx`, test olmayan kullanıcı) ve **PaywallGate:** Fiyat yok. Özellik listesinin altına aynı CTA kartı. Başlık "Pro abonelik çok yakında" kalır. "8 hafta içinde çıkmazsa" etiket "Pro önizlemesi" olur (pazarlama kuralı; metin sabitini tek yerde tut).

**Ayarlar:** "Pro bekleme listesi" satırı: durum `caption` ("Listedesin" / "Listede değilsin") + sağda ikincil düğme ("Katıl" / "Çık").

### 5.3 Davet kodu (F3, `src/app/settings.tsx` yeni kart)

Kart düzeni (yukarıdan aşağı):
1. `CardTitle` kicker "DAVET", başlık "Arkadaşını davet et".
2. Kod kutusu: `surfaceAlt`, `radius.md`, `padding space(4)`, ortalı. Üstte `caption` `textMuted` "Davet kodun", altında kod `title1` 26/900, `letterSpacing: 4`, `font.mono`, `selectable`. (Kopyala düğmesi yok: `expo-clipboard` paketi bulunmuyor; uzun basınca sistem seçimi çalışır.)
3. Birincil düğme "Davetiye gönder" (`Share.share`). Metin: `Türkçe, reklamsız skor uygulaması. Kurulum anlatımı burada: <bağlantı>?ref=invite&k=ABC234 — Uygulamayı açınca davet kodum: ABC234`
4. Sayaç satırı `label` `text`, rakamlar tabular: "Davetinle gelen: 4 · Aktif olan: 2". Değer sıfırsa "0" yazar; gizlenmez.
5. `caption` `textMuted`: "Aktif 3 davet → Pro satışa açılmadan önce denemeye davet edilirsin." (Süre, fiyat ve "ücretsiz Pro" yok.)
6. (Hesap 7 günden yeniyse ve kod girilmemişse) Ayırıcı + "Davet kodun var mı?" `headline` + satır: `TextInput` (`autoCapitalize="characters"`, `maxLength={6}`, `autoCorrect={false}`, `minHeight 44`, `surfaceAlt`, `borderStrong` kenar) + ikincil düğme "Kaydet". Sonuç metni girişin altında `caption`: başarı `live` "Teşekkürler, davet kaydedildi."; hata `danger` "Kod bulunamadı." / "Kendi kodunu giremezsin." / "Davet kodu yalnız ilk 7 günde girilebilir."

### 5.4 Sabah NBA özeti (F1)

- **Ayarlar:** bildirim kartına yeni satır (§3.11): simge 🏀, başlık "Sabah NBA özeti", açıklama "Takip ettiğin NBA takımı gece oynadıysa sabah 09:45 civarı tek bildirim." Varsayılan açık.
- **(Faz 2) Ana ekran kartı** (NBA seçiliyken, TSİ 06:00-14:00): `Card`, kicker "GECE NE OLDU?", her maç bir satır (`MatchRow` bitti varyantının sade hâli: skor + "En skorer: Ad 31 sayı" `caption`). Box score yoksa satır altında `caption` `textMuted` "Box score hazır olunca maç ekranında." Zaman vaadi yok.
- Bildirim gövdesi `docs/inovasyon-onerileri.md` §4.1 ve pazarlama düzeltmesine uyar: "birazdan" yerine "Box score hazır olunca maç ekranında."

---

## 6. Türkçe metin tonu

- Sen dili, kısa, sakin. Ünlem en fazla alarm gövdesinde.
- Fiil sonda, eylem net: "Tekrar dene", "Takip et", "Davetiye gönder".
- Basketbolda: sayı, ribaund, asist, çeyrek, seri. Futbolda: gol, şut, xG, devre. Karışmaz.
- Belirsizlikte zaman vermez: "hazır olunca", "genelde maç bittikten sonraki güncellemede".
- Apostrof düz `'` (U+0027) veya tipografik `’` (U+2019) olur; `´` (aksan) kullanılmaz. Ana ekran hapında bugün eğik görünen işaret düzeltilir.

---

## 7. Kabul kontrol listesi (tester için)

Cihaz/koşullar: 360×800 pt ve 390×844 pt; Android yazı ölçeği 1.0 ve 1.3; "Animasyonları kaldır" açık ve kapalı. E2E ekran görüntüleri `e2e/shots/` ile karşılaştırılır.

**Kontrast ve renk**
- [ ] `src/theme.ts` `textDim` = `#7D8A9C`, `warning` = `#FFA23A`; `borderStrong`, `onFill`, `radius.pill`, `hit`, `type` tanımlı.
- [ ] "Son güncelleme", box score başlıkları ve yasal metin `surface` üzerinde en az 4.5:1 (renk seçiciyle #7D8A9C doğrulanır).
- [ ] Kadroda forma numaraları koyu (`#0A0E14`) metin; beyaz numara kalmadı.
- [ ] Kırmızı kart alarmı kırmızı (`danger`) şeritli; altın yalnız Pro/AI öğelerinde.
- [ ] ÖNİZLEME rozeti ile Pro hapı farklı renkte (turuncu ve altın).

**Düzen (360 pt)**
- [ ] Ana ekran: tarih tek satır; ÖNİZLEME rozeti tarihin yanında.
- [ ] Her lig grubunun alt köşeleri yuvarlak.
- [ ] NBA skor başlığında ("104 : 115") takım adı kelime ortasından bölünmüyor; "☆ Takip et" tek satır.
- [ ] Skor başlığında iki logo aynı yükseklikte (ad iki satır olsa da).
- [ ] Kadroda hiçbir puan rozeti bir oyuncu adının üstüne binmiyor.
- [ ] Box score'da PTS sütunu kaydırmadan görünüyor; kaydırma çubuğu ve "Tabloyu yana kaydır →" ipucu var.
- [ ] Yatay sayfa kaydırması yok (box score tablosu hariç).

**Yazı ölçeği 1.3**
- [ ] Filtre çipleri alt satıra sarılıyor, kesilmiyor.
- [ ] Sekme etiketleri ("İstatistik", "Box Score", "✦ AI Taktik") tek satır ve okunur.
- [ ] Skor 1.3 üstüne büyümüyor (`maxFontSizeMultiplier`); başlık kartı taşmıyor.
- [ ] Ayar satırlarında Switch metinle çakışmıyor.

**Dokunma alanları**
- [ ] Ayar dişlisi, Pro hapı, zil, filtre çipleri, sekmeler, takip hapı, gönder düğmesi en az 44 pt (hitSlop dahil). Android "Erişilebilirlik Tarayıcısı" uyarı vermiyor.

**Canlı durum ve hareket**
- [ ] Canlı satırda sol yeşil şerit var; dakika metni yanıp sönmüyor, yalnız nokta.
- [ ] "Animasyonları kaldır" açıkken nokta sabit.
- [ ] Devre arasında (İY) nokta sabit.

**Durumlar**
- [ ] Ağ kapalıyken hata ekranında simge, başlık, açıklama, "Tekrar dene" ve çekme ipucu var.
- [ ] Canlı filtrede maç yokken "Tüm maçlar" düğmesi var ve çalışıyor.
- [ ] Bildirimden açılan maç ekranında "‹ Maçlar" ile ana ekrana dönülüyor.

**Metin uyumu (pazarlama §8)**
- [ ] Uygulamada "anlık", "gerçek zamanlı", "canlı box score", "kesin", "garanti", "tahmin", "abone ol" geçmiyor (`grep -ri` ile `src/`).
- [ ] Test olmayan kullanıcıda hiçbir ekranda ₺/TL fiyatı yok; ana ekran hapı "✦ Pro · yakında".
- [ ] Ücretsiz veri planında takip bandı "akıllı alarmlar açık" demiyor.
- [ ] (F3 sonrası) Paylaş canlı maçta görünmüyor; futbol metninde "Maçın oyuncusu" yok, "En yüksek puan" var.
- [ ] (F2 sonrası) Vitrin etiketinde tarih yok; "Listedesin" metni "uygulamada duyuracağız" diyor.

**Ekran okuyucu**
- [ ] Maç satırı etiketi "Ev 1, Deplasman 0, 58. dakika" biçiminde okunuyor (bugünkü davranış korunur).
- [ ] Zil: "Maçı takip et" / "Maç takibini bırak".
- [ ] Switch pasifken "(yakında)" okunuyor.

---

## Uygulama durumu

Geliştirici ajan, 18 Kasım 2026 (kalite döngüsü 3 ile birlikte). §4 tablosundaki her madde için. Kapılar: `tsc` 0 hata, `eslint src` 0 hata/uyarı, 79 Deno testi, `deno check` 7/7, `npm run e2e` 11/11 betik, `narrow_ui.mjs` 360 pt'de 7 ekranda taşma yok.

| # | Durum | Ne yapıldı (dosya:satır) / neden |
|---|---|---|
| 1 | Yapıldı | `src/theme.ts`: `textDim #7D8A9C`, `warning #FFA23A`, `borderStrong`, `onFill`, `radius.pill`, `hit`, `motion`, `type`. Eski sarı uyarı zemini `rgba(255,197,61,…)` → `rgba(255,162,58,…)` (`FollowErrorNotice.tsx`, `index.tsx`, `PreviewCards.tsx`). |
| 2 | Yapıldı | Lig grubu alt köşeleri: `src/app/index.tsx:193` (`leagueFooter`, `:269`), rehberdeki değerlerle. |
| 3 | Yapıldı | `LiveMinute` (`src/components/ui.tsx:63`): metin sabit, yalnız nokta nabız; İY/SUSP/INT'de ve "Hareketi azalt" açıkken nokta sabit (`useReduceMotion`, `AccessibilityInfo`); nokta 8 px; süre `motion.pulse`. |
| 4 | Yapıldı | `src/components/MatchRow.tsx:131` sol 3 px şerit (`paddingLeft 13`), canlı skor 16/900 (`:149`), başlama saati `text` (`:135`). Ek: satır `minHeight 64`, skor sütunu `minWidth 28`, skor yoksa "–" `textDim`, TBD'de "Belirsiz" (§3.1). |
| 5 | Yapıldı | `src/components/match/LineupTab.tsx:255-260`: `shirtText` `onFill`, puan rozeti 10 px, `top -6 / right -16`, `marker.paddingTop 8`, `half.gap 8`, saha metinlerinde `maxFontSizeMultiplier 1.2`. |
| 6 | Yapıldı (uyarlandı) | `src/app/match/[id].tsx:426` `alignItems: 'flex-start'`, `scoreMid` `alignSelf center / flexShrink 0`, ≥100 skor 30 px (`:314`, `:448`), skor `maxFontSizeMultiplier 1.3`; takım adına `adjustsFontSizeToFit minimumFontScale 0.8 textBreakStrategy="simple"` (`:363`); takip hapı `numberOfLines 1`, `minHeight 32`, `hitSlop 6` (`:436`). Uyarlama: `adjustsFontSizeToFit` web'de çalışmadığından en uzun kelime ≥9 harfse ad 13 px, ≥12 harfse 12 px yazılır (`:353`); "Lakeshore Comets" 360 pt'de artık kelime ortasından bölünmüyor (`n6-nba-360.png`). |
| 7 | Yapıldı | Ayar dişlisi 44×44 (`index.tsx:228`), Pro hapı `minHeight 36` + `hitSlop 4` (`:230`), çip `minHeight 40` + `hitSlop` (`:248`), zil 44×44 (`MatchRow.tsx:145`; satır yüksekliği değişmesin diye negatif dikey kenar boşluğu), `SegmentedTabs.tab.minHeight 40` (`SegmentedTabs.tsx:47`). Ek: gün düğmesi `minHeight 48`, pasif çip/gün kenarı `borderStrong`. |
| 8 | Yapıldı | `src/components/alerts/AlertsFeed.tsx:13` `red_card: colors.danger`; `nba_run` zaten `warning` (yeni turuncu). |
| 9 | Yapıldı | `src/app/settings.tsx:112` `trackColor`, `thumbColor`, `ios_backgroundColor`; web'de açık başparmak için `activeThumbColor` da verilir. |
| 10 | Yapıldı (uyarlandı) | ÖNİZLEME rozeti tarih satırında (`index.tsx:55`), tarih `numberOfLines 1`. Uyarlama: 360 pt'de uzun gün adı kesiliyordu ("18 Kasım Çar…"); rozet yalnız önizleme kipinde görünür, bu kipte gün adı kısa yazılır ("18 Kasım Çar"). Üretimde tam gün adı kalır. |
| 11 | Yapıldı | `index.tsx:39`: test kullanıcısı değilse "✦ Pro · yakında", test kullanıcısında "Pro'ya geç" (düz apostrof), Pro'da "✦ PRO". Önizleme verisi test kullanıcısı olduğundan ekran görüntülerinde "Pro'ya geç" görünür. |
| 12 | Yapıldı | `[id].tsx:289` ücretsiz planda (veya plan bilinmiyorken) "🔔 Maçı takip et · maç başlayınca bildirim al" / "🔔 Takip ediliyor · maç başlayınca bildirim gelir"; ücretli planda bugünkü metin (🔕 yerine 🔔). |
| 13 | Yapıldı | `src/components/nba/BoxScoreTab.tsx:22` §3.8 sütun sırası (PTS 2. sütun, 900), kaydırma çubuğu (`:151`), "Tabloyu yana kaydır →" (`:187`), `ROW_H 36` (`:192`), hücrelerde `maxFontSizeMultiplier 1.3`, en skorer `text` + "★ ", TOPLAM üst kenarı `borderStrong`. Açıklama satırı yeni sıraya göre güncellendi. |
| 14 | Yapıldı | `[id].tsx:55`, `:69`: `router.canGoBack()` false ise `headerLeft` "‹ Maçlar" (`accent` 15/700, 44 pt) → `router.replace('/')`; yükleme hatası ekranında da. `narrow_ui.mjs` derin bağlantıdan geri dönüşü dener. |
| 15 | Yapıldı | Tam ekran hata: simge + "Maçlar yüklenemedi" + hata metni + birincil "Tekrar dene" (48 pt) + çekme ipucu (`index.tsx:160-180`). Boş durumlar yeni `StateMessage` bileşeniyle (`ui.tsx:92`): Canlı'da "Şu an canlı maç yok" + "Tüm maçlar", Biten'de "Tüm maçlar", Takip'te başlık + açıklama. Arka plan hatası bandı (§3.7) da eklendi (test bulgusu 1). |
| 16 | Yapıldı | `src/components/analysis/AssistantChat.tsx`: kullanıcı balonu `borderStrong` kenar + sağ alt köşe 4 (`:121`), AI balonu üstünde "✦ AI" (`:51`, `:59`) + sol alt köşe 4, AI zemininde yalnız `text`, hata yanıtı `danger` 12 px, `send.minHeight 44` (`:153`), sayaç 13 px. |
| 17 | Yapıldı | `PreviewCards.tsx`: Kilit eşleşme (`accent warning` kaldırıldı) ve Kırılma senaryosu kartları normal kenarlı; tüm sonraki kartların kicker'ı `pro` (`CardTitle kickerColor`). `HalftimeCards.tsx` ve `AnalysisCards.tsx` / `NbaAnalysisCards.tsx` kicker'ları da `pro`; gövde `opacity 0.92` kaldırıldı; maç önü ve devre arası raporu sonunda "AI tarafından üretildi…" notu. Kilitli/erken durum kartları tek kart olduğu için altın kalır. |
| 18 | Yapıldı | `ui.tsx:141` `badgeText` 11 px, `letterSpacing 0.5`; dolu rozet metni `onFill`. |
| 19 | Atlandı | P2 (iskelet liste). Kapsam dışı. |
| 20 | Kısmi | P2. Yalnız yeni/değişen stillerde `type` değerleri kullanıldı; yaygın geçiş yapılmadı. |
| 21 | Atlandı | P2 (önizleme bandı tek satır). Yalnız önizleme kipinde görünür. |
| 22 | Değişiklik yok | Bilinçli karar (rehberdeki gibi). |

Notlar:
- Kicker'larda Türkçe büyük harf ("KILIT" → "KİLİT") denendi ama geri alındı: kaynak metni büyük harfe çevirmek e2e metin seçicilerini bozuyor (Playwright büyük/küçük harf eşleşmesinde "İ" farklı). Rehberdeki öneri gibi kicker sabitleri ileride koda büyük harfle yazılmalı.
- `onFill` değeri `bg` ile aynı olduğundan mevcut `colors.bg` metin kullanımları (paywall, PaywallGate) görsel olarak değişmedi; yalnız dokunulan dosyalarda `onFill`'e geçildi.
- Maç sonu AI raporu (`AnalysisCards`) sonunda §3.9 notu yok: ardından sohbet kartı geliyor; ayrı bir OTA'da eklenebilir.

---

## Tasarım incelemesi (tur 1)

İnceleyen: UI/UX tasarım ajanı · 18 Kasım 2026. İncelenen görüntüler (`e2e/shots/`): `t1-liste`, `n1-liste-360`, `e1-hata`, `r1-arka-plan-hatasi`, `s1-ayar-hatasi`, `a1-ayarlar`, `n2-mac-360`, `n6-nba-360`, `a5-boxscore`, `l3-kadro`, `n3-kadro-360`, `a2-alarmlar`, `c1-sohbet`, `p1-macönü`, `h2-rapor`.

### A. Onaylananlar (16 madde)

| # | Madde | Kanıt |
|---|---|---|
| 1 | Token'lar (`textDim`, `warning`, yeni token'lar) | "Son güncelleme" ve box score başlıkları okunuyor (`t1-liste`, `a5-boxscore`). ÖNİZLEME turuncu, Pro hapı altın: artık karışmıyor. |
| 2 | Lig grubu alt köşeleri | Her grup kapalı bir kart (`t1-liste`, `n1-liste-360`). |
| 3 | `LiveMinute` | Dakika metni sabit, yalnız nokta soluyor (`r1`, `a2`). İY'de nokta sabit (`h2-rapor`). |
| 4 | Canlı satır şeridi + skor | Sol yeşil şerit ve 16/900 skor var; başlama saati beyaz (`t1-liste`). |
| 5 | Kadro kontrastı ve çakışma | Forma numaraları koyu; hiçbir puan rozeti isim üstüne binmiyor (`l3-kadro`, `n3-kadro-360`). Renk notu için bkz. B-4. |
| 7 | Dokunma alanları | Dişli, Pro hapı, çip, zil ve sekme ölçüleri görüntüde uygun. Cihazda Erişilebilirlik Tarayıcısı ile ayrıca doğrulanmalı. |
| 8 | Alarm renk anlamı | Baskı ve kırmızı kart kırmızı; altın yalnız Pro kilidinde (`a2-alarmlar`). |
| 9 | Switch | Başparmak beyaz, iz yeşil; kapalı iz görünür (`a1-ayarlar`). |
| 10 | Ana ekran başlığı | ÖNİZLEME tarih satırında; 360 pt'de tek satır (`n1-liste-360`). "18 Kasım Çar" kısaltması yalnız önizleme kipinde olduğu için kabul edildi. |
| 11 | Pro hapı metni | Test kullanıcısında "Pro'ya geç", düz apostrofla (`t1-liste`). Test kullanıcısı olmayan biri için görüntü yok; tester ayrıca doğrulamalı. |
| 13 | Box score | PTS 2. sütunda ve kalın; REB/AST/FG% ilk ekranda; ★ en skorer beyaz; "Tabloyu yana kaydır →" var (`a5-boxscore`). |
| 14 | Derin bağlantıda geri | "‹ Maçlar" var (`n6-nba-360`, `c1-sohbet`, `p1-macönü`). |
| 15 | Hata / boş durum | Simge, başlık, gövde, 48 pt düğme ve çekme ipucu var (`e1-hata`). |
| 16 | Sohbet | "✦ AI" etiketi, köşe farkı ve kenarlı kullanıcı balonu var; soru ve yanıt net ayrışıyor (`c1-sohbet`). |
| 17 | AI kart altın yoğunluğu | Yalnız manşet kartı altın kenarlı; sonraki kartlar normal, kicker'ları altın (`p1-macönü`, `h2-rapor`). |
| 18 | Rozet 11 px | Okunuyor (`p1-macönü`, "HÜCUMCU +22"). |

Kısmi onay:
- **6. Skor başlığı:** Hiza düzeldi, ama iki yeni sorun var (B-1, B-2).
- **12. Takip bandı:** Görüntülerdeki metin ücretli plan metni. Ücretsiz plan metni görüntüde doğrulanamadı (B-7).

### B. Düzeltilecekler

| # | Öncelik | Dosya | Sorun (görüntü) | Değişiklik (değerler) | Efor |
|---|---|---|---|---|---|
| B-1 | P0 | `src/app/match/[id].tsx` (`TeamSide`, `ScoreHeader`) | Ad boyutu her takım için ayrı hesaplanıyor. Aynı kartta "Lakeshore Comets" 13 px, "Desert Vipers" 15 px (`n6-nba-360`); "Karadeniz FK" 13 px, "Anadolu Gücü" 15 px (`h2-rapor`). | Boyutu `ScoreHeader` içinde iki takım adı için birlikte hesapla: `nameSize = Math.min(size(home), size(away))`. Aynı değeri iki `TeamSide`'a `nameSize` prop'u olarak geçir. Kural aynı kalır: en uzun kelime ≥12 harfse 12 px, ≥9 harfse 13 px, değilse 15 px. | S |
| B-2 | P1 | `src/app/match/[id].tsx` (styles) | Takip hapları farklı yükseklikte duruyor: adı tek satır olan tarafta hap yukarıda kalıyor (`n6-nba-360`, `h2-rapor`, `p1-macönü`, `n2-mac-360`). | `scoreCard.alignItems: 'stretch'`. Takip hapını saran öğeye `marginTop: 'auto'`. `scoreMid.alignSelf: 'center'` aynen kalır. Sonuçta logolar üstte, haplar altta hizalanır. | S |
| B-3 | P0 | `src/app/settings.tsx` | Ayarlar yüklenemeyince Switch'ler **açık** görünüyor (`s1-ayar-hatasi`). Kullanıcı bilinmeyen bir durumu "açık" sanıyor. | Hata varken bildirim kartını çizme; yalnız hata kutusu ve "Tekrar dene" kalsın. Kart kalacaksa Switch'lerin yerine `caption` `textDim` "—" yaz. | S |
| B-4 | P1 | `src/components/match/LineupTab.tsx` (puan rengi işlevi) | 6.5–6.9 arası puan rozeti yeni turuncu `warning` renginde. Deplasman formaları da turuncu, rozet formayla kaynaşıyor (`l3-kadro`, alt yarı). | Orta aralık rozet zemini `colors.textMuted` (#8A97A8), metni `onFill` (6.51:1). ≥7.0 `live`, <6.5 `danger` olarak kalır. `AnalysisCards` puan çemberinde aynı eşik varsa orada da aynı değişiklik. | S |
| B-5 | P1 | `src/app/index.tsx` (arka plan hatası bandı) | Önizleme bandı ve yenileme hatası bandı alt alta iki turuncu kutu. Hata metninin tamamı kalın turuncu (`r1-arka-plan-hatasi`). Hiyerarşi yok. | Bant zemini `surface`; `borderLeftWidth: 3`, `borderLeftColor: colors.warning`; diğer kenarlar `border`; `radius.md`; `padding space(3)`. Satır 1 `label` `warning`: "⚠ Liste yenilenemedi". Satır 2 `caption` `textMuted`: "Son yüklenen maçlar gösteriliyor. Aşağı çekerek tekrar dene." | S |
| B-6 | P1 | `PreviewCards.tsx`, `HalftimeCards.tsx`, `AnalysisCards.tsx`, `NbaAnalysisCards.tsx` ve ilgili e2e seçicileri | Kicker'larda Türkçe büyük harf hatası: "KILIT EŞLEŞME" yazıyor, doğrusu "KİLİT" (`p1-macönü`). `textTransform: 'uppercase'` "i" harfini "I" yapıyor. | Kicker sabitlerini koda büyük harfle yaz ("KİLİT EŞLEŞME", "İKİNCİ YARIDA NE OLMALI?"). Bu kartlarda `textTransform` kullanma; `CardTitle`'a bir bayrak ekle (ör. `upper={false}`). E2E seçicilerini aynı değişiklikte tam metne göre güncelle. | M |
| B-7 | P1 (doğrulama) | `src/app/match/[id].tsx` (`FollowBar`) | Görüntülerde metin hâlâ "akıllı alarm ve devre arası raporu al" / "akıllı alarmlar açık" (`a2`, `p1`, `h2`). Önizleme kipinde plan ücretli sayıldığı için olabilir. | Kod değişikliği gerekmeyebilir. E2E'ye bir `paid=false` senaryosu ekle. Tester bu senaryoda ekran görüntüsü alıp "maç başlayınca bildirim" metnini doğrular. | S |
| B-8 | P2 | `src/components/match/LineupTab.tsx` | Santrforun adı ("Er") orta saha dairesinin çizgisine biniyor (`l3-kadro`, `n3-kadro-360`). | `midLine.marginVertical` değerini `space(1)`'den `space(3)`'e çıkar. | S |
| B-9 | P2 | `AnalysisCards.tsx`, `NbaAnalysisCards.tsx` | Maç sonu raporunda §3.9'daki "AI tarafından üretildi…" notu yok (uygulama durumunda da belirtilmiş). | Raporun son kartının altına, sohbet kartından önce `caption` `textMuted` ekle: "AI tarafından üretildi, maç verisine dayanır." | S |

### C. Sıradaki en değerli arayüz işleri

#### C-1 (P1) F3 Paylaş düğmesi: kesin yerleşim

- **Yer:** `src/app/match/[id].tsx` içinde `Stack.Screen options.headerRight`. Sol tarafta "‹ Maçlar" ya da sistem geri oku var, sağ taraf boş. Skor kartına konmaz: kart zaten dolu, takip hapları 360 pt'de sıkışık.
- **Görünüm:** Metin düğmesi "Paylaş", `accent`, 15/700, `minWidth 44`, `minHeight 44`, `paddingHorizontal space(2)`, `hitSlop 8`. `accessibilityLabel`: "Maçı paylaş".
- **Başlık taşması:** Uzun lig adı Paylaş ile çakışmamalı. `headerTitle` metnine `numberOfLines={1}` ve `ellipsizeMode="tail"` ver. 360 pt'de "Dünya Kupası Avrupa El…" kabul edilir.
- **Görünürlük:** Düğme yalnız biten veya başlamamış (NS/TBD) maçta çizilir. Canlı, ertelenen ve iptal edilen maçta çizilmez. `EXPO_PUBLIC_DOWNLOAD_URL` boşsa da çizilmez. Pasif hâli yoktur.
- **Davranış:** `Share.share({ message })` çağrılır. Paylaşım sayfası kapanınca ekranda geri bildirim yok. Hata sessizce loglanır.
- **Metin:** §5.1'deki düzen aynen kullanılır.
  - Futbol: "En yüksek puan: Ad (8,4)" (ondalık virgül).
  - NBA: "En skorer: Ad 31 sayı, FG% 52".
  - Öne çıkan satır yoksa atlanır.
- **Kabul:**
  - 360 pt'de başlık ve Paylaş çakışmıyor.
  - Canlı maçta düğme yok.
  - Metinde "canlı", "anlık" ve "Maçın oyuncusu" yok.
  - İndirme sayfası dışında bağlantı yok.

#### C-2 (P1) F3 Davet kartı: ayrıntılı ölçüler

Yeri: `src/app/settings.tsx`, "Takımlarım" kartının hemen altı (hesap kartından önce).

| Öğe | Stil / metin |
|---|---|
| Kart | Normal `Card`. Davet bir Pro özelliği değil; altın kullanılmaz. |
| Başlık | `CardTitle`: kicker "DAVET" (kaynakta büyük harf), başlık "Arkadaşını davet et". |
| Kod kutusu | Zemin `surfaceAlt`, `radius.md`, `paddingVertical space(4)`, ortalı. Üstte `caption` `textMuted` "Davet kodun". Kod `type.title1` 26/900, `letterSpacing 4`, `font.mono`, `selectable`. `accessibilityLabel` kodu harf harf okutur ("A B C 2 3 4"). |
| Ana eylem | Birincil (yeşil) düğme "Davetiye gönder", `minHeight 48`, tam genişlik. |
| Sayaç | `label` `text`, rakamlar tabular: "Davetinle gelen: 4 · Aktif olan: 2". Değer sıfırsa "0" yazılır; yüklenirken "—". |
| Açıklama | `caption` `textMuted`: "Aktif 3 davet → Pro satışa açılmadan önce denemeye davet edilirsin." |
| İlerleme | Sayacın altında 8 px'lik 3 nokta, aralarında `gap 6`. "Aktif olan" sayısı kadarı dolu (`live`), kalanı boş (`borderStrong`). Sayaçla aynı bilgiyi verdiği için `accessible={false}`. |
| Kod girme | Yalnız ilk 7 gün ve kod girilmemişse görünür. Ayırıcı, sonra `headline` "Davet kodun var mı?". Tek satırda iki öğe. `TextInput`: `flex 1`, `minHeight 44`, zemin `surfaceAlt`, kenar `borderStrong`, `radius.md`, `autoCapitalize="characters"`, `maxLength={6}`, `autoCorrect={false}`, placeholder "ABC234" (`textDim`). Yanında ikincil düğme "Kaydet" (`minWidth 88`), 6 karakter girilene kadar pasif. |
| Sonuç | Girişin altında `caption`, `accessibilityLiveRegion="polite"`. Başarıda `live` "Teşekkürler, davet kaydedildi." yazar ve alan gizlenir. Hatada `danger` renkte üç mesajdan biri çıkar: "Kod bulunamadı.", "Kendi kodunu giremezsin.", "Davet kodu yalnız ilk 7 günde girilebilir." |
| Hata (RPC) | Kart içinde `caption` `danger` "Davet bilgisi yüklenemedi." ve ikincil "Tekrar dene" düğmesi. Kod kutusunda "—". |

Kartta yasak ifadeler: "ücretsiz Pro", süre, tarih, fiyat, "kazan". Kopyala düğmesi yok (`expo-clipboard` paketi yok); uzun basınca metin seçilebiliyor.

#### C-3 (P1) F2 AI vitrini + bekleme listesi

§5.2 aynen geçerli. Tur 1 sonrası iki netleştirme:
- **Ortak bant bileşeni:** Ana ekran vitrin bandı, B-5'teki uyarı bandıyla aynı iskeleti kullanır (sol 3 px şerit); vitrinde şerit `pro` renginde. İki bant tek bileşen olur: `ui.tsx` içinde `InfoStrip` (`tone: 'warning' | 'pro'`, `title`, `body?`, `onPress?`, `onClose?`).
- **Tek AI rozeti:** MatchRow'da "✦ AI açık" rozeti "AI Analiz Hazır" rozetinin yerini alır. Bir satırda en fazla bir AI rozeti görünür.

#### C-4 (P2) Liste iskeleti (madde 19)

- **Dosya:** yeni `src/components/SkeletonList.tsx`, mevcut temayla.
- **Düzen:** 3 kart. Her kartta 120×14 bir başlık çubuğu ve 2 satır. Her satırda 36×12 durum çubuğu, iki adet 140×14 takım çubuğu ve 14×14 skor çubuğu var.
- **Stil:** Çubuklar `surfaceAlt`, `radius.sm`.
- **Hareket:** Tüm blok tek bir `Animated.View`; opacity 0.5 ile 1 arasında, `duration 900`, native driver. `useReduceMotion()` true ise opacity sabit 0.8.
- **Ne zaman:** Ana ekranın ilk yüklemesinde `ActivityIndicator` yerine. Aşağı çekip yenilerken (`refreshing`) gösterilmez.

#### C-5 (P2) Sabah NBA özeti ana ekran kartı (F1 faz 2)

- **Biçim:** §5.4'teki kart, `InfoStrip` değil normal `Card` olarak. Kicker "GECE NE OLDU?" (`textMuted`).
- **İçerik:** En fazla 3 maç satırı. Satırlar `MatchRow`'un sade varyantı: durum sütunu yok, skor ve `caption` olarak "En skorer: Ad 31 sayı".
- **Bağlantı:** Altta metin bağlantısı "Tüm dünkü maçlar", `setDay(-1)` çağırır.
- **Görünürlük:** Yalnız NBA seçiliyken ve TSİ 06:00–14:00 arası. Takip edilen NBA takımı yoksa kart çizilmez.

### D. Tur 2 için tester kontrolü

- [ ] B-1: İki takım adı aynı puntoda (`n6-nba-360`, `h2-rapor`).
- [ ] B-2: İki takip hapı aynı yükseklikte.
- [ ] B-3: Ayarlar yüklenemediğinde açık görünen Switch yok.
- [ ] B-4: Kadroda turuncu puan rozeti yok; rozetler gri, yeşil veya kırmızı.
- [ ] B-5: Arka plan hatası bandı sol şeritli, gövde metni `textMuted`.
- [ ] B-6: "KİLİT EŞLEŞME" ve "İKİNCİ YARIDA NE OLMALI?" doğru Türkçe büyük harfle yazılı.
- [ ] B-7: `paid=false` senaryosunda takip bandı "maç başlayınca bildirim" diyor.

---

## Uygulama durumu (tur 2)

Geliştirici ajan, 18 Kasım 2026 (kalite döngüsü 4 ile birlikte). "Tasarım incelemesi (tur 1)" §B için. Kapılar: `tsc` 0 hata, `eslint src` 0 hata/uyarı, 88 Deno testi, `deno check` 7/7, `npm run e2e` 11/11 betik, `narrow_ui.mjs` 360 pt'de 7 ekranda taşma yok.

| # | Durum | Ne yapıldı (dosya:satır) / neden |
|---|---|---|
| B-1 | Yapıldı | `src/app/match/[id].tsx:316` `nameSize = Math.min(teamNameSize(home), teamNameSize(away))`, iki `TeamSide`'a prop. Kural `teamNameSize` (`:351`): en uzun kelime ≥12 → 12, ≥9 → 13, değilse 15. Görüntü: `n6-nba-360` (iki ad 13 px), `p1-macönü`. |
| B-2 | Yapıldı | `scoreCard.alignItems: 'stretch'` (`[id].tsx:436`), hap sarmalayıcısı `starWrap { marginTop: 'auto' }` (`:446`); `scoreMid.alignSelf: 'center'` aynı. Görüntü: `n6-nba-360`, `p1-macönü`, `f2-ucretsiz-takip`. |
| B-3 | Yapıldı | `src/app/settings.tsx:93`: `loadError` varken bildirim kartı çizilmez; yalnız hata kutusu + "Tekrar dene". `e2e/settings_error_ui.mjs` hata anında anahtar olmadığını doğrular. Görüntü: `s1-ayar-hatasi`. |
| B-4 | Yapıldı | `src/components/match/LineupTab.tsx:65` orta aralık `colors.textMuted` (metin `onFill`, 6.51:1). Eşikler koddaki gibi: ≥7.5 `live`, <6.5 `danger` (rehberdeki "≥7.0" kodda 7.5; değiştirilmedi). `AnalysisCards` puan çemberi takım rengini kullanıyor, eşik yok. Görüntü: `l3-kadro`. |
| B-5 | Yapıldı | `src/app/index.tsx:152-153`: satır 1 `⚠ Liste yenilenemedi` (`warning` 13/700), satır 2 `textMuted` 12 px; bant `surface`, sol 3 px `warning` şerit, diğer kenarlar `border`, `radius.md`, `padding space(3)`. Görüntü: `r1-arka-plan-hatasi`. |
| B-6 | Yapıldı (genişletildi) | Yalnız dört AI kartında değil, tüm `CardTitle` kicker'larında: kaynak metin `toLocaleUpperCase('tr-TR')` ile büyük harf ("KİLİT EŞLEŞME", "İKİNCİ YARIDA NE OLMALI?", "DİZİLİŞ 4-3-3", "TAKTİK ASİSTANA SOR", "DİĞER", "ŞUT VERİMLİLİĞİ"…). `CardTitle` stilinden `textTransform` kaldırıldı (`src/components/ui.tsx:142`); bayrak gerekmedi. Kadro "YEDEKLER" alt başlığı da (`LineupTab.tsx:131`). E2E: `chat_ui`, `ht_ui`, `preview_ui` tam metin + `exact: true`. Görüntü: `p1-macönü`, `c1-sohbet`, `n6-nba-360`. |
| B-7 | Yapıldı | Mock `?paid=0` (ücretsiz API planı) ve `?tester=0` (test kullanıcısı değil) (`src/lib/data/mockSource.ts:94`). `e2e/preview_ui.mjs:20-35`: ana ekran hapı "✦ Pro · yakında", "Pro'ya geç" yok; takip bandı "🔔 Maçı takip et · maç başlayınca bildirim al", dokununca "🔔 Takip ediliyor · maç başlayınca bildirim gelir"; "akıllı alarm" yok. Kod değişikliği gerekmedi. Görüntü: `f1-ucretsiz-liste`, `f2-ucretsiz-takip`. |
| B-8 | Yapıldı (uyarlandı) | `space(3)` (12 px) yetmedi: daire yarıçapı 28 px olduğu için ad yine çizgiye biniyordu. Daire 48 px, `midLine.marginVertical = yarıçap + space(1)` = 28 px (`LineupTab.tsx:239`, stiller). "Er" artık daireden ayrı. Görüntü: `l3-kadro`. |
| B-9 | Yapıldı | `AiNote` (`src/components/analysis/AnalysisCards.tsx:169`): `caption` `textMuted` "AI tarafından üretildi, maç verisine dayanır."; futbol (`:163`) ve NBA (`NbaAnalysisCards.tsx:224`) raporunun son kartından sonra, sohbet kartından önce. Görüntü: `c1-sohbet`. |

Ek (test bulguları Döngü 4, tasarımı etkileyenler):
- Switch kapalı izi yeni token `colors.trackOff` #5E6B7E (surface üstünde 3.29:1; `src/theme.ts:7`). `borderStrong` yorumu güncellendi.
- Asistan öneri çipleri `minHeight 44`; maç sekmeleri 40 pt + dikey `hitSlop` 2 (44 pt).
- Maç satırı zili: etiket "Ev - Deplasman maçını takip et" / "… maçının takibini bırak"; satırda "Takip et / Takibi bırak" erişilebilirlik eylemi (iOS VoiceOver). §7 "Ekran okuyucu" maddesindeki zil metni buna göre okunmalı.
- Davet kodu örneği `ABC234` (alfabede 0, 1, I, L, O yok).

---

## Tasarım incelemesi (tur 2)

İnceleyen: UI/UX tasarım ajanı · 18 Kasım 2026. İncelenen görüntüler (`e2e/shots/`): `n6-nba-360`, `p1-macönü`, `f1-ucretsiz-liste`, `f2-ucretsiz-takip`, `r1-arka-plan-hatasi`, `s1-ayar-hatasi`, `l3-kadro`, `c1-sohbet`, `t1-liste`, `a5-boxscore`.

### A. Onaylananlar (11 madde)

| # | Madde | Kanıt |
|---|---|---|
| B-1 | İki takım adı aynı puntoda | `n6-nba-360`: iki ad 13 px. `p1-macönü`: "FC Rheinstadt" ve "Borussia Nordheim" 13 px. `a5-boxscore`: dengeli. |
| B-2 | Takip hapları aynı yükseklikte | `n6-nba-360`, `p1-macönü`, `f2-ucretsiz-takip`: haplar altta hizalı, logolar üstte. |
| B-3 | Ayar hatasında Switch yok | `s1-ayar-hatasi`: bildirim kartı çizilmiyor, yalnız hata kutusu ve "Tekrar dene" var. Kutunun stili için bkz. R-2. |
| B-4 | Kadro orta puan rengi gri | `l3-kadro`: turuncu rozet kalmadı. Gri, yeşil ve kırmızı rozetler formalardan ayrışıyor. Eşik kararı aşağıda. |
| B-5 | Arka plan hatası bandı | `r1-arka-plan-hatasi`: sol turuncu şerit, `surface` zemin, başlık turuncu, gövde `textMuted`. Önizleme bandından net ayrışıyor. |
| B-6 | Türkçe büyük harf | `p1-macönü` "KİLİT EŞLEŞME", `c1-sohbet` "TAKTİK ASİSTANA SOR", `n6-nba-360` "MAÇ ÖZETİ". Kicker'ların tümüne yayılması doğru karar. |
| B-7 | Ücretsiz plan metinleri | `f1-ucretsiz-liste`: "✦ Pro · yakında". `f2-ucretsiz-takip`: "Maçı takip et · maç başlayınca bildirim al"; "akıllı alarm" yok. |
| B-8 | Orta saha dairesi | `l3-kadro`: "Er" daireden ayrı, çizgiye binmiyor. Uyarlama kararı aşağıda. |
| B-9 | AI notu | `c1-sohbet`: "AI tarafından üretildi, maç verisine dayanır." rapordan sonra, sohbetten önce. Hizası için bkz. R-3. |
| 11 | Pro hapı (tur 1'de doğrulanamamıştı) | `f1-ucretsiz-liste`: test kullanıcısı olmayan kişide "✦ Pro · yakında"; fiyat yok. |
| 12 | Takip bandı (tur 1'de kısmi onay) | `f2-ucretsiz-takip` ile doğrulandı. |

Regresyon yok: `t1-liste` ve `a5-boxscore` tur 1'deki onaylı hâlinde.

### B. Geliştiricinin iki uyarlaması: değerlendirme

**1. Orta puan eşiği 7.5 (rehberdeki 7.0 yerine): kabul.**
- Gerekçe: 6.5–7.4 bandı futbol puanlarında en kalabalık banttır. Yeşil 7.5'ten başlayınca seyrek kalır ve "öne çıkan oyuncu" anlamı taşır. `l3-kadro`'da 22 oyuncudan 3'ü yeşil: Tekin 8.3, Coşar 7.6 ve Gök. Eşik 7.0 olsaydı yarıya yakını yeşil olurdu ve vurgu kaybolurdu.
- Renk, sayıyla aynı bilgiyi verir; renk körü kullanıcı için ek kodlama gerekmez.
- Rehber güncellemesi: tur 1 B-4'teki "≥7.0 `live`" ifadesi **"≥7.5 `live`, 6.5–7.4 `textMuted`, <6.5 `danger`"** olarak okunmalı. Aynı eşik ileride paylaşım metnindeki "En yüksek puan" satırına renk eklenirse de kullanılır.

**2. Daire 48 px, `midLine.marginVertical` = yarıçap + `space(1)` = 28 px (rehberdeki `space(3)` yerine): kabul.**
- Gerekçe: Önerdiğim `space(3)` (12 px), 56 px'lik dairenin 28 px yarıçapından küçüktü. Ad yine çizgiye binerdi; benim hesap hatam. Boşluğu yarıçaptan türetmek doğru: daire boyutu değişirse boşluk da kendiliğinden uyar.
- Not: İki yarı arasındaki boşluk 56 px oldu ve saha uzadı. Bu kabul edilir; 360 pt'de kadro zaten kaydırılan bir ekran. Daire 40 px'e düşürülürse (yarıçap 20, boşluk 24) yine yeterli olur, ama zorunlu değil.

### C. Kalan düzeltmeler

| # | Öncelik | Dosya | Sorun (görüntü) | Değişiklik (değerler) | Efor |
|---|---|---|---|---|---|
| R-1 | P1 | `src/components/match/Timeline.tsx` | Başlamamış maçta "KIRILMA ANLARI / 0 kritik olay / Henüz olay yok." yazıyor (`f2-ucretsiz-takip`). "0 kritik olay" başlık olarak boş ve soğuk. | Maç başlamadıysa (`!isLive && !isFinished`): başlık `title3` "Maç başlamadı"; gövde `bodySm` `textMuted` "Goller, kartlar ve değişiklikler maç başlayınca burada görünür." Kicker "KIRILMA ANLARI" kalır. Maç başladı ama olay yoksa başlık "Henüz olay yok"; "0 kritik olay" hiç yazılmaz. | S |
| R-2 | P2 | `src/app/settings.tsx` (ayar hata kutusu) | Hata kutusu eski stilde: tam turuncu kenar ve iki satırlık kalın turuncu cümle (`s1-ayar-hatasi`). Ana ekrandaki B-5 bandıyla tutarsız. | B-5 ile aynı iskelet: `surface` zemin, sol 3 px `warning` şerit, diğer kenarlar `border`, `radius.md`, `padding space(3)`. Satır 1 `label` `warning` "⚠ Ayarlar yüklenemedi". Satır 2 `caption` `textMuted`: hata metni. Altında ikincil "Tekrar dene" (`minHeight 44`). İki ekran için ortak `InfoStrip` bileşeni (tur 1 C-3) burada başlatılabilir. | S |
| R-3 | P2 | `src/components/analysis/AnalysisCards.tsx` (`AiNote`) | Not, ekran kenar boşluğunda duruyor (x=16 pt); kart içi metinler 32 pt'de başlıyor (`c1-sohbet`). Kartla bağı zayıf. | `AiNote` stiline `paddingHorizontal: space(4)` ekle (kart içi metin hizası). İsteğe bağlı başına "✦ " öneki ekle, rengi `textMuted` kalsın. | S |
| R-4 | P2 | `src/components/analysis/AssistantChat.tsx` | Hak bitince sayaç "0/3 soru" yazıyor (`c1-sohbet`). "0/3" hem "hiç sormadın" hem "hakkın kalmadı" diye okunabiliyor. | Sayaç metni kalan hakkı açık yazsın: "Kalan: 2/3", hak bitince "Hak doldu" (`textMuted`). Rengi `pro` kalır; hak bitince `textMuted`. | S |

Not: Tur 1 §4 madde 21 (önizleme bandının tek satıra inmesi, P2) hâlâ açık. Yalnız önizleme kipinde göründüğü için önceliği düşük kalır.

### D. F3 arayüz özelliği (son hâl, `docs/inovasyon-onerileri.md` §4.3 ve F13 kararıyla uyumlu)

Bu bölüm §5.1, §5.3 ve tur 1 C-1/C-2'nin yerine geçer. Metinler §4.3'teki "Arayüz metinleri (son hâl)" tablosuyla birebir aynıdır. Çelişki olursa §4.3'teki metin geçerlidir; bu bölüm yerleşimi ve görsel değerleri belirler.

#### D-1. Paylaş düğmesi (`src/components/ShareButton.tsx`)

**Yer:** `src/app/match/[id].tsx` içinde `Stack.Screen options.headerRight: () => <ShareButton match={match} />`. Sol tarafta `backOptions()` ("‹ Maçlar" veya sistem geri oku) aynen kalır.

**Görünürlük:** Kararı `shareKind(match)` verir.

| Maç durumu | `status_short` | Düğme |
|---|---|---|
| Bitti | FT, AET, PEN | Görünür |
| Başlamadı | NS, TBD | Görünür |
| Canlı (devre arası dahil) | 1H, HT, 2H, ET, BT, P, LIVE, INT, NBA çeyrekleri | **Gizli** (çizilmez; pasif hâli yok) |
| Ertelendi / iptal / yarıda kaldı / bilinmeyen | PST, CANC, ABD, SUSP, AWD, WO, diğer | Gizli |
| `DOWNLOAD_URL` boş | – | Gizli |

Durum yenilemeyle canlıdan bitmişe geçerse düğme aynı ekranda belirir. Ekranı yeniden açmak gerekmez, çünkü `match` değişince `headerRight` yeniden çizilir.

**Görünüm:**
- Metin "Paylaş", `colors.accent`, 15/700. Simge yok.
- `minWidth: hit`, `minHeight: hit` (44), `paddingHorizontal: space(2)`, `justifyContent: 'center'`, `hitSlop={4}`.
- Basılıyken `opacity 0.7`.
- `accessibilityRole="button"`, `accessibilityLabel="Maçı paylaş"`.

**Başlık taşması (360 pt):** "‹ Maçlar" yaklaşık 80 pt, Paylaş yaklaşık 64 pt yer tutar; başlığa yaklaşık 180 pt kalır. Başlığa `headerTitle` ile `numberOfLines={1}`, `ellipsizeMode="tail"` ver. "Dünya Kupası Avrupa El…" kabul edilir. Başlık Paylaş'ın altına girmemeli.

**Davranış:**
- `Share.share({ message })` çağrılır; yalnız `message` gönderilir, `url` alanı kullanılmaz.
- Gerekçe: Android'de `url` yok sayılır, iOS'ta metin ve bağlantı çift görünür.
- Sistem paylaşım sayfası kapanınca uygulamada toast veya geri bildirim yok.
- Hata (web'de destek yok, kullanıcı kapattı) sessizce yakalanır.

**Bağlantı biçimi (F13 kararı, OTA gerektirmesin diye ilk günden):**
```
<DOWNLOAD_URL>/m/?id=<fixture_id>&ref=app-share&k=<kod>
```
- Bu bir değişiklik. §4.3'teki satır kuralları tablosu `<url> = withRef(downloadUrl, 'app-share', inviteCode)` diyor. Bu, F13 kararıyla değişir: `share.ts`'e saf `matchLink(downloadUrl, fixtureId, code)` eklenir ve `buildShareText` bunu kullanır.
- `k` yalnız kod varsa eklenir (0017 kurulmamışsa veya kod yüklenmediyse yoktur).
- `DOWNLOAD_URL` sonunda `/` olsun ya da olmasın tek `/m/` üretilir. Mevcut sorgu ve `#` parçası `URL` API ile korunur (`withRef` ile aynı kural).
- `/m/` sayfası hazır olana kadar indirme sitesi bu adresi indirme sayfasına yönlendirir; bu iş depo dışında, pazarlamanın sahasında.
- Deno testine iki satır eklenir:
  - `matchLink('https://x.dev/skor', 42, 'ABC234')` sonucu `https://x.dev/skor/m/?id=42&ref=app-share&k=ABC234` olmalı.
  - `matchLink('https://x.dev/skor/', 42, null)` sonucu `https://x.dev/skor/m/?id=42&ref=app-share` olmalı.
- **Davet bağlantısı bu biçimi kullanmaz.** Davette `withRef(DOWNLOAD_URL, 'invite', code)` aynen kalır, yani `<DOWNLOAD_URL>?ref=invite&k=<kod>`.

**Metin düzeni:** §4.3 tablosu aynen geçerli. Satır sırası sabit, eksik satır boş satır bırakmaz.
```
Rockets 112-105 Lakers (MS)
En skorer: J. Smith 31 sayı, FG% 52
Box score Skor+'ta: https://…/m/?id=123&ref=app-share&k=ABC234
```
```
Ege Yıldızı 2-1 Boğaziçi SK (MS, uzatma)
En yüksek puan: A. Yılmaz (8,4)
Kadro ve puanlar Skor+'ta: https://…/m/?id=456&ref=app-share&k=ABC234
```
```
Marmara Gençlik – Kapadokya SK, bugün 19:00
Skor+'ta takip ediyorum: https://…/m/?id=789&ref=app-share&k=ABC234
```
Metinde "canlı", "anlık", "Maçın oyuncusu", logo ve resmîlik iması yok (`BANNED_SHARE_TERMS`). NBA metninde futbol terimi yok.

#### D-2. Davet kartı (`src/components/InviteCard.tsx`)

**Yer:** `src/app/settings.tsx`, `<FollowedTeams />` ile `<AccountCard />` arası. Ayarlar yüklenemediğinde (B-3 durumu) davet kartı ayrı veri kullandığı için yine görünür.

**Ne zaman çizilir:**

| Durum | Görünüm |
|---|---|
| `DOWNLOAD_URL` boş | Kart yok |
| `invite === null` (0017 kurulmamış / RPC yok) | Kart yok (konsolda yalnız uyarı) |
| İlk yükleme | Kart çizilir. Kod kutusunda "— — —" (`textDim`), sayaçta "—". "Davetiye gönder" pasif (`opacity 0.4`, `accessibilityState={{ disabled: true }}`). |
| Yükleme hatası (ağ) | Kart içinde B-5 tipi bant: "⚠ Davet bilgisi yüklenemedi" ve ikincil "Tekrar dene". |
| Hazır | Aşağıdaki düzen |

**Düzen (yukarıdan aşağı, kart içi `gap space(3)`):**

1. **Başlık:** `CardTitle kicker="DAVET" title="Arkadaşını davet et"`. Kicker kaynakta büyük harf. Kart normal kenarlı; davet Pro özelliği değil, altın kullanılmaz.
2. **Kod kutusu:**
   - Zemin `surfaceAlt`, `radius.md`, `paddingVertical: space(4)`, ortalı.
   - Üst satır `caption` `textMuted`: "Davet kodun".
   - Kod `type.title1` (26/32/900), `font.mono`, `letterSpacing: 4`, `color: colors.text`, `selectable`.
   - Okunurluk için kod 3+3 gruplanır: ekranda "ABC 234" görünür (`selectable` tek `Text`, gruplar arası tek boşluk). Kopyalanan metindeki boşluk sorun değil, çünkü `normalizeInviteInput` boşlukları atar.
   - `accessibilityLabel`: "Davet kodun A B C 2 3 4" (harf harf).
   - Alfabe (`INVITE_ALPHABET`): `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. 0/O, 1/I/L karışmadığı için ekranda ayrıca açıklama gerekmez.
3. **Ana eylem:** birincil düğme "Davetiye gönder".
   - Zemin `live`, metin `onFill`, 15/800, `minHeight 48`, tam genişlik, `radius.md`.
   - `Share.share({ message: buildInviteText(DOWNLOAD_URL, code) })`.
   - Metin: `Türkçe, reklamsız skor uygulaması. Kurulum anlatımı burada: <DOWNLOAD_URL>?ref=invite&k=ABC234 — Uygulamayı açınca davet kodum: ABC234`
4. **Sayaç:**
   - `label` `text`, rakamlar `font.mono`: "Davetinle gelen: {total} · Aktif olan: {active}". Sıfır da yazılır.
   - Altında 3 nokta: 8 px, `gap 6`; ilk `min(active, 3)` nokta `live`, kalanı `borderStrong`; `accessible={false}`.
5. **Açıklamalar:** `caption` `textMuted`, iki satır.
   - "Aktif 3 davet → Pro satışa açılmadan önce denemeye davet edilirsin."
   - "Aktif: uygulamayı en az 2 farklı gün açan davetli."
6. **Kod girme** (yalnız `invite.canRedeem`: ilk 7 gün ve kod girilmemiş):
   - Üstte 1 px `border` ayırıcı. Başlık `headline`: "Davet kodun var mı?".
   - Satır (`flexDirection: 'row'`, `gap space(2)`): `TextInput` ve "Kaydet".
   - `TextInput` özellikleri:
     - Görünüm: `flex: 1`, `minHeight: 44`, zemin `surfaceAlt`, kenar 1 px `borderStrong` (odakta `accent`), `radius.md`, `paddingHorizontal: space(3)`, `font.mono`, 16 px, `letterSpacing: 2`, `color: colors.text`.
     - Giriş: `autoCapitalize="characters"`, `autoCorrect={false}`, `autoComplete="off"`, `maxLength={8}` (yapıştırılan "ABC 234" boşluk dahil sığsın).
     - Placeholder "ABC234" (`placeholderTextColor={colors.textDim}`), `accessibilityLabel` "Davet kodu".
   - "Kaydet": ikincil düğme (`surfaceAlt`, `borderStrong`, `text` 14/700), `minWidth: 88`, `minHeight: 44`. `isValidInviteCode(normalizeInviteInput(value))` true olana kadar pasif (`opacity 0.4`, `accessibilityState={{ disabled: true }}`). Gönderim sırasında içinde küçük `ActivityIndicator`.
   - Girdi yazılırken değiştirilmez (kullanıcının yazdığı kalır); doğrulama `normalizeInviteInput` ile yapılır.
   - Alfabede olmayan karakter (0, 1, I, L, O, Türkçe harf) yazılırsa `caption` `textMuted` ipucu: "Kodlarda 0, 1, I, L ve O harfi yoktur." Hata rengi kullanılmaz; bu bir ipucu.
   - Sonuç satırı: `caption`, `accessibilityLiveRegion="polite"`. Metinler §4.3 tablosundan:

   | Sonuç | Metin | Renk | Sonrası |
   |---|---|---|---|
   | `ok` | Teşekkürler, davet kaydedildi. | `live` | Giriş satırı gizlenir, `reload()` |
   | `invalid` | Kod bulunamadı. | `danger` | Girdi kalır |
   | `self` | Kendi kodunu giremezsin. | `danger` | Girdi kalır |
   | `too_late` | Davet kodu yalnız ilk 7 günde girilebilir. | `textMuted` | Giriş satırı gizlenir |
   | `already` | Bu hesapta zaten bir davet kodu kayıtlı. | `textMuted` | Giriş satırı gizlenir |
   | `not_allowed` | Bu kod bu hesapta kullanılamaz. | `danger` | Girdi kalır |
   | `rate_limited` | Çok fazla deneme yapıldı. Yarın tekrar dene. | `danger` | "Kaydet" pasif kalır |
   | ağ / oturum | `friendlyError(e, 'Kod kaydedilemedi. Tekrar dene.')` | `danger` | Girdi kalır |

**Kartta olmayacaklar:** Kopyala düğmesi (`expo-clipboard` yok; uzun basınca seçim çalışır). "Ücretsiz Pro", süre, tarih, fiyat, "kazan", "ödül". Altın renk.

#### D-3. F3 kabul kontrolü (tester)

- [ ] Biten (`MS`) ve başlamamış maçta başlık sağında "Paylaş" var; canlı, devre arası, ertelenen ve iptal maçta yok.
- [ ] 360 pt'de "‹ Maçlar", başlık ve "Paylaş" çakışmıyor; uzun lig adı "…" ile kesiliyor.
- [ ] Paylaşım metnindeki bağlantı `/m/?id=<fixture_id>&ref=app-share` içeriyor; kod varsa `&k=<kod>`.
- [ ] Davetiye metnindeki bağlantı `?ref=invite&k=<kod>` biçiminde (`/m/` yok).
- [ ] Ekrandaki kod `^[A-HJKMNP-Z2-9]{6}$` biçiminde (gruplama boşluğu hariç); 0, 1, I, L, O içermiyor.
- [ ] Giriş alanına " abc 234 " yazılınca "Kaydet" etkin oluyor; "ABO234" yazılınca pasif kalıyor ve ipucu çıkıyor.
- [ ] Sekiz sonuç metni tablodaki renkte; `ok`, `too_late` ve `already` sonrası giriş satırı gizleniyor.
- [ ] Yazı ölçeği 1.3'te kod kutusu taşmıyor (kod `maxFontSizeMultiplier={1.3}`), "Kaydet" alt satıra düşmüyor.
- [ ] Hiçbir metinde "ücretsiz Pro", fiyat, "canlı", "anlık", "Maçın oyuncusu" yok.
- [ ] `EXPO_PUBLIC_DOWNLOAD_URL` boşken ne "Paylaş" ne davet kartı görünüyor.

---

## Uygulama durumu (tur 3)

Geliştirici ajan, 18 Kasım 2026 (kalite döngüsü 5 ile birlikte). "Tasarım incelemesi (tur 2)" §C ve §D için. Kapılar: `tsc` 0 hata, `eslint src` 0 hata/uyarı, 113 Deno testi, `deno check` 7/7, `npm run e2e` 13/13 betik (yeni: `largefont_ui.mjs`, `share_ui.mjs`), `narrow_ui.mjs` 360 pt'de 7 ekranda taşma yok.

| # | Durum | Ne yapıldı (dosya:satır) / neden |
|---|---|---|
| R-1 | Yapıldı (genişletildi) | `src/components/match/Timeline.tsx:43`: başlamamış maçta `title3` "Maç başlamadı" + `bodySm` `textMuted` "Goller, kartlar ve değişiklikler maç başlayınca burada görünür."; kicker aynı. Başlamış ve olaysız maçta "Henüz olay yok" (gövde yok). Ek: bitmiş ve olay kaydı olmayan maçta "Henüz" yanlış olacağı için "Olay kaydı yok". "0 kritik olay" hiç yazılmaz. Görüntü: `r1-mac-baslamadi`. |
| R-2 | Yapıldı | Ortak bileşen `InfoStrip` (`src/components/ui.tsx:147`; tur 1 C-3): `surface`, sol 3 px `warning`, diğer kenarlar `border`, `radius.md`, `padding space(3)`, satır 1 turuncu "⚠ …", satır 2 `textMuted`, altta ikincil "Tekrar dene" (`minHeight 44`). Kullanım: ayar hatası (`settings.tsx:82`), ana ekran "Liste yenilenemedi" (`index.tsx:143`), davet kartı ağ hatası. Ağ hatasında satır 2 "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene." Görüntü: `s1-ayar-hatasi`, `r1-arka-plan-hatasi`. |
| R-3 | Yapıldı | `AiNote` `paddingHorizontal: space(4)` ve "✦ " öneki, renk `textMuted` (`AnalysisCards.tsx:171,175`). Görüntü: `c1-sohbet`. |
| R-4 | Yapıldı | `AssistantChat.tsx:41-49`: "Kalan: 3/3" (`pro`), hak bitince "Hak doldu" (`textMuted`). `chat_ui.mjs` "Kalan: 2/3" ve "Hak doldu"yu doğrular. Görüntü: `c1-sohbet`. |
| 21 | Yapıldı | Önizleme bandı tek satır "⚠ Örnek veri · gerçek maç değil" + "Ayrıntı"/"Gizle" (`accent`, dokunma alanı 44 pt) ile açıklama aç/kapa (`index.tsx:217`). Kenar `warning` aynı. Görüntü: `n1-liste-360`. |
| D-1 | Yapıldı | `src/components/ShareButton.tsx`; `[id].tsx:135` `headerRight`. Görünürlük `shareKind` + `getDownloadUrl()`: yalnız FT/AET/PEN ve NS/TBD. Metin "Paylaş" `accent` 15/700, `minWidth/minHeight 44`, `hitSlop 4`, basılıyken 0.7. Başlık `headerTitle` `numberOfLines={1}` + `ellipsizeMode="tail"`. Bağlantı `matchLink` (`src/lib/share.ts`) → `<DOWNLOAD_URL>/m/?id=…&ref=app-share&k=…`; iki Deno satırı birebir. TBD maç metni: "Ev – Dep, yarın, saat belli değil". Görüntü: `f3-paylas-nba`, `f3-paylas-360` (360 pt'de "‹ Maçlar", başlık, "Paylaş" ayrık). |
| D-2 | Yapıldı | `src/components/InviteCard.tsx`, Ayarlar'da Takımlarım ile Hesap arası (`settings.tsx:127`); ayarlar yüklenemese de görünür (`s1-ayar-hatasi`). Kod kutusu `surfaceAlt`, "Davet kodun", kod `title1` + mono + `letterSpacing 4`, "ABC 234", `selectable`, harf harf etiket, `maxFontSizeMultiplier 1.3`. İlk yüklemede "— — —" ve pasif düğme. "Davetiye gönder" `live`/`onFill` 48 pt. Sayaç + 3 nokta, iki açıklama satırı, kod girme (ipucu, sekiz sonuç rengi, `ok`/`too_late`/`already` sonrası giriş gizli, `rate_limited` sonrası "Kaydet" pasif). Kopyala düğmesi, altın renk yok. Görüntü: `f3-davet`, `f3-davet-kaydedildi`. |
| D-3 | e2e ile | `e2e/share_ui.mjs`: D-3 listesindeki 10 maddenin 9'u otomatik (yazı ölçeği 1.3 maddesi `largefont_ui.mjs` ile yalnız maç ekranı için; davet kartı ×1,3 elle bakılmalı). `?dl=0` ile "Paylaş" ve kart gizli. |

Ek (test bulguları Döngü 5, tasarımı etkileyenler):
- Maç sekmeleri büyük yazıda 2 satıra iner ("✦ AI / Taktik"), metin ortalı. Pro sekme ekran okuyucuda "AI Taktik, Pro".
- Skor başlığındaki takım adı sistem yazı ölçeğiyle büyümez (`maxFontSizeMultiplier` 1); 12–15 pt kalın kalır, kelime ortasından bölünmez (`lf1-mac-buyukyazi`). Tasarım isterse 1,1'e çıkarılabilir; 360 pt'de "Boğaziçi" sınırda kalır.
- Liste satırında takım adı en fazla ×1,2 (skor sütunu hizası için tek satır kalır). Olay satırında oyuncu adı ve ana ekran tarihi 2 satıra iner.
- Kadro işaretleri ekran okuyucuda tek öğe: "Demir, 1 numara, puan 6.3".

---

## Tasarım incelemesi (tur 3)

İnceleyen: UI/UX tasarım ajanı · 18 Kasım 2026. İncelenen görüntüler (`e2e/shots/`): `f3-paylas-nba`, `f3-paylas-360`, `f3-davet`, `f3-davet-kaydedildi`, `r1-mac-baslamadi`, `s1-ayar-hatasi`, `c1-sohbet`, `n1-liste-360`, `lf1-mac-buyukyazi`.

### A. Onaylananlar (7 madde)

| # | Madde | Kanıt |
|---|---|---|
| R-1 | Başlamamış maçta Timeline | `r1-mac-baslamadi`: "Maç başlamadı" ve açıklama var; "0 kritik olay" kalktı. |
| R-2 | `InfoStrip` ve ayar hatası | `s1-ayar-hatasi`: sol turuncu şerit, turuncu başlık, `textMuted` gövde, 44 pt "Tekrar dene". Ana ekran bandıyla aynı aile. |
| R-3 | AI notu hizası | `c1-sohbet`: "✦ AI tarafından üretildi…" kart içi metinle aynı hizada. |
| R-4 | Sohbet hak sayacı | `c1-sohbet`: hak bitince "Hak doldu" (`textMuted`). Belirsizlik kalktı. |
| 21 | Önizleme bandı tek satır | `n1-liste-360`: tek satır ve "Ayrıntı" bağlantısı var; liste yaklaşık 130 pt yukarı çıktı. |
| D-1 | Paylaş düğmesi | `f3-paylas-nba`, `f3-paylas-360`: başlık sağında, `accent`, 44 pt. 360 pt'de "‹ Maçlar", "NBA" ve "Paylaş" çakışmıyor. Başlamamış maçta görünür (`r1-mac-baslamadi`). Canlı maçta gizli olduğu e2e ile doğrulanıyor. |
| D-2 | Davet kartı | `f3-davet`: kod "ABC 234" (mono, aralıklı), yeşil birincil düğme, sayaç, 2/3 nokta, iki açıklama satırı, pasif "Kaydet". `f3-davet-kaydedildi`: başarıda giriş satırı gizleniyor, yeşil sonuç metni çıkıyor. `s1-ayar-hatasi`: ayarlar yüklenemese de kart görünüyor. Altın renk yok, yasaklı ifade yok. |

### B. Açık karar: skor başlığında takım adı yazı ölçeği sınırı (`TEAM_NAME_MAX_SCALE = 1`)

**Karar: kabul, iki koşulla.**

Gerekçe:
- Skor başlığında üç sütun ve iki hap 360 pt'ye sığmak zorunda. Ad sütunu yaklaşık 100 pt. "Boğaziçi" ×1,2'de bu genişliğe sığmıyor ve kelime ortasından bölünüyor. Bölünmüş bir takım adı, biraz küçük bir adtan daha kötüdür.
- Ad zaten 12–15 pt kalın (`headline`) ve logonun altında ikincil bir kimlik bilgisi. Büyük yazı kullanan kişi için birincil bilgi skor; skor ×1,3'e kadar büyüyor (`lf1-mac-buyukyazi`).
- Ad, ekranın başka yerlerinde tam ölçekle okunabiliyor: maç listesinde ×1,2, Özet metninde, çeyrek tablosunda ve ekran okuyucu etiketinde.
- Alternatifler daha kötü. ×1,1 "Boğaziçi"de sınırda kalıyor. Adı başlıktan kaldırıp yalnız kısaltma göstermek kimliği zayıflatıyor. Satır sayısını 3'e çıkarmak kartı uzatıp hapları itiyor.

Koşullar:
1. `TeamSide` kabının `accessibilityLabel` değeri tam takım adını içermeli: "Boğaziçi SK, ev sahibi". Sistem büyütmesi olmayan metin, ekran okuyucuda eksiksiz okunmalı.
2. Sınır yalnız skor başlığındaki takım adı için geçerli. Başka bir yerde `maxFontSizeMultiplier={1}` kullanılmaz. Liste satırı ×1,2 ve skor ×1,3 değerleri aynen kalır. `TEAM_NAME_MAX_SCALE` sabitinin yanına bu kapsamı anlatan tek satırlık yorum eklenir.

### C. Düzeltilecekler

| # | Öncelik | Dosya | Sorun (görüntü) | Değişiklik (değerler) | Efor |
|---|---|---|---|---|---|
| T3-1 | P0 | `src/app/match/[id].tsx` (`ScoreHeader`, styles) | Büyük yazıda "Son güncelleme 15:14" orta sütundan taşıyor ve iki takip hapının üstüne biniyor (`lf1-mac-buyukyazi`). Orta sütun dar; metin iki yana yayılıyor. | "Son güncelleme" satırını orta sütundan çıkar. `scoreCard` iki katmanlı olsun: (1) bugünkü üç sütunlu satır (`flexDirection: 'row'`, `alignItems: 'stretch'`); (2) altında tam genişlikte, ortalı satır: `caption` `textDim`, `marginTop: space(3)`, `maxFontSizeMultiplier={1.3}`, `numberOfLines={1}`. Orta sütunda yalnız skor ve durum ("Maç Sonu", dakika, saat) kalır. `scoreMid` stiline `maxWidth: '40%'`. | S |
| T3-2 | P2 | `src/components/SegmentedTabs.tsx` | Büyük yazıda Pro sekmesi "✦ AI / Taktik" diye iki satıra iniyor; diğer sekmeler tek satır (`lf1-mac-buyukyazi`). Okunuyor, ama yükseklikler karışık. | Kabul edilebilir; zorunlu değil. İyileştirme: sekme etiketlerine `maxFontSizeMultiplier={1.2}` ver ve `numberOfLines={2}` kalsın. Böylece 1,3 ölçekte yalnız en uzun etiket kırılır, diğerleri tek satırda hizalı kalır. Sekme `minHeight 40` aynen kalır. | S |
| T3-3 | P2 (elle doğrulama) | `src/components/InviteCard.tsx` | Davet kartı ×1,3'te e2e ile denenmedi (uygulama notu). | Tester ×1,3 ve 360 pt'de kontrol eder: kod kutusu tek satır ("ABC 234"), "Kaydet" giriş alanının yanında kalıyor, sayaç ve noktalar taşmıyor. "Kaydet" alt satıra düşerse giriş satırına `flexWrap: 'wrap'` ve "Kaydet"e `flexGrow: 1` verilir. | S |

### D. Sıradaki arayüz işleri (uygulamaya hazır)

#### D-1 (P1) Liste iskeleti: `src/components/SkeletonList.tsx`

**Amaç:** Ana ekranın ilk yüklemesinde ortadaki dönen simge yerine listenin şeklini göstermek. Liste gelince düzen kaymaz.

**Ne zaman gösterilir:**

| Durum | Gösterim |
|---|---|
| İlk yükleme (`loading && groups.length === 0`) | İskelet |
| Gün veya spor değişti, veri yok | İskelet |
| Aşağı çekerek yenileme (`refreshing`) | İskelet **yok**; mevcut liste ve `RefreshControl` kalır |
| Arka plan yenilemesi | İskelet yok |
| Hata | `StateMessage` (bugünkü gibi) |

**Yerleşim:** `src/app/index.tsx` içinde, `loading` dalında `ActivityIndicator` yerine `<SkeletonList sport={sport} />`. Kap stili `styles.list` ile aynı (`paddingHorizontal: space(4)`), böylece iskelet ve gerçek liste aynı kenarda başlar.

**Yapı:** 3 lig kartı; kartlardaki satır sayısı sırasıyla 2, 1, 2. Kartlar arası `space(3)`, gerçek listedeki `leagueFooter` ile aynı.

| Parça | Ölçü | Stil |
|---|---|---|
| Kart | tam genişlik | `surface`, `radius.lg`, `overflow: 'hidden'` |
| Lig başlığı satırı | yükseklik 44, `paddingHorizontal space(4)` | Çubuk 120×14 (`radius.sm`); yanında 64×12 ülke çubuğu, `gap space(2)` |
| Başlık altı ayırıcı | 1 px | `border` |
| Maç satırı | `minHeight 64`, `paddingVertical space(3)`, `paddingHorizontal space(4)`, `gap space(3)` (MatchRow ile aynı) | – |
| Durum çubuğu | 36×12 (futbol), 56×12 (NBA, durum sütunu 76) | Durum sütun genişliği MatchRow ile aynı: 48 / 76 |
| Takım çubukları | 2 adet, üstteki 140×14, alttaki 112×14, `gap 10`; solda 18×18 daire (logo yeri) | daire `radius 9` |
| Skor çubukları | 2 adet 14×14, sağda, `gap 10` | – |
| Satırlar arası | 1 px | `border` |

Tüm çubuk ve daireler `colors.surfaceAlt`, köşe `radius.sm` (daireler hariç).

**Hareket:**
- Tüm iskelet tek bir `Animated.View` içinde; opacity 0.55 ile 1 arasında döngü, her yön `duration: 900`, `Easing.inOut(Easing.ease)`, `useNativeDriver` (ui.tsx'teki sabit).
- Çubuk başına animasyon yok; tek değer, tek döngü.
- `useReduceMotion()` true ise döngü başlamaz, opacity sabit 0.8.
- Döngü bileşen kalkınca `stop()` edilir.

**Erişilebilirlik:**
- Kap: `accessible`, `accessibilityRole="progressbar"`, `accessibilityLabel="Maçlar yükleniyor"`.
- Çocuklar `importantForAccessibility="no-hide-descendants"` (Android) ve `accessibilityElementsHidden` (iOS) ile gizli.

**Kabul:**
- İlk açılışta dönen simge değil, 3 iskelet kart görünüyor.
- Veri gelince ilk lig kartının üst kenarı aynı y konumunda başlıyor (kayma ≤ 4 pt).
- "Hareketi azalt" açıkken iskelet sabit.
- Aşağı çekerek yenilemede iskelet çıkmıyor.

**İsteğe bağlı (P2):** Maç ekranı için aynı yaklaşım. Skor kartı iskeleti 120 pt yükseklikte; içinde iki 44 pt daire ve ortada 96×32 çubuk.

#### D-2 (P1) F12b tazelik metni arayüzü

**Metin (sabit, tek kaynak):**
```
Maç saatlerinde daha sık güncellenir; her maçta son güncelleme saati yazar.
```
Pazarlama kuralı: dakika rakamı yok ("~30 dk" kaldırılır), "anlık" ve "gerçek zamanlı" yok. Metin `src/lib/status.ts` (veya yeni `src/lib/copy.ts`) içinde `FRESHNESS_NOTE` sabiti olur; ekranlar sabiti kullanır, metni kopyalamaz. Böylece pazarlama değişiklik isterse tek OTA yeter.

**Yerleşim 1: Ana ekran, "Canlı" filtresi** (`src/app/index.tsx:132`, bugünkü `freshNote` yerine):
- Kapsam: Filtre çiplerinin altında, önizleme bandı ve hata bandından önce.
- Görünüm: Bir satır düzeni: solda "ⓘ" (`textMuted`, 13 px), yanında metin `caption` (12/17) `textMuted`. `paddingHorizontal: space(4)`, `paddingBottom: space(3)`, `gap: space(1.5)`, `flexDirection: 'row'`, metin `flex: 1`.
- Kart veya kenar yok. Bu bir uyarı değil, bilgi; `InfoStrip` kullanılmaz.
- Görünürlük:
  - "Canlı" filtresinde her zaman.
  - "Tümü" filtresinde yalnız `liveCount > 0` ise.
  - Biten, Takip ve Yarın/Dün görünümlerinde yok.
  - `useApiPaid()` true ise (ücretli veri planı) hiçbir yerde gösterilmez.
- Erişilebilirlik: tek öğe; `accessibilityLabel` metnin kendisi ("ⓘ" okunmaz).

**Yerleşim 2: Maç ekranı, canlı maç** (`ScoreHeader`, T3-1'deki yeni alt satır):
- "Son güncelleme 15:14" satırına dokunulabilirlik eklenir: canlı maçta satırın sonunda "ⓘ" (`textDim`), satırın tamamı `Pressable`, `minHeight 44`.
- Dokununca satırın altında, aynı kartta, `caption` `textMuted` ile `FRESHNESS_NOTE` açılır. Tekrar dokununca kapanır. Durum yerel (`useState`), kalıcı değil.
- Biten ve başlamamış maçta "ⓘ" yok, satır dokunulamaz.
- `accessibilityHint`: "Güncelleme sıklığını açıklar".

**Yerleşim 3 (yalnız sunucu durumu bildirirse): güncellemeler durdu**
- Kapsam: F12b `budget_exhausted` durumunu istemciye bir alanla açarsa (örnek: `get_public_config().sync_paused_until`). Bugün istemcide böyle bir alan yok; alan gelmeden bu yerleşim yapılmaz.
- Görünüm: ana ekranda, filtre çiplerinin altında `InfoStrip tone="warning"`:
  - Başlık: "⚠ Güncellemeler geçici olarak durdu"
  - Gövde: "Skorlar son güncelleme saatindeki durumdadır. Güncellemeler kendiliğinden yeniden başlar."
- Saat veya süre vaadi verilmez ("yarın", "birazdan" yok).
- Bu bant görünürken Yerleşim 1'deki not gizlenir; iki tazelik mesajı aynı anda çıkmaz.

**Kabul:**
- Uygulamada "~30 dk" ve "30 dakika" geçmiyor (`grep -rn "30 dk" src/` boş).
- "Canlı" filtresinde not tek satır ikon ve iki satır metin olarak, 360 pt'de taşmadan görünüyor.
- `?paid=1` senaryosunda not hiçbir ekranda yok.
- Canlı maç ekranında "Son güncelleme" satırına dokununca not açılıyor, tekrar dokununca kapanıyor; biten maçta dokunulamıyor.
- Metin `FRESHNESS_NOTE` sabitinden geliyor (tek kaynak).

#### D-3 (P2) Sonraki adaylar (sırayla)

1. **F2 AI vitrini + bekleme listesi:** §5.2 ve tur 1 C-3 geçerli. Ana ekran bandı `InfoStrip`'e `tone="pro"` eklenerek yapılır (sol şerit `pro`, kapatma "×" 44×44).
2. **F1 sabah NBA özeti:** ayar satırı (§5.4) ve tur 1 C-5'teki ana ekran kartı.
3. **Maç ekranı iskeleti:** D-1'deki isteğe bağlı madde.

---

## Uygulama durumu (tur 4)

Geliştirici ajan, 18 Kasım 2026 (kalite döngüsü 6 ile birlikte). "Tasarım incelemesi (tur 3)" §B, §C ve §D-1 için. D-2 (tazelik metni) F12b ile gelecek; bu turda yapılmadı. Kapılar: `tsc` 0 hata, `eslint src` 0 hata/uyarı, 116 Deno testi, `deno check` 7/7, `npm run e2e` 15/15 betik (yeni: `growth_largefont_ui.mjs`, `skeleton_ui.mjs`), `narrow_ui.mjs` 360 pt'de 7 ekranda taşma yok.

| # | Durum | Ne yapıldı (dosya:satır) / neden |
|---|---|---|
| T3-1 | Yapıldı | `src/app/match/[id].tsx:333-366`: `scoreCard` iki katmanlı. (1) `scoreRow` üç sütun (`flexDirection: 'row'`, `alignItems: 'stretch'`); (2) altında tam genişlikte, ortalı "Son güncelleme 15:39": `caption` 12/500, `textDim`, `marginTop: space(3)`, `numberOfLines={1}`, `maxFontScale(1.3)`. Orta sütunda yalnız skor ve durum. `scoreMid` `maxWidth: '40%'`. Uyarlama: `caption`'ın sabit `lineHeight` 17'si alınmadı; ×1,3'te tek satırın alt kenarı kırpılıyordu. Görüntü: `lf1-mac-buyukyazi` (haplar ve satır çakışmıyor). |
| T3-2 | Yapıldı | `src/components/SegmentedTabs.tsx:33-38`: etiketler `maxFontScale(1.2)`, `numberOfLines={2}` kaldı, `minHeight 40` aynı. ×1,3 benzetiminde yalnız "✦ AI / Taktik" iki satır; Özet / İstatistik / Kadro tek satırda hizalı (`lf1-mac-buyukyazi`). |
| T3-3 | Doğrulandı, değişiklik yok | `e2e/growth_largefont_ui.mjs` (artık `npm run e2e` zincirinde): 360 pt ×1,3'te `scrollWidth=360`, "ABC 234", "Kaydet", "Davetiye gönder", "Davet kodun var mı?" kutusuna sığıyor; "Kaydet" giriş alanının yanında. `flexWrap` gerekmedi. Görüntü: `c6-davet-buyukyazi-360`. |
| §B koşul 1 | Yapıldı | `[id].tsx:391`: `TeamSide` logo + ad tek erişilebilir öğe; etiket tam ad ve taraf: "Boğaziçi SK, ev sahibi" / "Ege Yıldızı, deplasman". Takip hapı ayrı düğme olarak kalır. |
| §B koşul 2 | Yapıldı | `[id].tsx:374-375`: `TEAM_NAME_MAX_SCALE` yanında tek satır kapsam yorumu ("YALNIZ skor başlığındaki takım adı; başka yerde maxFontSizeMultiplier={1} kullanılmaz"). Liste ×1,2 ve skor ×1,3 aynı. |
| D-1 | Yapıldı | Yeni `src/components/SkeletonList.tsx`; `src/app/index.tsx:151-153` `loading` dalında `ActivityIndicator` yerine. 3 kart (2/1/2 satır), kap `paddingHorizontal: space(4)`, kart `surface` + `radius.lg` + `overflow: 'hidden'` + altta `space(2)` (gerçek `leagueFooter`), kartlar arası `space(3)`. Başlık 44 pt: 120×14 ve 64×12 çubuk. Satır `minHeight 64`, `space(3)`/`space(4)` iç boşluk, `gap space(3)`; durum sütunu 48 / 76 (NBA), çubuk 36×12 / 56×12; 18×18 daire + 140×14 ve 112×14 takım çubukları (`gap 10`); sağda iki 14×14. Hepsi `surfaceAlt`, `radius.sm`. Tek `Animated.View`, opacity 0.55 ↔ 1, 900 ms, `Easing.inOut(Easing.ease)`, `useNativeDriver`; hareketi azalt → sabit 0.8; kalkınca `stop()`. Kap `accessibilityRole="progressbar"`, "Maçlar yükleniyor"; çocuklar gizli. `loading` yalnız veri yokken true: aşağı çekerek ve arka plan yenilemesinde iskelet çıkmaz. Görüntü: `d1-iskelet-360`, `d1-liste-360`. |
| D-1 kabul | e2e ile | `e2e/skeleton_ui.mjs` (önizleme `?mockSlow=list`): 3 kart, progressbar etiketi, opaklık döngüsü, veri gelince ilk kartın üst kenarı aynı y (kayma 0,0 pt), `reducedMotion: 'reduce'` ile opaklık sabit 0.8. |
| D-2 | Bekliyor | F12b ile birlikte (`FRESHNESS_NOTE`). Skor kartındaki "Son güncelleme" satırı Yerleşim 2 için hazır (tam genişlik satır). |

Ek (test bulguları Döngü 6, arayüzü etkileyenler):
- Davet kartı: davetle 3'ten az kişi geldiyse "Aktif olan" ve 3 nokta gösterilmez; yerine "Aktif sayısı, davetinle en az 3 kişi gelince görünür." (`caption`, `textMuted`). Açıklama satırı: "Aktif: kodu girdikten sonra uygulamayı en az bir gün arayla 2 farklı gün açan davetli." Görüntü: `c6-davet-az-davetli`.
- "Paylaş" artık skoru henüz gelmemiş biten maçta da çizilmez. NBA uzatmalı maç metni "(MS, uzatma)".
- Hesap silme onayı: "… asistan soruların, davet kodun, davet bilgin ve kullanım günlerin kalıcı olarak silinir."

---

## Tasarım incelemesi (tur 4)

İnceleyen: UI/UX tasarım ajanı · 18 Kasım 2026. İncelenen görüntüler (`e2e/shots/`): `lf1-mac-buyukyazi`, `d1-iskelet-360`, `d1-liste-360`, `c6-davet-az-davetli`, `c6-davet-buyukyazi-360`, `c6-paylas-buyukyazi-360`, `f3-davet`, `f3-paylas-nba`, `n1`–`n6` (360 pt).

### A. Onaylananlar (8 madde)

| # | Madde | Kanıt |
|---|---|---|
| T3-1 | "Son güncelleme" ayrı satırda | `lf1-mac-buyukyazi`, `n2-mac-360`: tam genişlik, ortalı, haplara binmiyor. Futbol skorunda büyük yazı sorunu kalmadı. NBA için bkz. T4-1. |
| T3-2 | Sekme etiketleri ×1,2 | `lf1-mac-buyukyazi`: yalnız "✦ AI / Taktik" iki satır; diğerleri hizalı. |
| T3-3 | Davet kartı ×1,3 / 360 pt | `c6-davet-buyukyazi-360`: kod tek satır, "Kaydet" giriş alanının yanında, sayaç ve noktalar sığıyor. |
| §B-1 | Takım adı erişilebilir etiketi | Uygulama notu: "Boğaziçi SK, ev sahibi". Kod düzeyinde kabul. |
| §B-2 | `TEAM_NAME_MAX_SCALE` kapsamı | Yorum eklendi; liste ×1,2, skor ×1,3 aynı. |
| D-1 | Liste iskeleti | `d1-iskelet-360` → `d1-liste-360`: kart, satır ve kenar ölçüleri gerçek listeyle aynı; kayma yok. Hareket ve "Hareketi azalt" davranışı e2e ile doğrulandı. Çubuk rengi için bkz. T4-3. |
| Ek | Davet kartı: 3'ten az davetli | `c6-davet-az-davetli`: "Aktif olan" ve noktalar gizli, yerine açıklama var. Eksik veriyi "0" diye göstermemek doğru karar. Sıra için bkz. T4-2. |
| Ek | Skorsuz biten maçta Paylaş gizli | Boş skorlu paylaşım metni oluşmuyor; doğru. |

**Sapma kararı, "Son güncelleme" satırında `lineHeight` yok: kabul.** Satır `numberOfLines={1}`; tek satırlık metinde `lineHeight` yalnız dikey boşluğu değiştirir, okunurluğu değiştirmez. Satırın üstündeki `marginTop: space(3)` ritmi zaten veriyor (`n2-mac-360`). Koşul: bu satır ileride iki satıra izin verirse (ör. D-2 Yerleşim 2'deki açılır not), `lineHeight: 17` (`type.caption`) geri eklenir.

### B. Düzeltilecekler

| # | Öncelik | Dosya | Sorun (görüntü) | Değişiklik (değerler) | Efor |
|---|---|---|---|---|---|
| T4-1 | P0 | `src/app/match/[id].tsx` (`ScoreHeader`, `scoreMid`, `score`) | NBA'de 3 haneli skor ×1,3 ve 360 pt'de iki satıra kırılıyor: "104 :" / "115" (`c6-paylas-buyukyazi-360`). Sebep: `scoreMid.maxWidth: '40%'` + ×1,3 büyüme. Skor ekranın birincil bilgisi; asla kırılmamalı. | (1) Skor `Text`: `numberOfLines={1}`. (2) Skorlardan biri ≥100 ise: `fontSize: 28`, `maxFontScale(1.1)`, ayırıcı boşluklar kalkar: `"104:115"`, ":" ayrı `Text` olarak `marginHorizontal: 4` ve `textDim`. (3) `scoreMid`: `maxWidth: '44%'`, `flexShrink: 0`. (4) İki haneli skorlarda bugünkü değerler (34 px, ×1,3) değişmez. Kabul: `c6-paylas-buyukyazi-360` koşulunda skor tek satır, takım adları kelime ortasından bölünmüyor. | S |
| T4-2 | P2 | `src/components/InviteCard.tsx` | 3'ten az davetlide açıklama sırası karışık: ödül, tanım ve "Aktif sayısı… görünür" alt alta üç gri satır (`c6-davet-az-davetli`). Kullanıcı neden "Aktif olan"ı görmediğini sayaçtan uzakta okuyor. | Sıra: (1) Sayaç "Davetinle gelen: 2". (2) Hemen altında, `marginTop: space(1)`: "Aktif sayısı, davetinle en az 3 kişi gelince görünür." (3) Ödül satırı. (4) Tanım satırı en sonda. Hepsi `caption` `textMuted`. Satırlar arası `gap: space(1)`, grup ile ayırıcı arası `space(3)`. | S |
| T4-3 | P2 | `src/components/SkeletonList.tsx` | Çubuklar `surfaceAlt`; `surface` üzerinde çok silik (yaklaşık 1.1:1). Ekran parlaklığı düşükken iskelet boş kart gibi görünüyor (`d1-iskelet-360`). | Çubuk ve daire rengi `colors.border` (#232D3A; `surface` üzerinde 1.28:1). İskelet dekoratif olduğu için 3:1 şartı yok; amaç yalnız şeklin seçilmesi. Opaklık döngüsü aynen kalır. | S |

Not: Çeyrek tablosunda ×1,3'te takım adları "Lakesho…" diye kuyruktan kısalıyor (`c6-paylas-buyukyazi-360`). Bu kabul edilir: kelime ortasından bölünme değil, kuyruk kısaltması; tam ad skor kartında ve ekran okuyucuda var.

### C. F2 AI vitrini + Pro bekleme listesi + Kurucu Destekçi ön kaydı (uygulamaya hazır)

Kaynaklar: `docs/inovasyon-onerileri.md` §4.2 (veri modeli, RPC'ler, kabul), pazarlama §8 (yasaklı ifadeler), `docs/rakip-arastirmasi.md` §12.4–12.5. Araştırmanın önerisi: şimdi satış yok; yalnız ödemesiz bekleme listesi ve Kurucu Destekçi ön kaydı, amaç talebi ölçmek.

Bu bölüm §5.2 ve tur 1 C-3'ün yerine geçer.

#### C-0. İçerik kuralları (tüm F2 yüzeyleri)

- Fiyat, "₺", "TL", "abone ol", "satın al", "öde", "indirim", "ücretsiz Pro", "ömür boyu", tarih ve süre vaadi **yok**.
- "Kurucu Destekçi ön kaydı" bir satış değildir. Metin bunu açıkça söyler: "Ödeme yok; şimdi bir şey satın almıyorsun."
- Ön kayıt kullanıcıyı hiçbir şeye bağlamaz. Kontenjan, indirim veya süreli Pro gibi koşullar karara bağlanmadan metinde vaat edilmez. Koşullar satış açılmadan önce paywall'da yazılacak.
- Vitrin etiketi tek sabit: `SHOWCASE_LABEL = 'Pro (yakında) örneği'`. Pro 8 hafta içinde çıkmazsa (pazarlama kuralı) yalnız sabit değişir: `'Pro önizlemesi'`.
- Vitrine yalnız maç sonu analizi alınır; maç önü ve devre arası raporu alınmaz.
- Altın (`pro`) bu bölümün aksan rengidir. Yeşil yalnız "✓ Listedesin" onayında kullanılır.

#### C-1. Veri ihtiyacı (tasarımın gerektirdiği, geliştirici kesinleştirir)

§4.2'deki `pro_waitlist` tablosuna ön kayıt bayrağı eklenir:
- `founder boolean not null default false`.
- `join_pro_waitlist(p_source, p_sport, p_fixture_id, p_founder boolean default false)`. Tekrar çağrı kaydı günceller, çift satır açmaz.
- `get_waitlist_status()` → `{ joined: boolean, founder: boolean }`.
- `leave_pro_waitlist()` kaydı siler. `source` listesine `'paywall_founder'` eklenmez; kaynak ve bayrak ayrı tutulur.

Migration adı `docs/inovasyon-onerileri.md` §4.2'deki sırayla verilir (bugün son dosya `0017_growth_invites.sql`). RPC yoksa (migration çalışmamış) tüm F2 yüzeyleri gizlenir; paywall bugünkü "çok yakında" hâline döner. Hata kullanıcıya gösterilmez.

**Pazarlama ile hizalanacak tek konu:** Pazarlama §4.4, 3 aktif davetliyi de "Kurucu Destekçi" diye anıyor. Öneri: tek kavram olsun. Ön kayıt yapanlar Kurucu Destekçi adayıdır; 3 aktif davetli olanlar adaylar içinde öne alınır. Davet kartındaki bugünkü metin ("Pro satışa açılmadan önce denemeye davet edilirsin") değişmez; davet kartında "Kurucu Destekçi" geçmez.

#### C-2. Paywall (test kullanıcısı olmayan) — `src/app/paywall.tsx`

Test kullanıcısının simülasyon ekranı (`n4-paywall-360`) değişmez. Aşağıdaki düzen `!isTestUser` dalının yerine geçer. Kap: `content` aynı (`padding space(5)`, `gap space(5)`, `maxWidth 560`).

| Sıra | Öğe | Stil / metin |
|---|---|---|
| 1 | Kicker | "✦ SKOR+ PRO" (`micro`, `pro`, letterSpacing 1.4). Kaynakta büyük harf. |
| 2 | Başlık | "Pro abonelik çok yakında" (`title1` 26/32/900) |
| 3 | Alt metin | `bodySm` `textMuted`: "Maç sonu AI taktik analizi, maç önü eşleşme, devre arası raporu ve taktik asistan Pro'da olacak. Şu an satış yok. Haber almak istersen aşağıdan listeye katılabilirsin." |
| 4 | Özellik listesi | Bugünkü 4 madde, "✓ " `live` |
| 5 | Örnek bağlantısı (yalnız son 7 günde vitrin varsa) | Metin bağlantısı `accent` 15/700, 44 pt: "Herkese açık örnek analizi gör →". Hedef `/match/<id>?tab=ai`. |
| 6 | Seçim başlığı | `headline`: "Nasıl haber almak istersin?" |
| 7 | Seçenek kartları (radyo grubu) | Aşağıdaki tablo |
| 8 | Ana düğme | Pro düğmesi (`pro` zemin, `onFill` 15/900, `minHeight 48`, `radius.md`, tam genişlik). Etiket seçime göre değişir: "Listeye katıl" / "Ön kayıt ol". Gönderirken içinde `ActivityIndicator` (`onFill`). |
| 9 | Gizlilik notu | `caption` `textDim`, ortalı: "E-posta istenmez. Hesap kimliğin ve seçimin kaydedilir; listeden istediğin zaman çıkabilirsin." Altında metin bağlantısı "Gizlilik Politikası" (`accent`, 44 pt) → `/legal/privacy`. |

**Seçenek kartları** (`accessibilityRole="radiogroup"`; her kart `radio`, `accessibilityState={{ checked }}`). Bugünkü `plan` stili kullanılır, fiyat sütunu yok:
- Kart: `padding space(4)`, `radius.lg`, 1.5 px kenar `border`, zemin `surface`, `minHeight 64`, `gap space(3)`.
- Seçili kart: kenar `pro`, zemin `proGlow`.
- Radyo: 20 px daire; seçili `pro` dolu, değilse `textDim` kenar.
- Varsayılan seçim: "Pro çıkınca haber ver".

Gövde metni `caption`; seçili değilken `textMuted`, seçiliyken `text`. Gerekçe: `proGlow` zemininde `textMuted` 4.45:1 ile AA'nın altında kalıyor.

| Seçenek | Başlık (`headline`) | Gövde | Rozet |
|---|---|---|---|
| A | Pro çıkınca haber ver | Satış açıldığında uygulamada duyururuz. | – |
| B | Kurucu Destekçi ön kaydı | Pro satışa açıldığında ilk teklif sana gelir. Ödeme yok; şimdi bir şey satın almıyorsun. Koşullar satış açılmadan önce burada açıkça yazılır. | Başlığın yanında `Badge` "ÖN KAYIT" (`pro`, dolu değil) |

**Kayıtlı durum** (seçim, düğme ve gizlilik notunun yerine; aynı konumda):
- Kutu: `surfaceAlt`, `radius.md`, `padding space(4)`, `gap space(2)`.
- Satır 1 `headline` `live`: "✓ Listedesin" ya da (founder) "✓ Kurucu Destekçi ön kaydın alındı".
- Satır 2 `bodySm` `text`: "Pro satışa açıldığında uygulamada duyuracağız."
- Bildirim izni varsa satır 3 `caption` `textMuted`: "Bildirimle de haber vereceğiz."
- İzin yoksa satır 3: "Bildirim iznin kapalı. Duyuruyu Telegram kanalından da takip edebilirsin."
- Altta iki metin bağlantısı (`accent`, 44 pt, `gap space(4)`, satır sarar):
  - "Kurucu Destekçi ön kaydı yap" (yalnız founder değilse) ya da "Yalnız haber almak istiyorum" (founder ise). İkisi de `join_pro_waitlist` ile bayrağı günceller.
  - "Listeden çık" → `leave_pro_waitlist()`. Onay penceresi yok (geri alınabilir işlem); sonuçta ekran seçim düzenine döner ve `caption` "Listeden çıktın." 3 sn görünür.

**Hata:** Katılma veya çıkma başarısızsa düğmenin üstünde `InfoStrip tone="warning"`: "⚠ Kaydedilemedi" + gövdede `friendlyError` metni + "Tekrar dene".

**Erişilebilirlik:** Sonuç ve hata metinleri `accessibilityLiveRegion="polite"`. Ekran açılınca odak başlıkta.

#### C-3. Ana ekran vitrin bandı — `src/app/index.tsx` + `InfoStrip`

- `InfoStrip`'e `tone: 'warning' | 'pro'` eklenir. `pro` tonunda sol şerit `pro`, başlık rengi `pro`, simge "✦".
- `onPress` verilirse bandın tamamı `Pressable` olur, sağda "›" (`textMuted`) görünür.
- `onClose` verilirse sağ uçta "×" düğmesi (44×44, `textMuted`, `accessibilityLabel="Bandı kapat"`) çıkar.
- Metin:
  - Başlık (`label`): "✦ Haftanın açık AI analizi".
  - Gövde (`caption` `textMuted`): "<Ev> – <Deplasman> · herkese açık".
- Dokununca `/match/<fixture_id>?tab=ai`.
- Görünürlük:
  - Son 7 günde vitrin maçı varsa ve bu maç kapatılmadıysa. Kapatma AsyncStorage'da maç bazında tutulur: `skor.showcase.dismissed.<fixture_id>`, try/catch içinde.
  - Yalnız "Bugün" günü, "Tümü" filtresi ve maçın sporu seçiliyken.
  - Aynı anda en fazla bir vitrin bandı; birden çok vitrin maçı varsa en yenisi.
- Konum: filtre çiplerinin altında. Varsa tazelik notundan (tur 3 D-2) sonra; önizleme ve hata bantlarından önce.

#### C-4. MatchRow rozeti — `src/components/MatchRow.tsx`

- Vitrin maçında (`match.ai_showcase && isShowcaseActive(match, now)`) rozet `Badge label="✦ AI açık" color={colors.pro}`.
- Bu rozet "AI Analiz Hazır" rozetinin yerini alır; satırda en fazla bir AI rozeti görünür.
- Satırın erişilebilirlik etiketine ", AI analizi herkese açık" eklenir.

#### C-5. Maç ekranı AI sekmesi — vitrin maçı — `src/app/match/[id].tsx`

`PaywallGate` yerine doğrudan `AnalysisReport` / `NbaAnalysisReport`. Sıra:

1. **Etiket kutusu** (raporun üstünde): `surfaceAlt`, `radius.md`, `padding space(3)`, `gap 2`.
   - Satır 1: `micro` `pro`: "PRO (YAKINDA) ÖRNEĞİ · HERKESE AÇIK". Kaynakta büyük harf; `SHOWCASE_LABEL`'dan türetilir.
   - Satır 2: `caption` `textMuted`: "Bu analiz bu hafta herkese açık. AI tarafından üretildi, maç verisine dayanır."
2. **Rapor kartları** (değişmez) ve `AiNote`.
3. **CTA kartı** (`Card accent={colors.pro}`; sohbet kartının yerinde, çünkü asistan Pro'ya özel kalır):
   - `CardTitle kicker="SKOR+ PRO" title="Pro çıkınca haber al"`.
   - Gövde `bodySm` `textMuted`: "Her maçın AI analizi, maç önü eşleşme ve taktik asistan Pro'da olacak."
   - Kayıtlı değilse: Pro düğmesi "Pro çıkınca bana haber ver" → `join_pro_waitlist('showcase', sport, fixture_id)`. Altında metin bağlantısı "Kurucu Destekçi ön kaydı hakkında →" (`accent`, 44 pt) paywall'u açar.
   - Kayıtlıysa: C-2'deki kayıtlı durum kutusunun kısa hâli (satır 1, 2 ve bildirim satırı), bağlantı yalnız "Listeden çık".

#### C-6. PaywallGate (vitrin dışı, kilitli AI) — `src/components/analysis/PaywallGate.tsx`

- Test kullanıcısı olmayanda ana düğmenin etiketi "Pro'ya Geçerek Raporu Aç" → **"Pro'yu yakından gör"** olur. Satış yokken "geçerek açmak" mümkün değil. Hedef paywall, değişmez.
- Düğmenin altına C-5'teki kayıt satırı eklenir: kayıtlı değilse metin bağlantısı "Pro çıkınca bana haber ver" (`accent`, 44 pt, `join_pro_waitlist('ai_tab', sport)`); kayıtlıysa `caption` `live` "✓ Listedesin".
- Test kullanıcısında bugünkü düğme ve metin kalır.

#### C-7. Ayarlar satırı — `src/app/settings.tsx`

Davet kartından sonra küçük kart:
- `CardTitle kicker="PRO" title="Pro bekleme listesi"`.
- Durum `bodySm`: "Listede değilsin" (`textMuted`) / "Listedesin" (`live`) / "Kurucu Destekçi ön kaydın var" (`live`).
- Sağda ya da altta ikincil düğme: "Katıl" (paywall'u açar; seçim orada yapılır) / "Listeden çık" (`leave_pro_waitlist`).
- RPC yoksa kart çizilmez. Hesap silinince kayıt cascade ile silinir; hesap silme onay metnine "Pro bekleme listesi kaydın" eklenir.

#### C-8. F2 kabul kontrolü (tester)

- [ ] Test kullanıcısı olmayan paywall'da fiyat, "₺/TL", "abone ol", "satın al", "indirim", "ömür boyu" ve tarih yok (`?tester=0`).
- [ ] Paywall'da iki seçenek radyo grubu olarak okunuyor; varsayılan "Pro çıkınca haber ver". Düğme etiketi seçime göre "Listeye katıl" / "Ön kayıt ol".
- [ ] B seçeneğinin gövdesinde "Ödeme yok; şimdi bir şey satın almıyorsun." metni var.
- [ ] Katılınca kayıtlı durum kutusu çıkıyor. Founder bayrağı iki yönde değiştirilebiliyor. "Listeden çık" seçim düzenine döndürüyor. Tekrar katılma çift kayıt açmıyor.
- [ ] Vitrin maçında AI sekmesi kilitsiz; üstte "PRO (YAKINDA) ÖRNEĞİ · HERKESE AÇIK"; sohbet yerine CTA kartı.
- [ ] Vitrin dışı maçta PaywallGate düğmesi "Pro'yu yakından gör" (test kullanıcısı olmayanda).
- [ ] Ana ekran bandı yalnız Bugün + Tümü + doğru sporda; "×" ile kapanıyor ve yeniden açılışta kapalı kalıyor; dokununca AI sekmesi açılıyor.
- [ ] MatchRow'da vitrin maçında yalnız "✦ AI açık" rozeti var.
- [ ] 360 pt ve ×1,3'te paywall seçenek kartları taşmıyor, "ÖN KAYIT" rozeti başlıkla aynı satıra sığmazsa alt satıra iniyor (`flexWrap: 'wrap'`).
- [ ] RPC yokken paywall bugünkü "çok yakında" hâlinde; band, rozet, ayar kartı ve CTA gizli.
- [ ] Hesap silinince bekleme listesi kaydı siliniyor; onay metninde bu yazıyor.

---

## Play Store görselleri

Hazırlayan: UI/UX tasarım ajanı · 18 Kasım 2026. Kaynak: `docs/pazarlama-stratejisi.md` §3.5 (8 karelik senaryo), §3.6 (öne çıkan grafik), §8 (yasaklı ifadeler).

### 0. Play'in güncel gereksinimleri (kaynaklı)

Kaynak 1: [Add preview assets to showcase your app — Play Console Help](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en) (18.11.2026'da okundu).

| Varlık | Gereksinim |
|---|---|
| Uygulama simgesi | 32-bit PNG (alfa kanallı), **512×512 px**, en fazla **1024 KB**. Sıralama, fiyat veya Play kategorisi ima eden rozet ya da metin olmaz. |
| Öne çıkan grafik | **JPEG veya 24-bit PNG (alfa yok)**, **1024×500 px**. |
| Ekran görüntüleri | JPEG veya 24-bit PNG (alfa yok). En kısa kenar ≥ 320 px, en uzun kenar ≤ 3840 px; uzun kenar kısa kenarın 2 katını geçemez. Öne çıkarılmaya uygun olmak için uygulamalarda **en az 4** ekran görüntüsü, en az 1080 px; dikeyde **9:16, en az 1080×1920 px**. |
| Ekran görüntüsü içeriği | Uygulamadaki gerçek deneyimi göstermeli. Google Play başarısı, sıralama, ödül, kullanıcı yorumu, fiyat veya promosyon ima etmez ("Best", "#1", "Top", "New", "Discount", "Sale", "Million Downloads" gibi). Eylem çağrısı yok ("Download now", "Install now", "Try now"). Küçük puntolu yoğun metin ve metinle yarışan zemin yok. Çabuk eskiyen ifade yok. |
| Alt metin | Her görsel için alt metin önerilir: ≤ 140 karakter, "fotoğrafı/görseli" denmez. |

Kaynak 2: [Google Play icon design specifications — Android Developers](https://developer.android.com/distribute/google-play/resources/icon-design-specifications).
- Play köşe yarıçapını kendisi uygular (simge boyutunun %30'u) ve gölgeyi kendisi ekler. Yüklenen dosyaya gölge konmaz.
- Şekli önemli logolar keyline ızgarasına yerleştirilir.
- Saydam zemin önerilmez; saydam alanlarda Play'in arayüz rengi görünür.

**Bu belgedeki kararlar:**
- Telefon ekran görüntüleri **1080×1920 px (9:16)**, 24-bit PNG (alfa yok). 8 kare (Play'in telefon için üst sınırı 8'dir ⚠ Console'da yüklerken doğrulanacak).
- Görsel ve altyazı metinlerinde pazarlama §8 ve Play'in yukarıdaki yasakları birlikte uygulanır: "en iyi", "#1", "yeni", "indir", "hemen", fiyat, "anlık" yok.

### 1. Ortak kurallar

**Veri:**
- Tüm kareler önizleme (mock) verisiyle çekilir. Mock takımlar uydurmadır (Boğaziçi SK, Ege Yıldızı, AC Lombardia, Lakeshore Comets…) ve logoları baş harf rozetidir. Böylece gerçek kulüp logosu, oyuncu adı veya resmî işaret görünmez.
- **Kullanılmayacak mock maçlar:** Türkiye–İskoçya (alarm senaryosu, `alertsMockData.ts` `TURKEY_SCOTLAND_ID`) gerçek milli takım ve gerçek oyuncu adı (McTominay) içeriyor. İtalya–Portekiz satırı ve "UEFA" başlıklı grup listede görünmemeli.
- **Lig adları:** Mock maçlar gerçek lig adlarının altında duruyor ("Süper Lig", "Serie A", "Bundesliga"). Bunlar tanımlayıcı metin olarak kabul edilir; logo yok. Yine de kare 2'de yalnız bir lig grubu görünecek biçimde filtrelenir.

**Önizleme izleri gizlenir (geliştirici işi, bkz. §4):** Yeni `?store=1` parametresi şu etkileri yapar:
- ÖNİZLEME rozeti ve "Örnek veri" bandı gizlenir.
- Web'e özgü "Web sürümünde bildirim desteklenmiyor." notu gizlenir.
- Asistanın "Önizleme modundasın…" yanıtı gerçekçi bir mock yanıtla değişir.
- Expo geliştirme düğmesi (sol alttaki "⚡", `l3-kadro` eski görüntüsü) görünmez. En temizi, çekimi `npx expo export -p web` çıktısından almak.

**Saat:** Tüm "Son güncelleme" ve başlama saatleri sabit olur. Playwright'ta `page.clock.setFixedTime(new Date('2026-11-18T21:47:00+03:00'))` kullanılır.

**Dürüstlük notu:**
- Her karenin altında, kare kenarından 32 px içeride, 22 px `textDim` (#7D8A9C) ve ortalı tek satır yer alır: "Örnek verilerle gösterilmiştir."
- Gerekçe: Pazarlama "ekran görüntüleri gerçek" kuralını koyuyor; arayüz gerçek, veri örnek. Not bu farkı açıkça söyler.
- ⚠ Kullanıcı ve pazarlama onayı gerekir (§5).

**Pro rozeti:** Pro özelliği gösteren karelerde (1, 4, 7, 8) altyazının üstünde altın hap çıkar. Lansmanda Pro satışta değilse metin "PRO · YAKINDA", satıştaysa "PRO" olur (pazarlama §3.5: "Pro ekranlarında küçük Pro rozeti").

### 2. Kare yerleşimi (1080×1920)

```
┌──────────────── 1080 ────────────────┐
│ 72 px üst boşluk                      │
│ [PRO hap]  (yalnız Pro karelerinde)   │  hap: 28 px metin, 900, #0A0E14 üstüne #F5C451 zemin, pill, 14×28 iç boşluk
│ Altyazı: 2 satıra kadar, ortalı        │  64 px / 900 / satır yüksekliği 76, #E8EDF3, yan boşluk 72
│ (altyazı bloğu 460 px'e kadar)         │
├───────────────────────────────────────┤ y = 460
│   ┌──────── 900 ────────┐             │  uygulama görüntüsü: x = 90, genişlik 900
│   │ uygulama ekranı     │             │  köşe 48 px (yalnız üst), 2 px kenar #232D3A
│   │ (alttan taşar)      │             │  yükseklik 1400; alt kenar kesilir (cihaz çerçevesi yok)
│   └─────────────────────┘             │
│ "Örnek verilerle gösterilmiştir."     │  y = 1920 − 32 − 22; 22 px #7D8A9C; ekranın üstüne #0A0E14 %85 bant
└───────────────────────────────────────┘
```

- **Zemin:** `#0A0E14` (`bg`). Üst 460 px'te çok hafif radyal ışık: merkez (540, 0), yarıçap 700, `#121821` → `#0A0E14`. Pro karelerinde ışık rengi `rgba(245,196,81,0.10)`.
- **Yazı tipi:** Uygulamanın kullandığı sistem yazı tipi (web çekiminde `system-ui`); Türkçe karakter kontrolü ("ş", "ğ", "İ") yapılır.
- **Altyazı:** En fazla 2 satır; 3. satıra inerse metin kısaltılmaz, punto 56 px'e iner. 64 px büyük metin `bg` üzerinde 16.4:1.
- **Uygulama görüntüsü:** viewport **390×607**, `deviceScaleFactor` **900/390 ≈ 2.3077** → 900×1400 px. Ölçekleme bulanıklığı olmaz.

### 3. Sekiz kare

URL tabanı: `http://localhost:8084` (önizleme). Tüm URL'lere `store=1` eklenir. Pro kareleri için Pro simülasyonu `chat_ui.mjs`'teki adımlarla yapılır: AI Taktik → Pro düğmesi → "Aboneliği Başlat (Simülasyon)" → geri.

| # | Ekran ve durum | URL + adımlar | Altyazı (pazarlama §3.5) | Pro hapı | Alt metin (≤140) |
|---|---|---|---|---|---|
| 1 | Maç sonu AI raporu (futbol): momentum ve xG kartları ekranda | `/match/9004?store=1&tester=1` → Pro simülasyonu → "AI Taktik" → xG denetimi kartının kicker'ı ekranın üst 1/3'ünde olacak şekilde kaydır | Skoru herkes görür, nedenini sen gör | ✓ | Futbol maçı sonrası Türkçe AI taktik raporu: xG ve momentum kırılma kartları. |
| 2 | Ana liste, Bugün, Takip filtresi | `/match/9001?store=1` → "☆ Takip et" (Ege Yıldızı) → `/` → "★ Takip" çipi | Takımın, maçların, tek ekranda | – | Bugünün maç listesi, takip edilen takımın maçı filtrelenmiş hâlde. |
| 3 | NBA Box Score (ilk takım tablosu) | `/match/9000009101?store=1` → "Box Score" sekmesi → tablo başlığı ekranın üst 1/4'ünde | Gece maçının tam box score'u | – | NBA maçının box score tablosu: dakika, sayı, ribaund, asist, şut yüzdeleri. |
| 4 | NBA AI analizi (periyot kırılması, TS%) | `/match/9000009101?store=1&tester=1` → Pro simülasyonu → "AI Taktik" → TS% kartı görünür | NBA'i Türkçe yorumla oku | ✓ | NBA maçı için Türkçe AI analizi: şut verimliliği ve maçın koptuğu periyot. |
| 5 | **Varsayılan (ücretsiz API):** takım takibi. Maç ekranında "★ Takipte" hapı ve takip bandı "Takip ediliyor · maç başlayınca bildirim gelir". **Ücretli API doğrulanınca:** Akıllı Alarm kartı | Varsayılan: `/match/9006?store=1&paid=0` → "☆ Takip et" (Anadolu Gücü) → takip bandına dokun. Ücretli: kurgusal takımlı alarm senaryosu gerekir (bkz. §5). | Varsayılan: **"Takımını takip et, maç başlayınca haber al"** (⚠ öneri, pazarlama onayı gerekir). Ücretli: "Sadece önemli an: gürültüsüz alarm" | – | Maç ekranında takım takibi açık; maç başlayınca bildirim gelecek. |
| 6 | Futbol kadro: diziliş ve oyuncu puanları | `/match/9001?store=1` → "Kadro" → saha üst kenarı ekranın üstünde | Kadro, diziliş, oyuncu puanları | – | Futbol maçı kadrosu: saha üzerinde diziliş ve maç sonu oyuncu puanları. |
| 7 | **Varsayılan:** bildirim ayarları (yakında olanlar pasif ve etiketli). **Ücretli API doğrulanınca:** devre arası raporu | Varsayılan: `/settings?store=1&paid=0`. Ücretli: `/match/9006?store=1&tester=1&paid=1` → Pro simülasyonu → "AI Taktik" (İY) | Varsayılan: **"Bildirimleri sen seç"** (⚠ öneri, pazarlama onayı gerekir). Ücretli: "Devre arasında ikinci yarının reçetesi" | ücretli sürümde ✓ | Bildirim ayarları: maç başladı bildirimi açık; diğer alarmlar yakında. |
| 8 | Taktik Asistan: 1 soru ve yanıt, "Kalan: 2/3" | `/match/9004?store=1&tester=1` → Pro simülasyonu → "AI Taktik" → "Maçın kırılma anı neydi?" çipine dokun → yanıt gelince "TAKTİK ASİSTANA SOR" kartı ekranın üstünde | Maça özel sor: 3 soru, Türkçe cevap | ✓ | Maça özel Taktik Asistan: Türkçe soru ve yapay zekâ yanıtı, kalan soru hakkı. |

Kare 5 ve 7 için pazarlama §3.5 kuralı geçerli: ücretli API canlıda doğrulanmadan alarm ve devre arası kareleri kullanılmaz. Varsayılan sütun bu yüzden ücretsiz durumu gösterir.

### 4. Öne çıkan grafik (1024×500)

```
┌──────────────────────────── 1024 ────────────────────────────┐
│  56                                                           │
│  Skor+            (96 px / 900, "+" #2BE37A)      ╱‾‾‾‾‾‾╲     │
│                                                  ╱ telefon ╲    │ telefon kesiti: -6° eğik,
│  Skoru herkes görür,                            │  AI rapor │   │ genişlik 300, x ≈ 660,
│  nedenini sen gör.  (40 px / 800 / 48, #E8EDF3) │  kartı    │   │ alttan taşar (y 90 → 560)
│                                                  │ (logosuz) │   │
│  Futbol · NBA · Türkçe AI (24 px / 700, #8A97A8) ╲_________╱    │
│  56                                                           │
└───────────────────────────────────────────────────────────────┘
```

- **Zemin:** `#0A0E14`. Sağ yarıda radyal ışık `rgba(245,196,81,0.10)` (Pro/AI vurgusu), merkez (760, 250), yarıçap 420.
- **Sol blok:** x = 56, dikeyde ortalı, genişlik ≤ 520.
  - Marka "Skor+": "Skor" `#E8EDF3`, "+" `#2BE37A` (uygulama başlığıyla aynı).
  - Slogan 2 satır, 40 px `#E8EDF3`.
  - Alt satır 24 px `#8A97A8` (`bg` üzerinde 6.5:1).
- **Sağ blok, telefon kesiti:**
  - İçinde kare 1'deki AI rapor ekranının **yalnız kart bölümü** var: manşet kartı ve xG kartı. Skor başlığı ve takım rozetleri yok.
  - Telefon çerçevesi çizilmez; 36 px köşeli, 2 px `#232D3A` kenarlı bir ekran kesiti.
  - −6° döndürülür, gölge `rgba(0,0,0,0.5)` 0 24 48.
- **Yok:** kulüp, lig veya NBA logosu; oyuncu fotoğrafı; top, saha veya stadyum fotoğrafı; "indir", "yeni", "#1", fiyat. Rozet yok.
- **Güvenli alan:** Tüm metin kenarlardan ≥ 56 px içeride. Play grafiği farklı oranlarda kırpabildiği için önemli içerik ortadaki 924×400 alanda kalır.
- **Dosya:** 24-bit PNG (alfa yok) veya JPEG kalite 92; `store/feature-graphic.png`.
- **Alt metin:** "Skor+ uygulama adı ve Türkçe AI maç analizi kartı; futbol ve NBA için."

### 5. Uygulama simgesi incelemesi (`assets/`)

| Dosya | Ölçü / tür | Durum |
|---|---|---|
| `assets/icon.png` | 1024×1024, RGB (alfa yok), 384 KB | **Expo şablon simgesi**: açık mavi ızgara üzerinde mavi "Λ" (Expo logosu). Skor+ markası değil. |
| `assets/android-icon-foreground.png` | 512×512, RGBA, 76 KB | Şablon: mavi "Λ". |
| `assets/android-icon-background.png` | 512×512, RGBA, 17 KB | Şablon: açık mavi kılavuz ızgarası. `app.json` `backgroundColor: #0A0E14` veriyor, ama `backgroundImage` bu ızgarayı üstüne koyuyor. |
| `assets/android-icon-monochrome.png` | 432×432, RGBA, 4 KB | Şablon: gri "Λ". |
| `assets/splash-icon.png` | 1024×1024, paletli PNG | Şablon kılavuz ızgarası. |

**Sonuç: simge seti yayına hazır değil.** Tüm dosyalar `create-expo-app` şablonundan geliyor. Play'e yüklenirse başka bir markanın (Expo) logosunu kullanan, uygulamayla ilgisiz bir simge olur. Ayrıca simge değişikliği **native**dir: OTA ile gelmez, yeni EAS build gerekir (`npm run build:apk`).

**Önerilen simge (kullanıcı onayına bağlı, §6):**
- **Konsept:** Uygulama başlığındaki marka işaretinin kendisi: "S" harfi ve sağ üstte yeşil "+". Top, forma veya pota görseli kullanılmaz; spor-nötr kalır ve iki sporu da kapsar. Kulüp veya lig işaretine benzemez.
- **Play simgesi (512×512, 32-bit PNG):**
  - Zemin tam dolu `#0A0E14` (saydamlık yok; Play %30 köşe yarıçapını kendisi uygular).
  - "S" `#E8EDF3`, kalın (900), yükseklik 260 px, optik merkez (236, 266).
  - "+" `#2BE37A`, 120 px kare içinde, kol kalınlığı 30 px, merkez (352, 170).
  - Tüm çizim, ortadaki 352 px'lik keyline dairesinin içinde.
  - Gölge yok (Play ekler). Dosya < 1024 KB.
- **Android adaptif simge (Expo):**
  - `android-icon-background.png` → tek renk `#0A0E14` (1024×1024). Ya da dosya kaldırılıp yalnız `backgroundColor` kullanılır.
  - `android-icon-foreground.png` → 1024×1024, saydam zemin, "S+" çizimi ortadaki **%66'lık güvenli alanda** (adaptif simge 108 dp'nin 66 dp'si; maske dışı kırpılır).
  - `android-icon-monochrome.png` → aynı "S+" siluetinin tek renk (beyaz, alfa) hâli; tema simgeleri için.
  - `icon.png` → Play simgesinin 1024 sürümü (RGB, alfa yok).
  - `splash-icon.png` → yalnız "S+" işareti, saydam zemin; `app.json` splash zemini `#0A0E14`.
- **Kontrol:**
  - 48 dp ana ekran boyutunda "S" ve "+" ayrı seçiliyor.
  - Daire, kare ve damla maskelerinde "+" kırpılmıyor.
  - Monokrom temada okunuyor.

### 6. Playwright çekim planı → `e2e/store_shots.mjs`

Bu dosya `npm run e2e` zincirine **eklenmez**; elle çalıştırılır (`node e2e/store_shots.mjs`). Çıktı `store/` klasörüne gider; `e2e/shots/` ile karışmaz.

```text
Önkoşul
  - Uygulama tarafı (ayrı küçük iş): `?store=1` bayrağı (§1).
  - Tercihen üretim web çıktısı: `npx expo export -p web` → `npx serve dist -l 8084`.

1. Tarayıcı: chromium.launch(); bağlam: viewport 390×607, deviceScaleFactor 900/390,
   locale 'tr-TR', timezoneId 'Europe/Istanbul', reducedMotion 'reduce'
   (canlı nokta ve iskelet animasyonu durur).
2. Her karede: page.clock.setFixedTime('2026-11-18T21:47:00+03:00') → goto(URL) →
   §3'teki adımlar → hedef öğeyi scrollIntoViewIfNeeded → 400 ms bekle →
   page.screenshot({ type: 'png' }) → Buffer (900×1400).
3. Bileşim: ayrı bir sayfada (viewport 1080×1920, deviceScaleFactor 1) page.setContent(şablon HTML).
   Şablon: §2'deki düzen; uygulama görüntüsü <img src="data:image/png;base64,…">,
   altyazı, isteğe bağlı PRO hapı, dürüstlük notu.
   Fontlar yüklenince (document.fonts.ready) screenshot({ type: 'png', omitBackground: false })
   → store/0N-<ad>.png.
4. Öne çıkan grafik: aynı bileşim yöntemi, viewport 1024×500. Telefon kesiti için kare 1'in
   kart bölümü ayrı çekilir: locator('[data-testid=analysis-headline]') ya da kart kapsayıcısının
   screenshot'ı. Kayıt: store/feature-graphic.png.
5. Doğrulama (betik sonunda, sharp yok; PNG başlığından okunur):
   - Her dosya 1080×1920 (grafik 1024×500), renk türü 2 (RGB, alfa yok).
   - Dosya adları 01–08.
   - Sayfa metninde "ÖNİZLEME", "Örnek veri ·", "Önizleme modundasın", "Web sürümünde" yok.
   - Altyazılarda yasaklı kelime yok: en iyi, #1, yeni, indir, hemen, ücretsiz, anlık, ₺, TL.
   - Hata varsa process.exit(1).
6. Çıktı listesi: store/01-ai-rapor.png, 02-takip-listesi.png, 03-nba-box-score.png,
   04-nba-ai.png, 05-takim-takibi.png, 06-kadro.png, 07-bildirim-ayarlari.png,
   08-taktik-asistan.png, feature-graphic.png, alt-metinler.txt (§3 sütunu).
```

Not: `omitBackground: false` ve `bg` zemini sayesinde PNG alfasız çıkar. Chromium yine de RGBA yazarsa betik dosyayı JPEG (kalite 92) olarak da kaydeder; Play iki biçimi de kabul eder.

### 7. Kullanıcı ve pazarlama kararı gerekenler

1. **Simge ve marka işareti (engelleyici).** Bugünkü simgeler Expo şablonu. "S+" önerisi onaylanmalı, ya da kullanıcı kendi logosunu vermeli. Onaydan sonra yeni EAS build gerekir; OTA ile gelmez.
2. **Örnek veri notu.** Kareler mock veriyle çekilir. "Örnek verilerle gösterilmiştir." notunun her karede durması ve pazarlamanın "ekran görüntüleri gerçek" kuralıyla nasıl uzlaşacağı kararlaştırılmalı. Alternatif: gerçek maçlar, logolar gizlenmiş. Bu, kulüp adı ve logo riski taşır ve önerilmez.
3. **Kare 5 ve 7 altyazıları.** Ücretsiz API varsayılanı için önerdiğim iki altyazıyı ("Takımını takip et, maç başlayınca haber al", "Bildirimleri sen seç") pazarlama onaylamalı.
4. **Pro hapı metni.** Mağaza sayfası yayına girdiğinde Pro satışta mı? Satışta değilse hap "PRO · YAKINDA" olur ve tam açıklamadaki "Pro aboneliği Google Play üzerinden yönetilir" cümlesi de değişmelidir.
5. **Kare 5 ücretli sürümü.** Alarm kartı için kurgusal takımlı ve kurgusal oyunculu bir mock senaryo gerekir. Bugünkü alarm senaryosu gerçek milli takım ve gerçek oyuncu adı içeriyor.
