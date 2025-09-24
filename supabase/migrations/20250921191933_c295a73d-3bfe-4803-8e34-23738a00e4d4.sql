-- Actualizar la estructura JSON unificada para todos los WODs
-- Standardizar todos los campos en warmup, main_workout, secondary_wod, cooldown

UPDATE daily_workouts 
SET 
  warmup = jsonb_build_object(
    'time_type', 'For Time',
    'time_params', jsonb_build_object(
      'minutes', 8,
      'description', 'Calentamiento progresivo'
    ),
    'exercises', jsonb_build_array(
      jsonb_build_object(
        'name', 'Salto de cuerda',
        'sets', 1,
        'reps', 0,
        'notes', '5 min ritmo moderado',
        'scaling', 'Reducir tiempo si necesario',
        'image_url', 'https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/jump-rope.png'
      ),
      jsonb_build_object(
        'name', 'Burpees',
        'sets', 1,
        'reps', 15,
        'notes', 'Movimiento completo',
        'scaling', 'Step-ups como alternativa',
        'image_url', 'https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/burpees.png'
      ),
      jsonb_build_object(
        'name', 'Lunges alternas',
        'sets', 1,
        'reps', 20,
        'notes', 'Mantén rodilla cerca del suelo',
        'scaling', 'Reducir rango de movimiento',
        'image_url', 'https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/lunges.png'
      ),
      jsonb_build_object(
        'name', 'Push-ups',
        'sets', 1,
        'reps', 10,
        'notes', 'Movimiento controlado',
        'scaling', 'Push-ups en rodillas',
        'image_url', 'https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/push-ups.png'
      )
    ),
    'description', 'Calentamiento completo para preparar el cuerpo',
    'skill_work', jsonb_build_array(),
    'accessory_work', jsonb_build_array(),
    'rounds', 1,
    'instructions', jsonb_build_array('Mantén ritmo constante', 'Escucha a tu cuerpo')
  ),
  
  main_workout = jsonb_build_object(
    'time_type', 'For Time',
    'time_params', jsonb_build_object(
      'minutes', 20,
      'cap', 20,
      'description', '4 rondas For Time con time cap de 20 min'
    ),
    'exercises', main_workout->'exercises',
    'description', COALESCE(main_workout->>'description', '4 rondas For Time con time cap de 20 min. Registra tiempo final.'),
    'skill_work', COALESCE(main_workout->'skill_work', jsonb_build_array('3 min kettlebell swing technique (3 sets de 10 reps con peso ligero, cues: cadera impulsa)')),
    'accessory_work', COALESCE(main_workout->'accessory_work', jsonb_build_array('2 min hollow hold (fortalece core)')),
    'rounds', COALESCE((main_workout->>'rounds')::int, 4),
    'instructions', jsonb_build_array('Mantén buena forma', 'Descansa si es necesario', 'Registra tu tiempo')
  ),
  
  secondary_wod = jsonb_build_object(
    'time_type', COALESCE(secondary_wod->>'time_type', 'AMRAP'),
    'time_params', COALESCE(secondary_wod->'time_params', jsonb_build_object('minutes', 5, 'description', 'Tantas rondas como sea posible')),
    'exercises', COALESCE(secondary_wod->'exercises', jsonb_build_array()),
    'description', COALESCE(secondary_wod->>'description', 'WOD secundario para finalizar'),
    'skill_work', jsonb_build_array(),
    'accessory_work', jsonb_build_array(),
    'rounds', COALESCE((secondary_wod->>'rounds')::int, 0),
    'instructions', jsonb_build_array('Mantén la intensidad', 'Cuenta las rondas completadas')
  ),
  
  cooldown = jsonb_build_object(
    'time_type', 'Rest',
    'time_params', jsonb_build_object(
      'minutes', 5,
      'description', 'Enfriamiento y relajación'
    ),
    'exercises', jsonb_build_array(
      jsonb_build_object(
        'name', 'Caminata ligera',
        'sets', 1,
        'reps', 0,
        'notes', '3 min caminata ligera',
        'scaling', 'Caminar en el lugar si es necesario',
        'image_url', 'https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/walking.png'
      ),
      jsonb_build_object(
        'name', 'Estiramientos estáticos',
        'sets', 4,
        'reps', 0,
        'notes', 'Cuádriceps, hombros - 30 seg cada',
        'scaling', 'Mantén solo los estiramientos necesarios',
        'image_url', 'https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/stretching.png'
      ),
      jsonb_build_object(
        'name', 'Foam roll',
        'sets', 1,
        'reps', 0,
        'notes', 'Foam roll espalda',
        'scaling', 'Usar pelota si no hay foam roll',
        'image_url', 'https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/foam-roll.png'
      )
    ),
    'description', 'Enfriamiento para recuperación muscular',
    'skill_work', jsonb_build_array(),
    'accessory_work', jsonb_build_array(),
    'rounds', 1,
    'instructions', jsonb_build_array('Respiración profunda', 'Mantén estiramientos 30 segundos')
  )
WHERE id = 'f13ec06c-9220-4106-a75c-3cd2729c80d6';