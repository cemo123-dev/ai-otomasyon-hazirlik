# Arayüz testleri (Playwright, önizleme verisiyle)

Önizleme sunucusunu başlatın (örnek veri, Supabase'e bağlanmaz):

```sh
EXPO_PUBLIC_PREVIEW_MODE=1 npx expo start --web --port 8084
```

Tarayıcıyı bir kez indirin, ardından testleri çalıştırın (proje kökünden):

```sh
npx playwright-core install chromium-headless-shell
npm run e2e
```

| Dosya | Kapsam |
| --- | --- |
| ht_ui.mjs | Takip zili, devre arası kilidi, Pro rapor, liste rozeti |
| alerts_ui.mjs | Bildirim ayarları, kırmızı kart / canlı baskı alarmı, Pro analiz; `?paid=1&nbapaid=0` (Pro futbol + ücretsiz NBA: NBA seri alarmı yakında) ve `?paid=0` |
| nba_ui.mjs | NBA seri alarmı |
| chat_ui.mjs | Taktik Asistan: çip, yazılı soru, 3 soru limiti |
| preview_ui.mjs | Maç önü AI raporu, mazeret metni ("veri yetersiz") olmaması |
| account_ui.mjs | Test aboneliği, gizlilik/KVKK metinleri, hesap silme |
| teams_ui.mjs | Takım takibi, ★ Takip filtresi, ayarlarda takım listesi |
| share_ui.mjs | F3 Paylaş (NBA/futbol/başlamamış metni, canlıda gizli, 360 pt başlık), davet kartı, kod girme, `?dl=0` / `?invite=0` / `?mockFail=invite` |
| referrer_ui.mjs | Döngü 11: Install Referrer davet önerisi (`?referrer=<kodlu UTM>`: ana ekran bandı, Ayarlar onayı, "Bu kod değil", geçersiz/organik/kendi kodu), Play mağaza bağlantısı (`?dl=play`), önizlemede satın alma kapalı |
| largefont_ui.mjs | 360 px + yazı ×1,3 benzetimi: tek satırlık metin kırpılmaz, Pro sekme etiketi (`FONT_SCALE` ile değiştirilir) |
| lineup_ui.mjs | Tarih şeridi (Dün/Bugün/Yarın + filtre; `?paid=1` 9 gün −1…+7 kaydırılır, NBA 3 gün; `?paid=0` 3 gün), veri tazeliği etiketi (ücretli futbol F1 / ~30 dk), Kadro sekmesi (diziliş, yedekler, puanlar, boş durum, NBA'da yok) |

Her test ayrı tarayıcı oturumunda çalışır; ekran görüntüleri `e2e/shots/` altına yazılır.
Farklı adres için `BASE_URL` ortam değişkenini verin.
