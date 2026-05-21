-- ============================================================
-- Drop the legacy user_settings.archetype text column.
--
-- This column stored derived archetype names ("Pilgrim", "Healer", etc.)
-- from the original 9-screen onboarding quiz. The archetype concept was
-- removed end-to-end earlier in the project (see deleted
-- src/constants/archetypes.js) and no code reads this column anymore.
-- The companion archetype_data jsonb column stays, since it still feeds
-- the AI interpretation prompt via the Personalization card.
--
-- Verified clean before dropping:
--   grep -rn "\.archetype\b" src/  → no hits outside archetype_data
--
-- Run in Supabase Dashboard > SQL Editor (idempotent, safe to re-run).
-- ============================================================

alter table user_settings drop column if exists archetype;
