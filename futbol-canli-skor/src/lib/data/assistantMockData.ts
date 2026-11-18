import type { Match } from '../types';

// Önizleme: "Taktik Asistana Sor" şablon yanıtları (gerçek sistemde Gemini maç dosyasından yanıtlar)

export function mockAnswer(m: Match, q: string): string {
  const s = q.toLocaleLowerCase('tr');
  const score = `${m.home_score ?? 0}-${m.away_score ?? 0}`;
  if (m.sport_type === 'nba') return mockNbaAnswer(m, s, score);
  if (s.includes('kırılma')) {
    const goal = (m.events ?? []).filter((e) => e.type.includes('goal')).pop();
    return goal
      ? `Maçın kırılma anı ${goal.minute}. dakikadaki ${goal.player} golü. Bu golle skor dengesi değişti ve maç ${score} bitti.`
      : `Maç ${score} bitti; skor tabelasını değiştiren bir an olmadı. Kırılma, şut kalitesindeki farktaydı.`;
  }
  if (s.includes('teknik direktör') || s.includes('hamle')) {
    const subs = (m.events ?? []).filter((e) => e.type === 'substitution');
    return subs.length
      ? `Yorumum: ${subs[0].minute}. dakikadaki ${subs[0].player} değişikliği oyunun dengesini değiştirdi; hamleler skora ${m.home_score ?? 0}-${m.away_score ?? 0} olarak yansıdı.`
      : 'Yorumum: Teknik direktörler ilk 11 ile devam etti; maçı sahadaki oyun planı belirledi.';
  }
  if (s.includes('hakem')) {
    const cards = (m.events ?? []).filter((e) => e.type === 'red_card' || e.type === 'penalty_goal' || e.type === 'var');
    return cards.length
      ? `Verideki kritik hakem kararları: ${cards.map((e) => `${e.minute}' ${e.player}`).join(', ')}. Bu kararlar maçın akışını etkiledi ama skoru tek başına belirlemedi.`
      : 'Bu maçın verisinde skoru etkileyen penaltı, kırmızı kart veya VAR kararı yok.';
  }
  if (s.includes('rövanş') || s.includes('avantaj')) {
    return `Bu maçın verisine göre pozisyon kalitesinde öne çıkan taraf avantajlı görünüyor; ancak tek maçlık veriyle kesin bir tahmin yapılamaz.`;
  }
  return `Önizleme modundasın: gerçek sistemde bu soru maçın hazır dosyasına (${m.home_team} ${score} ${m.away_team}) bakılarak yanıtlanır.`;
}

/** NBA önizleme yanıtları: yalnız basketbol dili (çeyrek, seri, bench, faul) */
function mockNbaAnswer(m: Match, s: string, score: string): string {
  const ps = m.period_scores;
  // En büyük çeyrek farkı = kırılma periyodu
  const swings = (ps?.home ?? []).map((h, i) => ({ q: i + 1, d: h - (ps?.away[i] ?? 0) }));
  const best = swings.reduce<{ q: number; d: number } | null>((a, b) => (!a || Math.abs(b.d) > Math.abs(a.d) ? b : a), null);
  const label = (q: number) => (q <= 4 ? `${q}. çeyrek` : `${q - 4}. uzatma`);
  if (s.includes('kırılma') || s.includes('koptu')) {
    return best && best.d !== 0
      ? `Maçın kırılma periyodu ${label(best.q)}: ${best.d > 0 ? m.home_team : m.away_team} o periyodu ${Math.abs(best.d)} sayı farkla kazandı ve maç ${score} bitti.`
      : `Maç ${score} bitti; tek bir periyotta belirgin bir seri yok, fark şut verimliliğinden geldi.`;
  }
  if (s.includes('koç') || s.includes('teknik direktör') || s.includes('hamle') || s.includes('rotasyon')) {
    return `Yorumum: rotasyonda bench dakikaları ve son çeyrekteki ilk 5 tercihi skoru (${score}) belirledi; koç hamlelerini Analiz kartlarındaki bench ve +/- verisiyle birlikte okumak gerekir.`;
  }
  if (s.includes('hakem') || s.includes('faul')) {
    return 'Bu maçın verisinde skoru tek başına belirleyen bir hakem kararı yok; faul sorunu yaşayan oyuncular Analiz sekmesindeki oyuncu etkisi kartında.';
  }
  if (s.includes('seri') || s.includes('avantaj')) {
    return 'Bu maçın verisine göre şut verimliliği ve ribaund üstünlüğü olan taraf avantajlı görünüyor; ancak tek maçlık veriyle seri hakkında kesin tahmin yapılamaz.';
  }
  return `Önizleme modundasın: gerçek sistemde bu soru maçın hazır dosyasına (${m.home_team} ${score} ${m.away_team}) bakılarak yanıtlanır.`;
}
