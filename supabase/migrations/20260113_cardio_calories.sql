-- Add calories column to completed_sets for HIIT/interval cardio tracking
ALTER TABLE completed_sets ADD COLUMN IF NOT EXISTS calories INTEGER;

-- Add a comment for documentation
COMMENT ON COLUMN completed_sets.calories IS 'Calories burned during cardio exercise (used for HIIT/interval workouts as alternative to distance)';
