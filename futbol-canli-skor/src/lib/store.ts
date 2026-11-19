/**
 * Google Play mağaza bağlantısı + Play Install Referrer çözümleme — SAF modül (React Native içe aktarmaz;
 * Deno test eder: supabase/functions/tests/store.test.ts; Node e2e de doğrudan içe aktarır).
 * Bu yüzden içe aktarma yok; davet kodu deseni `share.ts` ile aynıdır (test ikisinin eşitliğini denetler).
 *
 * Bağlantı biçimi: docs/pazarlama-stratejisi.md §9.1 —
 * `https://play.google.com/store/apps/details?id=<paket>&referrer=utm_source%3D…%26utm_medium%3D…%26utm_campaign%3D…%26utm_content%3D<kod>`
 * `referrer` değeri BİR KEZ kodlanır (Play, kurulumda çözülmüş hâlini Install Referrer API'ye verir).
 */

export const STORE_PACKAGE = 'com.skorplus.app';
const PLAY_DETAILS = 'https://play.google.com/store/apps/details';

/** Davet kodu deseni (share.ts `INVITE_RE` ile aynı; 0017 CHECK) */
const INVITE_RE = /^[A-HJKMNP-Z2-9]{6}$/;

export type Utm = {
  source: string;
  medium: string;
  campaign?: string | null;
  /** Davet kodu (pazarlama §9.1: utm_content = davet kodu) */
  content?: string | null;
};

/** Uygulama içi bağlantı türleri → UTM (pazarlama §9.1 tablosu) */
export type AppLinkKind = 'share' | 'invite';

export function appUtm(kind: AppLinkKind, code: string | null): Utm {
  return kind === 'invite'
    ? { source: 'app', medium: 'invite', campaign: 'invite', content: code }
    : { source: 'app', medium: 'share', campaign: 'match_share', content: code };
}

/** Play mağaza sayfası + UTM'li `referrer`. Boş UTM alanları yazılmaz. */
export function storeUrl(packageName: string, utm: Utm | null): string {
  const base = `${PLAY_DETAILS}?id=${encodeURIComponent(packageName || STORE_PACKAGE)}`;
  if (!utm) return base;
  const pairs: [string, string | null | undefined][] = [
    ['utm_source', utm.source],
    ['utm_medium', utm.medium],
    ['utm_campaign', utm.campaign],
    ['utm_content', utm.content],
  ];
  const inner = pairs
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim())}`)
    .join('&');
  return inner ? `${base}&referrer=${encodeURIComponent(inner)}` : base;
}

/** Adres Google Play mağaza sayfası mı */
export const isPlayStoreUrl = (url: string): boolean => /^https:\/\/play\.google\.com\//i.test(String(url ?? '').trim());

/** Play adresindeki paket adı (`?id=`); yoksa / geçersizse varsayılan paket */
export function packageFromPlayUrl(url: string): string {
  const m = /[?&]id=([A-Za-z0-9_.]+)(?:&|#|$)/.exec(String(url ?? ''));
  return m ? m[1] : STORE_PACKAGE;
}

export type ParsedReferrer = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  /** Geçerli davet kodu (büyük harf) ya da null */
  code: string | null;
};

const safeDecode = (s: string): string => {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
};

/**
 * Install Referrer dizesi → UTM alanları + davet kodu. Kod `utm_content`'ten, yoksa `k`'dan (eski indirme
 * sayfası biçimi) okunur ve davet deseniyle süzülür. Girdi bir kez kodlanmış (`utm_source%3Dapp%26…`) ya da
 * çözülmüş (`utm_source=app&…`) olabilir; başında `?` ya da `referrer=` sarmalı varsa atılır.
 * Play'in organik değeri `utm_source=google-play&utm_medium=organic` → kod null.
 */
export function parseReferrer(raw: string | null | undefined): ParsedReferrer {
  const empty: ParsedReferrer = { source: null, medium: null, campaign: null, code: null };
  let s = String(raw ?? '').trim();
  if (!s || s.length > 1000) return empty;
  s = s.replace(/^\?/, '');
  // Tam mağaza adresi ya da `referrer=<kodlu>` sarmalı verildiyse iç değeri al
  const wrapped = /(?:^|[?&])referrer=([^&#]*)/.exec(s);
  if (wrapped) s = safeDecode(wrapped[1]);
  // Bir kez kodlanmış: `=` yok ama `%3D` var
  if (!s.includes('=') && /%3D/i.test(s)) s = safeDecode(s);
  const map = new Map<string, string>();
  for (const part of s.split('&')) {
    const at = part.indexOf('=');
    if (at <= 0) continue;
    const k = safeDecode(part.slice(0, at)).trim().toLowerCase();
    const v = safeDecode(part.slice(at + 1)).trim();
    if (k && !map.has(k)) map.set(k, v);
  }
  const val = (k: string) => {
    const v = map.get(k);
    return v ? v : null;
  };
  const rawCode = (val('utm_content') ?? val('k') ?? '').replace(/\s+/g, '').toUpperCase();
  return {
    source: val('utm_source'),
    medium: val('utm_medium'),
    campaign: val('utm_campaign'),
    code: INVITE_RE.test(rawCode) ? rawCode : null,
  };
}
