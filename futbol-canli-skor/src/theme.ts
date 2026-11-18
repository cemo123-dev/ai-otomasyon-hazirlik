export const colors = {
  bg: '#0A0E14',
  surface: '#121821',
  surfaceAlt: '#18202B',
  border: '#232D3A',
  borderStrong: '#3A4656', // etkileşimli öğe kenarı (çip, gün düğmesi)
  trackOff: '#5E6B7E', // Switch kapalı izi: surface üstünde 3.29:1 (WCAG 1.4.11 ≥ 3:1)
  text: '#E8EDF3',
  textMuted: '#8A97A8',
  textDim: '#7D8A9C', // surface üstünde 5.08:1 (AA)
  live: '#2BE37A',
  liveGlow: 'rgba(43,227,122,0.18)',
  accent: '#4C8DFF',
  home: '#4C8DFF',
  away: '#FF7A45',
  pro: '#F5C451',
  proGlow: 'rgba(245,196,81,0.14)',
  danger: '#FF4D5E',
  warning: '#FFA23A', // altından ayrışan turuncu-amber
  onFill: '#0A0E14', // dolu renkli zemin üstündeki metin
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;
export const space = (n: number) => n * 4;

/** En küçük dokunma alanı (pt) */
export const hit = 44;
/** Animasyon süreleri (ms) */
export const motion = { fast: 150, base: 220, pulse: 650 } as const;

export const font = {
  mono: { fontVariant: ['tabular-nums' as const] },
};

/** Tipografi ölçeği (sistem yazı tipi); en küçük boyut 11 px */
export const type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '900' }, // Skor başlığı
  title1: { fontSize: 26, lineHeight: 32, fontWeight: '900' }, // Paywall başlığı
  title2: { fontSize: 21, lineHeight: 27, fontWeight: '900' }, // AI rapor manşeti
  title3: { fontSize: 17, lineHeight: 22, fontWeight: '800' }, // CardTitle
  headline: { fontSize: 15, lineHeight: 20, fontWeight: '700' }, // Takım adı, ayar satırı başlığı
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' }, // AI gövde metni
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' }, // Sohbet, alarm gövdesi
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700' }, // Sekme, çip, durum sütunu
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' }, // Açıklama, meta
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '700' }, // Kicker, tablo başlığı
} as const;
