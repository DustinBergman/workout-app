-- Migration: Email Notifications
-- Adds table for tracking sent email notifications (deduplication)
-- Adds email_notifications_enabled column to profiles

-- 1. Create table to track sent email notifications
CREATE TABLE IF NOT EXISTS email_notifications_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'workout_liked',
    'workout_commented',
    'friend_request_received',
    'friend_request_accepted'
  )),
  -- For workout-related emails, tracks the workout
  workout_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  -- For friend requests, tracks the request
  friend_request_id UUID REFERENCES friend_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Deduplication constraints:
  -- For workout interactions: one email per actor per workout per recipient
  CONSTRAINT unique_workout_email UNIQUE (recipient_user_id, actor_user_id, workout_id),
  -- For friend requests: one email per request per notification type
  CONSTRAINT unique_friend_request_email UNIQUE (friend_request_id, notification_type)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_sent_recipient ON email_notifications_sent(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_email_sent_workout ON email_notifications_sent(workout_id);
CREATE INDEX IF NOT EXISTS idx_email_sent_created ON email_notifications_sent(created_at);

-- 2. Add email_notifications_enabled column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Enable RLS on the new table
ALTER TABLE email_notifications_sent ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view their own email notification records (for debugging/transparency)
CREATE POLICY "Users can view own email notifications"
  ON email_notifications_sent FOR SELECT
  USING (auth.uid() = recipient_user_id OR auth.uid() = actor_user_id);

-- Insert is handled by the Edge Function using service role key
-- No direct client insert policy needed
