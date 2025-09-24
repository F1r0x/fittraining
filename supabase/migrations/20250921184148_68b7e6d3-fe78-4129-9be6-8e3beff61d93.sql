-- Remove time_type and time_params columns from daily_workouts table
-- This information will now be handled exclusively within the main_workout and secondary_wod JSON fields

ALTER TABLE public.daily_workouts 
DROP COLUMN IF EXISTS time_type,
DROP COLUMN IF EXISTS time_params;