import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource } from '@/lib/data';
import { isFinished, type Match, type TacticalPayload } from '@/lib/types';
import { usePremium } from './usePremium';

export type AnalysisState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'not_finished' }
  | { kind: 'paywall' }
  | { kind: 'generating' }
  | { kind: 'completed'; payload: TacticalPayload }
  | { kind: 'error'; message: string };

/** Realtime olayı kaçarsa diye üretim sırasında yedek kontrol aralığı */
const SAFETY_POLL_MS = 10_000;

/**
 * "AI Taktik Analizi" sekmesi aktifken çalışır.
 * İstemci yalnızca request_match_analysis RPC'sini çağırır; üretimi sunucu
 * (singleflight) yönetir, tamamlanma bilgisi matches.analysis_status ile gelir.
 */
export function useAnalysis(match: Match | null, active: boolean) {
  const { isPremium } = usePremium();
  const [state, setState] = useState<AnalysisState>({ kind: 'idle' });
  const reqId = useRef(0);
  const fixtureId = match?.fixture_id;
  const finished = match ? isFinished(match.status_short) : false;

  const loadPayload = useCallback(async (id: number, my: number) => {
    const payload = await dataSource.getAnalysis(id);
    if (my !== reqId.current) return;
    setState(payload ? { kind: 'completed', payload } : { kind: 'error', message: 'Analiz bulunamadı' });
  }, []);

  const request = useCallback(async () => {
    if (fixtureId == null) return;
    const my = ++reqId.current;
    setState({ kind: 'loading' });
    try {
      const res = await dataSource.requestAnalysis(fixtureId);
      if (my !== reqId.current) return;
      switch (res) {
        case 'completed':
          return loadPayload(fixtureId, my);
        case 'generating':
          return setState({ kind: 'generating' });
        case 'paywall_blocked':
          return setState({ kind: 'paywall' });
        case 'not_finished':
          return setState({ kind: 'not_finished' });
        case 'unauthenticated':
          return setState({ kind: 'error', message: 'Oturum açılamadı. Bağlantını kontrol edip tekrar dene.' });
        default:
          return setState({ kind: 'error', message: 'Analiz şu an alınamıyor' });
      }
    } catch (e) {
      // Supabase hataları (PostgrestError) Error sınıfından türemez; message alanını doğrudan oku
      const msg = (e as { message?: string } | null)?.message;
      if (my === reqId.current) setState({ kind: 'error', message: msg ? `Analiz alınamadı: ${msg}` : 'Analiz alınamadı' });
    }
  }, [fixtureId, loadPayload]);

  // Sekme açıldığında, maç bittiğinde veya abonelik değiştiğinde yeniden iste
  useEffect(() => {
    if (!active || fixtureId == null) return;
    if (!finished) {
      setState({ kind: 'not_finished' });
      return;
    }
    request();
  }, [active, finished, isPremium, fixtureId, request]);

  // Realtime: analysis_status 'completed' / 'failed' olduğunda
  const status = match?.analysis_status;
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    if (status === 'completed') loadPayload(fixtureId, reqId.current);
    else if (status === 'failed') setState({ kind: 'error', message: 'Analiz üretilemedi. Tekrar deneyin.' });
  }, [status, state.kind, fixtureId, loadPayload]);

  // Güvenlik ağı: Realtime bağlantısı koparsa durumu periyodik kontrol et
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    const t = setInterval(async () => {
      const m = await dataSource.getMatch(fixtureId);
      if (m?.analysis_status === 'completed') loadPayload(fixtureId, reqId.current);
      else if (m?.analysis_status === 'failed') setState({ kind: 'error', message: 'Analiz üretilemedi. Tekrar deneyin.' });
    }, SAFETY_POLL_MS);
    return () => clearInterval(t);
  }, [state.kind, fixtureId, loadPayload]);

  return { state, retry: request };
}
