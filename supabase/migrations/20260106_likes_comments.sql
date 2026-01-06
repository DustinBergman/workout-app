-- ============================================================================
-- Likes and Comments Migration
-- Run this in your Supabase SQL Editor AFTER the social_features migration
-- ============================================================================

-- ============================================================================
-- 1. WORKOUT LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only like a workout once
  CONSTRAINT unique_workout_like UNIQUE (workout_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_workout_likes_workout ON workout_likes(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_likes_user ON workout_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_likes_created ON workout_likes(workout_id, created_at DESC);

-- ============================================================================
-- 2. WORKOUT COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_workout_comments_workout ON workout_comments(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_user ON workout_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_created ON workout_comments(workout_id, created_at DESC);

-- ============================================================================
-- 3. UPDATE NOTIFICATIONS TABLE TYPE CONSTRAINT
-- ============================================================================
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'friend_request_received',
    'friend_request_accepted',
    'workout_liked',
    'workout_commented'
  ));

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;

-- Workout Likes Policies
-- Users can view likes on workouts from friends or their own workouts
CREATE POLICY "Users can view likes on accessible workouts"
  ON workout_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = workout_likes.workout_id
      AND (
        ws.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = auth.uid() AND f.friend_id = ws.user_id
        )
      )
    )
  );

CREATE POLICY "Users can like accessible workouts"
  ON workout_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = workout_id
      AND (
        ws.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = auth.uid() AND f.friend_id = ws.user_id
        )
      )
    )
  );

CREATE POLICY "Users can unlike their own likes"
  ON workout_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Workout Comments Policies
CREATE POLICY "Users can view comments on accessible workouts"
  ON workout_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = workout_comments.workout_id
      AND (
        ws.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = auth.uid() AND f.friend_id = ws.user_id
        )
      )
    )
  );

CREATE POLICY "Users can comment on accessible workouts"
  ON workout_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = workout_id
      AND (
        ws.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = auth.uid() AND f.friend_id = ws.user_id
        )
      )
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON workout_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. DATABASE FUNCTIONS (RPCs)
-- ============================================================================

-- Like a workout (with batched notification)
CREATE OR REPLACE FUNCTION like_workout(p_workout_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  like_id UUID;
  workout_owner_id UUID;
  liker_name TEXT;
  existing_notification_id UUID;
  current_likers JSONB;
  like_count INT;
BEGIN
  -- Get workout owner
  SELECT user_id INTO workout_owner_id
  FROM workout_sessions
  WHERE id = p_workout_id;

  IF workout_owner_id IS NULL THEN
    RAISE EXCEPTION 'Workout not found';
  END IF;

  -- Insert the like
  INSERT INTO workout_likes (workout_id, user_id)
  VALUES (p_workout_id, auth.uid())
  RETURNING id INTO like_id;

  -- Don't notify yourself
  IF workout_owner_id != auth.uid() THEN
    -- Get liker name
    SELECT COALESCE(
      NULLIF(CONCAT(first_name, ' ', last_name), ' '),
      username,
      'Someone'
    ) INTO liker_name
    FROM profiles WHERE id = auth.uid();

    -- Check for existing unread notification for this workout
    SELECT id, data INTO existing_notification_id, current_likers
    FROM notifications
    WHERE user_id = workout_owner_id
      AND type = 'workout_liked'
      AND read = FALSE
      AND data->>'workout_id' = p_workout_id::TEXT
    ORDER BY created_at DESC
    LIMIT 1;

    IF existing_notification_id IS NOT NULL THEN
      -- Update existing notification with new liker
      -- Get current like count for this workout
      SELECT COUNT(*) INTO like_count
      FROM workout_likes
      WHERE workout_id = p_workout_id;

      UPDATE notifications
      SET
        body = CASE
          WHEN like_count = 2 THEN liker_name || ' and 1 other liked your workout'
          ELSE liker_name || ' and ' || (like_count - 1) || ' others liked your workout'
        END,
        data = jsonb_set(
          jsonb_set(current_likers, '{latest_liker_id}', to_jsonb(auth.uid()::TEXT)),
          '{like_count}', to_jsonb(like_count)
        ),
        created_at = NOW()
      WHERE id = existing_notification_id;
    ELSE
      -- Create new notification
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        workout_owner_id,
        'workout_liked',
        'Workout Liked',
        liker_name || ' liked your workout',
        jsonb_build_object(
          'workout_id', p_workout_id,
          'latest_liker_id', auth.uid(),
          'like_count', 1
        )
      );
    END IF;
  END IF;

  RETURN like_id;
END;
$$;

-- Add a comment (with notification)
CREATE OR REPLACE FUNCTION add_workout_comment(p_workout_id UUID, p_content TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  comment_id UUID;
  workout_owner_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get workout owner
  SELECT user_id INTO workout_owner_id
  FROM workout_sessions
  WHERE id = p_workout_id;

  IF workout_owner_id IS NULL THEN
    RAISE EXCEPTION 'Workout not found';
  END IF;

  -- Insert the comment
  INSERT INTO workout_comments (workout_id, user_id, content)
  VALUES (p_workout_id, auth.uid(), p_content)
  RETURNING id INTO comment_id;

  -- Don't notify yourself
  IF workout_owner_id != auth.uid() THEN
    -- Get commenter name
    SELECT COALESCE(
      NULLIF(CONCAT(first_name, ' ', last_name), ' '),
      username,
      'Someone'
    ) INTO commenter_name
    FROM profiles WHERE id = auth.uid();

    -- Create notification (individual for each comment)
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      workout_owner_id,
      'workout_commented',
      'New Comment',
      commenter_name || ' commented on your workout',
      jsonb_build_object(
        'workout_id', p_workout_id,
        'comment_id', comment_id,
        'commenter_id', auth.uid()
      )
    );
  END IF;

  RETURN comment_id;
END;
$$;

-- ============================================================================
-- 6. GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION like_workout(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_workout_comment(UUID, TEXT) TO authenticated;
