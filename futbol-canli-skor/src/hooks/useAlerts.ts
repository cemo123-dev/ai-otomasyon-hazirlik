import { useEffect, useState } from 'react';
import { dataSource } from '@/lib/data';
import type { MatchAlert } from '@/lib/types';

/** Maçın akıllı alarmları: geçmiş + Realtime ile gelen yeni alarm ve analiz durumu güncellemeleri */
export function useAlerts(fixtureId: number) {
  const [alerts, setAlerts] = useState<MatchAlert[]>([]);

  useEffect(() => {
    let alive = true;
    dataSource
      .listAlerts(fixtureId)
      .then((list) => alive && setAlerts(list))
      .catch(() => {}); // 0007 kurulmadıysa kart görünmez
    const unsub = dataSource.subscribeAlerts(fixtureId, (a) => {
      setAlerts((prev) => {
        const i = prev.findIndex((x) => x.id === a.id);
        if (i < 0) return [a, ...prev];
        const next = [...prev];
        next[i] = a;
        return next;
      });
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [fixtureId]);

  return alerts;
}
