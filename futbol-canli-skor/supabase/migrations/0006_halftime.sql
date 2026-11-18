-- Skor+ : Canlı Devre Arası "Soyunma Odası Reçetesi" + maç takibi + push bildirimi
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).
--
-- İki tetikleme yolu (aynı singleflight kilidi):
--   1) Otomatik: sync-matches canlı senkronu bir maçı HT'de görünce işi kuyruğa atar.
--      Ücretli planda cron dakikalık olduğundan HT ~1 dk içinde yakalanır (aşağıdaki nota bakın).
--   2) Talep üzerine: Pro kullanıcı devre arasında AI sekmesini açınca request_halftime_report.
-- generate-halftime raporu üretir ve maçı takip edenlere push bildirimi gönderir.

-- ─────────────────────────────────────────────── matches: devre arası durumu
alter table public.matches
  add column if not exists halftime_status text not null default 'none',
  add column if not exists halftime_requested_at timestamptz,
  add column if not exists halftime_attempts int not null default 0,
  add column if not exists halftime_teaser text; -- ücretsiz tek cümle (push metniyle aynı, 0 token)

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_halftime_status_check') then
    alter table public.matches add constraint matches_halftime_status_check
      check (halftime_status in ('none', 'generating', 'completed', 'failed'));
  end if;
end $$;

-- ─────────────────────────────────────────────── rapor tablosu (yalnız aboneler)
create table if not exists public.match_halftime_reports (
  fixture_id bigint primary key references public.matches (fixture_id) on delete cascade,
  report_payload jsonb not null,
  model text,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

alter table public.match_halftime_reports enable row level security;

drop policy if exists "match_halftime_reports: yalnızca aktif aboneler okur" on public.match_halftime_reports;
create policy "match_halftime_reports: yalnızca aktif aboneler okur"
  on public.match_halftime_reports for select to authenticated
  using ((select public.is_premium_user()));

-- ─────────────────────────────────────────────── kuyruk + tetikleyici
create table if not exists public.halftime_jobs (
  id bigserial primary key,
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists halftime_jobs_fixture_idx on public.halftime_jobs (fixture_id);
alter table public.halftime_jobs enable row level security;

create or replace function public.dispatch_halftime_job()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_edge_function('generate-halftime', jsonb_build_object('fixture_id', new.fixture_id));
  return new;
end $$;

revoke execute on function public.dispatch_halftime_job() from public, anon, authenticated;

drop trigger if exists on_halftime_job_created on public.halftime_jobs;
create trigger on_halftime_job_created
  after insert on public.halftime_jobs
  for each row execute function public.dispatch_halftime_job();

/**
 * Singleflight sahiplenme: ilk çağıran işi kuyruğa atar, diğerleri bekler.
 * Hem RPC hem sync-matches (service_role) kullanır.
 */
create or replace function public.claim_halftime_job(p_fixture_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_claimed bigint;
begin
  update public.matches
     set halftime_status = 'generating',
         halftime_requested_at = now(),
         halftime_attempts = halftime_attempts + 1
   where fixture_id = p_fixture_id
     and sport_type = 'football'
     and (
       -- "İlk yarı henüz bitmedi" sonrası 'none'a dönen maçlar en fazla dakikada bir denenir (kota)
       (halftime_status = 'none' and (halftime_requested_at is null or halftime_requested_at < now() - interval '1 minute'))
       or (halftime_status = 'failed' and halftime_attempts < 4 and halftime_requested_at < now() - interval '1 minute')
       or (halftime_status = 'generating' and halftime_requested_at < now() - interval '3 minutes')
     )
  returning fixture_id into v_claimed;
  if v_claimed is null then
    return false;
  end if;
  insert into public.halftime_jobs (fixture_id) values (p_fixture_id);
  return true;
end $$;

revoke execute on function public.claim_halftime_job(bigint) from public, anon, authenticated;
grant execute on function public.claim_halftime_job(bigint) to service_role;

-- ─────────────────────────────────────────────── RPC: request_halftime_report
-- Dönüş: 'unauthenticated' | 'not_found' | 'not_supported' | 'not_halftime'
--        | 'paywall_blocked' | 'completed' | 'generating' | 'failed'
create or replace function public.request_halftime_report(p_fixture_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_sport text;
  v_status text;
  v_kickoff timestamptz;
  v_ht text;
begin
  if auth.uid() is null then
    return 'unauthenticated';
  end if;

  select sport_type, status_short, kickoff_at, halftime_status
    into v_sport, v_status, v_kickoff, v_ht
    from public.matches where fixture_id = p_fixture_id;
  if not found then
    return 'not_found';
  end if;
  if v_sport <> 'football' then
    return 'not_supported';
  end if;
  if v_ht = 'completed' then
    -- Hazır rapor maç boyunca ve sonrasında Pro kullanıcıya gösterilir
    if not public.is_premium_user() then return 'paywall_blocked'; end if;
    return 'completed';
  end if;
  if v_ht = 'generating' then
    if not public.is_premium_user() then return 'paywall_blocked'; end if;
    return 'generating';
  end if;

  -- Veritabanı HT diyorsa ya da (ücretsiz planda senkron 30 dk'da bir olduğundan) durum eski
  -- olabileceği için başlangıçtan 45-75 dk sonrasındaysa denenir; gerçek durumu fonksiyon
  -- API'den doğrular ve devre arası değilse 'failed' döner.
  if not (v_status = 'HT'
          or (v_status in ('1H', 'NS') and now() between v_kickoff + interval '45 minutes' and v_kickoff + interval '75 minutes')) then
    return 'not_halftime';
  end if;
  if not public.is_premium_user() then
    return 'paywall_blocked';
  end if;

  if public.claim_halftime_job(p_fixture_id) then
    return 'generating';
  end if;
  select halftime_status into v_ht from public.matches where fixture_id = p_fixture_id;
  return case v_ht when 'completed' then 'completed' when 'generating' then 'generating' else 'failed' end;
end $$;

revoke execute on function public.request_halftime_report(bigint) from public, anon;
grant execute on function public.request_halftime_report(bigint) to authenticated;

-- ─────────────────────────────────────────────── maç takibi
create table if not exists public.match_follows (
  user_id uuid not null references auth.users (id) on delete cascade,
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, fixture_id)
);
create index if not exists match_follows_fixture_idx on public.match_follows (fixture_id);
alter table public.match_follows enable row level security;

drop policy if exists "match_follows: kendi takiplerini okur" on public.match_follows;
create policy "match_follows: kendi takiplerini okur"
  on public.match_follows for select to authenticated
  using (user_id = (select auth.uid()));

/** Takip et / bırak. Dönüş: yeni durum (true = takipte) */
create or replace function public.toggle_follow(p_fixture_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  delete from public.match_follows where user_id = auth.uid() and fixture_id = p_fixture_id;
  if found then
    return false;
  end if;
  insert into public.match_follows (user_id, fixture_id) values (auth.uid(), p_fixture_id);
  return true;
end $$;

revoke execute on function public.toggle_follow(bigint) from public, anon;
grant execute on function public.toggle_follow(bigint) to authenticated;

-- ─────────────────────────────────────────────── push token'ları
create table if not exists public.push_tokens (
  token text primary key, -- ExponentPushToken[...]
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security; -- politika yok: yazma RPC ile, okuma service_role

/** Cihaz token'ını oturumdaki kullanıcıya bağlar (cihaz el değiştirirse sahibi güncellenir) */
create or replace function public.register_push_token(p_token text, p_platform text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[.+\]$' then
    raise exception 'invalid token';
  end if;
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end $$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

-- ─────────────────────────────────────────────── NOT: ücretli planda dakikalık HT tespiti
-- Ücretli geçiş: yalnız 0018 prosedürü (docs/ucretli-gecis.md; 0019 gerekir); nba-sync-live'a dokunmayın.
