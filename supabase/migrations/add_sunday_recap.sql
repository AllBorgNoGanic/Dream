-- ============================================================
-- Sunday Recap: track the last Sunday a user saw the weekly recap card
-- on the Journal tab so the card appears once per Sunday in the user's
-- local timezone.
--
-- Run in Supabase Dashboard > SQL Editor (idempotent, safe to re-run).
-- ============================================================

alter table user_settings
  add column if not exists last_sunday_recap_seen text;

-- Stored as a YYYY-MM-DD string representing Sunday's local date. Written
-- client-side, same pattern as morning_card_last_seen, to avoid server vs
-- client timezone drift.
