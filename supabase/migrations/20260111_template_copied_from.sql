-- Add copied_from column to workout_templates
-- This stores attribution data when a template is copied from another user's workout

ALTER TABLE workout_templates
  ADD COLUMN IF NOT EXISTS copied_from JSONB;

-- Add comment for documentation
COMMENT ON COLUMN workout_templates.copied_from IS 'Attribution data when template is copied from another user. Contains userId, username, firstName, lastName.';
