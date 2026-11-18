-- Skor+ : NBA desteği (tek veritabanı, çoklu spor)
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).

-- ─────────────────────────────────────────────── çoklu spor kolonları
alter table public.matches
  add column if not exists sport_type text not null default 'football',
  add column if not exists period_scores jsonb,   -- NBA: { home: number[], away: number[] } (çeyrek + uzatma)
  add column if not exists status_detail text;    -- NBA: "Q3 04:12", "Devre Arası", "Maç Sonu"

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_sport_type_check') then
    alter table public.matches add constraint matches_sport_type_check check (sport_type in ('football', 'nba'));
  end if;
end $$;

create index if not exists matches_sport_kickoff_idx on public.matches (sport_type, kickoff_at);

-- ─────────────────────────────────────────────── analiz işine spor türünü ekle
-- request_match_analysis (singleflight) değişmez: işi analysis_jobs'a yazar.
-- Tetikleyici, Edge Function'a giden JSON yüküne sport_type'ı ekler.
create or replace function public.dispatch_analysis_job()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_sport text := (select sport_type from public.matches where fixture_id = new.fixture_id);
begin
  perform public.call_edge_function(
    'generate-analysis',
    jsonb_build_object('fixture_id', new.fixture_id, 'sport_type', coalesce(v_sport, 'football'))
  );
  return new;
end $$;

revoke execute on function public.dispatch_analysis_job() from public, anon, authenticated;

-- ─────────────────────────────────────────────── NBA zamanlanmış senkron
-- Maç saatleri TSİ 02:00-09:30 = UTC 23:00-06:30 (pg_cron UTC çalışır).
-- API-NBA ücretsiz plan (100 istek/gün) için 15 dakikada bir. Ücretli geçiş: yalnız 0018 prosedürü (docs/ucretli-gecis.md; 0019 gerekir); nba-sync-live'a dokunmayın.
select cron.unschedule(jobid) from cron.job where jobname in ('nba-sync-live', 'nba-sync-schedule');

select cron.schedule('nba-sync-live', '*/15 23,0-6 * * *',
  $$ select public.call_edge_function('sync-nba', '{"mode":"live"}'::jsonb) $$);

-- Fikstür günde 2 kez (TSİ 15:00 ve 23:00)
select cron.schedule('nba-sync-schedule', '0 12,20 * * *',
  $$ select public.call_edge_function('sync-nba', '{"mode":"schedule"}'::jsonb) $$);
