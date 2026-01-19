-- Add weekly_workout_goal column to profiles table
-- This stores the user's target number of workouts per week (default 4)
-- Used for calculating weekly consistency streaks

ALTER TABLE profiles
ADD COLUMN weekly_workout_goal INTEGER NOT NULL DEFAULT 4;

-- Add constraint to ensure valid range (2-7 workouts per week)
ALTER TABLE profiles
ADD CONSTRAINT weekly_workout_goal_range CHECK (weekly_workout_goal >= 2 AND weekly_workout_goal <= 7);
