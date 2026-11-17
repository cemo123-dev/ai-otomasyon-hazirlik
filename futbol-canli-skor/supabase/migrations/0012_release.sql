-- Skor+ : yayın öncesi güvenlik — test aboneliğinin kısıtlanması ve hesap silme
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0011_config.sql gerekir.

-- ─────────────────────────────────────────────── test aboneliği yalnız izin listesine
-- simulate_subscription eskiden her girişli kullanıcıya açıktı (herkes kendine Pro verebiliyordu).
-- Artık yalnız app_config.test_user_ids listesindeki hesaplarda çalışır.
-- Test hesabı eklemek için (kimlik: Ayarlar ekranındaki "Hesap kimliği"):
--   update public.app_config set value = value || '["<kullanıcı-uuid>"]'::jsonb where key = 'test_user_ids';
insert into public.app_config (key, value) values ('test_user_ids', '[]'::jsonb) on conflict (key) do nothing;

create or replace function public.is_test_user()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select (value ? auth.uid()::text) from public.app_config where key = 'test_user_ids'),
    false);
$$;
revoke execute on function public.is_test_user() from public, anon;
grant execute on function public.is_test_user() to authenticated;

create or replace function public.simulate_subscription(p_plan text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if not public.is_test_user() then
    raise exception 'not_allowed' using hint = 'Test aboneliği yalnız test hesaplarında kullanılabilir.';
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

revoke execute on function public.simulate_subscription(text) from public, anon;
grant execute on function public.simulate_subscription(text) to authenticated;

-- ─────────────────────────────────────────────── hesap silme (Google Play şartı)
-- Kullanıcının kendi hesabını ve ona bağlı tüm verisini kalıcı olarak siler:
-- profil/abonelik, maç ve takım takipleri, bildirim tercihleri, push token'ları,
-- asistan soruları (hepsi auth.users'a "on delete cascade" ile bağlı).
-- Maç verileri ve AI analizleri kullanıcıya ait olmadığı için silinmez.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
