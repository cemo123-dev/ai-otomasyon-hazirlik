-- Skor+ : Kişiselleştirilmiş "Akıllı Alarm" (gürültüsüz bildirimler)
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).
--
-- Alarm türleri (yalnız maçı takip edenlere, kullanıcı tercihine göre):
--   pressure : futbol baskı alarmı (son ~10 dk isabetli şut + xG artışı, gol yok)
--   nba_run  : NBA seri alarmı (rakip sayı bulamadan 12+ sayılık seri)
--   red_card : kırmızı kart kırılması (+ Gemini ile kısa canlı taktik analiz, Pro)
-- Tespit sync-matches / sync-nba içinde dakikalık anlık görüntülerle yapılır
-- (ÜCRETLİ API PLANI: API_FOOTBALL_PAID=1 + dakikalık cron; aşağıdaki nota bakın).

-- ─────────────────────────────────────────────── anlık görüntüler (yalnız service_role)
create table if not exists public.match_snapshots (
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  taken_at timestamptz not null default now(),
  minute int,              -- futbol: dakika, NBA: çeyrek
  home_score int,
  away_score int,
  data jsonb,              -- futbol: isabetli şut / xG
  primary key (fixture_id, taken_at)
);
alter table public.match_snapshots enable row level security; -- politika yok

-- ─────────────────────────────────────────────── alarmlar (metin herkese açık)
create table if not exists public.match_alerts (
  id bigserial primary key,
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  kind text not null check (kind in ('pressure', 'nba_run', 'red_card')),
  side text check (side in ('home', 'away')),
  minute int,
  title text not null,
  body text not null,
  dedupe_key text not null unique,
  analysis_status text not null default 'none' check (analysis_status in ('none', 'generating', 'completed', 'failed')),
  created_at timestamptz not null default now()
);
create index if not exists match_alerts_fixture_idx on public.match_alerts (fixture_id, created_at desc);
alter table public.match_alerts enable row level security;

drop policy if exists "match_alerts: herkes okur" on public.match_alerts;
create policy "match_alerts: herkes okur"
  on public.match_alerts for select to anon, authenticated
  using (true);

-- Kırmızı kart canlı taktik analizi (yalnız aboneler)
create table if not exists public.match_alert_analyses (
  alert_id bigint primary key references public.match_alerts (id) on delete cascade,
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  payload jsonb not null,
  model text,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);
alter table public.match_alert_analyses enable row level security;

drop policy if exists "match_alert_analyses: yalnızca aktif aboneler okur" on public.match_alert_analyses;
create policy "match_alert_analyses: yalnızca aktif aboneler okur"
  on public.match_alert_analyses for select to authenticated
  using ((select public.is_premium_user()));

-- Yeni alarm → process-alert (analiz + push)
create or replace function public.dispatch_alert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_edge_function('process-alert', jsonb_build_object('alert_id', new.id));
  return new;
end $$;

revoke execute on function public.dispatch_alert() from public, anon, authenticated;

drop trigger if exists on_match_alert_created on public.match_alerts;
create trigger on_match_alert_created
  after insert on public.match_alerts
  for each row execute function public.dispatch_alert();

-- Maç ekranında alarmlar canlı akar
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'match_alerts'
  ) then
    alter publication supabase_realtime add table public.match_alerts;
  end if;
end $$;

-- ─────────────────────────────────────────────── bildirim tercihleri
-- Satır yoksa tüm türler açık sayılır
create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  halftime boolean not null default true,
  pressure boolean not null default true,
  nba_run boolean not null default true,
  red_card boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;

drop policy if exists "notification_prefs: kendi tercihini okur" on public.notification_prefs;
create policy "notification_prefs: kendi tercihini okur"
  on public.notification_prefs for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.set_notification_prefs(
  p_halftime boolean, p_pressure boolean, p_nba_run boolean, p_red_card boolean
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  insert into public.notification_prefs (user_id, halftime, pressure, nba_run, red_card, updated_at)
  values (auth.uid(), p_halftime, p_pressure, p_nba_run, p_red_card, now())
  on conflict (user_id) do update
    set halftime = excluded.halftime, pressure = excluded.pressure,
        nba_run = excluded.nba_run, red_card = excluded.red_card, updated_at = now();
end $$;

revoke execute on function public.set_notification_prefs(boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_notification_prefs(boolean, boolean, boolean, boolean) to authenticated;

-- ─────────────────────────────────────────────── NOT: ücretli planda dakikalık senkron
-- API_FOOTBALL_PAID=1 secret'ını ekledikten sonra canlı senkronları dakikalık yapın:
--   select cron.alter_job((select jobid from cron.job where jobname = 'skor-sync-live'),
--                         schedule := '* 12-22 * * *');
--   select cron.alter_job((select jobid from cron.job where jobname = 'nba-sync-live'),
--                         schedule := '* 23,0-6 * * *');
