-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================
-- DREAMSCAPE — Full Schema
-- ============================================================

-- ========== DREAMS TABLE ==========

create table if not exists dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text not null,
  mood text,
  theme text,
  symbols text[] default '{}',
  tags text[] default '{}',
  characters text[] default '{}',
  interpretation text,
  is_lucid boolean default false,
  lucidity_level int default 0,
  sleep_quality int,
  bed_time timestamptz,
  wake_time timestamptz,
  sleep_hours numeric(4,2),
  is_public boolean default false,
  likes_count int default 0,
  created_at timestamptz default now()
);

alter table dreams enable row level security;

create policy "Users can view own dreams" on dreams for select using (auth.uid() = user_id);
create policy "Users can view public dreams" on dreams for select using (is_public = true);
create policy "Users can insert own dreams" on dreams for insert with check (auth.uid() = user_id);
create policy "Users can update own dreams" on dreams for update using (auth.uid() = user_id);
create policy "Users can delete own dreams" on dreams for delete using (auth.uid() = user_id);

-- ========== USER SETTINGS ==========

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id),
  interpretation_count int default 0,
  is_pro boolean default false,
  stripe_customer_id text,
  display_name text,
  avatar_url text,
  archetype text,
  archetype_data jsonb default '{}',
  wake_time text default '07:00',
  reminder_enabled boolean default false,
  streak_current int default 0,
  streak_longest int default 0,
  last_dream_date date,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Users can view own settings" on user_settings for select using (auth.uid() = user_id);
create policy "Users can update own settings" on user_settings for update using (auth.uid() = user_id);
create policy "Users can insert own settings" on user_settings for insert with check (auth.uid() = user_id);

-- ========== DREAM LIKES ==========

create table if not exists dream_likes (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid references dreams(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  unique(dream_id, user_id)
);

alter table dream_likes enable row level security;

create policy "Users can view likes" on dream_likes for select using (true);
create policy "Users can insert own likes" on dream_likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes" on dream_likes for delete using (auth.uid() = user_id);

-- ========== DREAM COMMENTS ==========

create table if not exists dream_comments (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid references dreams(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table dream_comments enable row level security;

create policy "Users can view comments" on dream_comments for select using (true);
create policy "Users can insert comments" on dream_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on dream_comments for delete using (auth.uid() = user_id);

-- ========== SLEEP LOG ==========

create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  date date not null,
  bed_time timestamptz,
  wake_time timestamptz,
  sleep_hours numeric(4,2),
  quality int,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table sleep_logs enable row level security;

create policy "Users can view own sleep logs" on sleep_logs for select using (auth.uid() = user_id);
create policy "Users can insert own sleep logs" on sleep_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own sleep logs" on sleep_logs for update using (auth.uid() = user_id);

-- ========== INDEXES ==========

create index if not exists idx_dreams_user_id on dreams(user_id);
create index if not exists idx_dreams_created_at on dreams(created_at desc);
create index if not exists idx_dreams_public on dreams(is_public) where is_public = true;
create index if not exists idx_dream_likes_dream on dream_likes(dream_id);
create index if not exists idx_dream_comments_dream on dream_comments(dream_id);
create index if not exists idx_sleep_logs_user_date on sleep_logs(user_id, date desc);

-- ========== STREAK FUNCTION ==========

create or replace function update_dream_streak(p_user_id uuid)
returns void as $$
declare
  v_last_date date;
  v_current_streak int;
  v_longest_streak int;
  v_today date := current_date;
begin
  select last_dream_date, streak_current, streak_longest
  into v_last_date, v_current_streak, v_longest_streak
  from user_settings where user_id = p_user_id;

  if v_last_date = v_today then
    return;
  elsif v_last_date = v_today - 1 then
    v_current_streak := v_current_streak + 1;
  else
    v_current_streak := 1;
  end if;

  if v_current_streak > v_longest_streak then
    v_longest_streak := v_current_streak;
  end if;

  update user_settings
  set streak_current = v_current_streak,
      streak_longest = v_longest_streak,
      last_dream_date = v_today
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;
