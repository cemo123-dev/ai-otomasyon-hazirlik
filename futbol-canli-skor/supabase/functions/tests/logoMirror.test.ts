// Logo kaynağı adres yardımcıları — çalıştırma: supabase/functions içinde `deno test`
import { assertEquals } from 'jsr:@std/assert@1';
import { thumb120, wikiFileName } from '../_shared/nbaBox.ts';

Deno.test('wikiFileName: thumb ve özgün adres', () => {
  assertEquals(wikiFileName('https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Chicago_Bulls_logo.svg/120px-Chicago_Bulls_logo.svg.png'), 'Chicago_Bulls_logo.svg');
  assertEquals(wikiFileName('https://upload.wikimedia.org/wikipedia/fr/0/0e/San_Antonio_Spurs_2018.png'), 'San_Antonio_Spurs_2018.png');
  assertEquals(wikiFileName('https://example.com/x.png'), null);
});

Deno.test('thumb120: büyük thumb boyutu 120 px olur', () => {
  assertEquals(
    thumb120('https://upload.wikimedia.org/wikipedia/en/thumb/2/21/Portland_Trail_Blazers_logo.svg/1200px-Portland_Trail_Blazers_logo.svg.png'),
    'https://upload.wikimedia.org/wikipedia/en/thumb/2/21/Portland_Trail_Blazers_logo.svg/120px-Portland_Trail_Blazers_logo.svg.png',
  );
});
