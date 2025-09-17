-- Add image support to warmup and main_workout sections in daily_workouts table
-- Update the warmup and main_workout JSONB columns to support image_url fields

-- Since these are JSONB columns, we don't need to modify the structure but we'll add
-- a comment to document the expected structure

COMMENT ON COLUMN public.daily_workouts.warmup IS 'JSONB array of warmup exercises. Each exercise can have: name, duration, reps, notes, scaling, image_url';

COMMENT ON COLUMN public.daily_workouts.main_workout IS 'JSONB object containing main workout data. skill_work array can have exercises with: name, duration, reps, notes, scaling, image_url. exercises array can have: name, sets, reps, notes, scaling, image_url';

-- Also update gym_daily_workouts for consistency
COMMENT ON COLUMN public.gym_daily_workouts.warmup IS 'JSONB array of warmup exercises. Each exercise can have: name, duration, reps, notes, scaling, image_url';

COMMENT ON COLUMN public.gym_daily_workouts.main_workout IS 'JSONB object containing main workout data. exercises can have: name, sets, reps, notes, scaling, image_url';