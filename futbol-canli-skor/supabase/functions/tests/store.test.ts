// src/lib/store.ts (Play mağaza bağlantısı + Install Referrer) — saf modül. Çalıştırma: npm run test:functions.
// Plan: docs/inovasyon-onerileri.md §0.8 "Testler"; bağlantı biçimi pazarlama §9.1 (utm_source=app).
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { appUtm, isPlayStoreUrl, packageFromPlayUrl, parseReferrer, STORE_PACKAGE, storeUrl } from '../../../src/lib/store.ts';
import { INVITE_ALPHABET, isValidInviteCode, matchLink, withRef } from '../../../src/lib/share.ts';

const PLAY = 'https://play.google.com/store/apps/details?id=com.skorplus.app';

Deno.test('storeUrl: davet bağlantısı birebir (referrer bir kez kodlanmış)', () => {
  assertEquals(
    storeUrl(STORE_PACKAGE, appUtm('invite', 'ABC234')),
    `${PLAY}&referrer=utm_source%3Dapp%26utm_medium%3Dinvite%26utm_campaign%3Dinvite%26utm_content%3DABC234`,
  );
});

Deno.test('storeUrl: kod null → utm_content yok; maç paylaşımı match_share', () => {
  assertEquals(storeUrl(STORE_PACKAGE, appUtm('share', null)), `${PLAY}&referrer=utm_source%3Dapp%26utm_medium%3Dshare%26utm_campaign%3Dmatch_share`);
});

Deno.test('storeUrl: utm yok → yalnız mağaza adresi; boş paket → varsayılan', () => {
  assertEquals(storeUrl(STORE_PACKAGE, null), PLAY);
  assertEquals(storeUrl('', null), PLAY);
  assertEquals(storeUrl('com.x', { source: 'telegram', medium: 'social', campaign: 'launch' }), 'https://play.google.com/store/apps/details?id=com.x&referrer=utm_source%3Dtelegram%26utm_medium%3Dsocial%26utm_campaign%3Dlaunch');
});

Deno.test('storeUrl: özel karakterler iki katmanda kodlanır, geri çözülür', () => {
  const u = storeUrl(STORE_PACKAGE, { source: 'creator_a&b', medium: 'referral', campaign: 'creator' });
  const raw = decodeURIComponent(u.split('&referrer=')[1]);
  assertEquals(parseReferrer(raw).source, 'creator_a&b');
});

Deno.test('parseReferrer: kodlanmış ve kodlanmamış girdi', () => {
  const enc = 'utm_source%3Dapp%26utm_medium%3Dinvite%26utm_campaign%3Dinvite%26utm_content%3DABC234';
  assertEquals(parseReferrer(enc), { source: 'app', medium: 'invite', campaign: 'invite', code: 'ABC234' });
  assertEquals(parseReferrer(decodeURIComponent(enc)), { source: 'app', medium: 'invite', campaign: 'invite', code: 'ABC234' });
});

Deno.test('parseReferrer: küçük harf ve boşluk → büyük harf kod', () => {
  assertEquals(parseReferrer('utm_content=abc234').code, 'ABC234');
  assertEquals(parseReferrer('utm_content=abc%20234').code, 'ABC234');
});

Deno.test('parseReferrer: eski indirme sayfası biçimi k=', () => {
  assertEquals(parseReferrer('ref=invite&k=XYZ789').code, 'XYZ789');
  // utm_content önce gelir
  assertEquals(parseReferrer('k=XYZ789&utm_content=ABC234').code, 'ABC234');
});

Deno.test('parseReferrer: geçersiz kod → null (alfabe dışı 1, uzunluk)', () => {
  assertEquals(parseReferrer('utm_content=ABC123').code, null);
  assertEquals(parseReferrer('utm_content=ABCD234').code, null);
  assertEquals(parseReferrer('utm_content=ABO234').code, null);
});

Deno.test("parseReferrer: Play'in organik değeri", () => {
  assertEquals(parseReferrer('utm_source=google-play&utm_medium=organic'), { source: 'google-play', medium: 'organic', campaign: null, code: null });
});

Deno.test('parseReferrer: boş / null / çöp / çok uzun', () => {
  const empty = { source: null, medium: null, campaign: null, code: null };
  assertEquals(parseReferrer(null), empty);
  assertEquals(parseReferrer(''), empty);
  assertEquals(parseReferrer(undefined), empty);
  assertEquals(parseReferrer('%%%'), empty);
  assertEquals(parseReferrer('x'.repeat(1001) + '=1'), empty);
});

Deno.test('parseReferrer: tam mağaza adresi ve ?referrer= sarmalı', () => {
  assertEquals(parseReferrer(storeUrl(STORE_PACKAGE, appUtm('invite', 'XYZ789'))).code, 'XYZ789');
  assertEquals(parseReferrer('?referrer=utm_source%3Dapp%26utm_content%3DXYZ789').code, 'XYZ789');
});

Deno.test('gidiş-dönüş: storeUrl → referrer → parseReferrer aynı kod', () => {
  for (const code of ['ABC234', 'XYZ789', 'HJK2M9']) {
    const raw = decodeURIComponent(storeUrl(STORE_PACKAGE, appUtm('share', code)).split('&referrer=')[1]);
    assertEquals(parseReferrer(raw), { source: 'app', medium: 'share', campaign: 'match_share', code });
  }
});

Deno.test('davet kodu deseni share.ts ile aynı (tüm alfabe + dışı)', () => {
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    const c = ch.repeat(6);
    assertEquals(parseReferrer(`utm_content=${c}`).code !== null, isValidInviteCode(c), `karakter ${ch}`);
    assertEquals(INVITE_ALPHABET.includes(ch), isValidInviteCode(c));
  }
});

Deno.test('isPlayStoreUrl / packageFromPlayUrl', () => {
  assert(isPlayStoreUrl(PLAY));
  assertEquals(isPlayStoreUrl('https://play.google.com.evil.dev/x'), false);
  assertEquals(isPlayStoreUrl('https://ornek.invalid/skorplus'), false);
  assertEquals(packageFromPlayUrl(PLAY), 'com.skorplus.app');
  assertEquals(packageFromPlayUrl(`${PLAY}&hl=tr`), 'com.skorplus.app');
  assertEquals(packageFromPlayUrl('https://play.google.com/store/apps/details?hl=tr&id=com.x.y'), 'com.x.y');
  assertEquals(packageFromPlayUrl('https://play.google.com/store'), STORE_PACKAGE);
});

Deno.test('share.ts: Play adresinde withRef / matchLink mağaza bağlantısı (eski referrer atılır)', () => {
  assertEquals(withRef(PLAY, 'invite', 'ABC234'), storeUrl(STORE_PACKAGE, appUtm('invite', 'ABC234')));
  assertEquals(withRef(`${PLAY}&referrer=eski`, 'app-share', null), storeUrl(STORE_PACKAGE, appUtm('share', null)));
  const m = matchLink(PLAY, 9001, 'ABC234');
  assertEquals(m, storeUrl(STORE_PACKAGE, appUtm('share', 'ABC234')));
  assert(!m.includes('/m/'));
  // Play dışı adres değişmez (APK / indirme sayfası)
  assertEquals(withRef('https://x.dev/skor', 'invite', 'ABC234'), 'https://x.dev/skor?ref=invite&k=ABC234');
});
