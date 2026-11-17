-- Skor+ : Maç öncesi "Taktiksel Eşleşme & Kırılma Senaryosu" (Pre-Match AI)
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).
--
-- Akış: Pro kullanıcı ilk 11'ler açıklandıktan sonra (başlamaya ≤ 45 dk)
-- request_match_preview RPC'sini çağırır → singleflight → preview_jobs INSERT
-- → tetikleyici → generate-preview Edge Function (maç başına 1 Gemini çağrısı).

-- ─────────────────────────────────────────────── matches: önizleme durumu + kadro
alter table public.matches
  add column if not exists preview_status text not null default 'none',
  add column if not exists preview_requested_at timestamptz,
  add column if not exists preview_attempts int not null default 0,
  add column if not exists lineups jsonb; -- { home: {formation, coach, xi:[{name,pos,grid}]}, away: {...} }

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_preview_status_check') then
    alter table public.matches add constraint matches_preview_status_check
      check (preview_status in ('none', 'generating', 'completed', 'failed'));
  end if;
end $$;

-- ─────────────────────────────────────────────── oyuncu-maç istatistikleri (form hafızası)
-- Biten maçların detayı zaten çekiliyor; tüm oyuncular burada saklanır.
-- Ücretsiz planda "son 5 maç" formu buradan hesaplanır (ek API isteği yok).
create table if not exists public.player_match_stats (
  fixture_id bigint not null,
  player_id int not null,
  team_id int,
  team_name text not null,
  name text not null,
  position text,
  kickoff_at timestamptz not null,
  started boolean not null default false,
  minutes int not null default 0,
  rating numeric,
  duels_total int not null default 0,
  duels_won int not null default 0,
  dribbles_att int not null default 0,
  dribbles_succ int not null default 0,
  dribbled_past int not null default 0,
  tackles int not null default 0,
  interceptions int not null default 0,
  key_passes int not null default 0,
  shots int not null default 0,
  goals int not null default 0,
  assists int not null default 0,
  primary key (fixture_id, player_id)
);

create index if not exists player_match_stats_player_idx on public.player_match_stats (player_id, kickoff_at desc);
create index if not exists player_match_stats_team_idx on public.player_match_stats (team_id, kickoff_at desc);
alter table public.player_match_stats enable row level security; -- politika yok: yalnızca service_role

-- ─────────────────────────────────────────────── match_previews
create table if not exists public.match_previews (
  fixture_id bigint primary key references public.matches (fixture_id) on delete cascade,
  preview_payload jsonb not null,
  model text,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

alter table public.match_previews enable row level security;

drop policy if exists "match_previews: yalnızca aktif aboneler okur" on public.match_previews;
create policy "match_previews: yalnızca aktif aboneler okur"
  on public.match_previews for select to authenticated
  using ((select public.is_premium_user()));

-- ─────────────────────────────────────────────── preview_jobs (kuyruk)
create table if not exists public.preview_jobs (
  id bigserial primary key,
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists preview_jobs_fixture_idx on public.preview_jobs (fixture_id);
alter table public.preview_jobs enable row level security;

create or replace function public.dispatch_preview_job()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_edge_function('generate-preview', jsonb_build_object('fixture_id', new.fixture_id));
  return new;
end $$;

revoke execute on function public.dispatch_preview_job() from public, anon, authenticated;

drop trigger if exists on_preview_job_created on public.preview_jobs;
create trigger on_preview_job_created
  after insert on public.preview_jobs
  for each row execute function public.dispatch_preview_job();

-- ─────────────────────────────────────────────── RPC: request_match_preview
-- Dönüş: 'unauthenticated' | 'not_found' | 'not_supported' (NBA) | 'not_prematch' (başladı/bitti)
--        | 'too_early' (ilk 11 henüz yok) | 'paywall_blocked' | 'completed' | 'generating' | 'failed'
create or replace function public.request_match_preview(p_fixture_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_sport text;
  v_status text;
  v_kickoff timestamptz;
  v_preview text;
  v_claimed bigint;
begin
  if auth.uid() is null then
    return 'unauthenticated';
  end if;

  select sport_type, status_short, kickoff_at, preview_status
    into v_sport, v_status, v_kickoff, v_preview
    from public.matches where fixture_id = p_fixture_id;
  if not found then
    return 'not_found';
  end if;
  if v_sport <> 'football' then
    return 'not_supported'; -- API-NBA ilk 5 vermiyor
  end if;
  if v_preview = 'completed' then
    -- Maç başlasa bile hazır önizleme Pro kullanıcıya gösterilir
    if not public.is_premium_user() then return 'paywall_blocked'; end if;
    return 'completed';
  end if;
  if v_status <> 'NS' then
    return 'not_prematch';
  end if;
  if v_kickoff > now() + interval '45 minutes' then
    return 'too_early'; -- ilk 11'ler genelde başlamadan 20-40 dk önce açıklanır
  end if;
  if not public.is_premium_user() then
    return 'paywall_blocked';
  end if;

  update public.matches
     set preview_status = 'generating',
         preview_requested_at = now(),
         preview_attempts = preview_attempts + 1
   where fixture_id = p_fixture_id
     and (
       preview_status = 'none'
       or (preview_status = 'failed' and preview_attempts < 4)
       or (preview_status = 'generating' and preview_requested_at < now() - interval '3 minutes')
     )
  returning fixture_id into v_claimed;

  if v_claimed is not null then
    insert into public.preview_jobs (fixture_id) values (p_fixture_id);
    return 'generating';
  end if;

  select preview_status into v_preview from public.matches where fixture_id = p_fixture_id;
  return case v_preview when 'completed' then 'completed' when 'generating' then 'generating' else 'failed' end;
end $$;

revoke execute on function public.request_match_preview(bigint) from public, anon;
grant execute on function public.request_match_preview(bigint) to authenticated;
