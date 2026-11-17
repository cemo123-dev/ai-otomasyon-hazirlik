-- Skor+ : "Taktik Asistana Sor" — maç içi bağlamsal mini sohbet (yalnız Pro)
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).
--
-- Kullanıcı başına maç başına 3 soru. Model genel sohbet yapmaz: yalnız maçın hazır
-- dosyasına (match_dossiers, veritabanındaki ön-hesaplanmış veriden derlenir) bakar.
-- Akış: ask_assistant RPC (premium + limit, atomik) → match_chat INSERT → tetikleyici →
--       ask-assistant Edge Function → yanıt aynı satıra yazılır → Realtime ile istemciye.

-- ─────────────────────────────────────────────── maç dosyası önbelleği (yalnız service_role)
create table if not exists public.match_dossiers (
  fixture_id bigint primary key references public.matches (fixture_id) on delete cascade,
  dossier text not null,
  built_at timestamptz not null default now()
);
alter table public.match_dossiers enable row level security; -- politika yok

-- ─────────────────────────────────────────────── sorular ve yanıtlar
create table if not exists public.match_chat (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fixture_id bigint not null references public.matches (fixture_id) on delete cascade,
  question text not null check (char_length(question) between 3 and 200),
  answer text,
  status text not null default 'pending' check (status in ('pending', 'answered', 'failed')),
  model text,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);
create index if not exists match_chat_user_fixture_idx on public.match_chat (user_id, fixture_id, created_at);
alter table public.match_chat enable row level security;

drop policy if exists "match_chat: kendi sorularını okur" on public.match_chat;
create policy "match_chat: kendi sorularını okur"
  on public.match_chat for select to authenticated
  using (user_id = (select auth.uid()));

-- Yanıt Realtime ile gelir (RLS: kullanıcı yalnız kendi satırlarını alır)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'match_chat'
  ) then
    alter publication supabase_realtime add table public.match_chat;
  end if;
end $$;

-- Yeni soru → ask-assistant
create or replace function public.dispatch_chat()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_edge_function('ask-assistant', jsonb_build_object('message_id', new.id));
  return new;
end $$;

revoke execute on function public.dispatch_chat() from public, anon, authenticated;

drop trigger if exists on_match_chat_created on public.match_chat;
create trigger on_match_chat_created
  after insert on public.match_chat
  for each row execute function public.dispatch_chat();

-- ─────────────────────────────────────────────── RPC: ask_assistant
-- Dönüş: 'unauthenticated' | 'not_found' | 'not_ready' | 'paywall_blocked' | 'invalid'
--        | 'limit_reached' | 'busy' | 'queued'
-- Başarısız (failed) sorular hakka sayılmaz.
create or replace function public.ask_assistant(p_fixture_id bigint, p_question text)
returns text language plpgsql security definer set search_path = public as $$
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

  if exists (select 1 from public.match_chat
              where user_id = auth.uid() and fixture_id = p_fixture_id and status = 'pending'
                and created_at > now() - interval '2 minutes') then
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
