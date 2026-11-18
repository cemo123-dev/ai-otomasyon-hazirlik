-- Skor+ : ortak API-Sports kotası (günde 100 istek) için zamanlama
-- API-Football ve API-NBA aynı kotayı paylaşır. Tahmini kullanım ~80 istek/gün:
--   Futbol canlı  : TSİ 15:00-01:30, 30 dk'da bir           ~22 + biten maç detayları
--   Futbol fikstür: günde 1 (TSİ 12:00)                     ~3  + biten maç detayları
--   NBA canlı     : TSİ 02:00-09:30, 30 dk'da bir           ~16 + biten maç kutu skorları
--   NBA fikstür   : günde 1 (TSİ 23:00)                     ~3
-- Edge Function'lardaki kota bekçisi ayrıca futbolun gece NBA için 45 istek bırakmasını sağlar.
-- Ücretli geçiş: yalnız 0018 prosedürü (docs/ucretli-gecis.md; 0019 gerekir); nba-sync-live'a dokunmayın.

select cron.unschedule(jobid) from cron.job
 where jobname in ('skor-sync-live', 'skor-sync-schedule', 'nba-sync-live', 'nba-sync-schedule');

-- pg_cron UTC çalışır (TSİ = UTC+3)
select cron.schedule('skor-sync-live', '*/30 12-22 * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"live"}'::jsonb) $$);

select cron.schedule('skor-sync-schedule', '0 9 * * *',
  $$ select public.call_edge_function('sync-matches', '{"mode":"schedule"}'::jsonb) $$);

select cron.schedule('nba-sync-live', '*/30 23,0-6 * * *',
  $$ select public.call_edge_function('sync-nba', '{"mode":"live"}'::jsonb) $$);

select cron.schedule('nba-sync-schedule', '0 20 * * *',
  $$ select public.call_edge_function('sync-nba', '{"mode":"schedule"}'::jsonb) $$);
