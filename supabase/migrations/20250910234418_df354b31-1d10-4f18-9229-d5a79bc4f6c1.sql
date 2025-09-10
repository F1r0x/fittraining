-- Add missing workout types that appear in daily workouts
INSERT INTO public.workout_types (name, category, unit, unit2) VALUES
('Sit-ups', 'Fuerza', 'reps', null),
('Push Press', 'Fuerza', 'kg', 'reps'),
('Flexiones', 'Fuerza', 'reps', null),
('Sentadillas', 'Fuerza', 'reps', null),
('Plancha', 'Fuerza', 'seconds', null),
('Burpees', 'Cardio', 'reps', null),
('Mountain Climbers', 'Cardio', 'reps', null),
('Jumping Jacks', 'Cardio', 'reps', null),
('Lunges', 'Fuerza', 'reps', null),
('Pull-ups', 'Fuerza', 'reps', null),
('Push-ups', 'Fuerza', 'reps', null),
('Squats', 'Fuerza', 'reps', null),
('Plank', 'Fuerza', 'seconds', null)
ON CONFLICT (name) DO NOTHING;

-- Create workout_type_aliases table to map daily workout names to canonical workout types
CREATE TABLE public.workout_type_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_name TEXT NOT NULL,
  canonical_workout_type_id UUID NOT NULL REFERENCES public.workout_types(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alias_name)
);

-- Enable RLS on the aliases table
ALTER TABLE public.workout_type_aliases ENABLE ROW LEVEL SECURITY;

-- Create policy for aliases (read-only for authenticated users)
CREATE POLICY "Workout type aliases are viewable by authenticated users" 
ON public.workout_type_aliases 
FOR SELECT 
USING (true);

-- Populate aliases table with common mappings
WITH workout_mappings AS (
  SELECT 
    wt.id,
    wt.name,
    unnest(ARRAY[
      -- Common English/Spanish variations
      CASE WHEN wt.name = 'Flexiones' THEN 'Push-ups' END,
      CASE WHEN wt.name = 'Flexiones' THEN 'Pushups' END,
      CASE WHEN wt.name = 'Push-ups' THEN 'Flexiones' END,
      CASE WHEN wt.name = 'Push-ups' THEN 'Pushups' END,
      CASE WHEN wt.name = 'Sentadillas' THEN 'Squats' END,
      CASE WHEN wt.name = 'Squats' THEN 'Sentadillas' END,
      CASE WHEN wt.name = 'Plancha' THEN 'Plank' END,
      CASE WHEN wt.name = 'Plank' THEN 'Plancha' END,
      CASE WHEN wt.name = 'Pull-ups' THEN 'Dominadas' END,
      CASE WHEN wt.name = 'Sit-ups' THEN 'Abdominales' END,
      CASE WHEN wt.name = 'Lunges' THEN 'Zancadas' END,
      -- Common variations with punctuation/spacing
      CASE WHEN wt.name = 'Mountain Climbers' THEN 'Mountain climbers' END,
      CASE WHEN wt.name = 'Jumping Jacks' THEN 'Jumping jacks' END,
      -- Add more variations as needed
      NULL
    ]) AS alias_name
  FROM public.workout_types wt
)
INSERT INTO public.workout_type_aliases (alias_name, canonical_workout_type_id)
SELECT alias_name, id
FROM workout_mappings
WHERE alias_name IS NOT NULL
ON CONFLICT (alias_name) DO NOTHING;