import type { HalftimePayload, Match } from '../types';

// Önizleme: canlı maç HT'ye girince bu şablondan rapor üretilir (gerçek sistemde Gemini yazar).

const x2 = (v: number) => v.toFixed(2);

export function buildMockHalftime(m: Match): HalftimePayload {
  const s = m.stats;
  const h = s?.home;
  const a = s?.away;
  const sterileHome = h && h.possession >= 60 && h.xg < 0.5;
  const teaser = sterileHome
    ? `${m.home_team} %${h!.possession} topla oynadı ama ${x2(h!.xg)} xG'de kaldı. İkinci yarıda kilidi açacak hamle uygulamada!`
    : `İlk yarı: ${m.home_team} ${m.home_score ?? 0}-${m.away_score ?? 0} ${m.away_team}${h && a ? `, xG ${x2(h.xg)}-${x2(a.xg)}` : ''}. İkinci yarıda kilidi açacak hamle uygulamada!`;
  const half = (t: NonNullable<typeof h>) => ({
    possession: t.possession,
    xg: t.xg,
    shots: t.shots_total,
    on_target: t.shots_on_target,
    inside_box: t.shots_inside_box,
    outside_box: t.shots_outside_box,
    corners: t.corners,
    fouls: t.fouls,
    pass_pct: t.passes_accuracy,
  });
  return {
    kind: 'halftime',
    headline: 'İkinci Yarı: Ceza Sahasına Daha Çok Adam',
    situation: `İlk yarı ${m.home_score ?? 0}-${m.away_score ?? 0} bitti. ${m.home_team} oyunu kurdu ama şutlarının önemli kısmı ceza sahası dışından geldi; ${m.away_team} geçişlerde daha net pozisyon buldu.`,
    prescriptions: [
      { side: 'home', move: 'Kanat bekleri bindirmeye çıksın, ceza sahasına ikinci forvet girsin', why: 'Uzaktan şutlar düşük kaliteli kaldı.' },
      { side: 'home', move: 'Top kaybı sonrası beş saniye kontra-pres', why: 'Rakibin geçişlerini kaynağında kesmek için.' },
      { side: 'away', move: 'Orta blokta merkezi kapat, kanatlara yönlendir', why: 'Ev sahibi ortalarda etkisiz kaldı.' },
    ],
    key: 'İkinci yarının kilidi: ev sahibinin ceza sahasına kaç oyuncuyla girebildiği.',
    score: { home: m.home_score ?? 0, away: m.away_score ?? 0 },
    formations: { home: '4-2-3-1', away: '4-4-2' },
    first_half: h && a ? { home: half(h), away: half(a) } : ({} as HalftimePayload['first_half']),
    events: (m.events ?? [])
      .filter((e) => e.minute <= 45 && (e.type.includes('goal') || e.type === 'red_card'))
      .map((e) => ({ minute: e.minute, side: e.team, type: e.type === 'red_card' ? 'red_card' : 'goal', player: e.player })),
    signals: sterileHome ? [{ kind: 'sterile_possession', side: 'home', possession: h!.possession, xg: h!.xg }] : [],
    teaser,
    generated_at: new Date().toISOString(),
  };
}
