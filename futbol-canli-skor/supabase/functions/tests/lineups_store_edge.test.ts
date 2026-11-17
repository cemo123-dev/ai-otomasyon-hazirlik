// Yeniden doğrulama turu: storeLineupFields / mapLineupFields kenar durumları ve yazım yollarının kapsamı
// Çalıştırma: npm run test:functions
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { mapPlayerRatings, storeLineupFields, type LineupWriter } from '../_shared/lineups.ts';

const pl = (id: number, name: string) => ({ player: { id, name, number: id, pos: 'M', grid: null } });
const rated = (id: number, name: string) => ({
  player: { id, name },
  statistics: [{ games: { minutes: 90, rating: '7.0', position: 'M' }, goals: { total: 0, assists: 0 } }],
});
const fx = (id: number) => ({
  fixture: { id },
  teams: { home: { id: 10 }, away: { id: 20 } },
  lineups: [{ team: { id: 10 }, startXI: [pl(1, 'A')] }],
  players: [{ team: { id: 10 }, players: [rated(1, 'A')] }],
});

Deno.test('store: istemci (db) promise reddederse throw etmez, sonraki maç yazılır', async () => {
  const seen: number[] = [];
  const db: LineupWriter = {
    from: () => ({
      update: () => ({
        eq: (_c, id) => {
          seen.push(id);
          return id === 1 ? Promise.reject(new Error('ağ hatası')) : Promise.resolve({ error: null });
        },
      }),
    }),
  };
  const n = await storeLineupFields(db, [fx(1), fx(2)]);
  assertEquals(seen, [1, 2]);
  assertEquals(n, 1);
});

Deno.test('store: null / bozuk fixture girdileri atlanır', async () => {
  const db: LineupWriter = { from: () => { throw new Error('çağrılmamalı'); } };
  assertEquals(await storeLineupFields(db, [null, undefined, 5, 'x', { fixture: null }]), 0);
});

Deno.test('store: yazılan alanlar yalnız lineup_detail / player_ratings (başka kolon yok)', async () => {
  const vals: Record<string, unknown>[] = [];
  const db: LineupWriter = {
    from: (t) => {
      assertEquals(t, 'matches');
      return { update: (v) => ({ eq: (c) => { assertEquals(c, 'fixture_id'); vals.push(v as Record<string, unknown>); return Promise.resolve({ error: null }); } }) };
    },
  };
  await storeLineupFields(db, [fx(7)]);
  assertEquals(Object.keys(vals[0]).sort(), ['lineup_detail', 'player_ratings']);
});

Deno.test('ratings: startXI nesne / substitutes sayı iken puanlar yine üretilir', () => {
  const f = { ...fx(1), lineups: [{ team: { id: 10 }, startXI: { a: 1 }, substitutes: 5 }] };
  assertEquals(mapPlayerRatings(f)?.map((r) => r.name), ['A']);
});

Deno.test('bilgi: arr() ön kırpması — ilk 22 kaydı geçersiz olan startXI boş sayılır', () => {
  const xi = [...Array.from({ length: 22 }, () => ({ player: {} })), pl(1, 'Geç Gelen')];
  const out = mapPlayerRatings({ ...fx(1), lineups: [{ team: { id: 10 }, startXI: xi }] });
  // numara kadrodan tamamlanamaz (kayıt kırpıldı); puan yine var
  assertEquals(out?.[0].name, 'A');
});

Deno.test('kapsam: mapDetails kadro/puan üretmez; tüm mapDetails yazım yollarında storeLineupFields çağrılır', async () => {
  const api = await Deno.readTextFile(new URL('../_shared/apiFootball.ts', import.meta.url));
  const body = api.slice(api.indexOf('export function mapDetails'), api.indexOf('function mapEvent'));
  assert(!/out\.(lineup_detail|player_ratings)\s*=/.test(body), 'mapDetails hâlâ kadro alanı yazıyor');
  for (const fn of ['sync-matches', 'generate-halftime']) {
    const src = await Deno.readTextFile(new URL(`../${fn}/index.ts`, import.meta.url));
    const details = (src.match(/mapDetails\(/g) ?? []).length;
    const stores = (src.match(/storeLineupFields\(admin/g) ?? []).length;
    assert(details > 0 && stores >= details, `${fn}: mapDetails=${details}, storeLineupFields=${stores}`);
    assert(!/lineup_detail|player_ratings/.test(src), `${fn}: ana yazımda kadro kolonu adı geçiyor`);
  }
});
