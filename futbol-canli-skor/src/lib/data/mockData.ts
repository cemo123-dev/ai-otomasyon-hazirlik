import type { Match, MatchStats, TacticalPayload } from '../types';

// Tüm takım ve oyuncu adları kurgusaldır (önizleme verisi).

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

/** Ana senaryo: %71 topla oynama, 0.62 xG, 0-1 mağlubiyet */
export const SCENARIO_FIXTURE_ID = 9001;

const scenarioStats: MatchStats = {
  home: {
    possession: 71,
    xg: 0.62,
    shots_total: 19,
    shots_on_target: 3,
    shots_inside_box: 7,
    shots_outside_box: 12,
    passes_accuracy: 89,
    corners: 11,
    fouls: 9,
  },
  away: {
    possession: 29,
    xg: 1.38,
    shots_total: 6,
    shots_on_target: 3,
    shots_inside_box: 5,
    shots_outside_box: 1,
    passes_accuracy: 71,
    corners: 2,
    fouls: 16,
  },
};

/** Futbol önizleme maçları; sport_type vb. alanlar mockSource'ta varsayılanla doldurulur */
export type FootballMock = Omit<Match, 'sport_type' | 'period_scores' | 'status_detail'>;

export const initialMatches: FootballMock[] = [
  {
    fixture_id: SCENARIO_FIXTURE_ID,
    league_name: 'Süper Lig',
    league_country: 'Türkiye',
    league_priority: 1,
    kickoff_at: hoursFromNow(-2.2),
    home_team: 'Boğaziçi SK',
    away_team: 'Ege Yıldızı',
    home_score: 0,
    away_score: 1,
    status_short: 'FT',
    elapsed_minute: 90,
    summary_teaser:
      'Boğaziçi topun %71’ini tuttu, 19 şut çekti ama yalnızca 0.62 xG üretebildi. Ege Yıldızı 6 şutla 1.38 xG’ye ulaştı ve 64. dakikada 11 saniyelik bir geçişle maçı kopardı.',
    analysis_status: 'none',
    stats: scenarioStats,
    events: [
      { minute: 23, team: 'home', type: 'yellow_card', player: 'Serkan Ilgaz' },
      { minute: 38, team: 'away', type: 'yellow_card', player: 'Murat Aksoy' },
      { minute: 58, team: 'home', type: 'substitution', player: 'Okan Ural', detail: 'Arda Yalın' },
      { minute: 64, team: 'away', type: 'goal', player: 'Barış Tekin', detail: 'Emre Coşar' },
      { minute: 71, team: 'away', type: 'substitution', player: 'Cem Dursun', detail: 'Kaan Bilgiç' },
      { minute: 76, team: 'home', type: 'substitution', player: 'Deniz Kurt', detail: 'Tolga Sezer' },
      { minute: 76, team: 'home', type: 'substitution', player: 'Yusuf Erdem', detail: 'Hakan Çelik' },
      { minute: 83, team: 'home', type: 'red_card', player: 'Serkan Ilgaz', detail: 'İkinci sarı' },
      { minute: 90, extra: 4, team: 'away', type: 'var', player: 'Penaltı incelemesi', detail: 'Penaltı yok' },
    ],
  },
  {
    fixture_id: 9006,
    league_name: 'Süper Lig',
    league_country: 'Türkiye',
    league_priority: 1,
    kickoff_at: hoursFromNow(-0.8),
    home_team: 'Anadolu Gücü',
    away_team: 'Karadeniz FK',
    home_score: 1,
    away_score: 1,
    status_short: '1H',
    elapsed_minute: 41,
    summary_teaser: null,
    analysis_status: 'none',
    stats: {
      home: { possession: 52, xg: 0.84, shots_total: 7, shots_on_target: 3, shots_inside_box: 5, shots_outside_box: 2, passes_accuracy: 82, corners: 3, fouls: 6 },
      away: { possession: 48, xg: 0.71, shots_total: 5, shots_on_target: 2, shots_inside_box: 3, shots_outside_box: 2, passes_accuracy: 80, corners: 2, fouls: 8 },
    },
    events: [
      { minute: 12, team: 'away', type: 'goal', player: 'Ali Kaya', detail: 'Ozan Er' },
      { minute: 29, team: 'home', type: 'penalty_goal', player: 'Burak Sönmez' },
    ],
  },
  {
    fixture_id: 9002,
    league_name: 'Premier League',
    league_country: 'İngiltere',
    league_priority: 12,
    kickoff_at: hoursFromNow(-1.3),
    home_team: 'Northbridge FC',
    away_team: 'Kingsport United',
    home_score: 2,
    away_score: 1,
    status_short: '2H',
    elapsed_minute: 84,
    summary_teaser: null,
    analysis_status: 'none',
    stats: {
      home: { possession: 46, xg: 1.92, shots_total: 13, shots_on_target: 6, shots_inside_box: 10, shots_outside_box: 3, passes_accuracy: 84, corners: 5, fouls: 10 },
      away: { possession: 54, xg: 1.15, shots_total: 11, shots_on_target: 4, shots_inside_box: 6, shots_outside_box: 5, passes_accuracy: 87, corners: 6, fouls: 9 },
    },
    events: [
      { minute: 18, team: 'home', type: 'goal', player: 'J. Whitmore', detail: 'L. Carver' },
      { minute: 44, team: 'away', type: 'goal', player: 'D. Okafor' },
      { minute: 61, team: 'home', type: 'substitution', player: 'R. Haines', detail: 'T. Bell' },
      { minute: 73, team: 'home', type: 'goal', player: 'R. Haines', detail: 'J. Whitmore' },
    ],
  },
  {
    fixture_id: 9003,
    league_name: 'LaLiga',
    league_country: 'İspanya',
    league_priority: 13,
    kickoff_at: hoursFromNow(-0.4),
    home_team: 'Atlético Sierra',
    away_team: 'CD Costa Brava',
    home_score: 0,
    away_score: 0,
    status_short: '1H',
    elapsed_minute: 22,
    summary_teaser: null,
    analysis_status: 'none',
    stats: {
      home: { possession: 58, xg: 0.31, shots_total: 4, shots_on_target: 1, shots_inside_box: 2, shots_outside_box: 2, passes_accuracy: 86, corners: 2, fouls: 3 },
      away: { possession: 42, xg: 0.12, shots_total: 2, shots_on_target: 0, shots_inside_box: 1, shots_outside_box: 1, passes_accuracy: 79, corners: 1, fouls: 5 },
    },
    events: [{ minute: 15, team: 'away', type: 'yellow_card', player: 'P. Navarro' }],
  },
  {
    fixture_id: 9004,
    league_name: 'Serie A',
    league_country: 'İtalya',
    league_priority: 14,
    kickoff_at: hoursFromNow(-3.5),
    home_team: 'AC Lombardia',
    away_team: 'Sporting Tirreno',
    home_score: 3,
    away_score: 1,
    status_short: 'FT',
    elapsed_minute: 90,
    summary_teaser:
      'Lombardia 2.41 xG ile skoru hak etti; Tirreno’nun tek golü 0.04 xG’lik bir uzak mesafe şutundan geldi.',
    analysis_status: 'completed',
    stats: {
      home: { possession: 55, xg: 2.41, shots_total: 16, shots_on_target: 8, shots_inside_box: 12, shots_outside_box: 4, passes_accuracy: 85, corners: 7, fouls: 11 },
      away: { possession: 45, xg: 0.58, shots_total: 9, shots_on_target: 2, shots_inside_box: 3, shots_outside_box: 6, passes_accuracy: 81, corners: 3, fouls: 13 },
    },
    events: [
      { minute: 9, team: 'home', type: 'goal', player: 'M. Ferraro', detail: 'G. Conti' },
      { minute: 33, team: 'away', type: 'goal', player: 'L. Bassi' },
      { minute: 52, team: 'home', type: 'goal', player: 'G. Conti' },
      { minute: 66, team: 'away', type: 'substitution', player: 'S. Greco', detail: 'A. Marino' },
      { minute: 81, team: 'home', type: 'goal', player: 'F. Rinaldi', detail: 'M. Ferraro' },
    ],
  },
  {
    fixture_id: 9005,
    league_name: 'Bundesliga',
    league_country: 'Almanya',
    league_priority: 15,
    kickoff_at: hoursFromNow(1.5),
    home_team: 'FC Rheinstadt',
    away_team: 'Borussia Nordheim',
    home_score: null,
    away_score: null,
    status_short: 'NS',
    elapsed_minute: null,
    summary_teaser: null,
    analysis_status: 'none',
    stats: null,
    events: null,
  },
  {
    fixture_id: 9007,
    league_name: 'Ligue 1',
    league_country: 'Fransa',
    league_priority: 16,
    kickoff_at: hoursFromNow(3),
    home_team: 'Olympique Riviera',
    away_team: 'Stade Armorique',
    home_score: null,
    away_score: null,
    status_short: 'NS',
    elapsed_minute: null,
    summary_teaser: null,
    analysis_status: 'none',
    stats: null,
    events: null,
  },
  // Milli takım ve UEFA maçları (önizleme verisi; oyuncu adları kurgusal)
  {
    fixture_id: 9010,
    league_name: 'Dünya Kupası Avrupa Elemeleri',
    league_country: 'Milli Takımlar',
    league_priority: 4,
    kickoff_at: hoursFromNow(-1.1),
    home_team: 'Türkiye',
    away_team: 'İskoçya',
    home_score: 1,
    away_score: 0,
    status_short: '2H',
    elapsed_minute: 58,
    summary_teaser: null,
    analysis_status: 'none',
    stats: {
      home: { possession: 57, xg: 1.21, shots_total: 11, shots_on_target: 4, shots_inside_box: 7, shots_outside_box: 4, passes_accuracy: 86, corners: 5, fouls: 8 },
      away: { possession: 43, xg: 0.47, shots_total: 6, shots_on_target: 1, shots_inside_box: 3, shots_outside_box: 3, passes_accuracy: 80, corners: 2, fouls: 11 },
    },
    events: [
      { minute: 34, team: 'home', type: 'goal', player: 'Mert Aydın', detail: 'Can Yılmaz' },
      { minute: 46, team: 'away', type: 'substitution', player: 'J. Fraser', detail: 'K. Burns' },
    ],
  },
  {
    fixture_id: 9011,
    league_name: 'UEFA Uluslar Ligi',
    league_country: 'Milli Takımlar',
    league_priority: 6,
    kickoff_at: hoursFromNow(2.5),
    home_team: 'İtalya',
    away_team: 'Portekiz',
    home_score: null,
    away_score: null,
    status_short: 'NS',
    elapsed_minute: null,
    summary_teaser: null,
    analysis_status: 'none',
    stats: null,
    events: null,
  },
  {
    fixture_id: 9012,
    league_name: 'UEFA Şampiyonlar Ligi',
    league_country: 'Avrupa',
    league_priority: 8,
    kickoff_at: hoursFromNow(4),
    home_team: 'Northbridge FC',
    away_team: 'AC Lombardia',
    home_score: null,
    away_score: null,
    status_short: 'NS',
    elapsed_minute: null,
    summary_teaser: null,
    analysis_status: 'none',
    stats: null,
    events: null,
  },
];

export const scenarioPayload: TacticalPayload = {
  headline_title: 'Steril Hakimiyet: %71 top, 0.62 xG, sıfır gol',
  executive_tactical_verdict:
    'Boğaziçi topa sahip oldu ama ceza sahasına sahip olamadı. 19 şutun 12’si ceza sahası dışından geldi ve şut başına xG 0.03’te kaldı. Ege Yıldızı 41. dakikadan sonra 5-4-1 alçak bloğa geçip merkezi kapattı; tek yapması gereken geçişte isabetli olmaktı. 64. dakikadaki 3 paslık, 11 saniyelik kontra maçın bütün hikâyesini özetliyor.',
  xg_and_shot_quality_audit: {
    verdict_type: 'sterile_dominance',
    verdict_label: 'Steril Baskı ↔ Klinik Geçiş',
    home: { xg: 0.62, shots: 19, xg_per_shot: 0.03, shots_on_target: 3, shots_inside_box: 7 },
    away: { xg: 1.38, shots: 6, xg_per_shot: 0.23, shots_on_target: 3, shots_inside_box: 5 },
    commentary:
      'Boğaziçi’nin xG’sinin %48’i tek bir 0.30’luk pozisyondan geldi. Kanattan yapılan 11 ortanın yalnızca 2’si arkadaşını buldu. Ege’nin 6 şutunun 5’i ceza sahası içinden ve 3’ü büyük fırsattı: az ama nitelikli üretim.',
  },
  game_state_and_momentum_shifts: [
    {
      minute: 15,
      score_state: '0-0',
      title: 'Yüksek blok, düşük tehdit',
      description: 'Boğaziçi ilk 30 dakikada topun %78’ini tuttu ama yalnızca 0.11 xG üretti. Orta saha geniş bırakıldı, dikine pas sayısı 4’te kaldı.',
      momentum: 'home',
    },
    {
      minute: 41,
      score_state: '0-0',
      title: 'Ege 5-4-1 alçak bloğa geçti',
      description: 'Kanat oyuncuları bek hattına indi. Boğaziçi’nin ceza sahasına girişleri devre arasına kadar yarı yarıya düştü.',
      momentum: 'neutral',
    },
    {
      minute: 64,
      score_state: '0-1',
      title: 'Geçiş golü: 3 pas, 11 saniye',
      description: 'Bir korner sonrası top kaybı yaşandı. Coşar’ın uzun diyagonal pası Boğaziçi’nin dağınık rest-defence yapısını cezalandırdı. Golün xG değeri 0.41.',
      momentum: 'away',
    },
    {
      minute: 76,
      score_state: '0-1',
      title: 'Çift santrfor kumarı',
      description: '4-2-4’e geçilince orta saha boşaldı. Ege sonraki 10 dakikada 3 kontra atağa çıktı ve 0.52 xG daha üretti.',
      momentum: 'away',
    },
    {
      minute: 83,
      score_state: '0-1',
      title: 'Kırmızı kart baskıyı bitirdi',
      description: 'Ilgaz’ın ikinci sarı kartından sonra Boğaziçi’nin son 10 dakikalık xG’si 0.04’te kaldı.',
      momentum: 'away',
    },
  ],
  managerial_and_bench_impact: {
    home: {
      manager: 'Tarık Karaman',
      delta: -1.5,
      key_decision: '76’da iki santrforla 4-2-4',
      commentary: 'Yapılan değişiklikler şut sayısını artırdı ama şut kalitesini artırmadı. Geçiş savunmasını zayıflatan değişiklik maçı kapatmadı, tersine Ege’ye alan açtı.',
    },
    away: {
      manager: 'Rıza Esen',
      delta: 2,
      key_decision: '41’de 5-4-1 alçak blok',
      commentary: 'Merkezi kapatarak rakibi kanat ve uzaktan şuta mecbur bıraktı. 71’deki taze kanat değişikliği kontra hattını canlı tuttu.',
    },
  },
  player_performance_spotlight: {
    player: 'Emre Coşar',
    team: 'away',
    position: 'Sol Bek',
    rating: 8.4,
    headline: 'Hem savunmanın kilidi hem kontranın fitili',
    key_stats: [
      { label: 'Asist', value: '1' },
      { label: 'Top kapma', value: '6' },
      { label: 'Uzun pas', value: '4/5' },
      { label: 'Kazanılan ikili mücadele', value: '9' },
    ],
  },
};

export const lombardiaPayload: TacticalPayload = {
  headline_title: 'Kalite Farkı Skora Yansıdı',
  executive_tactical_verdict:
    'Lombardia, ceza sahası içinden attığı 12 şutla 2.41 xG üretti. Rakibini uzaktan şuta zorladı ve ikinci yarıda baskı hattını yükselterek maçı kontrol etti.',
  xg_and_shot_quality_audit: {
    verdict_type: 'balanced_exchange',
    verdict_label: 'Hak Edilmiş Galibiyet',
    home: { xg: 2.41, shots: 16, xg_per_shot: 0.15, shots_on_target: 8, shots_inside_box: 12 },
    away: { xg: 0.58, shots: 9, xg_per_shot: 0.06, shots_on_target: 2, shots_inside_box: 3 },
    commentary: 'Tirreno’nun tek golü 0.04 xG’lik bir şuttan geldi. Bu bir şanstı, bir sistemin ürünü değildi.',
  },
  game_state_and_momentum_shifts: [
    { minute: 9, score_state: '1-0', title: 'Erken baskının ödülü', description: 'Yükseğe çıkan Conti ve Ferraro’nun kombinasyonu.', momentum: 'home' },
    { minute: 33, score_state: '1-1', title: 'Uzaktan sürpriz', description: 'Bassi’nin 28 metreden şutu (0.04 xG).', momentum: 'away' },
    { minute: 52, score_state: '2-1', title: 'Devre arası düzeltmesi', description: 'Sağ kanatta 2’ye 1 üstünlük kuruldu ve Conti boş alanı buldu.', momentum: 'home' },
  ],
  managerial_and_bench_impact: {
    home: { manager: 'Paolo Ricci', delta: 1.5, key_decision: 'Devre arası sağ kanat yüklemesi', commentary: 'İkinci yarının ilk 15 dakikasında 0.9 xG üretildi.' },
    away: { manager: 'Marco Vitale', delta: -0.5, key_decision: '66’da Greco değişikliği', commentary: 'Değişiklik oyuna etki etmedi; pres yoğunluğu düştü.' },
  },
  player_performance_spotlight: {
    player: 'G. Conti',
    team: 'home',
    position: 'Sağ Kanat',
    rating: 8.7,
    headline: '1 gol, 1 asist, 5 kilit pas',
    key_stats: [
      { label: 'Gol', value: '1' },
      { label: 'Asist', value: '1' },
      { label: 'Kilit pas', value: '5' },
      { label: 'xA', value: '0.62' },
    ],
  },
};

/** Önizlemede canlı maç bittiğinde üretilen basit (şablon) analiz */
export function buildFallbackPayload(m: Match): TacticalPayload {
  const s = m.stats!;
  const h = s.home;
  const a = s.away;
  const homeWon = (m.home_score ?? 0) > (m.away_score ?? 0);
  const winner = homeWon ? m.home_team : m.away_team;
  const xps = (xg: number, shots: number) => +(shots ? xg / shots : 0).toFixed(2);
  return {
    headline_title: `${winner} için Kritik Anlar`,
    executive_tactical_verdict: `${m.home_team} ${h.xg.toFixed(2)} xG, ${m.away_team} ise ${a.xg.toFixed(2)} xG üretti. (Önizleme: şablondan üretilen analiz.)`,
    xg_and_shot_quality_audit: {
      verdict_type: 'balanced_exchange',
      verdict_label: 'Dengeli Alışveriş',
      home: { xg: h.xg, shots: h.shots_total, xg_per_shot: xps(h.xg, h.shots_total), shots_on_target: h.shots_on_target, shots_inside_box: h.shots_inside_box },
      away: { xg: a.xg, shots: a.shots_total, xg_per_shot: xps(a.xg, a.shots_total), shots_on_target: a.shots_on_target, shots_inside_box: a.shots_inside_box },
      commentary: 'Önizleme verisi.',
    },
    game_state_and_momentum_shifts: (m.events ?? [])
      .filter((e) => e.type.includes('goal'))
      .map((e) => ({
        minute: e.minute,
        score_state: '',
        title: `Gol: ${e.player}`,
        description: e.detail ? `Asist: ${e.detail}` : 'Bireysel aksiyon',
        momentum: e.team,
      })),
    managerial_and_bench_impact: {
      home: { manager: 'Ev sahibi TD', delta: 0, key_decision: '—', commentary: 'Önizleme verisi.' },
      away: { manager: 'Deplasman TD', delta: 0, key_decision: '—', commentary: 'Önizleme verisi.' },
    },
    player_performance_spotlight: {
      player: m.events?.find((e) => e.type.includes('goal'))?.player ?? '—',
      team: homeWon ? 'home' : 'away',
      position: 'Forvet',
      rating: 7.5,
      headline: 'Maçın belirleyici ismi',
      key_stats: [{ label: 'Gol', value: '1' }],
    },
  };
}
