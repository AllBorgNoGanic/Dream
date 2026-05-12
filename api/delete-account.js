import { createClient } from '@supabase/supabase-js';

// Service-role client. Used as a fallback if the RPC isn't available.
// Required env vars on Vercel:
//   SUPABASE_URL (or VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY
const adminClient = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the caller is the actual signed-in user. Reject anonymous calls.
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  let userId;
  try {
    const { data, error } = await adminClient.auth.getUser(token);
    if (error || !data?.user) throw error || new Error('Invalid token');
    userId = data.user.id;
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    // Delete user-owned rows in FK-safe order.
    await adminClient.from('dream_likes').delete().eq('user_id', userId);
    await adminClient.from('dream_comments').delete().eq('user_id', userId);
    await adminClient.from('sleep_logs').delete().eq('user_id', userId);
    await adminClient.from('reports').delete().eq('reporter_id', userId);
    await adminClient.from('blocked_users').delete().or(`user_id.eq.${userId},blocked_user_id.eq.${userId}`);
    await adminClient.from('dreams').delete().eq('user_id', userId);
    await adminClient.from('user_settings').delete().eq('user_id', userId);

    // Finally delete the auth user.
    const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return res.status(200).json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Deletion failed' });
  }
}
