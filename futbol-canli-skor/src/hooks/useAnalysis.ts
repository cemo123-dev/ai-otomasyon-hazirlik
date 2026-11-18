import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource } from '@/lib/data';
import { isFinished, type AnyTacticalPayload, type Match } from '@/lib/types';
import { usePremium } from './usePremium';
import { friendlyError } from '@/lib/errors';

export type AnalysisState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'not_finished' }
  /** 0015: istatistik henüz yok; deneme sayılmadı */
  | { kind: 'not_ready' }
  | { kind: 'paywall' }
  | { kind: 'generating'; stale?: Stale }
  | { kind: 'completed'; payload: AnyTacticalPayload }
  | { kind: 'error'; message: string };

/**
 * RPC 'generating' döndüğünde istemcideki durum alanı Realtime gelene kadar eski değerinde kalır
 * (none / failed). O an görülen değer saklanır; durum bu değerden bir kez farklı görülene kadar eski
 * değer "üretim sürüyor" sayılır (yanlış "veri bekleniyor" / "üretilemedi" kartı gösterilmez).
 * updated_at kullanılmaz: AI durum değişiklikleri onu değiştirmez (Döngü 4, bulgu 8).
 */
type Stale = { status: string | undefined };

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
  const status = match?.analysis_status;
  const latest = useRef<Stale>({ status });
  useEffect(() => {
    latest.current = { status };
  }, [status]);

  const loadPayload = useCallback(async (id: number, my: number) => {
    const payload = await dataSource.getAnalysis(id);
    if (my !== reqId.current) return;
    setState(payload ? { kind: 'completed', payload } : { kind: 'error', message: 'Analiz bulunamadı' });
  }, []);

  const request = useCallback(async () => {
    if (fixtureId == null) return;
    const my = ++reqId.current;
    try {
      const res = await dataSource.requestAnalysis(fixtureId);
      if (my !== reqId.current) return;
      switch (res) {
        case 'completed':
          return loadPayload(fixtureId, my);
        case 'generating':
          return setState({ kind: 'generating', stale: latest.current.status === 'generating' ? undefined : { ...latest.current } });
        case 'paywall_blocked':
          return setState({ kind: 'paywall' });
        case 'not_finished':
          return setState({ kind: 'not_finished' });
        case 'not_ready':
          return setState({ kind: 'not_ready' });
        case 'unauthenticated':
          return setState({ kind: 'error', message: 'Oturum açılamadı. Bağlantını kontrol edip tekrar dene.' });
        default:
          return setState({ kind: 'error', message: 'Analiz şu an alınamıyor' });
      }
    } catch (e) {
      // Ham İngilizce / Postgrest hata metni ekrana yazılmaz (Döngü 5, bulgu 8)
      if (my === reqId.current) setState({ kind: 'error', message: friendlyError(e, 'Analiz alınamadı. Tekrar dene.') });
    }
  }, [fixtureId, loadPayload]);

  // Sekme açıldığında, maç bittiğinde veya abonelik değiştiğinde yeniden iste
  useEffect(() => {
    if (!active || fixtureId == null || !finished) return;
    // request durum güncellemelerini zaten asenkron yapar; effect gövdesinde senkron setState olmasın
    Promise.resolve().then(request);
  }, [active, finished, isPremium, fixtureId, request]);

  // İstek sonrası henüz değişmemiş (eski) durum "üretim sürüyor" sayılır
  const stale = state.kind === 'generating' ? state.stale : undefined;
  // Durum eski değerden bir kez ayrıldıysa işaret bırakılır (hızlı failed → generating → failed gidiş-dönüşü
  // eski değere yeniden eşit olunca "üretiliyor"da takılmasın). Render sırasında durum ayarı (effect değil).
  if (stale && stale.status !== status) setState({ kind: 'generating' });
  const effStatus = stale && stale.status === status ? 'generating' : status;

  // Realtime: analysis_status 'completed' / 'failed' olduğunda
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    if (effStatus === 'completed') loadPayload(fixtureId, reqId.current).catch(() => {}); // yoklama yeniden dener
  }, [effStatus, state.kind, fixtureId, loadPayload]);

  // Güvenlik ağı: Realtime bağlantısı koparsa durumu periyodik kontrol et
  useEffect(() => {
    if (state.kind !== 'generating' || fixtureId == null) return;
    const t = setInterval(async () => {
      // Çevrimdışıyken getMatch reddi yakalanır (işlenmemiş promise reddi olmasın); sonraki turda tekrar denenir
      try {
        const m = await dataSource.getMatch(fixtureId);
        if (m?.analysis_status === 'completed') await loadPayload(fixtureId, reqId.current);
        else if (m?.analysis_status === 'failed') setState({ kind: 'error', message: 'Analiz üretilemedi. Tekrar deneyin.' });
        else if (m?.analysis_status === 'none') setState({ kind: 'not_ready' }); // sunucu veriyi hazır bulmadı, denemeyi iade etti
      } catch {
        // yoklama sessizce atlanır
      }
    }, SAFETY_POLL_MS);
    return () => clearInterval(t);
  }, [state.kind, fixtureId, loadPayload]);

  // Türetilmiş durumlar (effect içinde setState yerine): maç bitmedi / Realtime "failed"
  const shown: AnalysisState =
    active && match && !finished
      ? { kind: 'not_finished' }
      : state.kind === 'generating' && effStatus === 'failed'
        ? { kind: 'error', message: 'Analiz üretilemedi. Tekrar deneyin.' }
        : state.kind === 'generating' && effStatus === 'none'
          ? { kind: 'not_ready' } // generate-analysis "veri yok" deyip denemeyi iade etti
          : state;

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    request();
  }, [request]);

  return { state: shown, retry };
}
