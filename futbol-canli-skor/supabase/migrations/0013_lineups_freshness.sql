-- Skor+ : kadro/diziliş + maç sonu oyuncu puanları + veri tazeliği ("Son güncelleme HH:MM")
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).
-- Önerilen sıra: bu dosya → npm run deploy:functions → npm run update:apk.
-- Sıra bozulursa senkron DURMAZ: kadro/puan ana upsert'te değil, ayrı update ile yazılır ve
-- kolon yoksa (PGRST204/42703) uyarıyla atlanır; yalnız bu dosya çalışana kadar kadro gelmez.

-- ─────────────────────────────────────────────── kadro ve oyuncu puanları
-- NEDEN YENİ KOLON: matches.lineups (0005_prematch.sql) maç önü AI'nın kendi formatıdır
-- ({formation, coach, xi:[{name,pos}]}) ve generate-preview tarafından yazılır. İki ayrı yazarın
-- aynı kolonu farklı biçimlerle ezmemesi için tam kadro ayrı kolonda tutulur.
--   lineup_detail : { home: {team_id, formation, coach, start_xi:[{id,name,number,pos,grid}], substitutes:[...]}, away: {...} }
--   player_ratings: [{ id, name, team:'home'|'away', number, pos, rating, minutes, goals, assists }] (puana göre azalan)
-- Kaynak: /fixtures?id= yanıtı (mevcut detay çekimi) — ek API isteği yok.
alter table public.matches
  add column if not exists lineup_detail jsonb,
  add column if not exists player_ratings jsonb;

-- ─────────────────────────────────────────────── veri tazeliği
-- updated_at 0001_init.sql'de var ama hiçbir yazar güncellemiyordu. Senkron fonksiyonları artık
-- her yazımda updated_at'i açıkça verir (skor değişmese de "kaynak şu an kontrol edildi").
-- Tetikleyici yedektir: updated_at verilmeden veri alanlarından biri değişirse damgalar.
-- AI / bildirim durum güncellemeleri (analysis_status, halftime_*, kickoff_notified ...) tazelik SAYILMAZ.
alter table public.matches add column if not exists updated_at timestamptz not null default now();

create or replace function public.matches_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.updated_at is distinct from old.updated_at then
    return new; -- yazan (senkron) açıkça verdi
  end if;
  if (new.home_score, new.away_score, new.status_short, new.elapsed_minute, new.status_detail,
      new.period_scores, new.events, new.stats, new.lineup_detail, new.player_ratings)
     is distinct from
     (old.home_score, old.away_score, old.status_short, old.elapsed_minute, old.status_detail,
      old.period_scores, old.events, old.stats, old.lineup_detail, old.player_ratings) then
    new.updated_at := now();
  end if;
  return new;
end $$;
revoke execute on function public.matches_touch_updated_at() from public, anon, authenticated;

drop trigger if exists matches_touch_updated_at on public.matches;
create trigger matches_touch_updated_at
  before update on public.matches
  for each row execute function public.matches_touch_updated_at();
