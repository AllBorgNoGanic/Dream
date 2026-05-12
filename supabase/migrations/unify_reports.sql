-- ============================================================
-- UNIFY REPORTS: extend the existing `reports` table to also cover
-- AI interpretation reports, then drop the standalone `dream_reports`
-- table created in add_account_deletion_and_reports.sql.
--
-- Run in Supabase Dashboard > SQL Editor (idempotent, safe to re-run).
-- ============================================================

-- ========== EXTEND `reports` ==========

-- New columns: pointer to the dream whose interpretation is being
-- reported, plus optional free-text details from the reporter.
alter table reports add column if not exists interpretation_dream_id uuid
  references dreams(id) on delete cascade;
alter table reports add column if not exists details text;

-- Replace the old target check so a row can target any of the three:
-- a community dream, a comment, or an AI interpretation.
alter table reports drop constraint if exists reports_target_check;
alter table reports add constraint reports_target_check check (
  dream_id is not null
  or comment_id is not null
  or interpretation_dream_id is not null
);

-- Prevent a user from filing more than one interpretation report on the
-- same dream. (The unique constraints on dream_id and comment_id already
-- exist from the original migration.)
alter table reports drop constraint if exists reports_unique_interpretation;
alter table reports add constraint reports_unique_interpretation
  unique (reporter_id, interpretation_dream_id);

create index if not exists idx_reports_interpretation
  on reports(interpretation_dream_id)
  where interpretation_dream_id is not null;

-- ========== TRIGGER UPDATE ==========
-- The increment_report_count trigger auto-hides community dreams at 3
-- reports. We DO NOT want interpretation reports to auto-hide the dream
-- itself, so explicitly skip the bump when interpretation_dream_id is set.

create or replace function increment_report_count()
returns trigger as $$
begin
  -- Community dream report: bump count on the dream, auto-hide at 3
  if NEW.dream_id is not null then
    update dreams
    set report_count = report_count + 1,
        is_public = case when report_count + 1 >= 3 then false else is_public end
    where id = NEW.dream_id;
  end if;

  -- Comment report: bump count on the comment
  if NEW.comment_id is not null then
    update dream_comments
    set report_count = report_count + 1
    where id = NEW.comment_id;
  end if;

  -- Interpretation report: no auto-hide, just stored for moderation review
  -- (intentionally a no-op here)

  return NEW;
end;
$$ language plpgsql security definer;

-- ========== DATA MIGRATION FROM dream_reports ==========
-- Move any rows from the deprecated `dream_reports` table into `reports`,
-- but only if `dream_reports` actually exists (re-run safety).

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'dream_reports'
  ) then
    -- Insert interpretation-type rows from dream_reports into reports.
    -- ON CONFLICT swallows the case where a user already reported the
    -- same interpretation through both flows.
    insert into reports (reporter_id, interpretation_dream_id, reason, details, created_at)
    select reporter_id, target_dream_id, reason, details, created_at
    from dream_reports
    where target_type = 'interpretation' and target_dream_id is not null
    on conflict on constraint reports_unique_interpretation do nothing;

    -- Community-post rows from dream_reports become regular dream reports.
    insert into reports (reporter_id, dream_id, reason, created_at)
    select reporter_id, target_dream_id, reason, created_at
    from dream_reports
    where target_type = 'community_post' and target_dream_id is not null
    on conflict on constraint reports_unique_dream do nothing;

    drop table dream_reports;
  end if;
end $$;

-- ========== UPDATE delete_my_account RPC ==========
-- Remove the explicit dream_reports delete (table is gone) and rely on
-- the existing ON DELETE CASCADE from auth.users -> reports.reporter_id.

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from dream_likes      where user_id = v_user_id;
  delete from dream_comments   where user_id = v_user_id;
  delete from sleep_logs       where user_id = v_user_id;
  delete from reports          where reporter_id = v_user_id;
  delete from blocked_users    where user_id = v_user_id or blocked_user_id = v_user_id;
  delete from dreams           where user_id = v_user_id;
  delete from user_settings    where user_id = v_user_id;
  delete from auth.users       where id = v_user_id;
end;
$$;

revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;
