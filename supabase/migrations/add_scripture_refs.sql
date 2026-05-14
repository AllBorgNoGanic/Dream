-- ============================================================
-- Scripture connections: store biblical verse references tied to a dream's
-- interpretation so the reading modal can render a "Scripture Connections"
-- card alongside the AI reading and detected symbols.
--
-- Run in Supabase Dashboard > SQL Editor (idempotent, safe to re-run).
-- ============================================================

alter table dreams add column if not exists scripture_refs text[]
  default array[]::text[];

-- Note: format is "Book Chapter:Verse" (e.g. "Psalm 23:4", "John 10:11").
-- The AI is instructed to return 0 to 3 refs per interpretation.
