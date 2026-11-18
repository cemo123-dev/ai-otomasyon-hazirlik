import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource } from '@/lib/data';
import type { Match, PreviewPayload } from '@/lib/types';
import { usePremium } from './usePremium';
import { friendlyError } from '@/lib/errors';

export type PreviewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'too_early' }
  | { kind: 'not_prematch' }
  | { kind: 'not_supported' }
  | { kind: 'paywall' }
  /** 0015: ilk 11 henüz açıklanmadı (deneme iade edildi / 5 dk bekleme) */
  | { kind: 'not_ready' }
  | { kind: 'generating'; stale?: Stale }
  | { kind: 'completed'; payload: PreviewPayload }
  | { kind: 'error'; message: string };

/**
 * RPC 'generating' döndüğünde istemcideki durum alanı Realtime gelene kadar eski değerinde kalır
 * (none / failed). O an görülen değer saklanır; durum bu değerden bir kez farklı görülene kadar eski
 * değer "üretim sürüyor" sayılır (yanlış "veri bekleniyor" / "üretilemedi" kartı gösterilmez).
 * updated_at kullanılmaz: AI durum değişiklikleri onu değiştirmez (Döngü 4, bulgu 8).
 */
type Stale = { status: string | undefined };

const SAFETY_POLL_MS = 10_000;

/**
 * Maç öncesi "Taktiksel Eşleşme & Kırılma Senaryosu".
 * İstemci yalnızca request_match_preview RPC'sini çağırır; üretimi sunucu (singleflight)
 * yönetir, tamamlanma bilgisi matches.preview_status ile Realtime üzerinden gelir.
 */
export function usePreview(match: Match | null, active: boolean) {
  const { isPremium } = usePremium();
  const [state, setState] = useState<PreviewState>({ kind: 'idle' });
  const reqId = useRef(0);
  const fixtureId = match?.fixture_id;
  const status = match?.preview_status;
  const latest = useRef<Stale>({ status });
  useEffect(() => {
    latest.current = { status };
  }, [status]);

  const loadPayload = useCallback(async (id: number, my: number) => {
    const payload = await dataSource.getPreview(id);
    if (my !== reqId.current) return;
    setState(payload ? { kind: 'completed', payload } : { kind: 'error', message: 'Maç önü analizi bulunamadı' });
  }, []);

  const request = useCallback(async () => {
    if (fixtureId == null) return;
    const my = ++reqId.current;
    try {
      const res = await dataSource.requestPreview(fixtureId);
      if (my !== reqId.current) return;
      switch (res) {
        case 'completed':
          return loadPayload(fixtureId, my);
        case 'generating':
          return setState({ kind: 'generating', stale: latest.current.status === 'generating' ? undefined : { ...latest.current } });
        case 'paywall_blocked':
          return setState({ kind: 'paywall' });
        case 'too_early':
          return setState({ kind: 'too_early' });
        case 'not_prematch':
          return setState({ kind: 'not_prematch' });
        case 'not_supported':
          return setState({ kind: 'not_supported' });
        case 'not_ready':
          return setState({ kind: 'not_ready' });
        case 'unauthenticated':
          return setState({ kind: 'error', message: 'Oturum açılamadı. Bağlantını kontrol edip tekrar dene.' });
        default:
          return setState({ kind: 'error', message: 'İlk 11 henüz alınamadı. Birkaç dakika sonra tekrar dene.' });
      }
    } catch (e) {
      // Ham İngilizce hata metni ekrana yazılmaz (Döngü 5, bulgu 8)
      if (my === reqId.current) setState({ kind: 'error', message: friendlyError(e, 'Maç önü analizi alınamadı. Tekrar dene.') });
    }
  }, [fixtureId, loadPayload]);

  useEffect(() => {
    if (!active || fixtureId == null) return;
    // request durum güncellemelerini zaten asenkron yapar; effect gövdesinde senkron setState olmasın
    Promise.resolve().then(request);
  }, [active, isPremium, fixtureId, request]);

  // İstek sonrası henüz değişmemiş (eski) durum "üretim sürüyor" sayılır
  const stale = state.kind === 'generating' ? state.stale : undefined;
  // Durum eski değerden bir kez ayrıldıysa işaret bırakılır (hızlı none → generating → none gidiş-dönüşü
  // eski değere yeniden eşit olunca "üretiliyor"da takılmasın). Render sırasında durum ayarı (effect değil).
  if (stale && stale.status !== status) setState({ kind: 'generating' });
  const effStatus = stale && stale.status === status ? 'generating' : status;

  // Realtime: preview_status 'completed' / 'failed'
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    if (effStatus === 'completed') loadPayload(fixtureId, reqId.current).catch(() => {}); // yoklama yeniden dener
  }, [effStatus, state.kind, fixtureId, loadPayload]);

  // Güvenlik ağı: Realtime koparsa periyodik kontrol
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    const t = setInterval(async () => {
      // Çevrimdışıyken getMatch reddi yakalanır (işlenmemiş promise reddi olmasın); sonraki turda tekrar denenir
      try {
        const m = await dataSource.getMatch(fixtureId);
        if (m?.preview_status === 'completed') await loadPayload(fixtureId, reqId.current);
        else if (m?.preview_status === 'failed') setState({ kind: 'error', message: 'İlk 11 henüz alınamadı. Birkaç dakika sonra tekrar dene.' });
        else if (m?.preview_status === 'none') setState({ kind: 'not_ready' });
      } catch {
        // yoklama sessizce atlanır
      }
    }, SAFETY_POLL_MS);
    return () => clearInterval(t);
  }, [state.kind, fixtureId, loadPayload]);

  // Realtime "failed" durumu türetilir (effect içinde setState yerine)
  const shown: PreviewState =
    state.kind === 'generating' && effStatus === 'failed'
      ? { kind: 'error', message: 'İlk 11 henüz alınamadı. Birkaç dakika sonra tekrar dene.' }
      : state.kind === 'generating' && effStatus === 'none'
        ? { kind: 'not_ready' } // generate-preview ilk 11'i bulamadı, denemeyi iade etti
        : state;

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    request();
  }, [request]);

  return { state: shown, retry };
}
