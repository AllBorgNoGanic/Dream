-- ============================================================
-- Morning with the Shepherd: track the last date each user saw or dismissed
-- the daily devotional card on the Journal tab, so the card shows once per
-- local day and stays out of the way after.
--
-- Run in Supabase Dashboard > SQL Editor (idempotent, safe to re-run).
-- ============================================================

alter table user_settings
  add column if not exists morning_card_last_seen text;

-- Stored as a YYYY-MM-DD string in the user's local date, written client-side.
-- Using text (not date) avoids server-vs-client timezone drift: when the
-- user wakes up at 6am in their timezone, that is "today" for them regardless
-- of the server's clock.
