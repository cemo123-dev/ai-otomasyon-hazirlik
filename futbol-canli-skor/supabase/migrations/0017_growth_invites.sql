-- Skor+ : F3 + F4 — aktif gün kaydı (D1/D7 ölçümü) ve anonim davet kodu.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0001–0015 gerekir
-- (profiles 0001, pg_cron 0009); 0016'ya bağımlı değil, ondan önce ya da sonra çalıştırılabilir.
-- Sıra serbest: RPC'ler yoksa istemci davet kartını ve paylaşım bağlantısındaki kodu gizler,
-- touch_activity hatasını yutar. Edge Function değişikliği yok. API-Sports kotası: 0.
-- KVKK: yalnız anonim hesap kimliği, TSİ günü ve davet ilişkisi. E-posta / telefon / cihaz bilgisi yok.

-- ─────────────────────────────────────────────── 1) aktif gün kaydı (F4)
create table if not exists public.user_activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,                                   -- Europe/Istanbul günü
  primary key (user_id, day)
);
create index if not exists user_activity_days_day_idx on public.user_activity_days (day);
alter table public.user_activity_days enable row level security; -- politika yok: yalnız RPC'ler
-- Supabase varsayılan tablo yetkilerini de kaldır (RLS'e ek savunma; PostgREST'ten doğrudan erişim yok)
revoke all on table public.user_activity_days from anon, authenticated;

-- ─────────────────────────────────────────────── 2) davet alanları (F3)
-- profiles'ta istemci için yalnız "kendi kaydını okur" politikası var (0001); insert/update politikası
-- yok. Bu alanları yalnız aşağıdaki security definer RPC'ler yazar.
alter table public.profiles add column if not exists invite_code text;
alter table public.profiles add column if not exists invited_by uuid;
alter table public.profiles add column if not exists invited_at timestamptz;
alter table public.profiles add column if not exists invite_fail_count smallint not null default 0;
alter table public.profiles add column if not exists invite_fail_at timestamptz;
-- Davetli "aktif" olduğu an (touch_activity bir kez yazar). Sayaç ve sıralama bunu sayar; 120 günlük
-- user_activity_days temizliği sayacı geri götürmez (Döngü 6 bulgu 1).
alter table public.profiles add column if not exists invite_active_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_invited_by_fkey') then
    alter table public.profiles add constraint profiles_invited_by_fkey
      foreign key (invited_by) references auth.users (id) on delete set null;
  end if;
  -- Alfabe: ABCDEFGHJKMNPQRSTUVWXYZ23456789 (0, 1, I, L, O yok)
  if not exists (select 1 from pg_constraint where conname = 'profiles_invite_code_format') then
    alter table public.profiles add constraint profiles_invite_code_format
      check (invite_code is null or invite_code ~ '^[A-HJKMNP-Z2-9]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_not_self_invited') then
    alter table public.profiles add constraint profiles_not_self_invited
      check (invited_by is null or invited_by <> id);
  end if;
end $$;

create unique index if not exists profiles_invite_code_key
  on public.profiles (invite_code) where invite_code is not null;
create index if not exists profiles_invited_by_idx
  on public.profiles (invited_by) where invited_by is not null;

-- ─────────────────────────────────────────────── 2b) aktif gün kaydı RPC'si (F4) + davetli aktifliği
-- Dönüş yok. Oturumsuz çağrı sessizce hiçbir şey yapmaz. Günde kullanıcı başına en fazla 1 satır.
-- Davetli için "aktif" işareti (profiles.invite_active_at) burada, bir kez yazılır. Sahte davete karşı
-- (Döngü 6 bulgu 2):
--   * yalnız kodun girildiği TSİ gününden SONRAKİ günler sayılır (koddan önceki / aynı günkü kullanım sayılmaz);
--   * iki gün arasında en az bir tam gün olmalı: max(day) - min(day) >= 2 (23:59 + 00:01 ile iki dakikada olmaz);
--   * davet eden başına 24 saatte en fazla 5 yeni aktif davetli; fazlası sonraki açılışlara kalır (kaybolmaz).
-- Anonim oturum için CAPTCHA (Supabase Auth ayarı) ayrıca değerlendirilir; burada yok.
create or replace function public.touch_activity()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_me public.profiles%rowtype;
  v_span int;
begin
  if v_uid is null then
    return;
  end if;
  insert into public.user_activity_days (user_id, day)
  values (v_uid, (now() at time zone 'Europe/Istanbul')::date)
  on conflict do nothing;

  select * into v_me from public.profiles where id = v_uid;
  if v_me.invited_at is null or v_me.invited_by is null or v_me.invite_active_at is not null then
    return;
  end if;
  select max(d.day) - min(d.day) into v_span
    from public.user_activity_days d
   where d.user_id = v_uid
     and d.day > (v_me.invited_at at time zone 'Europe/Istanbul')::date;
  if coalesce(v_span, 0) < 2 then
    return;
  end if;

  -- Günlük sınır: aynı davet edenin eşzamanlı davetlileri sırayla sayılsın
  perform pg_advisory_xact_lock(hashtextextended('skor.invite_active:' || v_me.invited_by::text, 0));
  if (select count(*) from public.profiles o
       where o.invited_by = v_me.invited_by
         and o.invite_active_at > now() - interval '24 hours') >= 5 then
    return;
  end if;
  update public.profiles set invite_active_at = now()
   where id = v_uid and invite_active_at is null;
end $$;
revoke execute on function public.touch_activity() from public, anon;
grant execute on function public.touch_activity() to authenticated;

-- Yardımcı: 6 karakterlik rastgele kod (güvenlik anahtarı değildir; benzersizlik indeksle sağlanır)
create or replace function public.invite_random_code()
returns text language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
    from generate_series(1, 6);
$$;
revoke execute on function public.invite_random_code() from public, anon, authenticated;

-- Ayarlar kartının tek isteği: kod (yoksa üretir) + sayaç + kod girme hakkı.
-- active = invite_active_at dolu davetli sayısı (touch_activity kuralları). KVKK (Döngü 6 bulgu 5): yalnız
--   total >= 3 iken döner, aksi hâlde null; tek davetlinin kullanımı sayaçtan çıkarılamasın.
-- invited / can_redeem invited_at'e bakar: davet eden hesabını silince invited_by null olur (FK set null)
--   ama invited_at kalır; davetli ikinci bir kod giremez (Döngü 6 bulgu 4).
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

-- Dönüş: 'ok' | 'already' | 'too_late' | 'invalid' | 'self' | 'not_allowed' | 'rate_limited' | 'unauthenticated'
-- Kod büyük/küçük harf ve boşluk duyarsız. Hatalı kod hesap başına 24 saatte en fazla 10 kez denenir.
create or replace function public.redeem_invite(p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_me public.profiles%rowtype;
  v_inviter public.profiles%rowtype;
  v_code text;
begin
  if v_uid is null then
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
  -- İkinci işlem kilidi bekler ve ilkinin commit ettiği invited_by'yi görür → 'not_allowed'.
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

  update public.profiles
     set invited_by = v_inviter.id, invited_at = now(), invite_fail_count = 0, invite_fail_at = null
   where id = v_uid;
  return 'ok';
end $$;
revoke execute on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;

-- ─────────────────────────────────────────────── 3) geliştirici raporları (yalnız SQL Editor)
-- Hiçbir istemci rolüne açık değil (PostgREST'ten çağrılamaz).
-- Örnek: select public.admin_growth_report('2026-11-20', '2026-11-26');
create or replace function public.admin_growth_report(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with c as (
    select p.id, (p.created_at at time zone 'Europe/Istanbul')::date as d0, p.invited_by
      from public.profiles p
     where (p.created_at at time zone 'Europe/Istanbul')::date between p_from and p_to
  )
  select jsonb_build_object(
    'cohort', count(*),
    'invited', count(*) filter (where c.invited_by is not null),
    'd1', count(*) filter (where exists (
            select 1 from public.user_activity_days a where a.user_id = c.id and a.day = c.d0 + 1)),
    'd7', count(*) filter (where exists (
            select 1 from public.user_activity_days a
             where a.user_id = c.id and a.day between c.d0 + 7 and c.d0 + 13)),
    'note', 'd7 = kurulumdan sonraki 7-13. günlerden birinde aktif. Kohort bitişinden en az 14 gün sonra yorumlayın.'
  )
  from c;
$$;
revoke execute on function public.admin_growth_report(date, date) from public, anon, authenticated;

-- Kurucu Destekçi adayları: kodun yalnız ilk 3 karakteri (Telegram sıralaması için).
-- active = invite_active_at dolu (temizlikten etkilenmez). quick_redeem = hesap açılışından en geç 5 dk sonra
-- kod girilen davetli sayısı; yüksekse elle incelenir (betikle açılan hesap şüphesi, Döngü 6 bulgu 2).
-- Dönüş sütunları değişti: create or replace dönüş tipini değiştiremez, önce drop (tekrar çalıştırılabilir).
drop function if exists public.admin_invite_leaderboard();
create function public.admin_invite_leaderboard()
returns table (code_prefix text, total int, active int, quick_redeem int)
language sql stable security definer set search_path = '' as $$
  select left(inv.invite_code, 3),
         count(*)::int,
         count(*) filter (where p.invite_active_at is not null)::int,
         count(*) filter (where p.invited_at <= p.created_at + interval '5 minutes')::int
    from public.profiles p
    join public.profiles inv on inv.id = p.invited_by
   group by inv.invite_code
   order by 3 desc, 2 desc;
$$;
revoke execute on function public.admin_invite_leaderboard() from public, anon, authenticated;

-- ─────────────────────────────────────────────── 4) saklama: kullanım günleri 120 gün
-- Davet sayacı invite_active_at'i sayar; bu temizlik sayacı ve sıralamayı değiştirmez.
-- run_maintenance() (0015) yeniden tanımlanmaz; ayrı ve küçük bir cron işi.
select cron.unschedule('skor-growth-cleanup')
 where exists (select 1 from cron.job where jobname = 'skor-growth-cleanup');
select cron.schedule('skor-growth-cleanup', '40 4 * * *',
  $$ delete from public.user_activity_days
      where day < (now() at time zone 'Europe/Istanbul')::date - 120 $$);
