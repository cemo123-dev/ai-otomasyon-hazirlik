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
| alerts_ui.mjs | Bildirim ayarları, kırmızı kart / canlı baskı alarmı, Pro analiz |
| nba_ui.mjs | NBA seri alarmı |
| chat_ui.mjs | Taktik Asistan: çip, yazılı soru, 3 soru limiti |
| account_ui.mjs | Test aboneliği, gizlilik/KVKK metinleri, hesap silme |
| teams_ui.mjs | Takım takibi, ★ Takip filtresi, ayarlarda takım listesi |

Her test ayrı tarayıcı oturumunda çalışır; ekran görüntüleri `e2e/shots/` altına yazılır.
Farklı adres için `BASE_URL` ortam değişkenini verin.
