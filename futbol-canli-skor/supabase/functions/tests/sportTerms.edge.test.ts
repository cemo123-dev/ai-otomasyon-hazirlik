// Test ajanının eklediği sınır durumları (bkz. docs/test-raporu.md, bulgu 3 ve 4 — düzeltildi).
import { assert } from 'jsr:@std/assert@1';
import { hasFootballTerm } from '../_shared/sportTerms.ts';

Deno.test('sportTerms: geçmesi gereken basketbol metinleri', () => {
  for (const t of [
    "Golden State'in bench'i 40 sayı üretti.",
    'Rudy Gobert boya alanında etkiliydi.',
    'Aaron Gordon pota altında.',
    'Goga Bitadze 10 ribaund aldı.',
    'Fark var.',
    'Forward oyuncu 20 sayı attı.',
  ]) {
    assert(!hasFootballTerm(t), t);
  }
});

Deno.test('Türkçe büyük İ/I içeren futbol terimleri yakalanır', () => {
  for (const t of ["İlk 11'de değişiklik yok.", 'İLK 11 belli oldu.', 'PENALTI kararı.', 'DEVRE ARASI skor 50-48.', 'TEKNİK DİREKTÖR kızdı.']) {
    assert(hasFootballTerm(t), t);
  }
});

Deno.test('boşluk farkı ve basketbol jargonu yanlış pozitif vermez', () => {
  for (const t of ['Warriors (Golden  State) kazandı.', 'Golden\nState kazandı.', 'Korner üçlüğü isabetli.', 'KORNER ÜÇLÜK denemesi', 'korner  üçlükleri düştü']) {
    assert(!hasFootballTerm(t), t);
  }
  assert(hasFootballTerm('kırmızı  kart gördü'), 'çift boşluk');
  assert(hasFootballTerm('teknik\ndirektör'), 'satır sonu');
  assert(hasFootballTerm('Korner kullandı.'), 'yalın korner');
});

Deno.test('gol: yalnız gerçek Türkçe ekler; Golf/Golan/golden geçer', () => {
  for (const t of ['Golf oynadı.', 'Golan Heights', 'golden ratio']) {
    assert(!hasFootballTerm(t), t);
  }
  for (const t of ['gol', 'golü', 'golün', 'gole', 'golde', 'golle', 'goller', 'gollerle', 'golcü', 'golcüsü', 'golsüz', 'golünü', 'golüyle', 'gollük', 'GOL attı']) {
    assert(hasFootballTerm(t), t);
  }
});
