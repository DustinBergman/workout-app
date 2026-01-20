-- Add training cycle columns to profiles table
-- cycle_config_id: stores the ID of the selected cycle configuration
-- cycle_state: stores the current state (phase index, week in phase, start date)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cycle_config_id TEXT,
ADD COLUMN IF NOT EXISTS cycle_state JSONB;

-- Add comment for documentation
COMMENT ON COLUMN profiles.cycle_config_id IS 'ID of the selected training cycle configuration (e.g., beginner-4, intermediate-6)';
COMMENT ON COLUMN profiles.cycle_state IS 'Current cycle state including cycleConfigId, cycleStartDate, currentPhaseIndex, currentWeekInPhase';
