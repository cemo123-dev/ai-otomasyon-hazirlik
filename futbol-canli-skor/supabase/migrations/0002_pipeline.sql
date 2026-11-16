-- Skor+ : veri toplama (API-Football) + AI analiz pipeline'ı
--
-- ÖNCE Vault'a iki secret ekleyin (SQL Editor):
--   select vault.create_secret('https://<PROJE>.supabase.co', 'project_url');
--   select vault.create_secret('<uzun-rastgele-değer>',       'internal_secret');
-- Aynı internal_secret değerini Edge Function secret'ı olarak da verin:
--   supabase secrets set INTERNAL_SECRET=<aynı-değer>

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ─────────────────────────────────────────────── ek kolonlar
alter table public.matches
  add column if not exists home_coach text,
  add column if not exists away_coach text,
  add column if not exists top_players jsonb; -- TopPlayer[] (spotlight için)

-- ─────────────────────────────────────────────── yardımcı: Edge Function çağrısı
create or replace function public.call_edge_function(p_name text, p_body jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url');
  v_secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'internal_secret');
begin
  if v_url is null or v_secret is null then
    raise warning 'project_url / internal_secret vault secret eksik';
    return null;
  end if;
  return net.http_post(
    url := v_url || '/functions/v1/' || p_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
    body := p_body,
    timeout_milliseconds := 60000
  );
end $$;

revoke execute on function public.call_edge_function(text, jsonb) from public, anon, authenticated;

-- ─────────────────────────────────────────────── analysis_jobs INSERT → generate-analysis
create or replace function public.dispatch_analysis_job()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_edge_function('generate-analysis', jsonb_build_object('fixture_id', new.fixture_id));
  return new;
end $$;

drop trigger if exists on_analysis_job_created on public.analysis_jobs;
create trigger on_analysis_job_created
  after insert on public.analysis_jobs
  for each row execute function public.dispatch_analysis_job();

-- ─────────────────────────────────────────────── zamanlanmış veri toplama
-- API-Football kotası: live ≈ 1 + ceil(canlı maç / 20) istek/dk → günde ~2.900-4.500 istek.
-- Ücretsiz plan (100/gün) yetmez; en az "Pro" plan gerekir.
select cron.unschedule(jobid) from cron.job where jobname in ('skor-sync-live', 'skor-sync-schedule');

select cron.schedule('skor-sync-live', '* * * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"live"}'::jsonb) $$);

select cron.schedule('skor-sync-schedule', '*/30 * * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"schedule"}'::jsonb) $$);
