-- ============================================================================
-- Social Features Migration
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FRIEND REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- Prevent duplicate requests
  CONSTRAINT unique_friend_request UNIQUE (from_user_id, to_user_id),
  -- Can't send request to yourself
  CONSTRAINT no_self_request CHECK (from_user_id != to_user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- ============================================================================
-- 2. FRIENDSHIPS TABLE (bidirectional - one row per direction)
-- ============================================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each friendship pair is unique
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  -- Can't be friends with yourself
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Index for efficient friend lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

-- ============================================================================
-- 3. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request_received', 'friend_request_accepted')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(user_id, created_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Friend Requests Policies
CREATE POLICY "Users can view their own friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests they received"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete their own sent requests"
  ON friend_requests FOR DELETE
  USING (auth.uid() = from_user_id);

-- Friendships Policies
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "System can insert friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. DATABASE FUNCTIONS (RPCs)
-- ============================================================================

-- Send Friend Request Function
CREATE OR REPLACE FUNCTION send_friend_request(to_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id UUID;
  from_user_name TEXT;
BEGIN
  -- Check if already friends
  IF EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = auth.uid() AND friend_id = to_user_id
  ) THEN
    RAISE EXCEPTION 'Already friends with this user';
  END IF;

  -- Check if there's already a pending request in either direction
  IF EXISTS (
    SELECT 1 FROM friend_requests
    WHERE status = 'pending'
    AND ((from_user_id = auth.uid() AND friend_requests.to_user_id = send_friend_request.to_user_id)
      OR (from_user_id = send_friend_request.to_user_id AND friend_requests.to_user_id = auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Friend request already pending';
  END IF;

  -- Create the friend request
  INSERT INTO friend_requests (from_user_id, to_user_id, status)
  VALUES (auth.uid(), to_user_id, 'pending')
  RETURNING id INTO request_id;

  -- Get the sender's name for the notification
  SELECT COALESCE(
    NULLIF(CONCAT(first_name, ' ', last_name), ' '),
    username,
    'Someone'
  ) INTO from_user_name
  FROM profiles WHERE id = auth.uid();

  -- Create notification for recipient
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    to_user_id,
    'friend_request_received',
    'New Friend Request',
    from_user_name || ' sent you a friend request',
    jsonb_build_object('request_id', request_id, 'from_user_id', auth.uid())
  );

  RETURN request_id;
END;
$$;

-- Accept Friend Request Function
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req RECORD;
  accepter_name TEXT;
BEGIN
  -- Get the request and verify it's for the current user
  SELECT * INTO req FROM friend_requests
  WHERE id = request_id AND to_user_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  -- Update the request status
  UPDATE friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = request_id;

  -- Create bidirectional friendship
  INSERT INTO friendships (user_id, friend_id)
  VALUES (req.from_user_id, req.to_user_id);

  INSERT INTO friendships (user_id, friend_id)
  VALUES (req.to_user_id, req.from_user_id);

  -- Get the accepter's name for the notification
  SELECT COALESCE(
    NULLIF(CONCAT(first_name, ' ', last_name), ' '),
    username,
    'Someone'
  ) INTO accepter_name
  FROM profiles WHERE id = auth.uid();

  -- Notify the original sender that their request was accepted
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    req.from_user_id,
    'friend_request_accepted',
    'Friend Request Accepted',
    accepter_name || ' accepted your friend request',
    jsonb_build_object('friend_id', auth.uid())
  );
END;
$$;

-- Decline Friend Request Function
CREATE OR REPLACE FUNCTION decline_friend_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the request status (only if it belongs to the current user)
  UPDATE friend_requests
  SET status = 'declined', responded_at = NOW()
  WHERE id = request_id
    AND to_user_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;
END;
$$;

-- ============================================================================
-- 6. ENSURE PROFILES TABLE HAS USERNAME COLUMN
-- ============================================================================
-- Add username column if it doesn't exist (for friend search)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
    CREATE INDEX idx_profiles_username ON profiles(username);
  END IF;
END $$;

-- ============================================================================
-- 7. GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION send_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_friend_request(UUID) TO authenticated;
