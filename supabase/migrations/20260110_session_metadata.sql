-- Add post-workout metadata columns to workout_sessions
-- These columns store data collected during the post-workout flow

-- Add columns if they don't exist
ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS custom_title TEXT,
  ADD COLUMN IF NOT EXISTS mood INTEGER,
  ADD COLUMN IF NOT EXISTS progressive_overload_week INTEGER,
  ADD COLUMN IF NOT EXISTS workout_goal TEXT,
  ADD COLUMN IF NOT EXISTS personal_bests JSONB,
  ADD COLUMN IF NOT EXISTS streak_count INTEGER;

-- Drop existing constraints if they exist (to recreate with correct values)
ALTER TABLE workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_mood_check;
ALTER TABLE workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_progressive_overload_week_check;
ALTER TABLE workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_workout_goal_check;

-- Add proper constraints
ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_mood_check
    CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5));

ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_progressive_overload_week_check
    CHECK (progressive_overload_week IS NULL OR (progressive_overload_week >= 0 AND progressive_overload_week <= 3));

ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_workout_goal_check
    CHECK (workout_goal IS NULL OR workout_goal IN ('build', 'lose', 'maintain'));

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workout_sessions_mood ON workout_sessions(mood) WHERE mood IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workout_sessions_streak ON workout_sessions(streak_count) WHERE streak_count IS NOT NULL;
