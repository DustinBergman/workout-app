-- Add in_rotation column to workout_templates
-- This tracks whether a template is in the user's current workout rotation

ALTER TABLE workout_templates
ADD COLUMN IF NOT EXISTS in_rotation BOOLEAN NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN workout_templates.in_rotation IS 'Whether this template is in the current workout rotation for "up next" logic';
