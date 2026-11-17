-- Skor+ : takım logoları, takım takibi ve "maç başladı" bildirimi
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).

-- ─────────────────────────────────────────────── takım kimliği ve logo
-- Senkron (sync-matches / sync-nba) her güncellemede doldurur; eski satırlar
-- bir sonraki fikstür senkronunda (günlük) dolar.
alter table public.matches
  add column if not exists home_team_id bigint,
  add column if not exists away_team_id bigint,
  add column if not exists home_logo text,
  add column if not exists away_logo text;

create index if not exists matches_home_team_idx on public.matches (sport_type, home_team_id);
create index if not exists matches_away_team_idx on public.matches (sport_type, away_team_id);

-- ─────────────────────────────────────────────── takım takibi
create table if not exists public.team_follows (
  user_id uuid not null references auth.users (id) on delete cascade,
  sport_type text not null check (sport_type in ('football', 'nba')),
  team_id bigint not null,
  team_name text not null,
  team_logo text,
  created_at timestamptz not null default now(),
  primary key (user_id, sport_type, team_id)
);
create index if not exists team_follows_team_idx on public.team_follows (sport_type, team_id);
alter table public.team_follows enable row level security;

drop policy if exists "team_follows: kendi takiplerini okur" on public.team_follows;
create policy "team_follows: kendi takiplerini okur"
  on public.team_follows for select to authenticated
  using (user_id = (select auth.uid()));

/**
 * Takımı takip et / bırak. Takip edilince takımın önümüzdeki maçları da
 * maç takibine eklenir (devre arası raporu ve akıllı alarmlar için).
 * Dönüş: yeni durum (true = takipte)
 */
create or replace function public.toggle_team_follow(p_sport text, p_team_id bigint, p_team_name text, p_team_logo text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if p_sport not in ('football', 'nba') or p_team_id is null then
    raise exception 'invalid';
  end if;
  delete from public.team_follows where user_id = auth.uid() and sport_type = p_sport and team_id = p_team_id;
  if found then
    return false;
  end if;
  insert into public.team_follows (user_id, sport_type, team_id, team_name, team_logo)
  values (auth.uid(), p_sport, p_team_id, left(p_team_name, 80), left(p_team_logo, 300));
  -- Başlamamış maçları otomatik takibe al
  insert into public.match_follows (user_id, fixture_id)
  select auth.uid(), m.fixture_id from public.matches m
   where m.sport_type = p_sport and m.status_short = 'NS'
     and (m.home_team_id = p_team_id or m.away_team_id = p_team_id)
  on conflict do nothing;
  return true;
end $$;

revoke execute on function public.toggle_team_follow(text, bigint, text, text) from public, anon;
grant execute on function public.toggle_team_follow(text, bigint, text, text) to authenticated;

/**
 * Senkron yeni fikstür eklediğinde: takımı takip edenleri maça otomatik bağlar.
 * Yalnız service_role (sync-matches / sync-nba) çağırır.
 */
create or replace function public.follow_team_fixtures(p_fixture_ids bigint[])
returns int language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  insert into public.match_follows (user_id, fixture_id)
  select tf.user_id, m.fixture_id
    from public.matches m
    join public.team_follows tf
      on tf.sport_type = m.sport_type and tf.team_id in (m.home_team_id, m.away_team_id)
   where m.fixture_id = any (p_fixture_ids) and m.status_short = 'NS'
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.follow_team_fixtures(bigint[]) from public, anon, authenticated;
grant execute on function public.follow_team_fixtures(bigint[]) to service_role;

-- ─────────────────────────────────────────────── "maç başladı" bildirimi
alter table public.matches add column if not exists kickoff_notified boolean not null default false;

alter table public.notification_prefs add column if not exists kickoff boolean not null default true;

-- Tercih RPC'si yeni kolonla (eski 4 parametreli sürüm kaldırılır)
drop function if exists public.set_notification_prefs(boolean, boolean, boolean, boolean);
create or replace function public.set_notification_prefs(
  p_halftime boolean, p_pressure boolean, p_nba_run boolean, p_red_card boolean, p_kickoff boolean
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  insert into public.notification_prefs (user_id, halftime, pressure, nba_run, red_card, kickoff, updated_at)
  values (auth.uid(), p_halftime, p_pressure, p_nba_run, p_red_card, p_kickoff, now())
  on conflict (user_id) do update
    set halftime = excluded.halftime, pressure = excluded.pressure, nba_run = excluded.nba_run,
        red_card = excluded.red_card, kickoff = excluded.kickoff, updated_at = now();
end $$;

revoke execute on function public.set_notification_prefs(boolean, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_notification_prefs(boolean, boolean, boolean, boolean, boolean) to authenticated;
