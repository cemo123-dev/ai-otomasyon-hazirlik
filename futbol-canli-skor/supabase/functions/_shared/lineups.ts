// Kadro/diziliş ve maç sonu oyuncu puanları — /fixtures?id(s)= yanıtından SAF eşleme (ek API isteği yok).
// Ortam değişkeni okumaz; Deno birim testleri doğrudan içe aktarır (bkz. tests/lineups.test.ts).
import type { LineupDetail, LineupPlayer, PlayerRating, TeamLineupDetail } from './types.ts';

// deno-lint-ignore no-explicit-any
type Json = any;

// Dış kaynaktan gelen veri: alan uzunlukları ve liste boyları sınırlanır (bozuk/şişkin yanıt satırı büyütmesin)
const MAX_NAME = 60;
const MAX_XI = 11;
const MAX_SUBS = 23;
const MAX_RATINGS = 60;

const str = (v: unknown, max = MAX_NAME): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  // Kod noktası bazında kesilir: UTF-16 vekil çifti bölünüp yalnız kalmış vekil (jsonb reddi) oluşmasın
  return s ? Array.from(s).slice(0, max).join('') : null;
};

/** Dizi değilse boş dizi; dev dizi map'ten önce kabaca kırpılır (geçersiz kayıtlar için 2 kat pay) */
const arr = (v: unknown, max: number): Json[] => (Array.isArray(v) ? v.slice(0, max * 2) : []);

const int = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e9 ? Math.trunc(n) : null;
};

/** Yalnız "satır:sütun" biçimi kabul edilir (ör. "1:1", "4:2") */
const gridOf = (v: unknown): string | null => (typeof v === 'string' && /^\d{1,2}:\d{1,2}$/.test(v) ? v : null);

/** API pozisyon kodu: G / D / M / F */
const posOf = (v: unknown): string | null => (typeof v === 'string' && /^[GDMF]$/.test(v) ? v : null);

function mapPlayer(entry: Json): LineupPlayer | null {
  const p = entry?.player;
  const name = str(p?.name);
  if (!name) return null;
  return { id: int(p.id), name, number: int(p.number), pos: posOf(p.pos), grid: gridOf(p.grid) };
}

function mapTeam(l: Json): TeamLineupDetail | null {
  const start_xi = arr(l?.startXI, MAX_XI).map(mapPlayer).filter(Boolean).slice(0, MAX_XI) as LineupPlayer[];
  if (!start_xi.length) return null; // ilk 11 açıklanmamış
  const substitutes = arr(l.substitutes, MAX_SUBS).map(mapPlayer).filter(Boolean).slice(0, MAX_SUBS) as LineupPlayer[];
  return {
    team_id: int(l.team?.id),
    formation: str(l.formation, 12),
    coach: str(l.coach?.name),
    start_xi,
    substitutes,
  };
}

/** lineups[] → { home, away }; ilk 11'i olmayan takım null. Hiç kadro yoksa null (kolon yazılmaz). */
export function mapLineupDetail(f: Json): LineupDetail | null {
  if (!Array.isArray(f?.lineups) || !f.lineups.length) return null;
  const homeId = f.teams?.home?.id;
  // Ev sahibi kimliği yoksa taraf belirlenemez (iki kadro aynı tarafa düşerdi) → kolon yazılmaz
  if (homeId == null) return null;
  const out: LineupDetail = { home: null, away: null };
  for (const l of arr(f.lineups, 2)) {
    const team = mapTeam(l);
    if (!team) continue;
    out[l.team?.id === homeId ? 'home' : 'away'] = team;
  }
  return out.home || out.away ? out : null;
}

/**
 * players[].statistics[0].games.rating → puanlı oyuncular (azalan).
 * Puanı olmayan veya 0 dakika oynayan oyuncu listelenmez. Hiç puan yoksa null.
 */
export function mapPlayerRatings(f: Json): PlayerRating[] | null {
  if (!Array.isArray(f?.players) || !f.players.length) return null;
  const homeId = f.teams?.home?.id;
  if (homeId == null) return null; // taraf belirlenemez
  // Forma numarası istatistikte yoksa kadrodan tamamlanır
  const numbers = new Map<number, number>();
  for (const l of arr(f.lineups, 2)) {
    for (const e of [...arr(l?.startXI, MAX_XI), ...arr(l?.substitutes, MAX_SUBS)]) {
      const id = int(e?.player?.id);
      const no = int(e?.player?.number);
      if (id != null && no != null) numbers.set(id, no);
    }
  }
  const out: PlayerRating[] = [];
  for (const t of arr(f.players, 2)) {
    const team: 'home' | 'away' = t?.team?.id === homeId ? 'home' : 'away';
    for (const p of arr(t?.players, 30)) {
      const st = p?.statistics?.[0];
      const name = str(p?.player?.name);
      const rating = parseFloat(st?.games?.rating ?? '');
      const minutes = int(st?.games?.minutes) ?? 0;
      if (!name || !Number.isFinite(rating) || rating <= 0 || rating > 10 || minutes <= 0) continue;
      const id = int(p.player.id);
      out.push({
        id,
        name,
        team,
        number: int(st.games?.number) ?? (id != null ? numbers.get(id) ?? null : null),
        pos: posOf(st.games?.position),
        rating: Math.round(rating * 100) / 100,
        minutes,
        goals: int(st.goals?.total) ?? 0,
        assists: int(st.goals?.assists) ?? 0,
      });
    }
  }
  if (!out.length) return null;
  return out.sort((a, b) => b.rating - a.rating || b.minutes - a.minutes).slice(0, MAX_RATINGS);
}

/** Ana senkron satırından AYRI yazılan kadro alanları (bkz. storeLineupFields) */
export type LineupFields = { lineup_detail?: LineupDetail; player_ratings?: PlayerRating[] };

/**
 * Kadro + puan alanları. Eşleme hatası (beklenmedik veri) yalnız ilgili alanı atlar;
 * satırın geri kalanı ve diğer maçlar etkilenmez.
 */
export function mapLineupFields(f: Json): LineupFields {
  const out: LineupFields = {};
  try {
    const lineup = mapLineupDetail(f);
    if (lineup) out.lineup_detail = lineup;
  } catch (e) {
    console.warn('[lineups] kadro eşlenemedi:', e instanceof Error ? e.message : e);
  }
  try {
    const ratings = mapPlayerRatings(f);
    if (ratings) out.player_ratings = ratings;
  } catch (e) {
    console.warn('[lineups] oyuncu puanları eşlenemedi:', e instanceof Error ? e.message : e);
  }
  return out;
}

type DbError = { code?: string; message?: string } | null;

/** 0013 kurulmadan deploy edildiyse: PostgREST "kolon bulunamadı" (PGRST204) veya Postgres 42703 */
export const isMissingLineupColumn = (e: DbError): boolean =>
  !!e && (e.code === 'PGRST204' || e.code === '42703' || /lineup_detail|player_ratings/.test(e.message ?? ''));

/** Supabase istemcisinin burada kullanılan kısmı (testte sahte istemci verilebilir) */
export type LineupWriter = {
  from(table: string): {
    update(values: LineupFields): { eq(column: string, value: number): PromiseLike<{ error: DbError }> };
  };
};

/**
 * Kadro alanlarını YALNIZ değeri olan maçlara, maç başına ayrı update ile yazar.
 * Neden ayrı: supabase-js dizi upsert'ünde kolonlar tüm satırların anahtar birleşimidir; bir satırda
 * olan alan, olmayan satırlarda NULL ile ezilirdi. Ana upsert bu alanları hiç içermez.
 * Hiçbir durumda throw etmez: 0013 eksikse bir kez uyarır ve durur; senkron devam eder.
 * Dönüş: yazılan maç sayısı.
 */
export async function storeLineupFields(db: LineupWriter, fixtures: Json[]): Promise<number> {
  let written = 0;
  for (const f of fixtures) {
    const id = f?.fixture?.id;
    if (typeof id !== 'number') continue;
    const fields = mapLineupFields(f);
    if (!fields.lineup_detail && !fields.player_ratings) continue;
    try {
      const { error } = await db.from('matches').update(fields).eq('fixture_id', id);
      if (isMissingLineupColumn(error)) {
        console.warn('[lineups] 0013_lineups_freshness.sql kurulmamış; kadro/puan yazımı atlandı');
        return written;
      }
      if (error) console.warn(`[lineups] fixture ${id} kadro yazılamadı:`, error.message);
      else written++;
    } catch (e) {
      console.warn(`[lineups] fixture ${id} kadro yazılamadı:`, e instanceof Error ? e.message : e);
    }
  }
  return written;
}
