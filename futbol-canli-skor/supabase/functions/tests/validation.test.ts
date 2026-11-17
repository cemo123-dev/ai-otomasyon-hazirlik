// LLM çıktısı doğrulama ve maç dosyası testleri — çalıştırma: supabase/functions içinde `deno test`
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { assembleRedCard, buildRedCardInput } from '../_shared/alerts.ts';
import { buildDossier, footballInferences, isCurrentDossier, sanitizeAnswer } from '../_shared/dossier.ts';
import { okPrescription } from '../_shared/halftime.ts';

Deno.test('reçete: diziliş önerisine izin, uydurma sayıya izin yok', () => {
  const allowed = new Set([65, 0.18]);
  assert(okPrescription('4-2-3-1 ile kanatları aç', '', allowed));
  assert(!okPrescription('Ceza sahasına 3 oyuncuyla gir', '', allowed));
  assert(!okPrescription('4-4-1 ve 2 forvet', '', allowed));
  assert(okPrescription('Bloğu koru', 'Top %65 ama xG 0.18', allowed));
  assert(!okPrescription('Bloğu koru', '12 kez boşa gitti', allowed));
});

Deno.test('kırmızı kart analizi: sayılı uydurma hamle elenir, diziliş kalır', () => {
  const facts = {
    home_team: 'Ev SK', away_team: 'Konuk FK', minute: 70, score: { home: 1, away: 0 },
    red: { side: 'home' as const, player: 'A. Yılmaz', minute: 66 }, stats: null, events: [],
  };
  const p = assembleRedCard(facts, buildRedCardInput(facts), {
    h: 'Ev SK 10 Kişi', d: 'Ev SK 66. dakikada 10 kişi kaldı.',
    rx: [
      { t: 'E', m: '4-4-1 ile bloğu derinleştir', w: 'Skoru korumak için.' },
      { t: 'D', m: '3 forvetle bas', w: 'Sayısal üstünlük.' },
    ],
    k: 'Kanatlar belirleyici olacak.',
  });
  assertEquals(p.prescriptions.map((x) => x.move), ['4-4-1 ile bloğu derinleştir']);
});

// Gerçek maç verisi (Yunanistan 1-0 Sırbistan) üzerinden çıkarımlar
const greece = {
  sport_type: 'football', status_short: 'FT', home_team: 'Greece', away_team: 'Serbia', home_score: 1, away_score: 0,
  stats: {
    home: { xg: 1.62, possession: 58, shots_on_target: 6 },
    away: { xg: 0.21, possession: 42, shots_on_target: 1 },
  },
  events: [
    { team: 'home', type: 'substitution', detail: 'Anastasios Douvikas', minute: 61, player: 'Georgios Masouras' },
    { team: 'home', type: 'goal', detail: 'Vangelis Pavlidis', minute: 69, player: 'Georgios Masouras' },
    { team: 'home', type: 'substitution', detail: 'Vangelis Pavlidis', minute: 73, player: 'Charalampos Kostoulas' },
  ],
};

Deno.test('çıkarımlar: değişikliğin skor durumu ve giren oyuncunun katkısı', () => {
  const lines = footballInferences(greece);
  assert(lines.some((l) => l.startsWith("61' Greece") && l.includes("giren Georgios Masouras 69' gol attı")));
  assert(lines.some((l) => l.startsWith("73' Greece") && l.includes('Greece öndeyken')));
  assert(lines.some((l) => l.includes('Pozisyon üstünlüğü Greece')));
});

Deno.test('maç dosyası sürümü ve cümle bazlı temizleme', () => {
  const doc = buildDossier({ match: greece, analysis: null, halftime: null, alerts: [] });
  assert(isCurrentDossier(doc));
  assert(!isCurrentDossier('{"mac":{}}'));
  const q = 'Rövanş için kim avantajlı?';
  assertEquals(
    sanitizeAnswer('Yorumum: Yunanistan avantajlı. xG 1.62-0.21 üstünlüğü bunu gösteriyor. Rövanşı %70 ihtimalle kazanır.', doc, q),
    'Yorumum: Yunanistan avantajlı. xG 1.62-0.21 üstünlüğü bunu gösteriyor.',
  );
  assertEquals(sanitizeAnswer("Yorumum: 61. dakikada giren Masouras 69. dakikada gol attı ve maçı çözdü.", doc, q)?.includes('61.'), true);
  assertEquals(sanitizeAnswer('Kazanma şansı %70.', doc, q), null);
});
