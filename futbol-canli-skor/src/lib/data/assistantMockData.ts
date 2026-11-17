import type { Match } from '../types';

// Önizleme: "Taktik Asistana Sor" şablon yanıtları (gerçek sistemde Gemini maç dosyasından yanıtlar)

export function mockAnswer(m: Match, q: string): string {
  const s = q.toLocaleLowerCase('tr');
  const score = `${m.home_score ?? 0}-${m.away_score ?? 0}`;
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
