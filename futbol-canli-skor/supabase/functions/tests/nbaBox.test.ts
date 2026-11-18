// NBA box score ve logo dönüşümü — çalıştırma: supabase/functions içinde `deno test`
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { applyMirroredLogos, BOX_WAIT_MS, boxScoreToStore, isMissingBoxColumn, isNbaBoxPending, normalizeNbaLogo, toBoxScore } from '../_shared/nbaBox.ts';
import type { NbaPlayerLine } from '../_shared/nbaMetrics.ts';

const p = (name: string, team: 'home' | 'away', starter: boolean, minutes: number, points = 0): NbaPlayerLine => ({
  name, team, starter, position: 'G', minutes, points, rebounds: 0, assists: 0, plus_minus: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, fta: 0,
});

Deno.test('box score: ev önce, her takımda ilk 5 sonra dakika; oynamayan elenir', () => {
  const box = toBoxScore([p('D1', 'away', true, 30), p('H2', 'home', false, 25), p('H1', 'home', true, 20), p('DNP', 'home', false, 0), p('D2', 'away', false, 35)])!;
  assertEquals(box.map((x) => x.name), ['H1', 'H2', 'D1', 'D2']);
});

Deno.test('box score: boş / bozuk girdi null', () => {
  assertEquals(toBoxScore([]), null);
  assertEquals(toBoxScore([p('X', 'home', true, 0)]), null);
  assertEquals(toBoxScore(null as unknown as NbaPlayerLine[]), null);
});

Deno.test('box score: takım başına en fazla 18', () => {
  const many = Array.from({ length: 40 }, (_, i) => p(`H${i}`, 'home', i < 5, 40 - i));
  assertEquals(toBoxScore(many)!.length, 18);
});

Deno.test('logo: Wikimedia SVG → 120 px PNG; diğerleri korunur', () => {
  assertEquals(
    normalizeNbaLogo('https://upload.wikimedia.org/wikipedia/en/0/02/Washington_Wizards_logo.svg'),
    'https://upload.wikimedia.org/wikipedia/en/thumb/0/02/Washington_Wizards_logo.svg/120px-Washington_Wizards_logo.svg.png',
  );
  assertEquals(normalizeNbaLogo('https://upload.wikimedia.org/wikipedia/commons/a/ab/X.svg'), 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.svg/120px-X.svg.png');
  assertEquals(normalizeNbaLogo('https://example.com/logo.png'), 'https://example.com/logo.png');
  assertEquals(normalizeNbaLogo('http://insecure.com/a.png'), null);
  assertEquals(normalizeNbaLogo(null), null);
  assertEquals(normalizeNbaLogo('javascript:alert(1)'), null);
});

Deno.test('isMissingBoxColumn', () => {
  assert(isMissingBoxColumn({ code: 'PGRST204' }));
  assert(isMissingBoxColumn({ message: 'column matches.box_score does not exist' }));
  assert(!isMissingBoxColumn({ code: '23505' }));
  assert(!isMissingBoxColumn(null));
});

Deno.test('boxScoreToStore: boş oyuncu verisi geri doldurmada [] ile işaretlenir, ilk denemede yazılmaz', () => {
  assertEquals(boxScoreToStore([], true), []);
  assertEquals(boxScoreToStore([p('X', 'home', true, 0)], true), []);
  assertEquals(boxScoreToStore([], false), null);
  assertEquals(boxScoreToStore([p('H1', 'home', true, 30)], true)!.map((x) => x.name), ['H1']);
});

Deno.test('isNbaBoxPending: [] beklenmez; null 9 saate kadar beklenir; futbol hiç', () => {
  const now = Date.parse('2026-11-18T12:00:00Z');
  const recent = new Date(now - 2 * 3600_000).toISOString();
  const old = new Date(now - BOX_WAIT_MS - 1000).toISOString();
  assert(isNbaBoxPending({ sport_type: 'nba', box_score: null, kickoff_at: recent }, now));
  assert(!isNbaBoxPending({ sport_type: 'nba', box_score: null, kickoff_at: old }, now));
  assert(!isNbaBoxPending({ sport_type: 'nba', box_score: [], kickoff_at: recent }, now));
  assert(!isNbaBoxPending({ sport_type: 'nba', box_score: [{ name: 'A' }], kickoff_at: recent }, now));
  assert(!isNbaBoxPending({ sport_type: 'nba', kickoff_at: old }, now)); // 0014 yok
  assert(isNbaBoxPending({ sport_type: 'nba', box_score: null, kickoff_at: null }, now));
  assert(!isNbaBoxPending({ sport_type: 'football', box_score: null, kickoff_at: recent }, now));
});

Deno.test('applyMirroredLogos: bilinen kümede Storage adresi; bilinmeyende logo alanları tüm satırlardan çıkar', () => {
  const url = (id: number) => `https://s/nba/${id}.png`;
  const rows = [
    { fixture_id: 1, home_team_id: 10, away_team_id: 20, home_logo: 'https://upload.wikimedia.org/a.png', away_logo: 'https://upload.wikimedia.org/b.png' },
    { fixture_id: 2, home_team_id: 30, away_team_id: 10, home_logo: 'https://upload.wikimedia.org/c.png', away_logo: null },
  ];
  const known = applyMirroredLogos(rows, new Set([10]), url);
  assertEquals(known[0].home_logo, url(10));
  assertEquals(known[0].away_logo, 'https://upload.wikimedia.org/b.png');
  assertEquals(known[1].away_logo, url(10));
  const unknown = applyMirroredLogos(rows, null, url);
  assert(unknown.every((r) => !Object.keys(r).some((k) => k === 'home_logo' || k === 'away_logo')));
  assertEquals(unknown[1].fixture_id, 2);
});
