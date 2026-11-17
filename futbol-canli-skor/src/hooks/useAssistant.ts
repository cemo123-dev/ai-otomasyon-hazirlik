import { useCallback, useEffect, useState } from 'react';
import { dataSource } from '@/lib/data';
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

/** "Taktik Asistana Sor": maç başına 3 soru, yanıt Realtime ile gelir */
export function useAssistant(fixtureId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const upsert = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      const i = prev.findIndex((x) => x.id === m.id);
      if (i < 0) return [...prev, m];
      const next = [...prev];
      next[i] = m;
      return next;
    });
  }, []);

  const reload = useCallback(async () => {
    const list = await dataSource.listChat(fixtureId).catch(() => null);
    if (list) setMessages(list);
  }, [fixtureId]);

  useEffect(() => {
    let alive = true;
    dataSource
      .listChat(fixtureId)
      .then((list) => alive && setMessages(list))
      .catch(() => {});
    const unsub = dataSource.subscribeChat(fixtureId, upsert);
    return () => {
      alive = false;
      unsub();
    };
  }, [fixtureId, upsert]);

  // Güvenlik ağı: Realtime koparsa bekleyen yanıtı periyodik kontrol et
  const pending = messages.some((m) => m.status === 'pending');
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(reload, POLL_MS);
    return () => clearInterval(t);
  }, [pending, reload]);

  const ask = useCallback(
    async (question: string) => {
      setSending(true);
      setError(null);
      try {
        const res = await dataSource.askAssistant(fixtureId, question);
        if (res === 'queued') await reload();
        else setError(RESULT_MSG[res] ?? 'Soru gönderilemedi.');
      } catch (e) {
        setError((e as { message?: string } | null)?.message ?? 'Soru gönderilemedi.');
      } finally {
        setSending(false);
      }
    },
    [fixtureId, reload],
  );

  const used = messages.filter((m) => m.status !== 'failed').length;
  return { messages, ask, sending, pending, error, remaining: Math.max(0, ASSISTANT_QUESTION_LIMIT - used) };
}
