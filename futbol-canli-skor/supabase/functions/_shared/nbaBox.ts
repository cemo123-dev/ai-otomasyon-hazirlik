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
 * Yazılacak box score. Oyuncu verisi boşsa (boş yanıt / herkes 0 dk) ve markEmpty ise []:
 * "denendi, veri yok" işareti. Geri doldurma `.is('box_score', null)` ile seçtiği için
 * aynı maç tekrar istenmez (NBA'in günlük kotası korunur). null = yazma.
 */
export function boxScoreToStore(players: NbaPlayerLine[], markEmpty: boolean): NbaPlayerLine[] | null {
  return toBoxScore(players) ?? (markEmpty ? [] : null);
}

/** Box score gelmemiş maçta dosya bu süreden sonra yine de önbelleğe alınır (başlama + ~3 sa maç + 6 sa) */
export const BOX_WAIT_MS = 9 * 3600_000;

/**
 * NBA box score hâlâ bekleniyor mu (dosya önbelleğe alınmasın)?
 * [] = denendi/veri yok → beklenmez. Kolon yok (undefined) veya null → başlamadan 9 sa geçene kadar beklenir.
 */
export function isNbaBoxPending(
  m: { sport_type?: string | null; box_score?: unknown; kickoff_at?: string | null },
  now = Date.now(),
): boolean {
  if (m.sport_type !== 'nba' || Array.isArray(m.box_score)) return false;
  const ko = m.kickoff_at ? Date.parse(m.kickoff_at) : NaN;
  return Number.isNaN(ko) || now - ko < BOX_WAIT_MS;
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

/** Dosya adı: .../thumb/x/xy/Ad.svg/120px-Ad.svg.png veya .../x/xy/Ad.png → "Ad.svg" / "Ad.png" */
export function wikiFileName(url: string): string | null {
  const m = url.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\/[^/]+$/i) ?? url.match(/\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)$/i);
  return m ? decodeURIComponent(m[1]) : null;
}

type LogoRow = { home_team_id?: unknown; away_team_id?: unknown; home_logo?: unknown; away_logo?: unknown };

/**
 * Kopyası olan takımların logosu Storage adresiyle değiştirilir.
 * mirrored === null (kova listesi okunamadı): logo alanları TÜM satırlardan çıkarılır; upsert
 * kolonları satırların birleşiminden kurduğu için mevcut DB logosu korunur (Wikimedia'ya geri dönmez).
 */
export function applyMirroredLogos<T extends LogoRow>(rows: T[], mirrored: Set<number> | null, urlOf: (id: number) => string): T[] {
  if (!mirrored) {
    return rows.map((r) => {
      const { home_logo: _h, away_logo: _a, ...rest } = r;
      return rest as T;
    });
  }
  const pick = (id: unknown, cur: unknown) => (typeof id === 'number' && mirrored.has(id) ? urlOf(id) : cur);
  return rows.map((r) => ({ ...r, home_logo: pick(r.home_team_id, r.home_logo), away_logo: pick(r.away_team_id, r.away_logo) }));
}

/** Thumb boyutunu 120 px'e sabitler (1200px gibi boyutlar 400/429 dönebiliyor) */
export const thumb120 = (url: string) => url.replace(/\/(\d+)px-([^/]+)$/, '/120px-$2');
