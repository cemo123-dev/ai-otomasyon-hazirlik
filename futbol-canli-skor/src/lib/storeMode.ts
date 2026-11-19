import { PREVIEW_MODE } from './supabase';

/**
 * Play Store ekran görüntüsü modu (docs/tasarim-rehberi.md "## Play Store görselleri" §1, e2e/store_shots.mjs).
 * Yalnız önizlemede (mock veri) ve web adresinde `?store=1` varken açılır; üretim paketinde PREVIEW_MODE
 * sabit false olduğu için hiçbir etkisi yoktur. Sayfa yüklenirken bir kez okunur: uygulama içi gezinmede
 * (ör. maç ekranından ana listeye dönüşte) adres çubuğundaki parametre düşse de mod oturum boyunca açık kalır.
 *
 * Etkiler: ÖNİZLEME rozeti ve "Örnek veri" bandı gizlenir, web bildirim notu çıkmaz, asistanın
 * "Önizleme modundasın" yanıtı gerçekçi bir yanıtla değişir, gerçek milli takım / UEFA maçları listeden
 * çıkar, ilk açılış takım seçimi (F5) gösterilmez.
 */
export const STORE_MODE: boolean =
  PREVIEW_MODE && typeof globalThis.location !== 'undefined' && /[?&]store=1(?:&|$)/.test(globalThis.location.search ?? '');
