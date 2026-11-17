-- Skor+ : uygulama yapılandırması — API planına bağlı davranışlar
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).
--
-- Ücretli API-Sports planına geçince (API_FOOTBALL_PAID=1 secret'ı ile birlikte) çalıştırın:
--   update public.app_config set value = 'true'::jsonb where key = 'api_paid';

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security; -- politika yok: yalnız SQL Editor / service_role

insert into public.app_config (key, value) values ('api_paid', 'false'::jsonb) on conflict (key) do nothing;

create or replace function public.api_paid()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (value)::boolean from public.app_config where key = 'api_paid'), false);
$$;
revoke execute on function public.api_paid() from public, anon, authenticated;

-- ─────────────────────────────────────────────── request_halftime_report: devre arası penceresi
-- Ücretsiz planda senkron 30 dk'da bir olduğundan durum eski olabilir: başlangıçtan 45-75 dk
-- sonrası da denenir (fonksiyon gerçek durumu API'den doğrular).
-- Ücretli planda senkron dakikalık: yalnız veritabanındaki HT durumu geçerli (gereksiz API isteği yok).
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
    if not public.is_premium_user() then return 'paywall_blocked'; end if;
    return 'completed';
  end if;
  if v_ht = 'generating' then
    if not public.is_premium_user() then return 'paywall_blocked'; end if;
    return 'generating';
  end if;

  if not (v_status = 'HT'
          or (not public.api_paid()
              and v_status in ('1H', 'NS')
              and now() between v_kickoff + interval '45 minutes' and v_kickoff + interval '75 minutes')) then
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
