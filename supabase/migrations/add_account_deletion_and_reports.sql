-- ============================================================
-- ACCOUNT DELETION + AI CONTENT REPORTING
-- App Store Guidelines 5.1.1(v) and 1.2/4.7
-- Run in Supabase Dashboard > SQL Editor (idempotent, safe to re-run).
--
-- NOTE: AI interpretation reports were originally stored in their own
-- `dream_reports` table. Those rows have since been unified into the
-- `reports` table by `unify_reports.sql`. This file no longer creates
-- `dream_reports`. If you are setting up a fresh project, run this file
-- followed by `unify_reports.sql`.
-- ============================================================

-- ========== ACCOUNT DELETION RPC ==========
-- Allows a signed-in user to delete their own account end-to-end.
-- Wraps the work in a SECURITY DEFINER function so the deletion of auth.users
-- works through the standard Supabase JS client (no service role key in the app).

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

  -- Delete in dependency-safe order. Likes and comments on the user's own
  -- dreams cascade via FK ON DELETE CASCADE on dreams. The deletes below
  -- handle records the user created against OTHER users' content.
  delete from dream_likes      where user_id = v_user_id;
  delete from dream_comments   where user_id = v_user_id;
  delete from sleep_logs       where user_id = v_user_id;
  delete from reports          where reporter_id = v_user_id;
  delete from dreams           where user_id = v_user_id;
  delete from user_settings    where user_id = v_user_id;

  -- Finally, remove the auth row. This requires the function to be
  -- SECURITY DEFINER and owned by a role with delete privileges on auth.users.
  delete from auth.users       where id = v_user_id;
end;
$$;

revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;
