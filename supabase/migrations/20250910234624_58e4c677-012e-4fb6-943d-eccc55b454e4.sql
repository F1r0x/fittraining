-- Populate aliases table with common mappings
INSERT INTO public.workout_type_aliases (alias_name, canonical_workout_type_id)
SELECT alias_name, wt.id
FROM public.workout_types wt
CROSS JOIN LATERAL (
  VALUES 
    -- English/Spanish variations for Flexiones
    (CASE WHEN wt.name = 'Flexiones' THEN 'Push-ups' END),
    (CASE WHEN wt.name = 'Flexiones' THEN 'Pushups' END),
    (CASE WHEN wt.name = 'Push-ups' THEN 'Flexiones' END),
    (CASE WHEN wt.name = 'Push-ups' THEN 'Pushups' END),
    
    -- English/Spanish variations for Sentadillas
    (CASE WHEN wt.name = 'Sentadillas' THEN 'Squats' END),
    (CASE WHEN wt.name = 'Squats' THEN 'Sentadillas' END),
    
    -- English/Spanish variations for Plancha
    (CASE WHEN wt.name = 'Plancha' THEN 'Plank' END),
    (CASE WHEN wt.name = 'Plank' THEN 'Plancha' END),
    
    -- Other common variations
    (CASE WHEN wt.name = 'Pull-ups' THEN 'Dominadas' END),
    (CASE WHEN wt.name = 'Sit-ups' THEN 'Abdominales' END),
    (CASE WHEN wt.name = 'Lunges' THEN 'Zancadas' END),
    (CASE WHEN wt.name = 'Mountain Climbers' THEN 'Mountain climbers' END),
    (CASE WHEN wt.name = 'Jumping Jacks' THEN 'Jumping jacks' END),
    (CASE WHEN wt.name = 'Burpees' THEN 'Burpees' END)
) AS aliases(alias_name)
WHERE alias_name IS NOT NULL
ON CONFLICT (alias_name) DO NOTHING;