-- Skor+ : kalite döngüsü 3 — maç önü raporu ilk 11 sorgu sınırı, elle bırakılan maç kayıtları
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent). 0001–0015 gerekir.
-- Sıra serbest: generate-preview yeni kolonu yalnız kota yolunda ayrı sorguyla okur (yoksa iadeyi atlar);
-- istemci yeni dönüş değeri beklemez.
-- Döngü 4 eki (henüz prod'a uygulanmadan): talep hakkı dolu + bayat 'generating' → 'not_supported';
-- toggle_follow çift dokunuşta 'on conflict do nothing'.

-- ─────────────────────────────────────────────── 1) maç önü: ilk 11 sorgu sınırı
-- Sorun (Döngü 3, bulgu 3): 0015 ile "ilk 11 yok" denemesi iade ediliyordu; tek sınır 5 dk'lık
-- kısmaydı. Kadro vermeyen lig/kupada maç başına ~9 getLineups isteği gidebiliyordu.
-- Artık: her talep (= 1 ilk 11 sorgusu) preview_lineup_checks'i artırır; en fazla 4 talep,
-- "veri yok" sonrası en az 10 dk arayla (T-45, -35, -25, -15). Sınır dolunca 'not_supported'
-- döner (istemci "bu maç için maç önü analizi üretilmedi" der; eski sürümler de bu değeri bilir).
-- Senkron yeni kadro yazarsa sayaç sıfırlanır (aşağıdaki tetikleyici).
alter table public.matches add column if not exists preview_lineup_checks smallint not null default 0;

-- Dönüş: 'unauthenticated' | 'not_found' | 'not_supported' | 'not_prematch' | 'too_early'
--        | 'paywall_blocked' | 'not_ready' | 'completed' | 'generating' | 'failed'
create or replace function public.request_match_preview(p_fixture_id bigint)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_sport text;
  v_status text;
  v_kickoff timestamptz;
  v_preview text;
  v_requested timestamptz;
  v_checks smallint;
  v_claimed bigint;
begin
  if auth.uid() is null then
    return 'unauthenticated';
  end if;

  select sport_type, status_short, kickoff_at, preview_status, preview_requested_at, preview_lineup_checks
    into v_sport, v_status, v_kickoff, v_preview, v_requested, v_checks
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
  if v_preview <> 'generating' and v_checks >= 4 then
    return 'not_supported'; -- bu maç için ilk 11 sorgu hakkı doldu (API kadro vermiyor)
  end if;
  if v_preview = 'none' and v_requested > now() - interval '10 minutes' then
    return 'not_ready';
  end if;

  update public.matches
     set preview_status = 'generating',
         preview_requested_at = now(),
         preview_attempts = preview_attempts + 1,
         preview_lineup_checks = preview_lineup_checks + 1
   where fixture_id = p_fixture_id
     and preview_lineup_checks < 4
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

  select preview_status, preview_requested_at, preview_lineup_checks into v_preview, v_requested, v_checks
    from public.matches where fixture_id = p_fixture_id;
  if v_preview = 'completed' then return 'completed'; end if;
  if v_preview = 'generating' and v_requested >= now() - interval '3 minutes' then return 'generating'; end if;
  -- Döngü 4, bulgu 6: 4. talepte işçi çöktüyse bayat 'generating' + dolu sayaç kalır;
  -- "Tekrar dene" sonsuza dek 'failed' vermesin, sorgu hakkı dolduğu söylensin
  if v_checks >= 4 then return 'not_supported'; end if;
  return 'failed';
end $$;

revoke execute on function public.request_match_preview(bigint) from public, anon;
grant execute on function public.request_match_preview(bigint) to authenticated;

-- Senkron yeni istatistik / kadro yazınca başarısız AI üretimleri yeniden denenebilir olur;
-- yeni kadro gelince ilk 11 sorgu sayacı da sıfırlanır (0015 sürümü + preview_lineup_checks)
create or replace function public.matches_reset_ai_attempts()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.analysis_status = 'failed' and new.stats is not null and new.stats is distinct from old.stats then
    new.analysis_status := 'none';
    new.analysis_attempts := 0;
  end if;
  if (new.lineups is not null and new.lineups is distinct from old.lineups)
     or (new.lineup_detail is not null and new.lineup_detail is distinct from old.lineup_detail) then
    new.preview_lineup_checks := 0;
    if new.preview_status = 'failed' then
      new.preview_status := 'none';
      new.preview_attempts := 0;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.matches_reset_ai_attempts() from public, anon, authenticated;

-- ─────────────────────────────────────────────── 2) elle bırakılan maç kayıtları
-- Sorun (Döngü 3, bulgu 10): elle (🔔) takip edilip bırakılan her maç kalıcı match_unfollows kaydı
-- bırakıyordu; kullanıcı sonradan takımı takip edince o maç atlanıyordu. Artık:
--   * Kayıt yalnız takım takibiyle eklenen ('team') satır silinince ya da kullanıcı maçın
--     takımlarından birini takip ederken yazılır (senkronun yeniden eklemesini engellemek için).
--   * Takım takibi başlatılınca o takımın maçlarına ait kayıtlar silinir (son ve açık niyet).
create or replace function public.toggle_follow(p_fixture_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_source text;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  delete from public.match_follows where user_id = auth.uid() and fixture_id = p_fixture_id
  returning source into v_source;
  if found then
    if v_source = 'team' or exists (
      select 1 from public.matches m
        join public.team_follows tf
          on tf.user_id = auth.uid() and tf.sport_type = m.sport_type and tf.team_id in (m.home_team_id, m.away_team_id)
       where m.fixture_id = p_fixture_id
    ) then
      -- Elle bırakılan maç takım takibiyle yeniden eklenmesin
      insert into public.match_unfollows (user_id, fixture_id) values (auth.uid(), p_fixture_id)
      on conflict do nothing;
    end if;
    return false;
  end if;
  delete from public.match_unfollows where user_id = auth.uid() and fixture_id = p_fixture_id;
  -- Döngü 4, bulgu 12: hızlı çift dokunuşta iki çağrı da insert'e ulaşabilir; ikincisi hata vermesin
  insert into public.match_follows (user_id, fixture_id, source) values (auth.uid(), p_fixture_id, 'manual')
  on conflict (user_id, fixture_id) do nothing;
  return true;
end $$;

revoke execute on function public.toggle_follow(bigint) from public, anon;
grant execute on function public.toggle_follow(bigint) to authenticated;

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
  -- Takımı takip etmek son ve açık niyettir: bu takımın maçlarındaki eski "bırakıldı" kayıtları silinir
  delete from public.match_unfollows u
   using public.matches m
   where u.user_id = auth.uid() and m.fixture_id = u.fixture_id
     and m.sport_type = p_sport and (m.home_team_id = p_team_id or m.away_team_id = p_team_id);
  insert into public.match_follows (user_id, fixture_id, source)
  select auth.uid(), m.fixture_id, 'team' from public.matches m
   where m.sport_type = p_sport and m.status_short = 'NS'
     and (m.home_team_id = p_team_id or m.away_team_id = p_team_id)
  on conflict do nothing;
  return true;
end $$;

revoke execute on function public.toggle_team_follow(text, bigint, text, text) from public, anon;
grant execute on function public.toggle_team_follow(text, bigint, text, text) to authenticated;

-- Geçiş: 0015 kuralıyla yazılmış, kullanıcının takımlarından hiçbirine ait olmayan kayıtlar
-- (yalnız elle takip edilip bırakılmış maçlar) silinir; bunlar hiçbir şeyi engellememeli.
delete from public.match_unfollows u
 where not exists (
   select 1 from public.matches m
     join public.team_follows tf
       on tf.user_id = u.user_id and tf.sport_type = m.sport_type and tf.team_id in (m.home_team_id, m.away_team_id)
    where m.fixture_id = u.fixture_id
 );
