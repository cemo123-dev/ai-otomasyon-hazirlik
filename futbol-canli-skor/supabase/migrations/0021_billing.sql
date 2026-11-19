-- Skor+ : P2 RevenueCat + Google Play Billing — webhook olay kaydı (idempotency) ve Pro durumu yazımı
-- (docs/inovasyon-onerileri.md §0.5/§0.6, GELISTIRMELER 3.38).
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0001 (profiles, is_premium_user) ve
-- 0009 (pg_cron) gerekir; 0010–0020'ye bağımlı değil. API-Sports kotası: 0.
-- Sıra: önce bu dosya, sonra `revenuecat-webhook` Edge Function deploy'u (fonksiyon `apply_billing_event` RPC'sini
-- çağırır; RPC yoksa 500 döner ve RevenueCat olayı sonra yeniden dener — olay kaybolmaz).
-- Yazma yalnız service_role (Edge Function) ile: istemci tabloyu okuyamaz, RPC'yi çağıramaz; profiles'ta
-- UPDATE politikası hâlâ yok (0001), is_premium'u istemci değiştiremez.
-- KVKK: olay kaydında yalnız olay kimliği/türü, ürün, ortam (SANDBOX/PRODUCTION), zaman ve hesap kimliği; ödeme
-- bilgisi, fiyat, e-posta yok. 400 gün sonra silinir; hesap silinince user_id boşalır (idempotency için olay kalır).

-- ─────────────────────────────────────────────── 1) profiles: sıra dışı (eski) olay koruması
alter table public.profiles add column if not exists billing_event_at timestamptz;

-- ─────────────────────────────────────────────── 2) olay kaydı (RevenueCat event.id başına tek satır)
create table if not exists public.billing_events (
  event_id text primary key,
  type text not null,
  environment text,
  product_id text,
  event_at timestamptz not null,
  user_id uuid references auth.users (id) on delete set null,
  ignored text,                                           -- yok sayma sebebi (info, other_entitlement, no_user…)
  applied int not null default 0,                         -- güncellenen profil sayısı
  received_at timestamptz not null default now()
);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'billing_events_id_len') then
    alter table public.billing_events add constraint billing_events_id_len
      check (char_length(event_id) between 1 and 200);
  end if;
end $$;
create index if not exists billing_events_user_idx on public.billing_events (user_id, event_at);
create index if not exists billing_events_received_idx on public.billing_events (received_at);
alter table public.billing_events enable row level security; -- politika yok
revoke all on table public.billing_events from public, anon, authenticated;
grant select, insert, update, delete on table public.billing_events to service_role;

-- ─────────────────────────────────────────────── 3) tek işlemde: olay kaydı + profil güncellemesi
-- p_actions: [{ "kind": "grant" | "revoke", "user_id": "<uuid>", "expires_at": "<iso>" }]
-- Dönüş: 'ok' | 'duplicate' (aynı olay daha önce işlendi; hiçbir şey yazılmaz) | 'invalid'.
-- Olay zamanı profilin son işlenen olayından eskiyse profil değişmez (RevenueCat sırayı garanti etmez).
create or replace function public.apply_billing_event(
  p_event_id text,
  p_type text,
  p_event_at timestamptz,
  p_environment text,
  p_product_id text,
  p_actions jsonb,
  p_ignored text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_actions jsonb := coalesce(p_actions, '[]'::jsonb);
  v_action jsonb;
  v_uid uuid;
  v_primary uuid;
  v_exp timestamptz;
  v_rows int;
  v_applied int := 0;
begin
  if p_event_id is null or char_length(p_event_id) not between 1 and 200
     or p_type is null or char_length(p_type) > 64 or p_event_at is null
     or jsonb_typeof(v_actions) <> 'array' then
    return 'invalid';
  end if;
  -- Eylemleri baştan doğrula: geçersiz kimlik / tür / tarih varsa hiçbir şey yazılmaz
  for v_action in select value from jsonb_array_elements(v_actions) loop
    if coalesce(v_action->>'kind', '') not in ('grant', 'revoke')
       or coalesce(v_action->>'user_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(v_action->>'expires_at', '') = '' then
      return 'invalid';
    end if;
  end loop;

  select u.id into v_primary from auth.users u where u.id = (v_actions->0->>'user_id')::uuid;

  insert into public.billing_events (event_id, type, environment, product_id, event_at, user_id, ignored)
  values (p_event_id, upper(p_type), left(p_environment, 32), left(p_product_id, 200), p_event_at, v_primary, left(p_ignored, 64))
  on conflict (event_id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  for v_action in select value from jsonb_array_elements(v_actions) loop
    v_uid := (v_action->>'user_id')::uuid;
    v_exp := (v_action->>'expires_at')::timestamptz;
    continue when not exists (select 1 from auth.users u where u.id = v_uid);  -- silinmiş hesap
    insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
    update public.profiles p
       set is_premium = (v_action->>'kind') = 'grant',
           subscription_expires_at = v_exp,
           billing_event_at = p_event_at
     where p.id = v_uid
       and (p.billing_event_at is null or p.billing_event_at <= p_event_at);
    get diagnostics v_rows = row_count;
    v_applied := v_applied + v_rows;
  end loop;

  update public.billing_events set applied = v_applied where event_id = p_event_id;
  return 'ok';
end;
$$;
revoke execute on function public.apply_billing_event(text, text, timestamptz, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.apply_billing_event(text, text, timestamptz, text, text, jsonb, text) to service_role;

-- ─────────────────────────────────────────────── 4) SQL Editor özeti (son 30 gün tür × ortam)
create or replace view public.admin_billing_summary with (security_invoker = true) as
  select e.type, e.environment, count(*)::int as events, count(distinct e.user_id)::int as users,
         count(*) filter (where e.ignored is not null)::int as ignored, max(e.event_at) as last_at
    from public.billing_events e
   where e.received_at > now() - interval '30 days'
   group by e.type, e.environment
   order by events desc;
revoke all on table public.admin_billing_summary from public, anon, authenticated;

-- ─────────────────────────────────────────────── 5) saklama: 400 gün
select cron.unschedule('skor-billing-events-cleanup')
 where exists (select 1 from cron.job where jobname = 'skor-billing-events-cleanup');
select cron.schedule('skor-billing-events-cleanup', '55 4 * * *',
  $$ delete from public.billing_events where received_at < now() - interval '400 days' $$);
