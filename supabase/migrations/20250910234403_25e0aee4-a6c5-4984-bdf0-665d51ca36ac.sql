-- Add missing workout types that appear in daily workouts
-- First, let's check if they exist and only insert new ones
DO $$
BEGIN
  -- Add Sit-ups if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Sit-ups') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Sit-ups', 'Fuerza', 'reps');
  END IF;
  
  -- Add Push Press if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Push Press') THEN
    INSERT INTO public.workout_types (name, category, unit, unit2) VALUES ('Push Press', 'Fuerza', 'kg', 'reps');
  END IF;
  
  -- Add Flexiones if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Flexiones') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Flexiones', 'Fuerza', 'reps');
  END IF;
  
  -- Add Sentadillas if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Sentadillas') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Sentadillas', 'Fuerza', 'reps');
  END IF;
  
  -- Add Plancha if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Plancha') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Plancha', 'Fuerza', 'seconds');
  END IF;
  
  -- Add Burpees if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Burpees') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Burpees', 'Cardio', 'reps');
  END IF;
  
  -- Add Mountain Climbers if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Mountain Climbers') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Mountain Climbers', 'Cardio', 'reps');
  END IF;
  
  -- Add Jumping Jacks if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Jumping Jacks') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Jumping Jacks', 'Cardio', 'reps');
  END IF;
  
  -- Add Lunges if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Lunges') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Lunges', 'Fuerza', 'reps');
  END IF;
  
  -- Add Pull-ups if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workout_types WHERE name = 'Pull-ups') THEN
    INSERT INTO public.workout_types (name, category, unit) VALUES ('Pull-ups', 'Fuerza', 'reps');
  END IF;
END $$;