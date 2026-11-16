-- Skor+ — Supabase SQL Editor'e TEK SEFERDE yapıştırıp Run'a basın.
-- (0001_init.sql + 0002_pipeline.sql birleşimi; gizli değer içermez.)

-- Skor+ : temel şema, RLS, singleflight analiz RPC'si ve Realtime
-- İstemci yalnızca bu tabloları okur ve RPC'leri çağırır. Yazma işlemleri
-- service_role (veri toplama worker'ı + AI Edge Function) ile yapılır.

-- ─────────────────────────────────────────────────────────── profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_premium boolean not null default false,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: kendi kaydını okur"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
-- Bilinçli olarak UPDATE politikası YOK: is_premium'u istemci değiştiremez.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_premium_user()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.is_premium and (p.subscription_expires_at is null or p.subscription_expires_at > now())
       from public.profiles p where p.id = auth.uid()),
    false);
$$;

-- ─────────────────────────────────────────────────────────── matches
create table if not exists public.matches (
  fixture_id bigint primary key,
  league_id int,
  league_name text not null,
  league_country text,
  league_priority int not null default 99,
  kickoff_at timestamptz not null,
  home_team text not null,
  away_team text not null,
  home_score int,
  away_score int,
  status_short text not null default 'NS',
  elapsed_minute int,
  -- Maç sonunda worker tarafından ŞABLONLA (0 token) yazılan ücretsiz özet
  summary_teaser text,
  analysis_status text not null default 'none'
    check (analysis_status in ('none', 'generating', 'completed', 'failed')),
  analysis_requested_at timestamptz,
  analysis_attempts int not null default 0,
  events jsonb,  -- MatchEvent[]
  stats jsonb,   -- { home: TeamStats, away: TeamStats }
  updated_at timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on public.matches (kickoff_at);

alter table public.matches enable row level security;

-- Canlı skor listesi herkese ücretsiz (giriş yapmamış kullanıcı dahil)
create policy "matches: herkes okur"
  on public.matches for select to anon, authenticated
  using (true);

-- Realtime: skor / dakika / analysis_status değişiklikleri istemciye akar
alter publication supabase_realtime add table public.matches;

-- ─────────────────────────────────────────────────────────── match_analyses
create table if not exists public.match_analyses (
  fixture_id bigint primary key references public.matches (fixture_id) on delete cascade,
  tactical_payload jsonb not null,
  model text,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

alter table public.match_analyses enable row level security;

create policy "match_analyses: yalnızca aktif aboneler okur"
  on public.match_analyses for select to authenticated
  using ((select public.is_premium_user()));

-- ─────────────────────────────────────────────────────────── analysis_jobs (kuyruk)
-- Bir INSERT, tetikleyici (0002_pipeline.sql) ile "generate-analysis" Edge Function'ını tetikler.
create table if not exists public.analysis_jobs (
  id bigserial primary key,
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists analysis_jobs_fixture_idx on public.analysis_jobs (fixture_id);
alter table public.analysis_jobs enable row level security; -- politika yok: yalnızca service_role

-- ─────────────────────────────────────────────────────────── RPC: request_match_analysis
-- Singleflight: aynı maç için kaç kullanıcı isterse istesin LLM yalnızca BİR KEZ çağrılır.
-- Dönüş: 'unauthenticated' | 'not_found' | 'not_finished' | 'paywall_blocked'
--        | 'completed' | 'generating' | 'failed'
create or replace function public.request_match_analysis(p_fixture_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_match_status text;
  v_status text;
  v_claimed bigint;
begin
  if auth.uid() is null then
    return 'unauthenticated';
  end if;

  select status_short, analysis_status into v_match_status, v_status
    from public.matches where fixture_id = p_fixture_id;
  if not found then
    return 'not_found';
  end if;
  if v_match_status not in ('FT', 'AET', 'PEN') then
    return 'not_finished';
  end if;
  if not public.is_premium_user() then
    return 'paywall_blocked';
  end if;
  if v_status = 'completed' then
    return 'completed';
  end if;

  -- Atomik sahiplenme: eşzamanlı ikinci UPDATE satır kilidini bekler, sonra
  -- WHERE koşulunu yeniden değerlendirir ve eşleşmez → ikinci üretim başlamaz.
  update public.matches
     set analysis_status = 'generating',
         analysis_requested_at = now(),
         analysis_attempts = analysis_attempts + 1
   where fixture_id = p_fixture_id
     and (
       analysis_status = 'none'
       or (analysis_status = 'failed' and analysis_attempts < 3)
       -- Takılı kalmış üretimi 3 dk sonra yeniden dene
       or (analysis_status = 'generating' and analysis_requested_at < now() - interval '3 minutes')
     )
  returning fixture_id into v_claimed;

  if v_claimed is not null then
    insert into public.analysis_jobs (fixture_id) values (p_fixture_id);
    return 'generating';
  end if;

  select analysis_status into v_status from public.matches where fixture_id = p_fixture_id;
  return case v_status when 'completed' then 'completed' when 'generating' then 'generating' else 'failed' end;
end $$;

-- ─────────────────────────────────────────────────────────── RPC: simulate_subscription
-- !!! YALNIZCA TEST İÇİN. Yayına çıkmadan önce DROP edin ve aboneliği
-- App Store / Play Store (ör. RevenueCat webhook → service_role) üzerinden yönetin.
create or replace function public.simulate_subscription(p_plan text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if p_plan is not null and p_plan not in ('monthly', 'yearly') then
    raise exception 'invalid plan';
  end if;

  insert into public.profiles (id, is_premium, subscription_expires_at)
  values (
    auth.uid(),
    p_plan is not null,
    case p_plan when 'monthly' then now() + interval '1 month'
                when 'yearly'  then now() + interval '1 year' end
  )
  on conflict (id) do update
    set is_premium = excluded.is_premium,
        subscription_expires_at = excluded.subscription_expires_at;

  return public.is_premium_user();
end $$;

-- ─────────────────────────────────────────────────────────── yetkiler
revoke execute on function public.request_match_analysis(bigint) from public, anon;
revoke execute on function public.simulate_subscription(text) from public, anon;
revoke execute on function public.is_premium_user() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.request_match_analysis(bigint) to authenticated;
grant execute on function public.simulate_subscription(text) to authenticated;
grant execute on function public.is_premium_user() to authenticated;

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
-- Ücretli plana geçince gerçek canlı akış için:
--   select cron.alter_job((select jobid from cron.job where jobname = 'skor-sync-live'), schedule := '* * * * *');
select cron.unschedule(jobid) from cron.job where jobname in ('skor-sync-live', 'skor-sync-schedule');

select cron.schedule('skor-sync-live', '*/30 * * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"live"}'::jsonb) $$);

select cron.schedule('skor-sync-schedule', '0 5,13 * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"schedule"}'::jsonb) $$);
