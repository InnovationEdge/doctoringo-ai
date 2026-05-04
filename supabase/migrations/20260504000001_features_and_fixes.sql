-- Doctoringo AI — Feature schema (search, share, upload, country, billing)
--
-- Adds the columns the Edge Function already writes (was inserting fields
-- that did not exist!), full-text search support over chat content, a
-- storage bucket for chat attachments, and a `subscriptions` table that
-- the rate limiter reads.

-- ============================================
-- 1. Required pg extensions
-- ============================================
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ============================================
-- 2. profiles.country_code
-- ============================================
alter table public.profiles
  add column if not exists country_code text default 'GE';

create index if not exists idx_profiles_country_code on public.profiles(country_code);

-- ============================================
-- 3. chat_messages — telemetry & emergency flag
-- ============================================
alter table public.chat_messages
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists is_emergency boolean default false,
  add column if not exists model text,
  add column if not exists prompt_tokens integer default 0,
  add column if not exists completion_tokens integer default 0,
  add column if not exists reasoning_tokens integer default 0,
  add column if not exists cost_usd numeric(10, 6) default 0;

-- Backfill user_id for existing rows from the parent session.
update public.chat_messages m
set user_id = s.user_id
from public.chat_sessions s
where m.session_id = s.id
  and m.user_id is null;

create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);
create index if not exists idx_chat_messages_user_role_date
  on public.chat_messages(user_id, role, created_at desc);

-- Trigram index on content for the search Edge Function.
create index if not exists idx_chat_messages_content_trgm
  on public.chat_messages
  using gin (content gin_trgm_ops);

-- ============================================
-- 4. subscriptions table (used by chat rate limiter)
-- ============================================
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'free' check (status in ('free', 'paid', 'trial', 'past_due')),
  plan_name text,
  current_period_end timestamptz,
  auto_renew boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS, so the Edge Function can write freely.

create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();

-- ============================================
-- 5. chat-uploads storage bucket
-- ============================================
-- Idempotent bucket create.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-uploads',
  'chat-uploads',
  false,
  10485760, -- 10 MB
  array[
    'image/png','image/jpeg','image/webp','image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- Each user gets a folder named after their auth.uid().
-- Postgres has no CREATE POLICY IF NOT EXISTS, so wrap in DO blocks.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users upload to own folder'
  ) then
    create policy "Users upload to own folder"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'chat-uploads'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users read own files'
  ) then
    create policy "Users read own files"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'chat-uploads'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users delete own files'
  ) then
    create policy "Users delete own files"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'chat-uploads'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- ============================================
-- 6. Search RPC — used by /functions/v1/search
-- ============================================
-- Returns sessions whose title or any message content matches the query,
-- ordered by best match. Constrained to the calling user via auth.uid().
create or replace function public.search_chat_sessions(q text)
returns table (
  id uuid,
  title text,
  snippet text,
  updated_at timestamptz,
  score real
) as $$
  with hits as (
    select
      s.id,
      s.title,
      s.updated_at,
      greatest(
        similarity(coalesce(s.title, ''), q),
        coalesce(
          (select max(similarity(m.content, q))
           from public.chat_messages m
           where m.session_id = s.id),
          0
        )
      )::real as score,
      (
        select substr(m.content, 1, 200)
        from public.chat_messages m
        where m.session_id = s.id
          and m.content ilike '%' || q || '%'
        order by m.created_at desc
        limit 1
      ) as snippet
    from public.chat_sessions s
    where s.user_id = auth.uid()
  )
  select id, title, snippet, updated_at, score
  from hits
  where score > 0.1 or snippet is not null
  order by score desc, updated_at desc
  limit 50;
$$ language sql stable security definer set search_path = public;

revoke all on function public.search_chat_sessions(text) from public;
grant execute on function public.search_chat_sessions(text) to authenticated;
