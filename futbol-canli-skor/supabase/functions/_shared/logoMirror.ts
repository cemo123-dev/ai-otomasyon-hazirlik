// NBA takım logoları Supabase Storage'a kopyalanır.
// Neden: API logoları Wikimedia'da; Wikimedia, Android'in varsayılan HTTP istemcisine (okhttp)
// 403 dönüyor ve telefonda logolar görünmüyor. Her takımın 120 px PNG'si sunucudan, kendini tanıtan
// bir User-Agent ile (Wikimedia kullanıcı aracısı politikası) BİR KEZ indirilir, herkese açık
// 'team-logos' kovasına yazılır ve maç satırları bu adresi kullanır.
import { admin } from './supabaseAdmin.ts';
import { normalizeNbaLogo, thumb120, wikiFileName } from './nbaBox.ts';

const BUCKET = 'team-logos';
const UA = 'SkorPlus/1.0 (+https://github.com/cemo123-dev/ai-otomasyon-hazirlik)';
/** Tek çalıştırmada indirilecek en fazla logo (Wikimedia'ya nazik olmak için) */
const MAX_PER_RUN = 12;
const MAX_BYTES = 300_000;

const path = (teamId: number) => `nba/${teamId}.png`;
export const nbaLogoUrl = (teamId: number) => admin.storage.from(BUCKET).getPublicUrl(path(teamId)).data.publicUrl;

/** Kovadaki takım kimlikleri (çalıştırma başına bir kez okunur) */
let mirrored: Set<number> | null = null;
async function loadMirrored(): Promise<Set<number>> {
  if (mirrored) return mirrored;
  const { data, error } = await admin.storage.from(BUCKET).list('nba', { limit: 200 });
  mirrored = new Set(
    (error ? [] : (data ?? [])).map((f) => Number(f.name.replace(/\.png$/, ''))).filter((n) => Number.isInteger(n) && n > 0),
  );
  return mirrored;
}

type LogoRow = { home_team_id?: unknown; away_team_id?: unknown; home_logo?: unknown; away_logo?: unknown };

/** Kopyası olan takımların logosunu Storage adresiyle değiştirir (upsert öncesi; logo gidip gelmesin) */
export async function withMirroredLogos<T extends LogoRow>(rows: T[]): Promise<T[]> {
  if (!rows.length) return rows;
  const set = await loadMirrored();
  const pick = (id: unknown, cur: unknown) => (typeof id === 'number' && set.has(id) ? nbaLogoUrl(id) : cur);
  return rows.map((r) => ({ ...r, home_logo: pick(r.home_team_id, r.home_logo), away_logo: pick(r.away_team_id, r.away_logo) }));
}

async function ensureBucket(): Promise<boolean> {
  const { error } = await admin.storage.getBucket(BUCKET);
  if (!error) return true;
  const { error: createErr } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ['image/png'],
  });
  if (createErr && !/exist/i.test(createErr.message)) {
    console.warn('[logos] kova oluşturulamadı:', createErr.message);
    return false;
  }
  return true;
}

/**
 * Dosya taşınmış/silinmişse (404) Wikipedia API'si güncel 120 px adresini verir
 * (en.wikipedia, Commons'taki dosyaları da çözer). Kaynak dil vikisi ilk denenir.
 */
async function resolveViaApi(url: string): Promise<string | null> {
  const name = wikiFileName(url);
  if (!name) return null;
  const lang = url.match(/\/wikipedia\/([a-z]+)\//)?.[1];
  const wikis = [...new Set([lang && lang !== 'commons' ? lang : 'en', 'en'])].map((l) => `${l}.wikipedia.org`);
  wikis.push('commons.wikimedia.org');
  for (const host of wikis) {
    const api = `https://${host}/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=120&titles=${encodeURIComponent('File:' + name)}`;
    try {
      const res = await fetch(api, { headers: { 'User-Agent': UA } });
      if (!res.ok) continue;
      const pages = (await res.json())?.query?.pages ?? {};
      for (const pg of Object.values(pages) as { imageinfo?: { thumburl?: string }[] }[]) {
        const t = pg.imageinfo?.[0]?.thumburl;
        if (t) return t;
      }
    } catch {
      // sonraki viki
    }
  }
  return null;
}

/** Son çare: takımın İngilizce Wikipedia maddesindeki logo (dosya silinmişse, ör. eski Spurs logosu) */
async function resolveByTeam(team: string): Promise<string | null> {
  const api = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=120&pilicense=any&redirects=1&titles=${encodeURIComponent(team)}`;
  try {
    const res = await fetch(api, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const pages = (await res.json())?.query?.pages ?? {};
    for (const pg of Object.values(pages) as { thumbnail?: { source?: string } }[]) {
      if (pg.thumbnail?.source) return pg.thumbnail.source;
    }
  } catch {
    // yok say
  }
  return null;
}

async function download(src: string | null, team: string): Promise<Uint8Array | null> {
  if (src) {
    const first = await fetchPng(thumb120(src));
    if (first) return first;
    const resolved = await resolveViaApi(src);
    const second = resolved ? await fetchPng(resolved) : null;
    if (second) return second;
  }
  const byTeam = await resolveByTeam(team);
  return byTeam ? await fetchPng(byTeam) : null;
}

async function fetchPng(url: string): Promise<Uint8Array | null> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !type.startsWith('image/png')) {
    await res.body?.cancel();
    console.warn(`[logos] indirilemedi (${res.status} ${type}):`, url);
    return null;
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  return bytes.length && bytes.length <= MAX_BYTES ? bytes : null;
}

/**
 * Eksik logoları kopyalar ve NBA maç/takip satırlarını Storage adresine taşır.
 * Kaynak: o takımın herhangi bir maç satırındaki Wikimedia adresi (bazı satırlarda logo boş geliyor).
 */
export async function mirrorNbaLogos(): Promise<{ copied: number; teams_updated: number }> {
  if (!(await ensureBucket())) return { copied: 0, teams_updated: 0 };
  const set = await loadMirrored();

  const { data: rows, error } = await admin
    .from('matches')
    .select('home_team_id, away_team_id, home_team, away_team, home_logo, away_logo')
    .eq('sport_type', 'nba')
    .not('home_team_id', 'is', null);
  if (error) throw error;

  const sources = new Map<number, { src: string | null; team: string }>();
  const stale = new Map<number, Set<'home' | 'away'>>(); // logosu Storage adresi olmayan (takım, taraf)
  for (const r of rows ?? []) {
    for (const side of ['home', 'away'] as const) {
      const id = r[`${side}_team_id`] as number | null;
      const logo = r[`${side}_logo`] as string | null;
      if (!id) continue;
      const src = normalizeNbaLogo(logo);
      const wiki = src?.startsWith('https://upload.wikimedia.org/') ? src : null;
      // Wikimedia kaynağı olan satır tercih edilir; hiç yoksa takım adıyla aranır
      if (!sources.get(id)?.src) sources.set(id, { src: wiki, team: r[`${side}_team`] as string });
      if (logo !== nbaLogoUrl(id)) stale.set(id, (stale.get(id) ?? new Set()).add(side));
    }
  }

  let copied = 0;
  for (const [id, { src, team }] of sources) {
    if (set.has(id) || copied >= MAX_PER_RUN) continue;
    try {
      const bytes = await download(src, team);
      if (!bytes) continue;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path(id), bytes, { contentType: 'image/png', upsert: true });
      if (upErr) {
        console.warn(`[logos] ${id} yüklenemedi:`, upErr.message);
        continue;
      }
      set.add(id);
      copied++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.warn(`[logos] ${id} atlandı:`, e instanceof Error ? e.message : e);
    }
  }

  // Satırları Storage adresine taşı (takım ve taraf başına tek güncelleme)
  let teams = 0;
  for (const [id, sides] of stale) {
    if (!set.has(id)) continue;
    const url = nbaLogoUrl(id);
    for (const side of sides) {
      const { error: e } = await admin.from('matches').update({ [`${side}_logo`]: url }).eq('sport_type', 'nba').eq(`${side}_team_id`, id);
      if (e) console.warn(`[logos] ${id} ${side} güncellenemedi:`, e.message);
    }
    await admin.from('team_follows').update({ team_logo: url }).eq('sport_type', 'nba').eq('team_id', id);
    teams++;
  }
  return { copied, teams_updated: teams };
}
