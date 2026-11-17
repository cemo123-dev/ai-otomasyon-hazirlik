// Maç önü AI: veri olmadan yorumcu modu — çalıştırma: supabase/functions içinde `deno test`
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { assemblePreview, buildPreviewInput, formationInsights, formationShape, type PreviewFacts } from '../_shared/preview.ts';

const noForm = { n: 0, xg_for: null, xg_against: null, shots: null, possession: null, results: '', trend: null };
const xi = (names: string[]) => names.map((name, i) => ({ id: i + 1, name, pos: i === 0 ? 'G' : 'D', row: 1, col: 1 }));

// Gerçek ekran görüntüsündeki durum: Galler - Portekiz, iki taraf 4-2-3-1, oyuncu formu yok
const facts: PreviewFacts = {
  home_team: 'Wales',
  away_team: 'Portugal',
  league: 'UEFA Uluslar Ligi · Lig A',
  kickoff_at: '2026-11-17T19:45:00Z',
  lineups: {
    home: { team_id: 1, team: 'Wales', formation: '4-2-3-1', coach: 'Craig Bellamy', xi: xi(['D. Ward', 'C. Roberts']) },
    away: { team_id: 2, team: 'Portugal', formation: '4-2-3-1', coach: 'Roberto Martínez', xi: xi(['Diogo Costa', 'Diogo Dalot']) },
  },
  form: { home: noForm, away: noForm },
  matchups: [
    { zone: 'sol kanat', attacking_side: 'home', attacker: { name: 'S. Thomas', pos: 'M', form: null }, defender: { name: 'Diogo Dalot', pos: 'D', form: null }, edge: null },
  ],
  key_index: null,
  absences: [],
  data_basis: 'lineups_only',
};

Deno.test('formationShape: 4-2-3-1 → 4/5/1; geçersiz null', () => {
  assertEquals(formationShape('4-2-3-1'), { def: 4, mid: 5, fwd: 1 });
  assertEquals(formationShape('3-5-2'), { def: 3, mid: 5, fwd: 2 });
  assertEquals(formationShape('4-4'), null);
  assertEquals(formationShape('9-9-9'), null);
  assertEquals(formationShape(null), null);
});

Deno.test('formationInsights: ayna diziliş, tek forvet, 3\'lü savunma', () => {
  const mirror = formationInsights('4-2-3-1', '4-2-3-1');
  assert(mirror.some((l) => l.startsWith('ayna diziliş')));
  assert(mirror.some((l) => l.includes('tek forvet')));
  const wb = formationInsights('3-5-2', '4-3-3');
  assert(wb.some((l) => l.includes("3'lü stoper")));
  assertEquals(formationInsights('?', '4-4-2'), []);
});

Deno.test('girdi: Türkçe takım adı, "veri yetersiz" yok, diziliş analizi var, form satırı yok', () => {
  const input = buildPreviewInput(facts);
  assert(input.startsWith('Galler(E) vs Portekiz(D)'));
  assert(!/veri yetersiz|belirlenemedi|veri yok/i.test(input));
  assert(input.includes('DİZİLİŞ ANALİZİ:'));
  assert(!input.includes('FORM:'));
});

Deno.test('birleştirme: AI mazeret yazarsa şablona düşülür, şablon da mazeretsiz', () => {
  const input = buildPreviewInput(facts);
  const p = assemblePreview(facts, input, {
    h: 'Wales ve Portekiz Mücadelesi',
    v: 'Her iki takım da 4-2-3-1 ile sahada. Form ve istatistik verileri henüz bulunmuyor.',
    km: 'Kilit eşleşme belirlenemedi çünkü veri yetersizdir.',
    ks: 'Eğer erken gol olursa tempo değişir.',
    wl: ['Veri yok', 'S. Thomas ile Diogo Dalot düellosu'],
    ab: '',
  });
  const all = [p.headline, p.overview, p.key_matchup_commentary, p.breaking_scenario, ...p.watch_list].join(' ');
  assert(!/veri\s*(yok|yetersiz)|belirlenemedi|bulunmuyor/i.test(all), all);
  assert(p.key_matchup_commentary.includes('S. Thomas'));
  assert(p.overview.includes('Galler'));
  assertEquals(p.watch_list, ['S. Thomas ile Diogo Dalot düellosu']);
  assertEquals(p.breaking_scenario, 'Eğer erken gol olursa tempo değişir.');
});
