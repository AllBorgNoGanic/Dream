-- ============================================================
-- DEMO ACCOUNT SEED for App Store / Play Store review
-- Run AFTER manually creating the demo user in Supabase Auth.
-- 1. Supabase Dashboard > Authentication > Add user
--    Email: review@dreamshepherd.app
--    Password: (generate something strong, save in App Store Connect notes)
-- 2. Replace the UUID in the DECLARE block below with the user's UUID and run
--    in Supabase Dashboard > SQL Editor.
-- ============================================================

do $$
declare
  demo_user_id uuid := 'c8e4825c-f763-4800-87f4-f635b2e1f439';
begin

-- Settings: completed onboarding, named demo user, mid-streak, free tier
insert into user_settings (
  user_id, display_name, age, archetype, wake_time, reminder_enabled,
  streak_current, streak_longest, last_dream_date, onboarding_completed,
  interpretation_count, share_bonus_count, is_pro
) values (
  demo_user_id, 'Reviewer', 32, 'Wanderer', '07:00', false,
  4, 12, current_date - 1, true,
  2, 0, false
)
on conflict (user_id) do update set
  display_name = excluded.display_name,
  archetype = excluded.archetype,
  streak_current = excluded.streak_current,
  streak_longest = excluded.streak_longest,
  last_dream_date = excluded.last_dream_date,
  onboarding_completed = true;

-- Eight sample dreams across moods, themes, lucid + non-lucid, with one interpretation
insert into dreams (user_id, title, description, mood, theme, symbols, tags, characters, interpretation, is_lucid, sleep_quality, sleep_hours, is_public, created_at, generated_themes)
values
(demo_user_id,
  'The lighthouse on the cliff',
  'I stood on a cliff at night, watching a lighthouse beam sweep across dark water. Each pass revealed a small fishing boat further out than the last. I felt safe, as if the light was meant for me.',
  'peaceful', 'Guidance',
  array['light', 'water', 'ocean'],
  array['hope', 'direction'],
  array[]::text[],
  'Light scanning across darkness often reflects a longing for direction. The boat moving further out suggests trust that you can travel into uncertainty when something steady remains behind you.',
  false, 4, 7.5, false, now() - interval '1 day',
  '[{"title":"Steady direction in uncertainty","symbol":"💡","meaning":"Light reaching across dark water often reflects a guiding presence felt during transition.","guidance":"Notice what feels like a steady reference point this week and lean toward it."}]'::jsonb),

(demo_user_id,
  'Climbing stairs that never ended',
  'A spiral staircase made of warm stone. Every flight looked the same as the last. I was tired but not afraid.',
  'reflective', 'Persistence',
  array['house'],
  array['effort', 'patience'],
  array[]::text[],
  null,
  false, 3, 6.0, false, now() - interval '2 days',
  '[]'::jsonb),

(demo_user_id,
  'A dove landed on my hand',
  'I was in a garden and a white dove circled me twice before settling on my open palm. It was warm and very still.',
  'hopeful', 'Peace',
  array['dove', 'light'],
  array['comfort', 'reassurance'],
  array[]::text[],
  null,
  false, 5, 8.0, true, now() - interval '3 days',
  '[]'::jsonb),

(demo_user_id,
  'Lost in an unfamiliar city',
  'Streets that looked like home but the names were wrong. I kept asking strangers for directions and they smiled but answered in a language I could not place.',
  'uneasy', 'Confusion',
  array[]::text[],
  array['searching', 'transition'],
  array['stranger'],
  null,
  false, 2, 5.5, false, now() - interval '5 days',
  '[]'::jsonb),

(demo_user_id,
  'Flying low over fields',
  'I realized I was flying. I tested it by skimming low over wheat fields and the stalks brushed my fingertips. I knew it was a dream and chose to stay.',
  'joyful', 'Freedom',
  array['flying'],
  array['lucid', 'liberation'],
  array[]::text[],
  null,
  true, 4, 7.0, false, now() - interval '7 days',
  '[]'::jsonb),

(demo_user_id,
  'A teacher I never had',
  'An older woman I have never met handed me a small wooden box. Inside was bread that did not crumble. She said, share this, and walked away.',
  'curious', 'Calling',
  array['bread'],
  array['responsibility', 'gift'],
  array['mentor'],
  null,
  false, 4, 7.0, false, now() - interval '10 days',
  '[]'::jsonb),

(demo_user_id,
  'The ocean rose to my window',
  'I lived on the second floor of a house and the ocean came right up to the window. Through the glass I could see whales pass slowly. They looked at me.',
  'awed', 'Vastness',
  array['ocean', 'water'],
  array['scale', 'wonder'],
  array[]::text[],
  null,
  false, 4, 7.5, true, now() - interval '14 days',
  '[]'::jsonb),

(demo_user_id,
  'An old friend in a quiet field',
  'A friend I had not seen in years was walking ahead of me through tall grass. They did not turn around but said my name. The grass smelled like summer.',
  'nostalgic', 'Reconciliation',
  array[]::text[],
  array['memory', 'reaching out'],
  array['friend'],
  null,
  false, 3, 6.5, false, now() - interval '20 days',
  '[]'::jsonb);

-- A like on one of the public dreams (so the community feed shows engagement)
insert into dream_likes (dream_id, user_id)
select id, demo_user_id from dreams
  where user_id = demo_user_id
    and is_public = true
    and title = 'A dove landed on my hand'
on conflict do nothing;

end $$;
