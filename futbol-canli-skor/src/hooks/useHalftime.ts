import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource } from '@/lib/data';
import type { HalftimePayload, Match } from '@/lib/types';
import { usePremium } from './usePremium';

export type HalftimeState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'not_halftime' }
  | { kind: 'paywall' }
  | { kind: 'generating' }
  | { kind: 'completed'; payload: HalftimePayload }
  | { kind: 'error'; message: string };

const SAFETY_POLL_MS = 10_000;
const FAILED_MSG = 'Devre arası raporu üretilemedi. İkinci yarı başlamış olabilir.';

/**
 * Canlı devre arası "Soyunma Odası Reçetesi".
 * Ücretli planda rapor sunucuda HT anında otomatik üretilir; ücretsiz planda ilk Pro kullanıcının
 * isteği (request_halftime_report, singleflight) tetikler. Tamamlanma Realtime ile gelir.
 */
export function useHalftime(match: Match | null, active: boolean) {
  const { isPremium } = usePremium();
  const [state, setState] = useState<HalftimeState>({ kind: 'idle' });
  const reqId = useRef(0);
  const fixtureId = match?.fixture_id;
  const status = match?.halftime_status;

  const loadPayload = useCallback(async (id: number, my: number) => {
    const payload = await dataSource.getHalftime(id);
    if (my !== reqId.current) return;
    setState(payload ? { kind: 'completed', payload } : { kind: 'error', message: 'Devre arası raporu bulunamadı' });
  }, []);

  const request = useCallback(async () => {
    if (fixtureId == null) return;
    const my = ++reqId.current;
    setState({ kind: 'loading' });
    try {
      const res = await dataSource.requestHalftime(fixtureId);
      if (my !== reqId.current) return;
      switch (res) {
        case 'completed':
          return loadPayload(fixtureId, my);
        case 'generating':
          return setState({ kind: 'generating' });
        case 'paywall_blocked':
          return setState({ kind: 'paywall' });
        case 'not_halftime':
        case 'not_supported':
          return setState({ kind: 'not_halftime' });
        case 'unauthenticated':
          return setState({ kind: 'error', message: 'Oturum açılamadı. Bağlantını kontrol edip tekrar dene.' });
        default:
          return setState({ kind: 'error', message: FAILED_MSG });
      }
    } catch (e) {
      const msg = (e as { message?: string } | null)?.message;
      if (my === reqId.current) setState({ kind: 'error', message: msg ? `Devre arası raporu alınamadı: ${msg}` : FAILED_MSG });
    }
  }, [fixtureId, loadPayload]);

  useEffect(() => {
    if (!active || fixtureId == null) return;
    request();
  }, [active, isPremium, fixtureId, request]);

  // Realtime: halftime_status 'completed' / 'failed' (otomatik üretim de buraya düşer)
  useEffect(() => {
    if (!active || fixtureId == null) return;
    if (status === 'completed' && (state.kind === 'generating' || state.kind === 'not_halftime')) loadPayload(fixtureId, reqId.current);
    else if (status === 'failed' && state.kind === 'generating') setState({ kind: 'error', message: FAILED_MSG });
  }, [active, status, state.kind, fixtureId, loadPayload]);

  // Güvenlik ağı: Realtime koparsa periyodik kontrol
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    const t = setInterval(async () => {
      const m = await dataSource.getMatch(fixtureId);
      if (m?.halftime_status === 'completed') loadPayload(fixtureId, reqId.current);
      else if (m?.halftime_status === 'failed') setState({ kind: 'error', message: FAILED_MSG });
    }, SAFETY_POLL_MS);
    return () => clearInterval(t);
  }, [state.kind, fixtureId, loadPayload]);

  return { state, retry: request };
}
