import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, image_base64 } = req.body;
  if (!user_id || !image_base64) {
    return res.status(400).json({ error: 'user_id and image_base64 are required' });
  }

  // Reject oversized payloads (~2MB base64 ≈ ~1.5MB image)
  if (image_base64.length > 2 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large. Please use a smaller photo.' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  try {
    // ── Step 1: Moderate with Claude Haiku ──────────────────────────────
    const moderationResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image_base64,
              },
            },
            {
              type: 'text',
              text: 'Is this image appropriate as a profile photo in a family-friendly Christian app? Check for nudity, sexual content, violence, gore, hate symbols, offensive gestures, drug use, or other inappropriate content. Respond with ONLY the word "PASS" or "FAIL". Nothing else.',
            },
          ],
        }],
      }),
    });

    if (!moderationResponse.ok) {
      const errBody = await moderationResponse.text();
      console.error('Anthropic API error:', moderationResponse.status, errBody);
      return res.status(500).json({ error: 'Moderation service unavailable. Please try again.' });
    }

    const moderationData = await moderationResponse.json();
    const verdict = (moderationData.content?.[0]?.text || '').trim().toUpperCase();

    if (!verdict.startsWith('PASS')) {
      return res.status(200).json({
        success: false,
        reason: 'This photo does not meet our community guidelines. Please choose a different image.',
      });
    }

    // ── Step 2: Upload to Supabase Storage ─────────────────────────────
    // Ensure the avatars bucket exists (idempotent, ignores "already exists")
    await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    }).catch(() => {});

    const fileName = `${user_id}.jpg`;
    const buffer = Buffer.from(image_base64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image.' });
    }

    // Build the public URL with a cache-busting timestamp
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const avatarUrl = urlData.publicUrl + '?t=' + Date.now();

    // ── Step 3: Update user_settings ───────────────────────────────────
    const { error: updateError } = await supabase
      .from('user_settings')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Settings update error:', updateError);
      return res.status(500).json({ error: 'Failed to update profile.' });
    }

    return res.status(200).json({ success: true, avatar_url: avatarUrl });
  } catch (err) {
    console.error('Avatar moderation error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
