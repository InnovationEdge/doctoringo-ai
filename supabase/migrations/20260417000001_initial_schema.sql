-- Doctoringo AI — Initial Database Schema
-- Tables: profiles, chat_sessions, chat_messages

-- ============================================
-- 1. User Profiles (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  language text default 'EN' check (language in ('EN', 'KA', 'RU')),
  preferences text default '',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    ''
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. Chat Sessions
-- ============================================
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'New Chat',
  share_token text unique,
  is_shared boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index idx_chat_sessions_created_at on public.chat_sessions(created_at desc);
create index idx_chat_sessions_share_token on public.chat_sessions(share_token) where share_token is not null;

-- ============================================
-- 3. Chat Messages
-- ============================================
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index idx_chat_messages_session_id on public.chat_messages(session_id);
create index idx_chat_messages_created_at on public.chat_messages(created_at);

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================

-- Profiles: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Chat Sessions: users can CRUD their own sessions
alter table public.chat_sessions enable row level security;

create policy "Users can view own sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- Shared sessions: anyone can view if is_shared = true
create policy "Anyone can view shared sessions"
  on public.chat_sessions for select
  using (is_shared = true and share_token is not null);

-- Chat Messages: users can CRUD messages in their sessions
alter table public.chat_messages enable row level security;

create policy "Users can view messages in own sessions"
  on public.chat_messages for select
  using (
    session_id in (
      select id from public.chat_sessions where user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own sessions"
  on public.chat_messages for insert
  with check (
    session_id in (
      select id from public.chat_sessions where user_id = auth.uid()
    )
  );

create policy "Users can delete messages in own sessions"
  on public.chat_messages for delete
  using (
    session_id in (
      select id from public.chat_sessions where user_id = auth.uid()
    )
  );

-- Shared messages: anyone can view messages in shared sessions
create policy "Anyone can view messages in shared sessions"
  on public.chat_messages for select
  using (
    session_id in (
      select id from public.chat_sessions where is_shared = true
    )
  );

-- ============================================
-- 5. Updated_at trigger
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger update_chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function public.update_updated_at();
