-- Skor+ : kalite döngüsü 2 — AI deneme sayaçları, takip kaynağı, takılı asistan soruları,
-- ücretsiz planda gece temizlik senkronu
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0001–0014 gerekir.
-- Önerilen sıra: bu dosya → npm run deploy:functions → OTA güncellemesi.
-- Sıra bozulursa bir şey DURMAZ: edge function'lar ve istemci yeni dönüş değerlerini
-- ('not_ready') ve yeni kolonları bilmeden de eskisi gibi çalışır.

-- ─────────────────────────────────────────────── 1) AI deneme sayaçları
-- Sorun: veri (istatistik / ilk 11) hazır değilken her açılış bir deneme yakıyordu; 3-4 denemeden
-- sonra analiz o maç için herkese kalıcı olarak kilitleniyordu. Artık:
--   * Veri yoksa RPC sayaç artırmadan 'not_ready' döner.
--   * Senkron yeni istatistik / kadro yazınca 'failed' satırlar sıfırlanır (aşağıdaki tetikleyici).
--   * Takılı 'generating' yeniden denemesi de deneme sınırına tabi.

-- Dönüş: 'unauthenticated' | 'not_found' | 'not_finished' | 'paywall_blocked' | 'not_ready'
--        | 'completed' | 'generating' | 'failed'
create or replace function public.request_match_analysis(p_fixture_id bigint)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_match_status text;
  v_status text;
  v_sport text;
  v_stats jsonb;
  v_requested timestamptz;
  v_claimed bigint;
begin
  if auth.uid() is null then
    return 'unauthenticated';
  end if;

  select status_short, analysis_status, sport_type, stats, analysis_requested_at
    into v_match_status, v_status, v_sport, v_stats, v_requested
    from public.matches where fixture_id = p_fixture_id;
  if not found then
    return 'not_found';
  end if;
  if v_match_status not in ('FT', 'AET', 'PEN') then
    return 'not_finished';
  end if;
  if not public.is_premium_user() then
    return 'paywall_blocked';
  end if;
  if v_status = 'completed' then
    return 'completed';
  end if;
  -- Veri hazır değil (senkron istatistiği henüz yazmadı): deneme SAYILMAZ
  if v_stats is null or (v_sport = 'nba' and v_stats -> 'metrics' is null) then
    return 'not_ready';
  end if;

  update public.matches
     set analysis_status = 'generating',
         analysis_requested_at = now(),
         analysis_attempts = analysis_attempts + 1
   where fixture_id = p_fixture_id
     and (
       analysis_status = 'none'
       or (analysis_status = 'failed' and analysis_attempts < 3)
       -- Takılı üretim 3 dk sonra yeniden denenir; sürekli çöken üretim de deneme sınırına tabi
       or (analysis_status = 'generating' and analysis_requested_at < now() - interval '3 minutes' and analysis_attempts < 3)
     )
  returning fixture_id into v_claimed;

  if v_claimed is not null then
    insert into public.analysis_jobs (fixture_id) values (p_fixture_id);
    return 'generating';
  end if;

  select analysis_status, analysis_requested_at into v_status, v_requested
    from public.matches where fixture_id = p_fixture_id;
  if v_status = 'completed' then return 'completed'; end if;
  -- Hakkı biten takılı üretim sonsuza dek "hazırlanıyor" göstermesin
  if v_status = 'generating' and v_requested >= now() - interval '3 minutes' then return 'generating'; end if;
  return 'failed';
end $$;

revoke execute on function public.request_match_analysis(bigint) from public, anon;
grant execute on function public.request_match_analysis(bigint) to authenticated;

-- Dönüş: 'unauthenticated' | 'not_found' | 'not_supported' | 'not_prematch' | 'too_early'
--        | 'paywall_blocked' | 'not_ready' | 'completed' | 'generating' | 'failed'
-- 'not_ready': ilk 11 son 5 dk içinde denendi ve henüz açıklanmamıştı (generate-preview denemeyi
-- iade edip 'none' yazar). Her deneme 1 API isteği harcadığından maç başına 5 dk'da en fazla 1 deneme.
create or replace function public.request_match_preview(p_fixture_id bigint)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_sport text;
  v_status text;
  v_kickoff timestamptz;
  v_preview text;
  v_requested timestamptz;
  v_claimed bigint;
begin
  if auth.uid() is null then
    return 'unauthenticated';
  end if;

  select sport_type, status_short, kickoff_at, preview_status, preview_requested_at
    into v_sport, v_status, v_kickoff, v_preview, v_requested
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
  if v_preview = 'none' and v_requested > now() - interval '5 minutes' then
    return 'not_ready';
  end if;

  update public.matches
     set preview_status = 'generating',
         preview_requested_at = now(),
         preview_attempts = preview_attempts + 1
   where fixture_id = p_fixture_id
     and (
       preview_status = 'none'
       or (preview_status = 'failed' and preview_attempts < 4)
       or (preview_status = 'generating' and preview_requested_at < now() - interval '3 minutes' and preview_attempts < 4)
     )
  returning fixture_id into v_claimed;

  if v_claimed is not null then
    insert into public.preview_jobs (fixture_id) values (p_fixture_id);
    return 'generating';
  end if;

  select preview_status, preview_requested_at into v_preview, v_requested
    from public.matches where fixture_id = p_fixture_id;
  if v_preview = 'completed' then return 'completed'; end if;
  if v_preview = 'generating' and v_requested >= now() - interval '3 minutes' then return 'generating'; end if;
  return 'failed';
end $$;

revoke execute on function public.request_match_preview(bigint) from public, anon;
grant execute on function public.request_match_preview(bigint) to authenticated;

-- Senkron yeni istatistik / kadro yazınca başarısız AI üretimleri yeniden denenebilir olur
create or replace function public.matches_reset_ai_attempts()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.analysis_status = 'failed' and new.stats is not null and new.stats is distinct from old.stats then
    new.analysis_status := 'none';
    new.analysis_attempts := 0;
  end if;
  if new.preview_status = 'failed'
     and ((new.lineups is not null and new.lineups is distinct from old.lineups)
          or (new.lineup_detail is not null and new.lineup_detail is distinct from old.lineup_detail)) then
    new.preview_status := 'none';
    new.preview_attempts := 0;
  end if;
  return new;
end $$;
revoke execute on function public.matches_reset_ai_attempts() from public, anon, authenticated;

drop trigger if exists matches_reset_ai_attempts on public.matches;
create trigger matches_reset_ai_attempts
  before update on public.matches
  for each row execute function public.matches_reset_ai_attempts();

-- ─────────────────────────────────────────────── 2) takip kaynağı ve elle bırakılan maçlar
-- source: 'manual' (🔔 ile) | 'team' (takım takibiyle otomatik). Takım bırakılınca yalnız
-- otomatik eklenen, henüz başlamamış maç takipleri silinir.
alter table public.match_follows add column if not exists source text not null default 'manual';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'match_follows_source_check') then
    alter table public.match_follows
      add constraint match_follows_source_check check (source in ('manual', 'team'));
  end if;
end $$;

-- Geçiş: bu dosyadan önce takım takibiyle eklenen başlamamış maçlar ayırt edilemiyordu.
-- Kullanıcının takip ettiği takımın başlamamış maçı otomatik eklenmiş sayılır (tek seferlik).
do $$
begin
  if not exists (select 1 from public.match_follows where source = 'team') then
    update public.match_follows f
       set source = 'team'
      from public.matches m
     where m.fixture_id = f.fixture_id and m.status_short = 'NS'
       and exists (select 1 from public.team_follows tf
                    where tf.user_id = f.user_id and tf.sport_type = m.sport_type
                      and tf.team_id in (m.home_team_id, m.away_team_id));
  end if;
end $$;

-- Takımı takip eden kullanıcının elle bıraktığı maçlar: günlük senkron bunları yeniden eklemez
create table if not exists public.match_unfollows (
  user_id uuid not null references auth.users (id) on delete cascade,
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, fixture_id)
);
create index if not exists match_unfollows_fixture_idx on public.match_unfollows (fixture_id);
alter table public.match_unfollows enable row level security; -- politika yok: yalnız RPC'ler

/** Takip et / bırak. Dönüş: yeni durum (true = takipte) */
create or replace function public.toggle_follow(p_fixture_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  delete from public.match_follows where user_id = auth.uid() and fixture_id = p_fixture_id;
  if found then
    -- Elle bırakılan maç takım takibiyle yeniden eklenmesin
    insert into public.match_unfollows (user_id, fixture_id) values (auth.uid(), p_fixture_id)
    on conflict do nothing;
    return false;
  end if;
  delete from public.match_unfollows where user_id = auth.uid() and fixture_id = p_fixture_id;
  insert into public.match_follows (user_id, fixture_id, source) values (auth.uid(), p_fixture_id, 'manual');
  return true;
end $$;

revoke execute on function public.toggle_follow(bigint) from public, anon;
grant execute on function public.toggle_follow(bigint) to authenticated;

/**
 * Takımı takip et / bırak. Takip edilince takımın başlamamış maçları otomatik takibe alınır
 * (elle bırakılanlar hariç); bırakılınca bu otomatik takipler silinir (kullanıcının takip ettiği
 * diğer takımın maçı ve elle takip edilenler kalır). Dönüş: yeni durum (true = takipte)
 */
create or replace function public.toggle_team_follow(p_sport text, p_team_id bigint, p_team_name text, p_team_logo text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if p_sport not in ('football', 'nba') or p_team_id is null then
    raise exception 'invalid';
  end if;
  delete from public.team_follows where user_id = auth.uid() and sport_type = p_sport and team_id = p_team_id;
  if found then
    delete from public.match_follows f
     using public.matches m
     where f.user_id = auth.uid() and f.source = 'team' and m.fixture_id = f.fixture_id
       and m.sport_type = p_sport and m.status_short = 'NS'
       and (m.home_team_id = p_team_id or m.away_team_id = p_team_id)
       and not exists (select 1 from public.team_follows tf
                        where tf.user_id = auth.uid() and tf.sport_type = m.sport_type
                          and tf.team_id in (m.home_team_id, m.away_team_id));
    return false;
  end if;
  insert into public.team_follows (user_id, sport_type, team_id, team_name, team_logo)
  values (auth.uid(), p_sport, p_team_id, left(p_team_name, 80), left(p_team_logo, 300));
  insert into public.match_follows (user_id, fixture_id, source)
  select auth.uid(), m.fixture_id, 'team' from public.matches m
   where m.sport_type = p_sport and m.status_short = 'NS'
     and (m.home_team_id = p_team_id or m.away_team_id = p_team_id)
     and not exists (select 1 from public.match_unfollows u where u.user_id = auth.uid() and u.fixture_id = m.fixture_id)
  on conflict do nothing;
  return true;
end $$;

revoke execute on function public.toggle_team_follow(text, bigint, text, text) from public, anon;
grant execute on function public.toggle_team_follow(text, bigint, text, text) to authenticated;

/** Senkron yeni fikstür eklediğinde: takımı takip edenleri maça bağlar (elle bırakılanlar hariç) */
create or replace function public.follow_team_fixtures(p_fixture_ids bigint[])
returns int language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  insert into public.match_follows (user_id, fixture_id, source)
  select tf.user_id, m.fixture_id, 'team'
    from public.matches m
    join public.team_follows tf
      on tf.sport_type = m.sport_type and tf.team_id in (m.home_team_id, m.away_team_id)
   where m.fixture_id = any (p_fixture_ids) and m.status_short = 'NS'
     and not exists (select 1 from public.match_unfollows u where u.user_id = tf.user_id and u.fixture_id = m.fixture_id)
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.follow_team_fixtures(bigint[]) from public, anon, authenticated;
grant execute on function public.follow_team_fixtures(bigint[]) to service_role;

-- ─────────────────────────────────────────────── 3) takılı asistan soruları
-- Gemini isteği askıda kalır ya da edge function duvar saatinde öldürülürse satır 'pending'
-- kalıyor, hakkı yakıyor ve sohbeti kilitliyordu. 2 dk'dan eski bekleyen soru (busy penceresiyle
-- aynı) bir sonraki soruda kapatılır ve hakka sayılmaz; günlük bakım da güvenlik ağıdır.
-- Dönüş: 'unauthenticated' | 'not_found' | 'not_ready' | 'paywall_blocked' | 'invalid'
--        | 'limit_reached' | 'busy' | 'queued'
create or replace function public.ask_assistant(p_fixture_id bigint, p_question text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_q text := btrim(coalesce(p_question, ''));
  v_status text;
  v_analysis text;
  v_used int;
begin
  if auth.uid() is null then
    return 'unauthenticated';
  end if;
  select status_short, analysis_status into v_status, v_analysis from public.matches where fixture_id = p_fixture_id;
  if not found then
    return 'not_found';
  end if;
  -- Asistan maç sonu analizinin altında: analiz hazır olmalı
  if v_analysis <> 'completed' then
    return 'not_ready';
  end if;
  if not public.is_premium_user() then
    return 'paywall_blocked';
  end if;
  if char_length(v_q) < 3 or char_length(v_q) > 200 then
    return 'invalid';
  end if;

  -- Aynı kullanıcı + maç için eşzamanlı istekleri sırala (3 hak aşılmasın)
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || p_fixture_id::text, 0));

  -- Takılı kalan soru kapatılır (Realtime ile istemciye de gider); hakka sayılmaz
  update public.match_chat
     set status = 'failed',
         answer = 'Yanıt alınamadı; bu soru hakkından düşülmedi. Tekrar sorabilirsin.'
   where user_id = auth.uid() and fixture_id = p_fixture_id and status = 'pending'
     and created_at <= now() - interval '2 minutes';

  if exists (select 1 from public.match_chat
              where user_id = auth.uid() and fixture_id = p_fixture_id and status = 'pending') then
    return 'busy'; -- önceki soru yanıtlanmadan yenisi sorulmaz
  end if;

  select count(*) into v_used from public.match_chat
   where user_id = auth.uid() and fixture_id = p_fixture_id and status <> 'failed';
  if v_used >= 3 then
    return 'limit_reached';
  end if;

  insert into public.match_chat (user_id, fixture_id, question) values (auth.uid(), p_fixture_id, v_q);
  return 'queued';
end $$;

revoke execute on function public.ask_assistant(bigint, text) from public, anon;
grant execute on function public.ask_assistant(bigint, text) to authenticated;

-- ─────────────────────────────────────────────── 4) günlük bakım (0009'un genişletilmiş hali)
create or replace function public.run_maintenance()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v jsonb := '{}'::jsonb;
  n int;
begin
  -- Kuyruk tabloları: tetikleyici çalıştıktan sonra yalnız iz kaydıdır
  delete from public.analysis_jobs where created_at < now() - interval '7 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('analysis_jobs', n);
  delete from public.preview_jobs where created_at < now() - interval '7 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('preview_jobs', n);
  delete from public.halftime_jobs where created_at < now() - interval '7 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('halftime_jobs', n);

  -- Anlık görüntüler: senkron 6 saatte zaten budar; güvenlik ağı
  delete from public.match_snapshots where taken_at < now() - interval '1 day';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_snapshots', n);

  -- Maç dosyası önbelleği: gerekirse ask-assistant yeniden derler
  delete from public.match_dossiers where built_at < now() - interval '30 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_dossiers', n);

  -- Takip ve alarm kayıtları maç bittikten 30 gün sonra gereksiz
  delete from public.match_follows f using public.matches m
   where m.fixture_id = f.fixture_id and m.kickoff_at < now() - interval '30 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_follows', n);
  delete from public.match_unfollows u using public.matches m
   where m.fixture_id = u.fixture_id and m.kickoff_at < now() - interval '30 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_unfollows', n);
  delete from public.match_alerts where created_at < now() - interval '30 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_alerts', n);

  -- Takılı kalan asistan soruları (güvenlik ağı): hakka sayılmaz
  update public.match_chat
     set status = 'failed',
         answer = 'Yanıt alınamadı; bu soru hakkından düşülmedi. Tekrar sorabilirsin.'
   where status = 'pending' and created_at < now() - interval '5 minutes';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_chat_stale', n);

  -- Başarısız (hakka sayılmayan) sohbet satırları
  delete from public.match_chat where status = 'failed' and created_at < now() - interval '7 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_chat_failed', n);

  return v;
end $$;

revoke execute on function public.run_maintenance() from public, anon, authenticated;

-- ─────────────────────────────────────────────── 5) istemci için plan bayrağı
-- Uygulama, ücretsiz API planında çalışmayan özellikleri (akıllı alarmlar) vaat etmesin diye
-- yalnız bu boolean'ı okur. app_config tablosunun kendisi istemciye kapalı kalır.
grant execute on function public.api_paid() to authenticated;

-- ─────────────────────────────────────────────── 6) gece temizlik senkronu (futbol)
-- Son canlı çalıştırma 22:30 UTC. O sırada uzatmada / penaltıda olan maç ertesi sabaha kadar
-- "canlı" kalıyordu. 23:15 UTC'de tek ek çalıştırma (canlı liste 1 istek + biten maçlar için
-- tarih başına 1 istek; kota bekçisi geçerli).
select cron.unschedule('skor-sync-cleanup') where exists (select 1 from cron.job where jobname = 'skor-sync-cleanup');
select cron.schedule('skor-sync-cleanup', '15 23 * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"live"}'::jsonb) $$);
