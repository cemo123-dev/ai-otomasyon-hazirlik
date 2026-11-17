// Kadro / oyuncu puanı eşleme — kenar durum ve güvenlik testleri (bağımsız test turu)
// Çalıştırma: npm run test:functions
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { mapLineupDetail, mapPlayerRatings } from '../_shared/lineups.ts';

const pl = (id: unknown, name: unknown, extra: Record<string, unknown> = {}) => ({
  player: { id, name, number: 7, pos: 'M', grid: '2:1', ...extra },
});

const rated = (id: number, name: string, rating: unknown, minutes: unknown = 90) => ({
  player: { id, name },
  statistics: [{ games: { minutes, rating, position: 'M' }, goals: { total: 0, assists: 0 } }],
});

const base = (lineups: unknown, players: unknown = []) => ({
  teams: { home: { id: 10 }, away: { id: 20 } },
  lineups,
  players,
});

Deno.test('kenar: dev boyutlu kadro dizisi sınırlanır (11 / 23) ve hızlı biter', () => {
  const big = Array.from({ length: 200_000 }, (_, i) => pl(i, `Oyuncu ${i}`));
  const t0 = performance.now();
  const out = mapLineupDetail(base([{ team: { id: 10 }, startXI: big, substitutes: big }]));
  const ms = performance.now() - t0;
  assertEquals(out?.home?.start_xi.length, 11);
  assertEquals(out?.home?.substitutes.length, 23);
  // Bilgi: slice, map'ten SONRA uygulanıyor -> tüm dizi işleniyor. Süreyi raporlamak için yazdır.
  console.log(`[lineups_edge] 2x200k oyuncu eşleme: ${ms.toFixed(0)} ms`);
});

Deno.test('kenar: dev boyutlu puan listesi 60 ile sınırlanır', () => {
  const players = [{ team: { id: 10 }, players: Array.from({ length: 50_000 }, (_, i) => rated(i, `P${i}`, '7.1')) }];
  const t0 = performance.now();
  const out = mapPlayerRatings(base([], players));
  console.log(`[lineups_edge] 50k puan eşleme: ${(performance.now() - t0).toFixed(0)} ms`);
  assertEquals(out?.length, 60);
});

Deno.test('kenar: HTML/script içeren isim düz metin olarak kalır, 60 karakterle kesilir', () => {
  const evil = '<script>alert(1)</script><img src=x onerror=alert(2)>' + 'A'.repeat(500);
  const out = mapLineupDetail(base([{ team: { id: 10 }, coach: { name: evil }, formation: '4-3-3<b>xx</b>', startXI: [pl(1, evil)] }]));
  const p = out!.home!.start_xi[0];
  assertEquals(p.name.length, 60);
  assert(p.name.startsWith('<script>')); // kaçış yok: güvenlik RN <Text> render'ına dayanıyor (HTML yorumlanmaz)
  assertEquals(out!.home!.coach!.length, 60);
  assertEquals(out!.home!.formation!.length, 12);
});

Deno.test('kenar: bozuk grid / pos / numara değerleri null olur', () => {
  const bad = ['1:1;drop table', '999:1', '1:', ':1', '1-1', 5, null, { r: 1 }, ' 1:1'];
  const xi = bad.map((g, i) => pl(i, `G${i}`, { grid: g, pos: i % 2 ? 'X' : 'GK', number: i % 2 ? 'abc' : -3 }));
  const out = mapLineupDetail(base([{ team: { id: 10 }, startXI: xi }]));
  for (const p of out!.home!.start_xi) {
    assertEquals(p.grid, null, `grid=${JSON.stringify(p)}`);
    assertEquals(p.pos, null);
    assertEquals(p.number, null);
  }
});

Deno.test('kenar: rating "abc" / "11" / "-1" / "0" / 0 dk elenir; "10" kabul', () => {
  const players = [
    {
      team: { id: 10 },
      players: [
        rated(1, 'abc', 'abc'),
        rated(2, 'onbir', '11'),
        rated(3, 'eksi', '-1'),
        rated(4, 'sifir', '0'),
        rated(5, 'dakikasiz', '7.0', 0),
        rated(6, 'nesne', { v: 7 }),
        rated(7, 'on', '10'),
        rated(8, 'null', null),
      ],
    },
  ];
  const out = mapPlayerRatings(base([], players));
  assertEquals(out?.map((r) => r.name), ['on']);
});

Deno.test('kenar (bulgu adayı): "7.5abc" gibi kısmen sayısal rating kabul ediliyor', () => {
  const out = mapPlayerRatings(base([], [{ team: { id: 10 }, players: [rated(1, 'X', '7.5abc')] }]));
  // parseFloat gevşek; zararsız ama katı doğrulama beklenirse null olmalı. Davranışı belgeler.
  assertEquals(out?.[0].rating, 7.5);
});

Deno.test('kenar: lineups[].startXI dizi değilse (nesne/sayı) mapPlayerRatings çökmemeli', () => {
  const f = base([{ team: { id: 10 }, startXI: { a: 1 }, substitutes: 5 }], [{ team: { id: 10 }, players: [rated(1, 'X', '7.0')] }]);
  // mapLineupDetail güvenli:
  assertEquals(mapLineupDetail(f), null);
  // mapPlayerRatings: [...(l?.startXI ?? [])] yinelenemez nesnede TypeError atar -> tüm senkron batch'i düşer
  let threw: unknown = null;
  try {
    mapPlayerRatings(f);
  } catch (e) {
    threw = e;
  }
  assertEquals(threw, null, `mapPlayerRatings attı: ${threw}`);
});

Deno.test('kenar: teams/home id yoksa iki kadro aynı tarafa yazılıp biri kayboluyor mu', () => {
  const f = {
    lineups: [
      { team: { id: 10 }, startXI: [pl(1, 'A')] },
      { team: { id: 20 }, startXI: [pl(2, 'B')] },
    ],
  };
  // Düzeltme (bulgu #5): homeId yoksa taraf belirlenemez → yanlış tarafa yazmak yerine null (kolon yazılmaz)
  assertEquals(mapLineupDetail(f), null);
  assertEquals(mapPlayerRatings({ ...f, players: [{ team: { id: 10 }, players: [rated(1, 'A', '7.0')] }] }), null);
});

Deno.test('kenar: 60 karakter kesimi UTF-16 vekil çiftini bölmemeli (jsonb lone surrogate reddi)', () => {
  const name = 'a'.repeat(59) + '\u{1F600}'; // 61 kod birimi; slice(0,60) çifti böler
  const out = mapLineupDetail(base([{ team: { id: 10 }, startXI: [pl(1, name)] }]));
  const s = out!.home!.start_xi[0].name;
  // deno-lint-ignore no-explicit-any
  const wellFormed = (s as any).isWellFormed ? (s as any).isWellFormed() : !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(s);
  assert(wellFormed, 'kesilmiş isim yalnız (lone) high surrogate ile bitiyor');
});

Deno.test('kenar: prototip kirliliği anahtarları ve garip girdiler çökertmez', () => {
  const f = JSON.parse('{"teams":{"home":{"id":1}},"lineups":[{"__proto__":{"x":1},"team":{"id":1},"startXI":[{"player":{"name":"__proto__","id":"1e3","number":"9"}}]}],"players":"str"}');
  const out = mapLineupDetail(f);
  assertEquals(out?.home?.start_xi[0].name, '__proto__');
  assertEquals(out?.home?.start_xi[0].id, 1); // parseInt("1e3") = 1 (bilgi)
  assertEquals(mapPlayerRatings(f), null);
  assertEquals(mapLineupDetail(null), null);
  assertEquals(mapPlayerRatings(undefined), null);
});
