// src/lib/status.ts (istemci durum eşlemesi) — saf modül, Deno'dan doğrudan içe aktarılır.
// Çalıştırma: npm run test:functions
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  FINISHED_STATUSES,
  isFinished,
  isLive,
  isOff,
  isTimeTbd,
  LIVE_STATUSES,
  liveLabel,
  offLabel,
  statusSpeech,
} from '../../../src/lib/status.ts';
import { FINISHED, LIVE } from '../_shared/types.ts';

Deno.test('status: istemci canlı/bitti listeleri sunucuyla aynı (SUSP canlı)', () => {
  assertEquals([...LIVE_STATUSES].sort(), [...LIVE].sort());
  assertEquals([...FINISHED_STATUSES].sort(), [...FINISHED].sort());
  assert(isLive('SUSP'));
  assert(isLive('INT'));
  assert(!isFinished('SUSP'));
});

Deno.test('status: ertelenen / iptal / yarıda / hükmen etiketleri', () => {
  assertEquals(offLabel('PST'), 'Ertelendi');
  assertEquals(offLabel('CANC'), 'İptal edildi');
  assertEquals(offLabel('ABD'), 'Yarıda kaldı');
  assertEquals(offLabel('AWD'), 'Hükmen sonuç');
  assertEquals(offLabel('WO', 'short'), 'Hükmen');
  assertEquals(offLabel('PST', 'short'), 'Ert.');
  for (const s of ['PST', 'CANC', 'ABD', 'AWD', 'WO']) {
    assert(isOff(s), s);
    assert(!isLive(s) && !isFinished(s), s);
  }
  for (const s of ['NS', 'TBD', '1H', 'HT', 'FT', 'SUSP', 'LIVE']) {
    assert(!isOff(s), s);
    assertEquals(offLabel(s), null);
  }
  assert(isTimeTbd('TBD'));
  assert(!isTimeTbd('NS'));
});

Deno.test('status: canlı rozet metni dar sütuna sığar', () => {
  assertEquals(liveLabel('HT', 45), 'İY');
  assertEquals(liveLabel('SUSP', 63), 'Askı');
  assertEquals(liveLabel('INT', 30), 'Ara');
  assertEquals(liveLabel('2H', 58), "58'");
  assertEquals(liveLabel('1H', null), "0'");
  for (const s of LIVE_STATUSES) assert(liveLabel(s, 90).length <= 4, s);
});

Deno.test('status: ekran okuyucu özeti', () => {
  assertEquals(statusSpeech('2H', 58), '58. dakika');
  assertEquals(statusSpeech('HT', 45), 'devre arası');
  assertEquals(statusSpeech('SUSP', 70), 'maç askıya alındı');
  assertEquals(statusSpeech('FT', 90), 'maç sonu');
  assertEquals(statusSpeech('PST', null), 'ertelendi');
  // NBA: elapsed_minute çeyrek numarasıdır, "dakika" okunmaz (Döngü 3, bulgu 6)
  assertEquals(statusSpeech('LIVE', 3, 'nba'), '3. çeyrek');
  assertEquals(statusSpeech('LIVE', 5, 'nba'), 'uzatma');
  assertEquals(statusSpeech('FT', 4, 'nba'), 'maç sonu');
  assertEquals(statusSpeech('NS', null), '');
});
