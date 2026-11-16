export const colors = {
  bg: '#0A0E14',
  surface: '#121821',
  surfaceAlt: '#18202B',
  border: '#232D3A',
  text: '#E8EDF3',
  textMuted: '#8A97A8',
  textDim: '#5B6878',
  live: '#2BE37A',
  liveGlow: 'rgba(43,227,122,0.18)',
  accent: '#4C8DFF',
  home: '#4C8DFF',
  away: '#FF7A45',
  pro: '#F5C451',
  proGlow: 'rgba(245,196,81,0.14)',
  danger: '#FF4D5E',
  warning: '#FFC53D',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22 } as const;
export const space = (n: number) => n * 4;

export const font = {
  mono: { fontVariant: ['tabular-nums' as const] },
};
