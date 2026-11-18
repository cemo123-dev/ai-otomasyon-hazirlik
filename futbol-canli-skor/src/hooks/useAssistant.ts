import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataSource } from '@/lib/data';
import { friendlyError } from '@/lib/errors';
import { ASSISTANT_QUESTION_LIMIT, type ChatMessage } from '@/lib/types';

const RESULT_MSG: Record<string, string> = {
  unauthenticated: 'Oturum açılamadı. Bağlantını kontrol et.',
  not_found: 'Maç bulunamadı.',
  not_ready: 'Asistan, maç sonu analizi hazır olunca açılır.',
  paywall_blocked: 'Taktik asistan Pro üyelere özel.',
  invalid: 'Soru 3 ile 200 karakter arasında olmalı.',
  limit_reached: `Bu maç için ${ASSISTANT_QUESTION_LIMIT} soru hakkını kullandın.`,
  busy: 'Önceki sorunun yanıtı bekleniyor.',
};

const POLL_MS = 4000;
/**
 * Bu süreden eski 'pending' soru başarısız sayılır ve yoklama durur (sunucu da 0015 ile bir sonraki
 * soruda / günlük bakımda kapatır ve hakka saymaz). Gemini zaman aşımı + yeniden denemeler ~80 sn.
 */
const STALE_PENDING_MS = 2 * 60_000;
const STALE_MSG = 'Yanıt alınamadı; bu soru hakkından düşülmedi. Tekrar sorabilirsin.';

/**
 * seenAt: mesajın istemcide ilk görüldüğü an (yerel saat). Bayatlık bununla ölçülür; sunucunun
 * created_at'i ile cihaz saati karşılaştırılmaz (saati ileri cihazda yeni soru hemen "başarısız" görünüyordu).
 */
type Seen = ChatMessage & { seenAt: number };

/** Makul saat kayması: created_at bundan daha eskiyse cihaz saati yanlış olsa da soru gerçekten eskidir */
const CLOCK_SKEW_MS = 10 * 60_000;

/**
 * İlk görülme anı. Saatler önce sorulup sunucuda 'pending' kalmış soru her ekran açılışında
 * 2 dk "bakılıyor" görünüp girişi kilitlemesin (Döngü 4, bulgu 4): created_at saat kaymasından
 * çok eskiyse o kullanılır (hemen bayat sayılır); değilse yerel "şimdi" (saati ileri cihaz korunur).
 */
function firstSeen(m: ChatMessage, at: number): number {
  const created = Date.parse(m.created_at);
  return Number.isFinite(created) && at - created > CLOCK_SKEW_MS ? created : at;
}

/** Gelen listeyi önceki ilk-görülme zamanlarını koruyarak damgalar */
function stamp(prev: Seen[], list: ChatMessage[]): Seen[] {
  const at = Date.now();
  return list.map((m) => ({ ...m, seenAt: prev.find((x) => x.id === m.id)?.seenAt ?? firstSeen(m, at) }));
}

/** "Taktik Asistana Sor": maç başına 3 soru, yanıt Realtime ile gelir */
export function useAssistant(fixtureId: number) {
  const [messages, setMessages] = useState<Seen[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const upsert = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      const i = prev.findIndex((x) => x.id === m.id);
      if (i < 0) return [...prev, { ...m, seenAt: firstSeen(m, Date.now()) }];
      const next = [...prev];
      next[i] = { ...m, seenAt: prev[i].seenAt };
      return next;
    });
  }, []);

  const reload = useCallback(async () => {
    const list = await dataSource.listChat(fixtureId).catch(() => null);
    if (list) setMessages((prev) => stamp(prev, list));
  }, [fixtureId]);

  useEffect(() => {
    let alive = true;
    dataSource
      .listChat(fixtureId)
      .then((list) => alive && setMessages((prev) => stamp(prev, list)))
      .catch(() => {});
    const unsub = dataSource.subscribeChat(fixtureId, upsert);
    return () => {
      alive = false;
      unsub();
    };
  }, [fixtureId, upsert]);

  // Takılı kalan soru sonsuza dek "bakılıyor" göstermesin, girişi kilitlemesin
  const shown = useMemo(
    () =>
      messages.map(({ seenAt, ...m }): ChatMessage =>
        m.status === 'pending' && now - seenAt > STALE_PENDING_MS
          ? { ...m, status: 'failed' as const, answer: STALE_MSG }
          : m,
      ),
    [messages, now],
  );

  // Güvenlik ağı: Realtime koparsa bekleyen yanıtı periyodik kontrol et
  const pending = shown.some((m) => m.status === 'pending');
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => {
      reload();
      setNow(Date.now());
    }, POLL_MS);
    return () => clearInterval(t);
  }, [pending, reload]);

  /** Dönüş: soru kuyruğa alındı mı (istemci yazılan metni yalnız o zaman temizler) */
  const ask = useCallback(
    async (question: string): Promise<boolean> => {
      setSending(true);
      setError(null);
      try {
        const res = await dataSource.askAssistant(fixtureId, question);
        setNow(Date.now());
        if (res === 'queued') {
          await reload();
          return true;
        }
        setError(RESULT_MSG[res] ?? 'Soru gönderilemedi.');
        return false;
      } catch (e) {
        setError(friendlyError(e, 'Soru gönderilemedi. Tekrar dene.'));
        return false;
      } finally {
        setSending(false);
      }
    },
    [fixtureId, reload],
  );

  const used = shown.filter((m) => m.status !== 'failed').length;
  return { messages: shown, ask, sending, pending, error, remaining: Math.max(0, ASSISTANT_QUESTION_LIMIT - used) };
}
