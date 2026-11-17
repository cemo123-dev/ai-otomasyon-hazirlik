import type { MatchAlert, RedCardAnalysis } from '../types';

// Önizleme: canlı maçlar için örnek akıllı alarmlar (gerçek sistemde sync-matches / sync-nba üretir)

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const TURKEY_SCOTLAND_ID = 9010;
export const NBA_LIVE_ID = 9_000_009_102;
/** Simülasyonda bu dakikaya gelince canlı baskı alarmı düşer */
export const LIVE_PRESSURE_MINUTE = 61;

export const seedAlerts: MatchAlert[] = [
  {
    id: 1,
    fixture_id: TURKEY_SCOTLAND_ID,
    kind: 'red_card',
    side: 'away',
    minute: 49,
    title: '⚡ Kırmızı Kart Kırılması',
    body: "49' McTominay (İskoçya) kırmızı kart gördü, İskoçya 10 kişi kaldı. Maçta dengeler değişti.",
    analysis_status: 'completed',
    created_at: ago(9),
  },
  {
    id: 2,
    fixture_id: NBA_LIVE_ID,
    kind: 'nba_run',
    side: 'away',
    minute: 3,
    title: '🔥 NBA Seri Alarmı',
    body: "3. çeyrekte Riverside Rapids 12-0'lık seri yakaladı, skor eşitlendi!",
    analysis_status: 'none',
    created_at: ago(2),
  },
];

export const livePressureAlert = (id: number): MatchAlert => ({
  id,
  fixture_id: TURKEY_SCOTLAND_ID,
  kind: 'pressure',
  side: 'home',
  minute: LIVE_PRESSURE_MINUTE,
  title: '🚨 Baskı Alarmı',
  body: 'Son 10 dakikada Türkiye 4 isabetli şut (1.10 xG) buldu, gol kapıda!',
  analysis_status: 'none',
  created_at: new Date().toISOString(),
});

export const redCardAnalysisMock: RedCardAnalysis = {
  kind: 'red_card',
  headline: 'İskoçya 10 Kişi: Kanatlar Açıldı',
  situation:
    "McTominay'nin 49. dakikadaki kırmızı kartıyla İskoçya orta sahada bir kişi eksik kaldı. Türkiye topa daha uzun sahip olacak; İskoçya'nın tek silahı duran toplar.",
  prescriptions: [
    { side: 'home', move: 'Bekleri kanat oyuncusu gibi kullan, oyunu genişlet', why: 'On kişilik blok kenarları kapatamaz.' },
    { side: 'home', move: 'Merkezde sabırlı pas, ceza sahası çevresinde şut fırsatı ara', why: 'Rakip derin blokta kalacak.' },
    { side: 'away', move: '4-4-1 ile bloğu derinleştir, duran topları maksimize et', why: 'Açık oyunda sayısal dezavantaj var.' },
  ],
  key: 'Türkiye ilk 15 dakikada ikinci golü bulursa maç kopar; bulamazsa İskoçya duran topla tehdit olmaya devam eder.',
  red: { side: 'away', player: 'McTominay', minute: 49 },
  minute: 50,
  score: { home: 1, away: 0 },
  generated_at: new Date().toISOString(),
};
