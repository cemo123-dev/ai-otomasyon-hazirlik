// Kadro / oyuncu puanı eşleme testleri (0013) — çalıştırma: npm run test:functions
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  isMissingLineupColumn,
  type LineupWriter,
  mapLineupDetail,
  mapLineupFields,
  mapPlayerRatings,
  storeLineupFields,
} from '../_shared/lineups.ts';

const xi = (id: number, name: string, number: number, pos: string, grid: string) => ({ player: { id, name, number, pos, grid } });

const fixture = {
  fixture: { id: 1 },
  teams: { home: { id: 10, name: 'Ev' }, away: { id: 20, name: 'Konuk' } },
  lineups: [
    {
      team: { id: 20 },
      formation: '4-3-3',
      coach: { id: 2, name: 'Konuk Hoca' },
      startXI: [xi(201, 'K. Kaleci', 1, 'G', '1:1'), xi(202, 'K. Forvet', 9, 'F', '4:2')],
      substitutes: [xi(203, 'K. Yedek', 18, 'M', null as unknown as string)],
    },
    {
      team: { id: 10 },
      formation: '4-2-3-1',
      coach: { id: 1, name: 'Ev Hoca' },
      startXI: [xi(101, 'E. Kaleci', 1, 'G', '1:1'), xi(102, 'E. Forvet', 9, 'F', '5:1')],
      substitutes: [],
    },
  ],
  players: [
    {
      team: { id: 10 },
      players: [
        { player: { id: 101, name: 'E. Kaleci' }, statistics: [{ games: { minutes: 90, rating: '6.9', position: 'G' }, goals: { total: 0, assists: 0 } }] },
        { player: { id: 102, name: 'E. Forvet' }, statistics: [{ games: { minutes: 90, rating: '8.4', position: 'F' }, goals: { total: 2, assists: null } }] },
        // Oyuna girmedi → listelenmez
        { player: { id: 103, name: 'E. Yedek' }, statistics: [{ games: { minutes: null, rating: null, position: 'M' } }] },
      ],
    },
    {
      team: { id: 20 },
      players: [
        { player: { id: 202, name: 'K. Forvet' }, statistics: [{ games: { minutes: 70, rating: '7.1', position: 'F' }, goals: { total: 1, assists: 0 } }] },
        // 0 dakika ama puanı var (veri hatası) → listelenmez
        { player: { id: 203, name: 'K. Yedek' }, statistics: [{ games: { minutes: 0, rating: '6.0', position: 'M' } }] },
      ],
    },
  ],
};

Deno.test('kadro: ev/deplasman takım kimliğine göre ayrılır, alanlar korunur', () => {
  const d = mapLineupDetail(fixture)!;
  assertEquals(d.home?.formation, '4-2-3-1');
  assertEquals(d.home?.coach, 'Ev Hoca');
  assertEquals(d.away?.coach, 'Konuk Hoca');
  assertEquals(d.home?.start_xi[1], { id: 102, name: 'E. Forvet', number: 9, pos: 'F', grid: '5:1' });
  assertEquals(d.away?.substitutes[0].grid, null); // yedeklerde grid yok
});

Deno.test('kadro: veri yoksa / ilk 11 boşsa null (kolon yazılmaz)', () => {
  assertEquals(mapLineupDetail({ teams: { home: { id: 1 } }, lineups: [] }), null);
  assertEquals(mapLineupDetail({ teams: { home: { id: 1 } } }), null);
  assertEquals(mapLineupDetail({ teams: { home: { id: 1 } }, lineups: [{ team: { id: 1 }, startXI: [] }] }), null);
});

Deno.test('kadro: bozuk/şişkin alanlar temizlenir', () => {
  const big = {
    teams: { home: { id: 1 } },
    lineups: [
      {
        team: { id: 1 },
        formation: '<script>alert(1)</script>',
        coach: { name: 'x'.repeat(500) },
        startXI: Array.from({ length: 30 }, (_, i) => xi(i, `Oyuncu ${i}`, i, 'Z', 'a:b')),
        substitutes: [{ player: { name: 42 } }, null],
      },
    ],
  };
  const t = mapLineupDetail(big)!.home!;
  assertEquals(t.start_xi.length, 11);
  assertEquals(t.start_xi[0].pos, null); // tanımsız pozisyon kodu
  assertEquals(t.start_xi[0].grid, null); // geçersiz grid
  assertEquals(t.coach!.length, 60);
  assertEquals(t.formation!.length, 12);
  assertEquals(t.substitutes, []);
});

Deno.test('oyuncu puanları: azalan sıra, 0 dk / puansız oyuncu yok, numara kadrodan', () => {
  const r = mapPlayerRatings(fixture)!;
  assertEquals(r.map((p) => p.name), ['E. Forvet', 'K. Forvet', 'E. Kaleci']);
  assertEquals(r[0], { id: 102, name: 'E. Forvet', team: 'home', number: 9, pos: 'F', rating: 8.4, minutes: 90, goals: 2, assists: 0 });
  assertEquals(r[1].team, 'away');
  assertEquals(mapPlayerRatings({ teams: { home: { id: 1 } }, players: [] }), null);
  assertEquals(mapPlayerRatings({ teams: { home: { id: 1 } }, players: [{ team: { id: 1 }, players: [] }] }), null);
});

Deno.test('kadro/puan eşleme ek API isteği yapmaz (saf modül)', async () => {
  const src = await Deno.readTextFile(new URL('../_shared/lineups.ts', import.meta.url));
  assert(!/apiGet|fetch\(|Deno\.env/.test(src));
});

Deno.test('mapLineupFields: eşleme hatası yalnız o alanı atlar, throw etmez', () => {
  const evil = { ...fixture, get lineups(): unknown { throw new Error('bozuk'); } };
  const out = mapLineupFields(evil);
  assertEquals(out.lineup_detail, undefined);
  assertEquals(out.player_ratings, undefined); // puan da lineups'a baktığı için atlanır, ama throw yok
  assertEquals(Object.keys(mapLineupFields(fixture)).sort(), ['lineup_detail', 'player_ratings']);
});

Deno.test('isMissingLineupColumn: PGRST204 / 42703 / kolon adı', () => {
  assert(isMissingLineupColumn({ code: 'PGRST204', message: "Could not find the 'lineup_detail' column" }));
  assert(isMissingLineupColumn({ code: '42703' }));
  assert(isMissingLineupColumn({ message: 'column matches.player_ratings does not exist' }));
  assert(!isMissingLineupColumn({ code: '23505', message: 'duplicate key' }));
  assert(!isMissingLineupColumn(null));
});

type Call = { values: Record<string, unknown>; id: number };
const fakeDb = (errorFor: (id: number) => { code?: string; message?: string } | null, calls: Call[]): LineupWriter => ({
  from: () => ({
    update: (values) => ({
      eq: (_c, id) => {
        calls.push({ values: values as Record<string, unknown>, id });
        return Promise.resolve({ error: errorFor(id) });
      },
    }),
  }),
});

Deno.test('storeLineupFields: yalnız değeri olan maça, maç başına ayrı update (NULL ile ezme yok)', async () => {
  const calls: Call[] = [];
  const empty = { fixture: { id: 2 }, teams: { home: { id: 10 } }, lineups: [], players: [] };
  const n = await storeLineupFields(fakeDb(() => null, calls), [fixture, empty, { fixture: { id: 'x' } }]);
  assertEquals(n, 1);
  assertEquals(calls.map((c) => c.id), [1]);
  assertEquals(Object.keys(calls[0].values).sort(), ['lineup_detail', 'player_ratings']);
});

Deno.test('storeLineupFields: 0013 eksikse (PGRST204) throw etmez ve durur', async () => {
  const calls: Call[] = [];
  const second = { ...fixture, fixture: { id: 3 } };
  const n = await storeLineupFields(fakeDb(() => ({ code: 'PGRST204', message: 'column not found' }), calls), [fixture, second]);
  assertEquals(n, 0);
  assertEquals(calls.length, 1);
  // Başka bir hata: o maç atlanır, diğerleri yazılır
  const calls2: Call[] = [];
  const n2 = await storeLineupFields(fakeDb((id) => (id === 1 ? { code: '57014', message: 'timeout' } : null), calls2), [fixture, second]);
  assertEquals(n2, 1);
  assertEquals(calls2.length, 2);
});
