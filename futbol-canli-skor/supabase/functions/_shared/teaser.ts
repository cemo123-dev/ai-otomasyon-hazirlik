import type { MatchRow } from './types.ts';

/**
 * Ücretsiz maç özeti: LLM KULLANMAZ (0 token). Maç bittiğinde worker yazar.
 * Kurallar basit ve deterministik: skor + topla oynama/xG uyumsuzluğu.
 */
export function buildTeaser(m: MatchRow): string {
  const hs = m.home_score ?? 0;
  const as = m.away_score ?? 0;
  const s = m.stats;
  const score = `${m.home_team} ${hs}-${as} ${m.away_team}`;
  if (!s) return `${score}. Maç sona erdi.`;

  const h = s.home;
  const a = s.away;
  const xg = (v: number) => v.toFixed(2);
  const base = `${score}. Topla oynama %${h.possession}-%${a.possession}, xG ${xg(h.xg)}-${xg(a.xg)}.`;

  if (hs === as) {
    const better = h.xg > a.xg + 0.5 ? m.home_team : a.xg > h.xg + 0.5 ? m.away_team : null;
    return better
      ? `${base} ${better} daha net pozisyonlar buldu ama farkı skora yansıtamadı.`
      : `${base} İki takım da birbirine üstünlük kuramadı.`;
  }

  const homeWon = hs > as;
  const [wName, lName] = homeWon ? [m.home_team, m.away_team] : [m.away_team, m.home_team];
  const [w, l] = homeWon ? [h, a] : [a, h];

  if (l.possession >= 58 && l.xg < w.xg) {
    return `${base} ${lName} topa sahip oldu ama ${l.shots_total} şuttan yalnızca ${xg(l.xg)} xG üretebildi. ${wName} az ama nitelikli pozisyonla kazandı.`;
  }
  if (w.xg + 0.5 < l.xg) {
    return `${base} ${lName} daha fazla fırsat yarattı. ${wName} bitiricilikte fark yarattı.`;
  }
  return `${base} ${wName} hem pozisyon kalitesinde hem skorda öndeydi.`;
}
