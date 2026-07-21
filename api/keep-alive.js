// Keep-alive endpoint to prevent Supabase from pausing the project.
//
// Supabase free-tier projects are paused after 7 days with no activity.
// A single lightweight query resets that inactivity timer, so a daily
// Vercel Cron hit here keeps the database awake. See the "crons" entry
// in vercel.json (runs once per day).
//
// Env vars (already configured on Vercel):
//   - SUPABASE_URL or VITE_SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - CRON_SECRET (optional). If set, Vercel sends it as a Bearer token
//     on cron invocations and we reject requests that don't match, so the
//     endpoint can't be triggered by strangers.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // If a CRON_SECRET is configured, only allow authorized callers.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // A trivial read that still touches Postgres, which counts as activity.
    const { error } = await supabase
      .from('user_settings')
      .select('user_id', { head: true, count: 'exact' });
    if (error) throw error;

    return res.status(200).json({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'keep-alive failed' });
  }
}
