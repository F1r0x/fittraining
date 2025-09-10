-- Add missing workout types that appear in daily workouts (only if they don't already exist)
DO $$
BEGIN
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
    ('Plank', 'Fuerza', 'seconds', null);
    
EXCEPTION WHEN unique_violation THEN
    -- Handle case where some types already exist
    INSERT INTO public.workout_types (name, category, unit, unit2) 
    SELECT t.name, t.category, t.unit, t.unit2
    FROM (VALUES
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
    ) AS t(name, category, unit, unit2)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.workout_types WHERE workout_types.name = t.name
    );
END $$;

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