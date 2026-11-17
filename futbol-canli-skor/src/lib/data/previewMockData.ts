import type { PreviewPayload } from '../types';

// Önizleme verisi — takım ve oyuncu adları kurgusaldır.
export const PREVIEW_MOCK_ID = 9005;

export const previewMockPayload: PreviewPayload = {
  kind: 'preview',
  headline: 'Maçın Kilidi Nordheim\'ın Sağ Koridorunda',
  overview:
    'FC Rheinstadt 4-3-3 ile topa sahip olmaya, Borussia Nordheim 4-2-3-1 ile geçişe oynuyor. Son 5 maçta Rheinstadt maç başına 1.84 xG üretirken Nordheim\'ın xG\'si 1.12\'de kaldı ama trendi yükselişte.',
  lineups: {
    home: {
      formation: '4-3-3',
      coach: 'L. Brandt',
      xi: [
        { name: 'M. Keller', pos: 'G' }, { name: 'J. Wolf', pos: 'D' }, { name: 'T. Arndt', pos: 'D' }, { name: 'S. Brück', pos: 'D' },
        { name: 'F. Lenz', pos: 'D' }, { name: 'P. Haas', pos: 'M' }, { name: 'D. Roth', pos: 'M' }, { name: 'K. Vogel', pos: 'M' },
        { name: 'A. Sommer', pos: 'F' }, { name: 'N. Kraft', pos: 'F' }, { name: 'L. Weiss', pos: 'F' },
      ],
    },
    away: {
      formation: '4-2-3-1',
      coach: 'R. Eckert',
      xi: [
        { name: 'B. Stahl', pos: 'G' }, { name: 'O. Fink', pos: 'D' }, { name: 'C. Busch', pos: 'D' }, { name: 'H. Mayer', pos: 'D' },
        { name: 'E. Graf', pos: 'D' }, { name: 'V. Lang', pos: 'M' }, { name: 'G. Beck', pos: 'M' }, { name: 'R. Hahn', pos: 'M' },
        { name: 'I. Kuhn', pos: 'M' }, { name: 'Y. Pohl', pos: 'M' }, { name: 'Z. Frey', pos: 'F' },
      ],
    },
  },
  form: {
    home: { n: 5, xg_for: 1.84, xg_against: 0.97, shots: 15.2, possession: 58, results: 'G-G-B-M-G', trend: { recent: 1.71, earlier: 1.93, dir: 'flat' } },
    away: { n: 5, xg_for: 1.12, xg_against: 1.31, shots: 10.4, possession: 44, results: 'G-G-M-B-M', trend: { recent: 1.52, earlier: 0.85, dir: 'up' } },
  },
  matchups: [
    {
      zone: 'sol kanat', attacking_side: 'home',
      attacker: { name: 'A. Sommer', pos: 'F', form: { player_id: 1, name: 'A. Sommer', matches: 5, minutes: 412, duel_pct: 52, dribble_pct: 61, dribbles_90: 3.4, tkl_int_90: 0.9, dribbled_past_90: 0.4, key_passes_90: 1.8, rating: 7.3 } },
      defender: { name: 'E. Graf', pos: 'D', form: { player_id: 2, name: 'E. Graf', matches: 5, minutes: 450, duel_pct: 58, dribble_pct: null, dribbles_90: 0.2, tkl_int_90: 3.6, dribbled_past_90: 0.8, key_passes_90: 0.4, rating: 7.0 } },
      edge: -6,
    },
    {
      zone: 'sağ kanat', attacking_side: 'home',
      attacker: { name: 'L. Weiss', pos: 'F', form: { player_id: 3, name: 'L. Weiss', matches: 5, minutes: 388, duel_pct: 47, dribble_pct: 44, dribbles_90: 2.1, tkl_int_90: 1.1, dribbled_past_90: 0.5, key_passes_90: 1.2, rating: 6.8 } },
      defender: { name: 'O. Fink', pos: 'D', form: { player_id: 4, name: 'O. Fink', matches: 5, minutes: 450, duel_pct: 55, dribble_pct: null, dribbles_90: 0.4, tkl_int_90: 2.9, dribbled_past_90: 1.0, key_passes_90: 0.6, rating: 6.9 } },
      edge: -8,
    },
    {
      zone: 'sol kanat', attacking_side: 'away',
      attacker: { name: 'R. Hahn', pos: 'M', form: { player_id: 5, name: 'R. Hahn', matches: 5, minutes: 401, duel_pct: 49, dribble_pct: 50, dribbles_90: 1.9, tkl_int_90: 1.6, dribbled_past_90: 0.7, key_passes_90: 1.4, rating: 6.9 } },
      defender: { name: 'F. Lenz', pos: 'D', form: { player_id: 6, name: 'F. Lenz', matches: 5, minutes: 450, duel_pct: 51, dribble_pct: null, dribbles_90: 0.3, tkl_int_90: 2.4, dribbled_past_90: 1.3, key_passes_90: 0.9, rating: 6.7 } },
      edge: -2,
    },
    {
      zone: 'sağ kanat', attacking_side: 'away',
      attacker: { name: 'Y. Pohl', pos: 'M', form: { player_id: 7, name: 'Y. Pohl', matches: 5, minutes: 436, duel_pct: 63, dribble_pct: 68, dribbles_90: 4.1, tkl_int_90: 1.2, dribbled_past_90: 0.6, key_passes_90: 2.2, rating: 7.6 } },
      defender: { name: 'J. Wolf', pos: 'D', form: { player_id: 8, name: 'J. Wolf', matches: 4, minutes: 341, duel_pct: 41, dribble_pct: null, dribbles_90: 0.5, tkl_int_90: 2.1, dribbled_past_90: 2.4, key_passes_90: 0.7, rating: 6.4 } },
      edge: 22,
    },
  ],
  key_matchup_index: 3,
  key_matchup_commentary:
    'Nordheim\'ın sağ kanadında Y. Pohl, ikili mücadelede %63 ve maç başına 4.1 çalım denemesiyle formda; karşısındaki J. Wolf ise %41\'de kalıyor ve 90 dakikada 2.4 kez çalımla geçiliyor. Bu 22 puanlık fark, maçın en net dengesizliği.',
  breaking_scenario:
    'Eğer Rheinstadt topu kaybettiği anlarda Wolf\'un arkasındaki alanı koruyamazsa, Nordheim\'ın geçiş oyunu bu koridordan kırılma yaratabilir. Rheinstadt ise Sommer ile sol kanatta Graf\'ı geride tutmaya çalışacak.',
  watch_list: ['Pohl ile Wolf düellosu ilk 15 dakikada', 'Rheinstadt orta sahasının top kaybı sonrası pres hızı', 'Nordheim\'ın yükselen xG trendi geçişlerde sürecek mi'],
  absences: [
    { side: 'home', name: 'M. Ott', reason: 'Diz sakatlığı', regular_starter: true },
    { side: 'away', name: 'P. Seidel', reason: 'Kart cezası', regular_starter: false },
  ],
  absences_commentary: 'Rheinstadt\'ın düzenli ilk 11 sağ beki M. Ott\'un yokluğunda J. Wolf görev alıyor; bu, kilit eşleşmenin neden kritik olduğunu açıklıyor.',
  data_basis: 'api_last5',
  generated_at: new Date().toISOString(),
};
