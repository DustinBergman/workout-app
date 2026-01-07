-- ============================================================================
-- Comment Likes Migration
-- Run this in your Supabase SQL Editor AFTER the likes_comments migration
-- ============================================================================

-- ============================================================================
-- 1. COMMENT LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES workout_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only like a comment once
  CONSTRAINT unique_comment_like UNIQUE (comment_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Users can view likes on comments they can see (comments on accessible workouts)
CREATE POLICY "Users can view comment likes"
  ON comment_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_comments wc
      JOIN workout_sessions ws ON ws.id = wc.workout_id
      WHERE wc.id = comment_likes.comment_id
      AND (
        ws.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = auth.uid() AND f.friend_id = ws.user_id
        )
      )
    )
  );

CREATE POLICY "Users can like comments on accessible workouts"
  ON comment_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workout_comments wc
      JOIN workout_sessions ws ON ws.id = wc.workout_id
      WHERE wc.id = comment_id
      AND (
        ws.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = auth.uid() AND f.friend_id = ws.user_id
        )
      )
    )
  );

CREATE POLICY "Users can unlike their own comment likes"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. DATABASE FUNCTIONS (RPCs)
-- ============================================================================

-- Like a comment
CREATE OR REPLACE FUNCTION like_comment(p_comment_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  like_id UUID;
BEGIN
  -- Insert the like (will fail if already liked due to unique constraint)
  INSERT INTO comment_likes (comment_id, user_id)
  VALUES (p_comment_id, auth.uid())
  RETURNING id INTO like_id;

  RETURN like_id;
END;
$$;

-- Unlike a comment
CREATE OR REPLACE FUNCTION unlike_comment(p_comment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM comment_likes
  WHERE comment_id = p_comment_id AND user_id = auth.uid();
END;
$$;

-- ============================================================================
-- 4. GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION like_comment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlike_comment(UUID) TO authenticated;
