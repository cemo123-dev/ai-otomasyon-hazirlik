import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource } from '@/lib/data';
import type { Match, PreviewPayload } from '@/lib/types';
import { usePremium } from './usePremium';

export type PreviewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'too_early' }
  | { kind: 'not_prematch' }
  | { kind: 'not_supported' }
  | { kind: 'paywall' }
  | { kind: 'generating' }
  | { kind: 'completed'; payload: PreviewPayload }
  | { kind: 'error'; message: string };

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
          return setState({ kind: 'generating' });
        case 'paywall_blocked':
          return setState({ kind: 'paywall' });
        case 'too_early':
          return setState({ kind: 'too_early' });
        case 'not_prematch':
          return setState({ kind: 'not_prematch' });
        case 'not_supported':
          return setState({ kind: 'not_supported' });
        case 'unauthenticated':
          return setState({ kind: 'error', message: 'Oturum açılamadı. Bağlantını kontrol edip tekrar dene.' });
        default:
          return setState({ kind: 'error', message: 'İlk 11 henüz alınamadı. Birkaç dakika sonra tekrar dene.' });
      }
    } catch (e) {
      const msg = (e as { message?: string } | null)?.message;
      if (my === reqId.current) setState({ kind: 'error', message: msg ? `Maç önü analizi alınamadı: ${msg}` : 'Maç önü analizi alınamadı' });
    }
  }, [fixtureId, loadPayload]);

  useEffect(() => {
    if (!active || fixtureId == null) return;
    // request durum güncellemelerini zaten asenkron yapar; effect gövdesinde senkron setState olmasın
    Promise.resolve().then(request);
  }, [active, isPremium, fixtureId, request]);

  // Realtime: preview_status 'completed' / 'failed'
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    if (status === 'completed') loadPayload(fixtureId, reqId.current);
  }, [status, state.kind, fixtureId, loadPayload]);

  // Güvenlik ağı: Realtime koparsa periyodik kontrol
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    const t = setInterval(async () => {
      const m = await dataSource.getMatch(fixtureId);
      if (m?.preview_status === 'completed') loadPayload(fixtureId, reqId.current);
      else if (m?.preview_status === 'failed') setState({ kind: 'error', message: 'İlk 11 henüz alınamadı. Birkaç dakika sonra tekrar dene.' });
    }, SAFETY_POLL_MS);
    return () => clearInterval(t);
  }, [state.kind, fixtureId, loadPayload]);

  // Realtime "failed" durumu türetilir (effect içinde setState yerine)
  const shown: PreviewState =
    state.kind === 'generating' && status === 'failed'
      ? { kind: 'error', message: 'İlk 11 henüz alınamadı. Birkaç dakika sonra tekrar dene.' }
      : state;

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    request();
  }, [request]);

  return { state: shown, retry };
}
