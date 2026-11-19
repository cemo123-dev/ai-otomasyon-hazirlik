-- Skor+ : F7 — AI çıktısı için "Hata bildir" (Play üretken AI içerik politikası: kullanıcı rahatsız edici /
-- yanlış AI içeriğini uygulamadan çıkmadan bildirebilmeli; pazarlama Sürüm 3 lansman şartı).
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0001–0009 gerekir (auth.users, pg_cron);
-- 0010–0019'a bağımlı değil. Edge Function değişikliği yok. API-Sports kotası: 0.
-- Sıra serbest: 0020 kurulmadan yayınlanan istemci "Hata bildir" sayfasında "Bildirim şu an alınamıyor" der
-- (report_ai_output yok → PGRST202); uygulama bozulmaz.
-- KVKK: yalnız anonim hesap kimliği, maç, yüzey, neden, isteğe bağlı ≤ 200 karakter not. 90 gün sonra silinir
-- (aşağıdaki cron). Hesap silinince satırlar da silinir (auth.users on delete cascade).

-- ─────────────────────────────────────────────── 1) tablo (istemci doğrudan okuyamaz / yazamaz)
create table if not exists public.ai_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- matches'a yabancı anahtar yok: maç temizliği (0015) bildirimleri silmesin; 90 günlük kendi temizliği var
  fixture_id bigint not null,
  surface text not null,
  item_ref text,                                        -- asistan yanıtı / alarm kimliği; rapor geneli için null
  reason text not null,
  note text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ai_reports_surface_check') then
    alter table public.ai_reports add constraint ai_reports_surface_check
      check (surface in ('analysis', 'nba_analysis', 'preview', 'halftime', 'assistant', 'red_card'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ai_reports_reason_check') then
    alter table public.ai_reports add constraint ai_reports_reason_check
      check (reason in ('wrong_info', 'inappropriate', 'sport_mixup', 'other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ai_reports_note_len') then
    alter table public.ai_reports add constraint ai_reports_note_len
      check (note is null or char_length(note) <= 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ai_reports_item_ref_len') then
    alter table public.ai_reports add constraint ai_reports_item_ref_len
      check (item_ref is null or char_length(item_ref) <= 64);
  end if;
end $$;

create index if not exists ai_reports_user_time_idx on public.ai_reports (user_id, created_at);
create index if not exists ai_reports_time_idx on public.ai_reports (created_at);
alter table public.ai_reports enable row level security; -- politika yok: yalnız aşağıdaki RPC yazar
-- Supabase varsayılan tablo yetkilerini de kaldır (RLS'e ek savunma; PostgREST'ten doğrudan erişim yok)
revoke all on table public.ai_reports from anon, authenticated;

-- ─────────────────────────────────────────────── 2) bildirim RPC'si
-- Dönüş: 'ok' | 'rate_limited' | 'invalid' | 'unauthenticated'. Fırlatmaz (istemci metni dönüşe göre seçer).
--   * Kullanıcı başına kayan 24 saatte en fazla 20 bildirim (betikle tabloyu doldurmaya karşı).
--   * Aynı öğe (maç + yüzey + öğe) 24 saat içinde ikinci kez gelirse yeni satır açılmaz, 'ok' döner
--     (çift dokunuş / yeniden kurulan sayfa); sınırdan da düşmez.
--   * Not kırpılır (boşluk), boşsa null, 200 karakteri aşan kısım kesilir.
create or replace function public.report_ai_output(
  p_fixture_id bigint,
  p_surface text,
  p_item_ref text,
  p_reason text,
  p_note text
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_ref text := nullif(btrim(coalesce(p_item_ref, '')), '');
begin
  if v_uid is null then
    return 'unauthenticated';
  end if;
  if p_fixture_id is null
     or p_surface is null or p_surface not in ('analysis', 'nba_analysis', 'preview', 'halftime', 'assistant', 'red_card')
     or p_reason is null or p_reason not in ('wrong_info', 'inappropriate', 'sport_mixup', 'other')
     or char_length(coalesce(v_ref, '')) > 64 then
    return 'invalid';
  end if;
  v_note := left(v_note, 200);

  -- Aynı kullanıcının eşzamanlı çağrıları sırayla sayılır (sınır yarışla aşılmasın)
  perform pg_advisory_xact_lock(hashtextextended('ai_reports:' || v_uid::text, 0));

  if exists (
    select 1 from public.ai_reports r
     where r.user_id = v_uid and r.fixture_id = p_fixture_id and r.surface = p_surface
       and r.item_ref is not distinct from v_ref and r.created_at > now() - interval '24 hours'
  ) then
    return 'ok';
  end if;

  if (select count(*) from public.ai_reports r
       where r.user_id = v_uid and r.created_at > now() - interval '24 hours') >= 20 then
    return 'rate_limited';
  end if;

  insert into public.ai_reports (user_id, fixture_id, surface, item_ref, reason, note)
  values (v_uid, p_fixture_id, p_surface, v_ref, p_reason, v_note);
  return 'ok';
end;
$$;
revoke execute on function public.report_ai_output(bigint, text, text, text, text) from public, anon;
grant execute on function public.report_ai_output(bigint, text, text, text, text) to authenticated;

-- ─────────────────────────────────────────────── 3) geliştirici görünümleri (yalnız SQL Editor)
-- security_invoker: görünüm çağıranın yetkisiyle çalışır; anon/authenticated'a ayrıca kapalı.
-- Örnekler:
--   select * from public.admin_ai_reports limit 50;                 -- son bildirimler (maç adıyla)
--   select * from public.admin_ai_report_summary;                   -- son 7 gün: yüzey × neden sayısı
create or replace view public.admin_ai_reports with (security_invoker = true) as
  select r.id, r.created_at, r.surface, r.reason, r.note, r.item_ref, r.fixture_id,
         m.sport_type, m.league_name, m.home_team, m.away_team,
         left(r.user_id::text, 8) as user_prefix               -- tam kimlik gerekmez; aynı kişiyi gruplamaya yeter
    from public.ai_reports r
    left join public.matches m on m.fixture_id = r.fixture_id
   order by r.created_at desc;
revoke all on table public.admin_ai_reports from public, anon, authenticated;

create or replace view public.admin_ai_report_summary with (security_invoker = true) as
  select r.surface, r.reason, count(*)::int as reports, count(distinct r.user_id)::int as users,
         count(distinct r.fixture_id)::int as fixtures, max(r.created_at) as last_at
    from public.ai_reports r
   where r.created_at > now() - interval '7 days'
   group by r.surface, r.reason
   order by reports desc;
revoke all on table public.admin_ai_report_summary from public, anon, authenticated;

-- ─────────────────────────────────────────────── 4) 90 günlük temizlik (KVKK: serbest metin kısa süre tutulur)
-- run_maintenance() (0015) yeniden tanımlanmaz; ayrı ve küçük bir cron işi.
select cron.unschedule('skor-ai-reports-cleanup')
 where exists (select 1 from cron.job where jobname = 'skor-ai-reports-cleanup');
select cron.schedule('skor-ai-reports-cleanup', '50 4 * * *',
  $$ delete from public.ai_reports where created_at < now() - interval '90 days' $$);

-- Geri dönüş (gerekirse, SQL Editor):
--   select cron.unschedule('skor-ai-reports-cleanup');
--   drop view if exists public.admin_ai_report_summary; drop view if exists public.admin_ai_reports;
--   drop function if exists public.report_ai_output(bigint, text, text, text, text);
--   drop table if exists public.ai_reports;
