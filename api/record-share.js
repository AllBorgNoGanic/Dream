import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_SHARE_BONUS = 3;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Fetch current settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('share_bonus_count, last_share_date, is_pro')
      .eq('user_id', user_id)
      .single();

    if (error || !settings) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Pro users don't need bonuses
    if (settings.is_pro) {
      return res.status(200).json({ bonus_granted: false, reason: 'pro_user', share_bonus_count: settings.share_bonus_count ?? 0 });
    }

    // Check cap
    if ((settings.share_bonus_count ?? 0) >= MAX_SHARE_BONUS) {
      return res.status(200).json({ bonus_granted: false, reason: 'max_reached', share_bonus_count: settings.share_bonus_count });
    }

    // Check 3-day cooldown
    const COOLDOWN_DAYS = 1;
    const now = new Date();
    const lastShare = settings.last_share_date ? new Date(settings.last_share_date) : null;
    const daysSinceLast = lastShare
      ? Math.floor((now - lastShare) / (1000 * 60 * 60 * 24))
      : COOLDOWN_DAYS;
    if (daysSinceLast < COOLDOWN_DAYS) {
      const daysRemaining = COOLDOWN_DAYS - daysSinceLast;
      return res.status(200).json({
        bonus_granted: false,
        reason: 'cooldown',
        share_bonus_count: settings.share_bonus_count,
        days_remaining: daysRemaining,
      });
    }

    // Grant the bonus
    const newCount = (settings.share_bonus_count ?? 0) + 1;
    await supabase
      .from('user_settings')
      .update({ share_bonus_count: newCount, last_share_date: now.toISOString().split('T')[0] })
      .eq('user_id', user_id);

    return res.status(200).json({ bonus_granted: true, share_bonus_count: newCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
