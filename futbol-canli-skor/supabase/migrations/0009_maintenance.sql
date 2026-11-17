-- Skor+ : bakım — eksik indeksler ve büyüyen tablolar için günlük temizlik
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).

-- ─────────────────────────────────────────────── performans danışmanı: indekssiz yabancı anahtarlar
create index if not exists match_alert_analyses_fixture_idx on public.match_alert_analyses (fixture_id);
-- Realtime filtresi ve kaskad silme fixture_id ile çalışır
create index if not exists match_chat_fixture_idx on public.match_chat (fixture_id);

-- ─────────────────────────────────────────────── günlük temizlik
-- Kullanıcıya görünen içerik (analizler, raporlar, sohbet geçmişi) silinmez;
-- yalnız kuyruk/ara tablolar ve kısa ömürlü veriler temizlenir.
create or replace function public.run_maintenance()
returns jsonb language plpgsql security definer set search_path = public as $$
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
  delete from public.match_alerts where created_at < now() - interval '30 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_alerts', n);

  -- Başarısız (hakka sayılmayan) sohbet satırları
  delete from public.match_chat where status = 'failed' and created_at < now() - interval '7 days';
  get diagnostics n = row_count; v := v || jsonb_build_object('match_chat_failed', n);

  return v;
end $$;

revoke execute on function public.run_maintenance() from public, anon, authenticated;

-- Her gün 04:30 UTC (TSİ 07:30; maç saatleri dışı)
select cron.unschedule('skor-maintenance') where exists (select 1 from cron.job where jobname = 'skor-maintenance');
select cron.schedule('skor-maintenance', '30 4 * * *', $$select public.run_maintenance()$$);

-- ─────────────────────────────────────────────── AI maliyet panosu
-- Günlük ve özellik bazında Gemini kullanımı. Yalnız SQL Editor / service_role okur.
-- Tahmini maliyet için: select * from public.ai_usage_daily order by gun desc;
create or replace view public.ai_usage_daily
with (security_invoker = true) as
select date_trunc('day', created_at)::date as gun, ozellik, model,
       count(*) as cagri, sum(input_tokens) as giris_token, sum(output_tokens) as cikis_token
  from (
    select 'mac_sonu_analiz' as ozellik, model, input_tokens, output_tokens, created_at from public.match_analyses
    union all select 'mac_onu', model, input_tokens, output_tokens, created_at from public.match_previews
    union all select 'devre_arasi', model, input_tokens, output_tokens, created_at from public.match_halftime_reports
    union all select 'kirmizi_kart', model, input_tokens, output_tokens, created_at from public.match_alert_analyses
    union all select 'asistan', model, input_tokens, output_tokens, created_at from public.match_chat where model is not null
  ) u
 group by 1, 2, 3;

revoke all on public.ai_usage_daily from anon, authenticated;
