/**
 * NBA box score ve logo yardımcıları (saf fonksiyonlar; ortam değişkeni / ağ yok).
 * Bkz. 0014_nba_box.sql. Deno birim testleri doğrudan içe aktarır (tests/nbaBox.test.ts).
 */
import type { NbaPlayerLine } from './nbaMetrics.ts';

/** Takım başına en fazla oyuncu (NBA'de maç kadrosu en fazla 15) */
const MAX_PER_TEAM = 18;

/**
 * Tüm oyuncu satırları → box score: oynayanlar (dakika > 0), takım sırası ev → deplasman,
 * her takımda önce ilk 5, sonra dakikaya göre azalan.
 */
export function toBoxScore(players: NbaPlayerLine[]): NbaPlayerLine[] | null {
  if (!Array.isArray(players)) return null;
  const played = players.filter((p) => p && typeof p.name === 'string' && p.name && p.minutes > 0);
  if (!played.length) return null;
  const out: NbaPlayerLine[] = [];
  for (const team of ['home', 'away'] as const) {
    out.push(
      ...played
        .filter((p) => p.team === team)
        .sort((a, b) => Number(b.starter) - Number(a.starter) || b.minutes - a.minutes)
        .slice(0, MAX_PER_TEAM),
    );
  }
  return out.length ? out : null;
}

/**
 * API-NBA logoları çoğunlukla Wikimedia SVG'si; Android'deki Image bileşeni SVG çizemez.
 * Wikimedia'nın aynı dosya için ürettiği 120 px PNG küçük resmine çevrilir
 * (bu boyut CDN önbelleğinde hazır; büyük boyutlar ilk istekte 429 dönebiliyor).
 * Wikimedia dışı veya zaten raster olan adresler aynen döner.
 */
const WIKI_SVG = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[a-z]+)\/([0-9a-f]\/[0-9a-f]{2})\/([^/?#]+\.svg)$/i;

export function normalizeNbaLogo(url: unknown): string | null {
  if (typeof url !== 'string' || !url) return null;
  const m = url.match(WIKI_SVG);
  if (m) return `${m[1]}/thumb/${m[2]}/${m[3]}/120px-${m[3]}.png`;
  return /^https:\/\//i.test(url) ? url : null;
}

/** 0014 kurulmadan deploy edildiyse: PostgREST PGRST204 / Postgres 42703 */
export const isMissingBoxColumn = (e: { code?: string; message?: string } | null): boolean =>
  !!e && (e.code === 'PGRST204' || e.code === '42703' || /box_score/.test(e.message ?? ''));
