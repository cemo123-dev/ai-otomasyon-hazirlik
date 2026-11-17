// NBA metinlerinde futbol terimi bekçisi + NBA sohbet dosyası — çalıştırma: supabase/functions içinde `deno test`
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { basketballOr, dropFootballSentences, hasFootballTerm } from '../_shared/sportTerms.ts';
import { assistantInstruction, buildDossier, nbaInferences, sanitizeAnswer, ASSISTANT_SYSTEM_INSTRUCTION, NBA_ASSISTANT_SYSTEM_INSTRUCTION } from '../_shared/dossier.ts';

Deno.test('futbol terimleri yakalanır', () => {
  for (const t of [
    'Maçın golünü attı',
    'Forvet hattı etkisizdi',
    'Teknik direktör hamlesi',
    'Rövanşta avantaj kimde?',
    'Penaltı kararı',
    'VAR incelemesi',
    'xG değeri yüksekti',
    'orta sahada üstünlük',
    'sarı kart gördü',
  ]) {
    assert(hasFootballTerm(t), t);
  }
});

Deno.test('basketbol metinleri ve özel adlar geçer', () => {
  for (const t of [
    'Golden State Warriors son çeyrekte 12 sayılık seri yaptı.',
    'Bench farkı var ve rotasyon işe yaradı.',
    'Uzatma periyodunda Knicks kazandı.',
    'İkinci yarıda şut yüzdesi düştü.',
    'Forward pozisyonundaki oyuncu 10 ribaund aldı.',
    'Kaleb Martin üçlükte isabetliydi.',
  ]) {
    assert(!hasFootballTerm(t), t);
  }
});

Deno.test('basketballOr ve cümle ayıklama', () => {
  assertEquals(basketballOr('Grizzlies ikinci golü buldu', 'yedek'), 'yedek');
  assertEquals(basketballOr('Grizzlies 136-120 kazandı', 'yedek'), 'Grizzlies 136-120 kazandı');
  assertEquals(basketballOr('', 'yedek'), 'yedek');
  assertEquals(dropFootballSentences('Bench iyi oynadı. Forvet değişikliği işe yaradı.'), 'Bench iyi oynadı.');
});

const nbaMatch = {
  sport_type: 'nba',
  league_name: 'NBA',
  home_team: 'Memphis Grizzlies',
  away_team: 'Washington Wizards',
  home_score: 136,
  away_score: 120,
  status_short: 'FT',
  period_scores: { home: [30, 35, 38, 33], away: [32, 30, 23, 35] },
  stats: {
    metrics: {
      ts: { home: 65.7, away: 60.1, diff: 5.6 },
      decisive: { text: '3. Çeyrekte +15 sayılık seri (Memphis Grizzlies)' },
      volume_trap: null,
      bench: { home: { bench_points: 41 }, away: { bench_points: 38 } },
      possession: { extra_possessions_home: 4 },
      late_game: { q4_home: 33, q4_away: 35, final_margin: 16, close_game: false },
    },
  },
  top_players: [],
  box_score: [
    { name: 'Zach Edey', team: 'home', starter: true, minutes: 30, points: 23, rebounds: 10, assists: 2, plus_minus: 20, fgm: 10, fga: 14, tpm: 0, tpa: 0 },
    { name: 'Jordan Poole', team: 'away', starter: true, minutes: 32, points: 21, rebounds: 3, assists: 5, plus_minus: -12, fgm: 7, fga: 17, tpm: 3, tpa: 9 },
  ],
};

Deno.test('NBA dosyası: basketbol çıkarımları, box score, NBA talimatı', () => {
  const inf = nbaInferences(nbaMatch);
  assert(inf.some((l) => l.startsWith('kırılma periyodu: 3. Çeyrekte')));
  assert(inf.some((l) => l.includes('bench sayıları: Memphis Grizzlies 41')));
  assert(!inf.some(hasFootballTerm));

  const d = buildDossier({ match: nbaMatch, analysis: null, halftime: null, alerts: [] });
  assert(d.startsWith('{"v":3,'));
  assert(d.includes('"spor":"nba"'));
  assert(d.includes('Zach Edey* 30dk 23s 10r 2a +20'));
  assertEquals(assistantInstruction(d), NBA_ASSISTANT_SYSTEM_INSTRUCTION);
  assert(!/forvet değişikliği/i.test(NBA_ASSISTANT_SYSTEM_INSTRUCTION));

  const fb = buildDossier({ match: { ...nbaMatch, sport_type: 'football', box_score: null }, analysis: null, halftime: null, alerts: [] });
  assertEquals(assistantInstruction(fb), ASSISTANT_SYSTEM_INSTRUCTION);
});

Deno.test('NBA sohbet yanıtında futbol cümlesi atılır, futbolda dokunulmaz', () => {
  const d = buildDossier({ match: nbaMatch, analysis: null, halftime: null, alerts: [] });
  const ans = 'Memphis üçüncü çeyrekte farkı açtı ve bench katkısı belirleyici oldu. Teknik direktörün forvet hamlesi de işe yaradı.';
  assertEquals(sanitizeAnswer(ans, d, 'Maç nasıl koptu?'), 'Memphis üçüncü çeyrekte farkı açtı ve bench katkısı belirleyici oldu.');
  const fb = buildDossier({ match: { ...nbaMatch, sport_type: 'football', box_score: null }, analysis: null, halftime: null, alerts: [] });
  assertEquals(sanitizeAnswer(ans, fb, 'Maç nasıl koptu?'), ans);
});
