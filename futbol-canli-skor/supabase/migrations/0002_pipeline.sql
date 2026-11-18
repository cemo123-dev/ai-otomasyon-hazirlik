-- Skor+ : veri toplama (API-Football) + AI analiz pipeline'ı
--
-- Edge Function'lar ile veritabanı arasındaki paylaşılan anahtar (internal_secret)
-- Vault'ta RASTGELE üretilir; kimse elle girmez. Fonksiyonlar gelen isteği
-- check_internal_secret() RPC'si ile doğrular.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ─────────────────────────────────────────────── ek kolonlar
alter table public.matches
  add column if not exists home_coach text,
  add column if not exists away_coach text,
  add column if not exists top_players jsonb; -- TopPlayer[] (spotlight için)

-- ─────────────────────────────────────────────── Vault: proje URL'si + rastgele iç anahtar
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'project_url') then
    perform vault.create_secret('https://hcihjovckgojhtoemkpc.supabase.co', 'project_url');
  end if;
  if not exists (select 1 from vault.secrets where name = 'internal_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'internal_secret');
  end if;
end $$;

-- Edge Function'lar (service_role) gelen x-internal-secret başlığını bununla doğrular
create or replace function public.check_internal_secret(p_secret text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select decrypted_secret = p_secret from vault.decrypted_secrets where name = 'internal_secret'),
    false);
$$;

revoke execute on function public.check_internal_secret(text) from public, anon, authenticated;
grant execute on function public.check_internal_secret(text) to service_role;

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

revoke execute on function public.dispatch_analysis_job() from public, anon, authenticated;

drop trigger if exists on_analysis_job_created on public.analysis_jobs;
create trigger on_analysis_job_created
  after insert on public.analysis_jobs
  for each row execute function public.dispatch_analysis_job();

-- ─────────────────────────────────────────────── zamanlanmış veri toplama
-- ŞU AN: API-Football ÜCRETSİZ plan (100 istek/gün) için ayarlı:
--   canlı senkron 30 dakikada bir (~48 istek/gün + canlı maç detayları)
--   fikstür günde 2 kez (~4 istek/gün)
-- Ücretli geçiş: yalnız 0018 prosedürü (docs/ucretli-gecis.md; 0019 gerekir); nba-sync-live'a dokunmayın.
select cron.unschedule(jobid) from cron.job where jobname in ('skor-sync-live', 'skor-sync-schedule');

select cron.schedule('skor-sync-live', '*/30 * * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"live"}'::jsonb) $$);

select cron.schedule('skor-sync-schedule', '0 5,13 * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"schedule"}'::jsonb) $$);
