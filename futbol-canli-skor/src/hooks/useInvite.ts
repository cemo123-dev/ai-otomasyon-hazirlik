import { useCallback, useEffect, useState } from 'react';
import { dataSource } from '@/lib/data';
import type { InviteState } from '@/lib/data/types';
import { friendlyError } from '@/lib/errors';
import { redeemMessage } from '@/lib/share';

// Oturum başına bir kez sorulur; ShareButton (yalnız basınca, yalnız kod) ve InviteCard aynı isteği paylaşır
let cached: Promise<InviteState | null> | null = null;
let epoch = 0; // resetInviteCache sayacı: arka plan yenilemesinin eski yanıtı yazmasını önler
const listeners = new Set<() => void>();

const load = () => {
  if (!cached) {
    cached = dataSource.getInvite();
    // Hata önbellekte kalmasın: sonraki ekranda / "Tekrar dene"de yeniden sorulur
    cached.catch(() => {
      cached = null;
    });
  }
  return cached;
};

/** Hesap silinince ya da "Tekrar dene"de: önbellek boşaltılır, açık kartlar yeniden çeker */
export function resetInviteCache(): void {
  epoch++;
  cached = null;
  listeners.forEach((l) => l());
}

/**
 * Kod girme `ok` sonrası (Döngü 6 bulgu 9): önbellek yerelde güncellenir, kartlar hemen görür. Sunucudan sessiz
 * yenileme arka planda; başarısız olursa yerel durum kalır (kart hata bandına dönmez, başarı mesajı kaybolmaz).
 */
function markRedeemed(): void {
  const prev = cached;
  if (!prev) {
    resetInviteCache(); // yerel durum yok (beklenmez): sunucudan yeniden oku
    return;
  }
  cached = prev.then(
    (v) => (v ? { ...v, invited: true, canRedeem: false } : v),
    () => null,
  );
  listeners.forEach((l) => l());
  const at = epoch;
  dataSource.getInvite().then(
    (fresh) => {
      if (!fresh || at !== epoch) return; // arada hesap silindi / yeniden yüklendi: eski yanıt yazılmaz
      cached = Promise.resolve(fresh);
      listeners.forEach((l) => l());
    },
    () => {},
  );
}

/**
 * ShareButton için: yalnız kod, yalnız düğmeye basınca (maç açılışında istenmez; Döngü 6 bulgu 6–7).
 * En fazla `waitMs` beklenir; gelmezse / hata / 0017 yoksa null → paylaşım bağlantısı `k`'sız gider.
 */
export function loadInviteCode(waitMs: number): Promise<string | null> {
  const code = load().then(
    (v) => v?.code ?? null,
    () => null,
  );
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), waitMs));
  return Promise.race([code, timeout]);
}

export type RedeemOutcome = ReturnType<typeof redeemMessage>;

/**
 * F3 davet kartı durumu. `invite === null` ve `!loading && !error` → 0017 kurulmadı: kart çizilmez.
 */
export function useInvite(): {
  invite: InviteState | null;
  loading: boolean;
  error: string | null;
  redeem(code: string): Promise<RedeemOutcome>;
  reload(): void;
} {
  const [invite, setInvite] = useState<InviteState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gen, setGen] = useState(0);

  useEffect(() => {
    const bump = () => setGen((g) => g + 1);
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    load().then(
      (v) => {
        if (!alive) return;
        setInvite(v);
        setError(null);
        setLoading(false);
      },
      (e) => {
        if (!alive) return;
        setError(friendlyError(e, 'Davet bilgisi yüklenemedi.'));
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, [gen]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    resetInviteCache();
  }, []);

  const redeem = useCallback(
    async (code: string): Promise<RedeemOutcome> => {
      try {
        const r = await dataSource.redeemInvite(code);
        const out = redeemMessage(r);
        if (out.ok) markRedeemed(); // canRedeem yerelde kapanır; sayaç arka planda yenilenir
        return out;
      } catch (e) {
        return { ...redeemMessage('unauthenticated'), text: friendlyError(e, 'Kod kaydedilemedi. Tekrar dene.') };
      }
    },
    [],
  );

  return { invite, loading, error, redeem, reload };
}
