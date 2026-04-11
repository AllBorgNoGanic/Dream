-- ============================================================
-- Content Moderation: reports, blocked users, auto-hide
-- ============================================================

-- Reports table
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade not null,
  dream_id uuid references dreams(id) on delete cascade,
  comment_id uuid references dream_comments(id) on delete cascade,
  reason text not null,
  created_at timestamptz default now(),
  constraint reports_target_check check (dream_id is not null or comment_id is not null),
  constraint reports_unique_dream unique (reporter_id, dream_id),
  constraint reports_unique_comment unique (reporter_id, comment_id)
);

alter table reports enable row level security;

create policy "Users can submit reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users can view own reports"
  on reports for select
  using (auth.uid() = reporter_id);

-- Blocked users table
create table if not exists blocked_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  blocked_user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  constraint blocked_users_unique unique (user_id, blocked_user_id),
  constraint blocked_users_no_self check (user_id != blocked_user_id)
);

alter table blocked_users enable row level security;

create policy "Users can manage own blocks"
  on blocked_users for all
  using (auth.uid() = user_id);

-- Add report_count to dreams and comments for auto-hide
alter table dreams add column if not exists report_count int default 0;
alter table dream_comments add column if not exists report_count int default 0;

-- Function to increment report count and auto-hide at threshold
create or replace function increment_report_count()
returns trigger as $$
begin
  if NEW.dream_id is not null then
    update dreams
    set report_count = report_count + 1,
        is_public = case when report_count + 1 >= 3 then false else is_public end
    where id = NEW.dream_id;
  end if;

  if NEW.comment_id is not null then
    update dream_comments
    set report_count = report_count + 1
    where id = NEW.comment_id;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_report_created
  after insert on reports
  for each row
  execute function increment_report_count();

-- Update the public dreams select policy to exclude heavily reported content
-- (dreams with 3+ reports are auto-set to is_public=false by the trigger above)
