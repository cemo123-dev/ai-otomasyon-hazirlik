import { dayKeyFromToday, istanbulDayKey, istanbulDayStartMs } from '../days';
import type { LineupDetail, LineupPlayer, Match, PlayerRating } from '../types';

// Önizleme verisi — takım ve oyuncu adları kurgusaldır.
// Kadro (0013 lineup_detail), oyuncu puanları (player_ratings) ve tarih şeridi (Dün / Yarın maçları).

const pl = (id: number, name: string, number: number, pos: string, grid: string | null = null): LineupPlayer => ({
  id,
  name,
  number,
  pos,
  grid,
});

/** 9001 Boğaziçi SK 0-1 Ege Yıldızı (FT): olay akışındaki oyuncularla tutarlı */
export const scenarioLineup: LineupDetail = {
  home: {
    team_id: null,
    formation: '4-2-3-1',
    coach: 'Ahmet Sancak',
    start_xi: [
      pl(101, 'Ufuk Demir', 1, 'G', '1:1'),
      pl(102, 'Ali Yüce', 2, 'D', '2:4'),
      pl(103, 'Serkan Ilgaz', 4, 'D', '2:3'),
      pl(104, 'Mert Kaya', 5, 'D', '2:2'),
      pl(105, 'Onur Taş', 3, 'D', '2:1'),
      pl(106, 'Tolga Sezer', 6, 'M', '3:2'),
      pl(107, 'Selim Öz', 8, 'M', '3:1'),
      pl(108, 'Hakan Çelik', 7, 'M', '4:3'),
      pl(109, 'Arda Yalın', 10, 'M', '4:2'),
      pl(110, 'Burak Acar', 11, 'M', '4:1'),
      pl(111, 'Volkan Er', 9, 'F', '5:1'),
    ],
    substitutes: [
      pl(112, 'Okan Ural', 17, 'M'),
      pl(113, 'Deniz Kurt', 14, 'M'),
      pl(114, 'Yusuf Erdem', 19, 'F'),
      pl(115, 'Kerem Ak', 12, 'G'),
      pl(116, 'Eren Bulut', 22, 'D'),
    ],
  },
  away: {
    team_id: null,
    formation: '5-3-2',
    coach: 'Nihat Durmaz',
    start_xi: [
      pl(201, 'Sinan Gök', 1, 'G', '1:1'),
      pl(202, 'Rıza Kılıç', 2, 'D', '2:5'),
      pl(203, 'Murat Aksoy', 4, 'D', '2:4'),
      pl(204, 'Levent Şahin', 5, 'D', '2:3'),
      pl(205, 'Caner Uslu', 6, 'D', '2:2'),
      pl(206, 'Tarık Öner', 3, 'D', '2:1'),
      pl(207, 'Emre Coşar', 8, 'M', '3:3'),
      pl(208, 'Kaan Bilgiç', 14, 'M', '3:2'),
      pl(209, 'Gökhan Ilık', 10, 'M', '3:1'),
      pl(210, 'Barış Tekin', 9, 'F', '4:2'),
      pl(211, 'Fatih Oral', 11, 'F', '4:1'),
    ],
    substitutes: [pl(212, 'Cem Dursun', 16, 'M'), pl(213, 'Halil Yurt', 23, 'D'), pl(214, 'Ozan Bayrak', 12, 'G')],
  },
};

const r = (id: number, name: string, team: 'home' | 'away', number: number, pos: string, rating: number, minutes: number, goals = 0, assists = 0): PlayerRating => ({
  id,
  name,
  team,
  number,
  pos,
  rating,
  minutes,
  goals,
  assists,
});

/** Sunucudaki gibi azalan sırada; 0 dk oynayanlar (yedek kaleciler vb.) listede yok */
export const scenarioRatings: PlayerRating[] = [
  r(210, 'Barış Tekin', 'away', 9, 'F', 8.3, 90, 1),
  r(201, 'Sinan Gök', 'away', 1, 'G', 7.8, 90),
  r(207, 'Emre Coşar', 'away', 8, 'M', 7.6, 90, 0, 1),
  r(203, 'Murat Aksoy', 'away', 4, 'D', 7.2, 90),
  r(108, 'Hakan Çelik', 'home', 7, 'M', 7.1, 76),
  r(107, 'Selim Öz', 'home', 8, 'M', 7.0, 90),
  r(204, 'Levent Şahin', 'away', 5, 'D', 6.9, 90),
  r(102, 'Ali Yüce', 'home', 2, 'D', 6.8, 90),
  r(209, 'Gökhan Ilık', 'away', 10, 'M', 6.8, 90),
  r(104, 'Mert Kaya', 'home', 5, 'D', 6.7, 90),
  r(202, 'Rıza Kılıç', 'away', 2, 'D', 6.7, 90),
  r(110, 'Burak Acar', 'home', 11, 'M', 6.6, 90),
  r(206, 'Tarık Öner', 'away', 3, 'D', 6.6, 90),
  r(205, 'Caner Uslu', 'away', 6, 'D', 6.5, 90),
  r(208, 'Kaan Bilgiç', 'away', 14, 'M', 6.5, 71),
  r(111, 'Volkan Er', 'home', 9, 'F', 6.4, 90),
  r(105, 'Onur Taş', 'home', 3, 'D', 6.4, 90),
  r(101, 'Ufuk Demir', 'home', 1, 'G', 6.3, 90),
  r(106, 'Tolga Sezer', 'home', 6, 'M', 6.3, 76),
  r(211, 'Fatih Oral', 'away', 11, 'F', 6.3, 90),
  r(112, 'Okan Ural', 'home', 17, 'M', 6.2, 32),
  r(212, 'Cem Dursun', 'away', 16, 'M', 6.2, 19),
  r(113, 'Deniz Kurt', 'home', 14, 'M', 6.1, 14),
  r(114, 'Yusuf Erdem', 'home', 19, 'F', 6.0, 14),
  r(109, 'Arda Yalın', 'home', 10, 'M', 5.9, 58),
  r(103, 'Serkan Ilgaz', 'home', 4, 'D', 5.4, 83),
];

/** Kadrosu olan önizleme maçları (9006: canlı → yalnız diziliş, puan yok; grid'siz → pozisyona göre dizilir) */
export const mockLineups: Record<number, { lineup_detail: LineupDetail; player_ratings?: PlayerRating[] }> = {
  9001: { lineup_detail: scenarioLineup, player_ratings: scenarioRatings },
  9006: {
    lineup_detail: {
      home: {
        team_id: null,
        formation: '4-4-2',
        coach: 'Kemal Arı',
        start_xi: [
          pl(301, 'Barış Öztürk', 1, 'G'), pl(302, 'İlker Can', 2, 'D'), pl(303, 'Sefa Ay', 4, 'D'), pl(304, 'Taner Uz', 5, 'D'),
          pl(305, 'Gürkan Ece', 3, 'D'), pl(306, 'Doğan İnal', 7, 'M'), pl(307, 'Erkan Saygı', 8, 'M'), pl(308, 'Utku Pek', 6, 'M'),
          pl(309, 'Ferhat Su', 11, 'M'), pl(310, 'Koray Tan', 9, 'F'), pl(311, 'Polat Er', 10, 'F'),
        ],
        substitutes: [pl(312, 'Alp Nur', 18, 'F'), pl(313, 'Zafer Ok', 15, 'D')],
      },
      away: null, // ilk 11'i henüz açıklanmamış taraf: "Kadro henüz yok"
    },
  },
};

/**
 * Tarih şeridi: göreli saatle üretilen önizleme maçları, testin hangi saatte çalıştığına bakmadan
 * "Bugün" içinde kalsın diye İstanbul gününe sıkıştırılır (gerçek sistemde gün sınırı sunucudan gelir).
 */
export function clampToToday(iso: string, now = Date.now()): string {
  const today = dayKeyFromToday(0, now);
  const key = istanbulDayKey(iso);
  if (key === today) return iso;
  const start = istanbulDayStartMs(0, now);
  return new Date(key < today ? start + 5 * 60_000 : start + 23 * 3600_000 + 55 * 60_000).toISOString();
}

/** İstanbul saatiyle gün + saat (ör. dün 20:00) */
const at = (dayOffset: number, hh: number, mm = 0) =>
  new Date(istanbulDayStartMs(dayOffset) + (hh * 60 + mm) * 60_000).toISOString();

const fb = {
  sport_type: 'football' as const,
  period_scores: null,
  status_detail: null,
  events: null,
  stats: null,
  summary_teaser: null,
  analysis_status: 'none' as const,
  preview_status: 'none' as const,
  halftime_status: 'none' as const,
  halftime_teaser: null,
  elapsed_minute: null,
};

/** Dün (bitmiş) ve yarın (başlamamış) maçları — Dün / Yarın sekmeleri boş kalmasın */
export function dayStripMatches(): Match[] {
  return [
    {
      ...fb,
      fixture_id: 9020,
      league_name: 'Süper Lig',
      league_country: 'Türkiye',
      league_priority: 1,
      kickoff_at: at(-1, 20, 0),
      home_team: 'Karadeniz Spor',
      away_team: 'Toros FK',
      home_score: 2,
      away_score: 2,
      status_short: 'FT',
      elapsed_minute: 90,
      summary_teaser: 'Karadeniz Spor ile Toros FK 2-2 berabere kaldı. (Önizleme: dünkü maç.)',
    },
    {
      ...fb,
      fixture_id: 9021,
      league_name: 'Premier League',
      league_country: 'İngiltere',
      league_priority: 12,
      kickoff_at: at(-1, 22, 0),
      home_team: 'Harbour City',
      away_team: 'Kingsford United',
      home_score: 1,
      away_score: 0,
      status_short: 'FT',
      elapsed_minute: 90,
    },
    {
      ...fb,
      fixture_id: 9022,
      league_name: 'Süper Lig',
      league_country: 'Türkiye',
      league_priority: 1,
      kickoff_at: at(1, 19, 0),
      home_team: 'Marmara Gençlik',
      away_team: 'Kapadokya SK',
      home_score: null,
      away_score: null,
      status_short: 'NS',
    },
    {
      ...fb,
      fixture_id: 9023,
      league_name: 'LaLiga',
      league_country: 'İspanya',
      league_priority: 13,
      kickoff_at: at(1, 22, 0),
      home_team: 'Real Costa',
      away_team: 'Deportivo Meseta',
      home_score: null,
      away_score: null,
      status_short: 'NS',
    },
    {
      ...fb,
      sport_type: 'nba',
      fixture_id: 9_000_009_120,
      league_name: 'NBA',
      league_country: 'ABD',
      league_priority: 1,
      kickoff_at: at(-1, 3, 30),
      home_team: 'Harbor Hawks',
      away_team: 'Summit Bears',
      home_score: 112,
      away_score: 108,
      status_short: 'FT',
      elapsed_minute: 4,
      status_detail: 'Maç Sonu',
      period_scores: { home: [30, 26, 28, 28], away: [27, 29, 25, 27] },
    },
    {
      ...fb,
      sport_type: 'nba',
      fixture_id: 9_000_009_121,
      league_name: 'NBA',
      league_country: 'ABD',
      league_priority: 1,
      kickoff_at: at(1, 3, 0),
      home_team: 'Metro Knights',
      away_team: 'Bayou Gators',
      home_score: null,
      away_score: null,
      status_short: 'NS',
    },
  ];
}
