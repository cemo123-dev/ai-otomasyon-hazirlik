-- Skor+ : Ücretli plan geçiş güvenliği (Döngü 8 test bulguları 4, 5, 8). 0018 üretimde uygulandığı için
-- düzeltmeler burada (create or replace). Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).
-- 0001–0018 gerekir. API isteği: bu dosya tek başına 0 (api_paid false iken tetikleyici hiçbir çağrı kuyruğa almaz).
--
-- Ne değişir:
--   4) app_config_api_paid_schedule tetikleyicisi DELETE'i de dinler: api_paid satırı silinirse futbol cron'u
--      ücretsiz (0004) takvime döner (eskiden ücretli kalıyordu; istemci ise ücretsiz arayüz gösteriyordu).
--   5) api_paid ücretliye GEÇTİĞİ AN tetikleyici fikstür senkronunu bir kez kuyruğa alır
--      (call_edge_function('sync-matches', {"mode":"schedule","cadence":"paid"})) → +2…+7 günler 03:00/15:00'ı
--      beklemeden dolar (secret açıksa 9 gün = 9 istek; kapalıysa ücretsiz yol = 3 istek). Ücretsize dönüşte çağrı yok.
--   8) Fikstür gün sayısı tek kaynakta: app_config.fixture_days_ahead (varsayılan 7, 1…7). Edge (sync-matches)
--      ve istemci gün şeridi aynı değeri okur → değer < 7 verilse de istemci boş gün göstermez.
--      Eski FIXTURE_DAYS_AHEAD secret'ı yalnız 0019 kurulu değilken yedek olarak okunur; tanımlamayın.
-- Bulgu 3 (DB ücretli + secret kapalı iken fikstür) ve 6, 7 Edge Function'larda (deploy gerekir); SQL değişmez.
-- Ücretli geçiş: yalnız 0018 prosedürü (docs/ucretli-gecis.md); nba-sync-live'a dokunmayın.

-- ─────────────────────────────────────────────── 8) fikstür gün sayısı (Edge + istemci)
insert into public.app_config (key, value) values ('fixture_days_ahead', '7'::jsonb) on conflict (key) do nothing;

-- Sayı değilse (ör. '"5"') ya da satır yoksa 7; 1…7 aralığına kırpılır. Yalnız ücretli futbol planında kullanılır.
create or replace function public.fixture_days_ahead()
returns int language sql stable security definer set search_path = '' as $$
  select least(7, greatest(1, coalesce(
    (select floor((c.value)::numeric)::int from public.app_config c
      where c.key = 'fixture_days_ahead' and jsonb_typeof(c.value) = 'number'), 7)));
$$;
revoke execute on function public.fixture_days_ahead() from public, anon;
grant execute on function public.fixture_days_ahead() to authenticated, service_role;

-- ─────────────────────────────────────────────── 4) + 5) tetikleyici: DELETE + ücretliye geçişte tek fikstür çağrısı
create or replace function public.on_api_paid_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_plan text;
begin
  if tg_op = 'DELETE' then
    -- Satır silindi: api_paid_for('football') artık false → ücretsiz takvim
    if old.key = 'api_paid' then
      perform public.apply_football_sync_schedule();
    end if;
    return null;
  end if;
  if new.key = 'api_paid' and (tg_op = 'INSERT' or new.value is distinct from old.value) then
    v_plan := public.apply_football_sync_schedule();
    -- Ücretliye geçiş: fikstürü hemen doldur (prosedür adım 10'un otomatiği). Ücretli → ücretli (ör. 0018
    -- tekrarı) değer değişmediği için buraya gelmez. Çağrı başarısız olursa plan geçişi geri alınmaz.
    if v_plan = 'paid' and (tg_op = 'INSERT' or old.value is distinct from 'true'::jsonb) then
      begin
        perform public.call_edge_function('sync-matches', '{"mode":"schedule","cadence":"paid"}'::jsonb);
      exception when others then
        raise warning 'api_paid: fikstür çağrısı kuyruğa alınamadı (%); elle çalıştırın (docs/ucretli-gecis.md adım 10)', sqlerrm;
      end;
    end if;
  end if;
  return null;
end $$;
revoke execute on function public.on_api_paid_change() from public, anon, authenticated;

drop trigger if exists app_config_api_paid_schedule on public.app_config;
create trigger app_config_api_paid_schedule
  after insert or update or delete on public.app_config
  for each row execute function public.on_api_paid_change();

-- Bugünkü değere göre takvimi doğrula (api_paid false → 0004 ile aynı; true → ücretli kalır). Çağrı kuyruğa alınmaz.
select public.apply_football_sync_schedule();

-- ─────────────────────────────────────────────── GERİ DÖNÜŞ
-- 0018 tetikleyicisine dönmek için 0018_pro_api.sql'i yeniden çalıştırın (idempotent; on_api_paid_change ve
-- tetikleyici 0018 hâline döner, takvim api_paid'e göre korunur). Ardından:
--   drop function if exists public.fixture_days_ahead();       -- Edge FIXTURE_DAYS_AHEAD secret'ına, istemci 7'ye döner
--   delete from public.app_config where key = 'fixture_days_ahead';
-- Not: 0018 tekrar çalıştırılırsa (0019 kalacaksa) 0019'u da yeniden çalıştırın; aksi halde DELETE koruması gider.
