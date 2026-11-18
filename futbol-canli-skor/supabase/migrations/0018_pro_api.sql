-- Skor+ : P0 — API-Football Pro (7.500/gün) hazırlığı; NBA ücretsiz kalır (100/gün). (inovasyon §0.7)
-- Ek: Döngü 7 test bulguları 5–8 (0017 uygulanmış olduğu için düzeltmeler burada, create or replace ile).
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0001–0017 gerekir.
--
-- GÜVENLİ VARSAYILAN: bu dosya planı AÇMAZ. app_config.api_paid false kaldıkça cron takvimi 0004 ile
-- BİREBİR aynıdır (canlı */30 12-22 UTC, fikstür 0 9 UTC; aynı gövde) → API isteği artmaz.
-- Pro açılışı — Döngü 8 doğrulanmış sıra (kopyala-yapıştır SQL: docs/ucretli-gecis.md). Kural: hiçbir an
-- "DB ücretli + secret kapalı" kalınmaz; "secret açık + DB ücretsiz" aralığı dakikalarla sınırlı. Adım 5–8
-- 07:00–19:30 UTC arasında, :00/:30'dan uzak bir dakikada. nba-sync-live'a DOKUNMAYIN; 0002/0006/0007'deki
-- eski cron.alter_job notları kaldırıldı ve asla çalıştırılmaz.
--  Hazırlık (ücretsiz planda; davranış değişmez):
--   (1) secret kontrol: API_FOOTBALL_PAID ve API_NBA_PAID tanımsız ya da 0; FIXTURE_DAYS_AHEAD tanımsız
--   (2) npm run deploy:functions  (bayraklar KAPALIYKEN; bayrak ayrımlı kod çıkar, istek sayısı aynı; 7/7 Deployed,
--       sync-nba başarısızsa DUR)
--   (3) bu dosya + 0019_paid_switch_safety.sql; cron.job doğrulaması (ücretsiz takvim)
--   (4) OTA: npm run update:prod
--  Geçiş (Pro aboneliği aktif olduktan sonra):
--   (5) /status → plan Pro, limit_day 7500 (değilse DUR)
--   (6) secret: API_FOOTBALL_PAID=1, FOOTBALL_QUOTA_RESERVE=500 (API_NBA_PAID tanımsız/0 kalır)
--   (7) npm run deploy:functions (sıcak örnekler yeni bayrağı okusun) → hemen (8)
--   (8) update public.app_config set value = 'true'::jsonb, updated_at = now() where key = 'api_paid';
--       → tetikleyici futbol cron'unu dakikalık takvime geçirir (aşağıda 2) ve (0019) fikstürü bir kez kuyruğa alır
--   (9) cron.job doğrulaması (ücretli takvim + "cadence":"paid"; NBA satırları değişmemiş)
--  (10) fikstür kuyruğa girmediyse elle: select public.call_edge_function('sync-matches', '{"mode":"schedule","cadence":"paid"}'::jsonb);
--  (11) 10 dk sonra Edge logları: live ok her dakika, skipped yok
--  Geri dönüş: R1 api_paid false (tetikleyici 0004 takvimine döner) → R2 hemen secret API_FOOTBALL_PAID=0 +
--   deploy:functions (önce secret kapatılmaz) → R3 gerekirse dosya sonundaki GERİ DÖNÜŞ bloğu.
-- (8), (6)–(7)'den önce yapılırsa Edge'deki ikinci emniyet (syncUtils.shouldRunSync) dakikalık canlı çağrıları
-- ücretsiz takvim dakikalarına indirir; fikstür (03:00/15:00) Döngü 8'den beri ücretsiz yolla (3 gün) yine çalışır.

-- ─────────────────────────────────────────────── 1) spor başına plan bilgisi
-- api_paid (0011) = FUTBOL planı (adı geriye uyum için korunur). nba_api_paid = NBA planı (ücretsiz kalır).
insert into public.app_config (key, value) values ('nba_api_paid', 'false'::jsonb) on conflict (key) do nothing;

-- İstemci: alarm satırlarını spor başına "yakında" göstermek ve futbolda −1…+7 gün şeridi için.
-- Bilinmeyen spor → false (vaat edilmez).
create or replace function public.api_paid_for(p_sport text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select (c.value)::boolean from public.app_config c
                    where c.key = case p_sport when 'nba' then 'nba_api_paid'
                                               when 'football' then 'api_paid' end), false);
$$;
revoke execute on function public.api_paid_for(text) from public, anon;
grant execute on function public.api_paid_for(text) to authenticated, service_role;

-- ─────────────────────────────────────────────── 2) futbol senkron takvimi plana göre
-- Ücretsiz (api_paid false): 0004 ile aynı iş adı, takvim ve gövde.
-- Ücretli (api_paid true): canlı dakikalık 09:00–23:59 UTC, fikstür günde 2 (03:00, 15:00 UTC; −1…+7 gün,
--   FIXTURE_DAYS_AHEAD). Gövdede cadence = 'paid': secret API_FOOTBALL_PAID kapalıysa Edge Function
--   ücretsiz takvim dışındaki çağrıyı API'ye gitmeden atlar (ikinci emniyet).
-- NBA işleri (nba-sync-live */30 23,0-6, nba-sync-schedule 0 20) ve skor-sync-cleanup DEĞİŞMEZ.
create or replace function public.apply_football_sync_schedule()
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_paid boolean := public.api_paid_for('football');
begin
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname in ('skor-sync-live', 'skor-sync-schedule');
  if v_paid then
    perform cron.schedule('skor-sync-live', '* 9-23 * * *',
      $c$ select public.call_edge_function('sync-matches', '{"mode":"live","cadence":"paid"}'::jsonb) $c$);
    perform cron.schedule('skor-sync-schedule', '0 3,15 * * *',
      $c$ select public.call_edge_function('sync-matches', '{"mode":"schedule","cadence":"paid"}'::jsonb) $c$);
    return 'paid';
  end if;
  perform cron.schedule('skor-sync-live', '*/30 12-22 * * *',
    $c$ select public.call_edge_function('sync-matches', '{"mode":"live"}'::jsonb) $c$);
  perform cron.schedule('skor-sync-schedule', '0 9 * * *',
    $c$ select public.call_edge_function('sync-matches', '{"mode":"schedule"}'::jsonb) $c$);
  return 'free';
end $$;
revoke execute on function public.apply_football_sync_schedule() from public, anon, authenticated;

-- api_paid değişince takvim kendiliğinden uyar (SQL Editor'deki tek update yeterli; geri dönüş de öyle)
create or replace function public.on_api_paid_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.key = 'api_paid' and (tg_op = 'INSERT' or new.value is distinct from old.value) then
    perform public.apply_football_sync_schedule();
  end if;
  return null;
end $$;
revoke execute on function public.on_api_paid_change() from public, anon, authenticated;

drop trigger if exists app_config_api_paid_schedule on public.app_config;
create trigger app_config_api_paid_schedule
  after insert or update on public.app_config
  for each row execute function public.on_api_paid_change();

-- Bugünkü değere göre uygula (api_paid false → 0004 ile aynı takvim; tekrar çalıştırmada değişiklik yok)
select public.apply_football_sync_schedule();

-- ─────────────────────────────────────────────── 3) davet: silinmiş hesap, 3'lü halka, sınır bekleyen (Döngü 7)
-- Bulgu 8: sınıra (davet eden başına 24 saatte 5) takılan davetli artık kaybolmaz. Aktiflik kararı tek
-- yardımcıda; touch_activity kendisi için, saatlik cron (skor-invite-recount) bekleyenler için çağırır.
create or replace function public.invite_try_activate(p_uid uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_me public.profiles%rowtype;
  v_span int;
begin
  select * into v_me from public.profiles where id = p_uid;
  if v_me.id is null or v_me.invited_at is null or v_me.invited_by is null or v_me.invite_active_at is not null then
    return false;
  end if;
  -- Kod gününden SONRAKİ günler; aralarında en az bir tam gün (0017 kuralları aynen)
  select max(d.day) - min(d.day) into v_span
    from public.user_activity_days d
   where d.user_id = p_uid
     and d.day > (v_me.invited_at at time zone 'Europe/Istanbul')::date;
  if coalesce(v_span, 0) < 2 then
    return false;
  end if;
  -- Günlük sınır: aynı davet edenin eşzamanlı davetlileri sırayla sayılsın
  perform pg_advisory_xact_lock(hashtextextended('skor.invite_active:' || v_me.invited_by::text, 0));
  if (select count(*) from public.profiles o
       where o.invited_by = v_me.invited_by
         and o.invite_active_at > now() - interval '24 hours') >= 5 then
    return false; -- sınırda: skor-invite-recount sonraki saatlerde yeniden dener
  end if;
  update public.profiles set invite_active_at = now()
   where id = p_uid and invite_active_at is null;
  return found;
end $$;
revoke execute on function public.invite_try_activate(uuid) from public, anon, authenticated;

-- Bulgu 5: silinmiş hesabın süresi dolmamış JWT'si FK hatası (500) yerine sessizce döner.
create or replace function public.touch_activity()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from auth.users u where u.id = v_uid) then
    return;
  end if;
  insert into public.user_activity_days (user_id, day)
  values (v_uid, (now() at time zone 'Europe/Istanbul')::date)
  on conflict do nothing;
  perform public.invite_try_activate(v_uid);
end $$;
revoke execute on function public.touch_activity() from public, anon;
grant execute on function public.touch_activity() to authenticated;

-- Bulgu 5: silinmiş hesapta satır dönmez (istemci kartı gizler). Gövdenin geri kalanı 0017 ile aynı.
create or replace function public.get_my_invite()
returns table (code text, total int, active int, invited boolean, can_redeem boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_try int := 0;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if not exists (select 1 from auth.users u where u.id = v_uid) then
    return;
  end if;
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  select p.invite_code into v_code from public.profiles p where p.id = v_uid;
  while v_code is null loop
    v_try := v_try + 1;
    if v_try > 10 then
      raise exception 'invite_code_unavailable';
    end if;
    begin
      update public.profiles p set invite_code = public.invite_random_code()
       where p.id = v_uid and p.invite_code is null;
    exception when unique_violation then
      null; -- çakışma: yeni kodla tekrar dene
    end;
    select p.invite_code into v_code from public.profiles p where p.id = v_uid;
  end loop;

  return query
  select v_code,
         t.n_total,
         case when t.n_total >= 3 then t.n_active end,
         p.invited_at is not null,
         p.invited_at is null and p.created_at >= now() - interval '7 days'
    from public.profiles p,
         (select count(*)::int as n_total,
                 count(*) filter (where i.invite_active_at is not null)::int as n_active
            from public.profiles i
           where i.invited_by = v_uid) t
   where p.id = v_uid;
end $$;
revoke execute on function public.get_my_invite() from public, anon;
grant execute on function public.get_my_invite() to authenticated;

-- Bulgu 5: silinmiş hesap → 'unauthenticated'. Bulgu 6: 3'lü halka (A→B→C→A) da 'not_allowed'.
-- Karar: 3 uzunluğa kadar halka engellenir (ucuz, tek ek okuma). Daha uzun halkalar ve farklı çiftlerin
-- AYNI ANDA kapattığı 3'lü halka (çift kilidi kapsamaz) kabul edilen risk: ödül öncesi lider tablosu elle
-- incelenir (quick_redeem + aktiflik + 5/24 saat sınırı etkiyi sınırlar).
create or replace function public.redeem_invite(p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_me public.profiles%rowtype;
  v_inviter public.profiles%rowtype;
  v_code text;
begin
  if v_uid is null or not exists (select 1 from auth.users u where u.id = v_uid) then
    return 'unauthenticated';
  end if;
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  select * into v_me from public.profiles where id = v_uid for update;

  if v_me.invited_at is not null then
    return 'already';
  end if;
  if v_me.created_at < now() - interval '7 days' then
    return 'too_late';
  end if;
  if v_me.invite_fail_count >= 10 and v_me.invite_fail_at > now() - interval '24 hours' then
    return 'rate_limited';
  end if;

  v_code := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  if v_code = v_me.invite_code then
    return 'self';
  end if;

  -- Biçim dışı kod (alfabe dışı karakter / 6 karakter değil) da hatalı deneme sayılır
  if v_code ~ '^[A-HJKMNP-Z2-9]{6}$' then
    select * into v_inviter from public.profiles where invite_code = v_code;
  end if;
  if v_inviter.id is null then
    update public.profiles
       set invite_fail_count = case when invite_fail_at > now() - interval '24 hours'
                                    then invite_fail_count + 1 else 1 end,
           invite_fail_at = now()
     where id = v_uid;
    return 'invalid';
  end if;
  -- Eşzamanlı A→B ve B→A (Döngü 6 bulgu 3): çift için işlem kilidi, sonra davet edeni yeniden oku.
  perform pg_advisory_xact_lock(hashtextextended(
    'skor.invite_pair:' || least(v_uid, v_inviter.id)::text || greatest(v_uid, v_inviter.id)::text, 0));
  select * into v_inviter from public.profiles where id = v_inviter.id;
  if v_inviter.id is null then
    return 'invalid'; -- davet eden bu arada hesabını sildi
  end if;
  -- Karşılıklı davet (A→B, B→A) sayılmaz
  if v_inviter.invited_by = v_uid then
    return 'not_allowed';
  end if;
  -- 3'lü halka: davet edenin davet edeni beni davet etmiş (ben → davet eden → onun davet edeni → ben)
  if v_inviter.invited_by is not null and exists (
       select 1 from public.profiles g where g.id = v_inviter.invited_by and g.invited_by = v_uid) then
    return 'not_allowed';
  end if;

  update public.profiles
     set invited_by = v_inviter.id, invited_at = now(), invite_fail_count = 0, invite_fail_at = null
   where id = v_uid;
  return 'ok';
end $$;
revoke execute on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;

-- Bulgu 7: önek 3 → 4 karakter (31^4 = 923.521; 250 davet edende çakışma olasılığı ~%3).
-- Dönüş tipi 0017 ile aynı: create or replace yeterli.
create or replace function public.admin_invite_leaderboard()
returns table (code_prefix text, total int, active int, quick_redeem int)
language sql stable security definer set search_path = '' as $$
  select left(inv.invite_code, 4),
         count(*)::int,
         count(*) filter (where p.invite_active_at is not null)::int,
         count(*) filter (where p.invited_at <= p.created_at + interval '5 minutes')::int
    from public.profiles p
    join public.profiles inv on inv.id = p.invited_by
   group by inv.invite_code
   order by 3 desc, 2 desc;
$$;
revoke execute on function public.admin_invite_leaderboard() from public, anon, authenticated;

-- Bulgu 8: sınırda bekleyen davetliler saatlik yeniden denenir (uygulamayı bir daha açmasalar da).
-- Yalnız son 60 günde kod girenler; dönüş = bu turda aktif olan sayısı. API-Sports kotası: 0.
create or replace function public.invite_recount_held()
returns int language plpgsql security definer set search_path = '' as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select p.id from public.profiles p
     where p.invited_by is not null
       and p.invite_active_at is null
       and p.invited_at > now() - interval '60 days'
     order by p.invited_at
  loop
    if public.invite_try_activate(r.id) then
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke execute on function public.invite_recount_held() from public, anon, authenticated;

select cron.unschedule('skor-invite-recount')
 where exists (select 1 from cron.job where jobname = 'skor-invite-recount');
select cron.schedule('skor-invite-recount', '20 * * * *', $$ select public.invite_recount_held() $$);

-- ─────────────────────────────────────────────── GERİ DÖNÜŞ
-- Plan (Pro'dan ücretsize): tek satır; tetikleyici takvimi 0004'e döndürür. Ardından secret API_FOOTBALL_PAID=0 → deploy.
--   update public.app_config set value = 'false'::jsonb, updated_at = now() where key = 'api_paid';
-- Bu dosyanın tamamı (gerekirse; 0019 kuruluysa önce onun GERİ DÖNÜŞ'ündeki fixture_days_ahead iki satırı):
--   drop trigger if exists app_config_api_paid_schedule on public.app_config;
--   update public.app_config set value = 'false'::jsonb where key = 'api_paid';
--   select public.apply_football_sync_schedule();          -- 0004 takvimi (önce bunu, sonra drop)
--   drop function if exists public.on_api_paid_change();
--   drop function if exists public.apply_football_sync_schedule();
--   drop function if exists public.api_paid_for(text);      -- istemci 0015 api_paid()'e döner
--   select cron.unschedule('skor-invite-recount');
--   drop function if exists public.invite_recount_held();
--   -- 0017 davet fonksiyonlarına dönmek için 0017_growth_invites.sql'i yeniden çalıştırın (idempotent);
--   -- sonra: drop function if exists public.invite_try_activate(uuid);
--   delete from public.app_config where key = 'nba_api_paid';
