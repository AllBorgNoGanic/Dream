-- ============================================================
-- DREAMSCAPE — Full Schema (idempotent — safe to re-run)
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ========== DREAMS TABLE ==========

create table if not exists dreams (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        references auth.users(id) not null,
  title          text        not null,
  description    text        not null,
  mood           text,
  theme          text,
  symbols        text[]      default '{}',
  tags           text[]      default '{}',
  characters     text[]      default '{}',
  interpretation text,
  is_lucid       boolean     default false,
  lucidity_level int         default 0,
  sleep_quality  int,
  bed_time       timestamptz,
  wake_time      timestamptz,
  sleep_hours    numeric(4,2),
  is_public      boolean     default false,
  likes_count    int         default 0,
  created_at     timestamptz default now()
);

-- Patch any missing columns on existing dreams table
alter table dreams add column if not exists symbols        text[]      default '{}';
alter table dreams add column if not exists tags           text[]      default '{}';
alter table dreams add column if not exists characters     text[]      default '{}';
alter table dreams add column if not exists interpretation text;
alter table dreams add column if not exists is_lucid       boolean     default false;
alter table dreams add column if not exists lucidity_level int         default 0;
alter table dreams add column if not exists sleep_quality  int;
alter table dreams add column if not exists bed_time       timestamptz;
alter table dreams add column if not exists wake_time      timestamptz;
alter table dreams add column if not exists sleep_hours    numeric(4,2);
alter table dreams add column if not exists is_public      boolean     default false;
alter table dreams add column if not exists likes_count    int         default 0;
alter table dreams add column if not exists dream_signs    text[]      default '{}';
alter table dreams add column if not exists lucid_trigger  text;
alter table dreams add column if not exists lucid_activity text;
alter table dreams add column if not exists lucid_duration text;

alter table dreams enable row level security;

drop policy if exists "Users can view own dreams"    on dreams;
drop policy if exists "Users can view public dreams" on dreams;
drop policy if exists "Users can insert own dreams"  on dreams;
drop policy if exists "Users can update own dreams"  on dreams;
drop policy if exists "Users can delete own dreams"  on dreams;

create policy "Users can view own dreams"    on dreams for select using (auth.uid() = user_id);
create policy "Users can view public dreams" on dreams for select using (is_public = true);
create policy "Users can insert own dreams"  on dreams for insert with check (auth.uid() = user_id);
create policy "Users can update own dreams"  on dreams for update using (auth.uid() = user_id);
create policy "Users can delete own dreams"  on dreams for delete using (auth.uid() = user_id);

-- ========== USER SETTINGS ==========

create table if not exists user_settings (
  user_id              uuid        primary key references auth.users(id),
  interpretation_count int         default 0,
  is_pro               boolean     default false,
  stripe_customer_id   text,
  display_name         text,
  avatar_url           text,
  archetype            text,
  archetype_data       jsonb       default '{}',
  wake_time            text        default '07:00',
  reminder_enabled     boolean     default false,
  streak_current       int         default 0,
  streak_longest       int         default 0,
  last_dream_date      date,
  onboarding_completed boolean     default false,
  created_at           timestamptz default now()
);

-- Patch any missing columns on existing user_settings table
alter table user_settings add column if not exists stripe_customer_id   text;
alter table user_settings add column if not exists display_name         text;
alter table user_settings add column if not exists avatar_url           text;
alter table user_settings add column if not exists archetype            text;
alter table user_settings add column if not exists archetype_data       jsonb   default '{}';
alter table user_settings add column if not exists wake_time            text    default '07:00';
alter table user_settings add column if not exists reminder_enabled     boolean default false;
alter table user_settings add column if not exists streak_current       int     default 0;
alter table user_settings add column if not exists streak_longest       int     default 0;
alter table user_settings add column if not exists last_dream_date      date;
alter table user_settings add column if not exists onboarding_completed boolean default false;

alter table user_settings enable row level security;

drop policy if exists "Users can view own settings"   on user_settings;
drop policy if exists "Users can update own settings" on user_settings;
drop policy if exists "Users can insert own settings" on user_settings;

create policy "Users can view own settings"   on user_settings for select using (auth.uid() = user_id);
create policy "Users can update own settings" on user_settings for update using (auth.uid() = user_id);
create policy "Users can insert own settings" on user_settings for insert with check (auth.uid() = user_id);

-- ========== DREAM LIKES ==========

create table if not exists dream_likes (
  id         uuid        primary key default gen_random_uuid(),
  dream_id   uuid        references dreams(id) on delete cascade not null,
  user_id    uuid        references auth.users(id) not null,
  created_at timestamptz default now(),
  unique(dream_id, user_id)
);

alter table dream_likes enable row level security;

drop policy if exists "Users can view likes"       on dream_likes;
drop policy if exists "Users can insert own likes" on dream_likes;
drop policy if exists "Users can delete own likes" on dream_likes;

create policy "Users can view likes"       on dream_likes for select using (true);
create policy "Users can insert own likes" on dream_likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes" on dream_likes for delete using (auth.uid() = user_id);

-- ========== DREAM COMMENTS ==========

create table if not exists dream_comments (
  id         uuid        primary key default gen_random_uuid(),
  dream_id   uuid        references dreams(id) on delete cascade not null,
  user_id    uuid        references auth.users(id) not null,
  content    text        not null,
  created_at timestamptz default now()
);

alter table dream_comments enable row level security;

drop policy if exists "Users can view comments"       on dream_comments;
drop policy if exists "Users can insert comments"     on dream_comments;
drop policy if exists "Users can delete own comments" on dream_comments;

create policy "Users can view comments"       on dream_comments for select using (true);
create policy "Users can insert comments"     on dream_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on dream_comments for delete using (auth.uid() = user_id);

-- ========== SLEEP LOGS ==========

create table if not exists sleep_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) not null,
  date        date        not null,
  bed_time    timestamptz,
  wake_time   timestamptz,
  sleep_hours numeric(4,2),
  quality     int,
  notes       text,
  created_at  timestamptz default now(),
  unique(user_id, date)
);

alter table sleep_logs enable row level security;

drop policy if exists "Users can view own sleep logs"   on sleep_logs;
drop policy if exists "Users can insert own sleep logs" on sleep_logs;
drop policy if exists "Users can update own sleep logs" on sleep_logs;

create policy "Users can view own sleep logs"   on sleep_logs for select using (auth.uid() = user_id);
create policy "Users can insert own sleep logs" on sleep_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own sleep logs" on sleep_logs for update using (auth.uid() = user_id);

-- ========== INDEXES ==========

create index if not exists idx_dreams_user_id       on dreams(user_id);
create index if not exists idx_dreams_created_at    on dreams(created_at desc);
create index if not exists idx_dreams_public        on dreams(is_public) where is_public = true;
create index if not exists idx_dream_likes_dream    on dream_likes(dream_id);
create index if not exists idx_dream_comments_dream on dream_comments(dream_id);
create index if not exists idx_sleep_logs_user_date on sleep_logs(user_id, date desc);

-- ========== STREAK FUNCTION ==========

create or replace function update_dream_streak(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_last_date date;
  v_current   int;
  v_longest   int;
  v_today     date := current_date;
begin
  select last_dream_date, streak_current, streak_longest
    into v_last_date, v_current, v_longest
    from user_settings
   where user_id = p_user_id;

  -- Already logged today — nothing to do
  if v_last_date = v_today then
    return;
  end if;

  -- Yesterday → extend streak; anything older → reset to 1
  if v_last_date = v_today - interval '1 day' then
    v_current := coalesce(v_current, 0) + 1;
  else
    v_current := 1;
  end if;

  v_longest := greatest(coalesce(v_longest, 0), v_current);

  update user_settings
     set streak_current  = v_current,
         streak_longest  = v_longest,
         last_dream_date = v_today
   where user_id = p_user_id;
end;
$$;
