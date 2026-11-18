import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { dataSource } from '@/lib/data';
import { dayKeyFromToday, istanbulDayKey, istanbulDayStartMs, type DayOffset } from '@/lib/days';
import { friendlyError } from '@/lib/errors';
import { isFinished, isLive, type Match, type Sport } from '@/lib/types';
import { mergeMatch } from './useMatch';

export type MatchFilter = 'all' | 'live' | 'finished' | 'followed';

/** "Takip" filtresi: takip edilen maçlar + takip edilen takımların maçları */
export type FollowSets = { fixtures: Set<number>; teams: Set<string> };

export type LeagueGroup = {
  key: string;
  league_name: string;
  league_country: string | null;
  priority: number;
  data: Match[];
};

const stateRank = (m: Match) => (isLive(m.status_short) ? 0 : isFinished(m.status_short) ? 1 : 2);

/**
 * day: tarih şeridi (-1 Dün, 0 Bugün, 1 Yarın, 2…7 ücretli futbol planında; Europe/Istanbul günü).
 * Filtreler seçili günle birlikte çalışır. Gece yarısını geçen canlı maç "Bugün"de de görünür (kendi gününde de kalır).
 * daysAhead: listenin kapsadığı son gün (şeridin son günü; ücretsiz plan 1 → sorgu eskisiyle aynı).
 */
export function useMatches(sport: Sport, filter: MatchFilter, follows?: FollowSets, day: DayOffset = 0, daysAhead = 1) {
  // Liste ve hata, yüklendikleri spora göre anahtarlanır: spor değişince eski liste
  // effect içinde temizlenmez, render sırasında türetilerek gizlenir
  const [data, setData] = useState<{ sport: Sport; map: Map<number, Match> } | null>(null);
  const [failure, setFailure] = useState<{ sport: Sport; message: string } | null>(null);

  // Seçili spor: spor değiştikten sonra geç dönen eski istek yeni sporun listesini/hatasını ezmesin
  const sportRef = useRef(sport);
  useEffect(() => {
    sportRef.current = sport;
  }, [sport]);

  const load = useCallback(async () => {
    try {
      const list = await dataSource.listMatches(sport, daysAhead);
      if (sportRef.current !== sport) return;
      // Geç dönen liste, arada gelen daha yeni Realtime satırını ezmez (updated_at karşılaştırması)
      setData((prev) => {
        const old = prev?.sport === sport ? prev.map : null;
        return { sport, map: new Map(list.map((m) => [m.fixture_id, mergeMatch(old?.get(m.fixture_id), m)])) };
      });
      setFailure((f) => (f?.sport === sport ? null : f));
    } catch (e) {
      if (sportRef.current !== sport) return;
      setFailure({ sport, message: friendlyError(e, 'Maçlar yüklenemedi. Tekrar dene.') });
    }
  }, [sport, daysAhead]);

  // İstanbul'da gün dönünce (uygulama gece yarısını açık geçirirse) gün anahtarı ve sorgu penceresi
  // tazelenir: bir sonraki gece yarısına kurulan zamanlayıcı + uygulama öne gelince kontrol.
  // Öne gelince liste her durumda yeniden çekilir: arka planda kapanan WebSocket'in kaçırdığı
  // Realtime olayları yeniden gönderilmez (ve ağ hatasıyla açılan ekran kendiliğinden toparlanır).
  const [today, setToday] = useState(() => dayKeyFromToday(0));
  const todayRef = useRef(today);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = (force = false) => {
      const k = dayKeyFromToday(0);
      if (k !== todayRef.current) {
        todayRef.current = k;
        setToday(k);
      } else if (!force) return;
      loadRef.current();
    };
    const schedule = () => {
      timer = setTimeout(() => {
        check();
        schedule();
      }, istanbulDayStartMs(1) - Date.now() + 1000);
    };
    schedule();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check(true);
    });
    return () => {
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
    // Realtime: yalnızca seçili sporun skor / dakika / analiz durumu değişiklikleri
    return dataSource.subscribeMatches(sport, (m) =>
      setData((prev) => {
        if (!prev || prev.sport !== sport) return prev;
        const map = new Map(prev.map);
        map.set(m.fixture_id, mergeMatch(prev.map.get(m.fixture_id), m));
        return { sport, map };
      }),
    );
  }, [sport, load]);

  const matches = useMemo(() => (data?.sport === sport ? data.map : new Map<number, Match>()), [data, sport]);
  const hasData = data?.sport === sport;
  const failed = failure?.sport === sport ? failure.message : null;
  // Elde liste varken yenileme hatası tam ekran hata değil, liste üstünde kısa uyarı olur
  const error = hasData ? null : failed;
  const refreshError = hasData ? failed : null;
  const loading = !hasData && !failed;

  // Seçili günün anahtarı "bugün" durumundan türetilir (gün dönünce yukarıdaki kontrol günceller)
  const dayKey = dayKeyFromToday(day, Date.parse(`${today}T12:00:00+03:00`));

  const groups = useMemo<LeagueGroup[]>(() => {
    const byLeague = new Map<string, LeagueGroup>();
    for (const m of matches.values()) {
      if (istanbulDayKey(m.kickoff_at) !== dayKey && !(day === 0 && isLive(m.status_short))) continue;
      if (filter === 'live' && !isLive(m.status_short)) continue;
      if (filter === 'finished' && !isFinished(m.status_short)) continue;
      if (
        filter === 'followed' &&
        !(
          follows?.fixtures.has(m.fixture_id) ||
          (m.home_team_id != null && follows?.teams.has(`${m.sport_type}:${m.home_team_id}`)) ||
          (m.away_team_id != null && follows?.teams.has(`${m.sport_type}:${m.away_team_id}`))
        )
      )
        continue;
      const key = `${m.league_country ?? ''}|${m.league_name}`;
      let g = byLeague.get(key);
      if (!g) {
        g = { key, league_name: m.league_name, league_country: m.league_country, priority: m.league_priority, data: [] };
        byLeague.set(key, g);
      }
      g.data.push(m);
    }
    // Aynı turnuvanın alt grupları (… · Lig A, … · Lig B) alfabetik sırayla art arda gelir
    const out = [...byLeague.values()].sort(
      (a, b) => a.priority - b.priority || a.league_name.localeCompare(b.league_name, 'tr'),
    );
    for (const g of out) {
      g.data.sort((a, b) => stateRank(a) - stateRank(b) || a.kickoff_at.localeCompare(b.kickoff_at));
    }
    return out;
  }, [matches, filter, follows, day, dayKey]);

  // Canlı çipindeki sayı seçili günle tutarlı (Bugün: tüm canlı maçlar)
  const liveCount = useMemo(
    () =>
      [...matches.values()].filter((m) => isLive(m.status_short) && (day === 0 || istanbulDayKey(m.kickoff_at) === dayKey)).length,
    [matches, day, dayKey],
  );

  return { groups, liveCount, loading, error, refreshError, reload: load };
}
