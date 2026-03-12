-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Dreams table
create table dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text not null,
  mood text,
  theme text,
  symbols text[] default '{}',
  interpretation text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table dreams enable row level security;

-- Users can only read their own dreams
create policy "Users can view own dreams"
  on dreams for select
  using (auth.uid() = user_id);

-- Users can only insert their own dreams
create policy "Users can insert own dreams"
  on dreams for insert
  with check (auth.uid() = user_id);

-- User settings table (freemium tracking)
create table user_settings (
  user_id uuid primary key references auth.users(id),
  interpretation_count int default 0,
  is_pro boolean default false,
  stripe_customer_id text,
  created_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);
