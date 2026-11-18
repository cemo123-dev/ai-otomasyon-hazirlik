import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { dataSource } from '@/lib/data';
import type { Sport } from '@/lib/types';

// Sunucu yapılandırması (plan bayrağı, fikstür gün sayısı) nadiren değişir: anahtar başına tek istek paylaşılır.
// Futbol Pro'ya geçer, NBA ücretsiz kalır (0018): önbellek iki sporu ayrı tutar.
// Döngü 8 bulgu 10: önbellek oturum boyu değil, uygulama ön plana her dönüşte yenilenir (Pro'ya geçiş /
// geri dönüş açık uygulamalara yeniden başlatma gerekmeden yansır).
const cached = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();
let lastAppState: string | null | undefined = AppState.currentState;
let subscribed = false;

function ensureForegroundRefresh() {
  if (subscribed) return;
  subscribed = true;
  // Modül ömrü boyunca tek dinleyici; arka plandan ön plana geçişte önbellek boşalır, açık ekranlar yeniden sorar
  AppState.addEventListener('change', (next) => {
    const wasActive = lastAppState === 'active';
    lastAppState = next;
    if (next === 'active' && !wasActive) {
      cached.clear();
      listeners.forEach((l) => l());
    }
  });
}

/** Paylaşılan, ön planda yenilenen sunucu değeri. null = bilinmiyor (son bilinen değer korunur) */
function useServerValue<T>(key: string | null, load: () => Promise<T | null>): T | null {
  const [state, setState] = useState<{ key: string; value: T | null } | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    ensureForegroundRefresh();
    const l = () => setVersion((v) => v + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  useEffect(() => {
    if (key === null) return;
    let alive = true;
    let p = cached.get(key) as Promise<T | null> | undefined;
    if (!p) {
      p = load().catch(() => null);
      cached.set(key, p);
    }
    p.then((v) => {
      if (v === null) cached.delete(key); // bilinmiyorsa sonraki ekranda yeniden denensin
      if (!alive) return;
      // Yenileme başarısızsa (ağ yok) son bilinen değer kalır; yeni anahtarda bilinmiyor gösterilir
      setState((prev) => (v === null && prev?.key === key ? prev : { key, value: v }));
    });
    return () => {
      alive = false;
    };
    // load anahtarla belirlenir (her render'da yeni fonksiyon olabilir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);
  // Anahtar değişince önceki anahtarın cevabı gösterilmez (yeni cevap gelene kadar bilinmiyor)
  return key !== null && state?.key === key ? state.value : null;
}

/**
 * Bu sporun API planı ücretli mi? Akıllı alarmlar (baskı, kırmızı kart; NBA seri) ve futbolda −1…+7 gün
 * fikstür yalnız ücretli planda vardır; ücretsiz planda arayüz bunları vaat etmez.
 * null = bilinmiyor (nötr metin gösterilir, ücretli metin gösterilmez).
 */
export function useApiPaid(sport: Sport = 'football'): boolean | null {
  return useServerValue<boolean>(`paid:${sport}`, () => dataSource.isApiPaid(sport));
}

/**
 * Ücretli futbol planında sunucunun fikstürü kaç gün ileri çektiği (0019 fixture_days_ahead; Döngü 8 bulgu 8).
 * `enabled` false iken (ücretsiz / bilinmiyor) sorulmaz. null = bilinmiyor → şerit varsayılan 7'yi kullanır.
 */
export function useFixtureDaysAhead(enabled: boolean): number | null {
  return useServerValue<number>(enabled ? 'fixtureDaysAhead' : null, () => dataSource.fixtureDaysAhead());
}
