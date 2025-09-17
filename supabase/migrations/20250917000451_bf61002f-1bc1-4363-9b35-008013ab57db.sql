-- Update the daily_workouts table structure to match what the code expects
-- First, let's see if we need to add any missing columns
ALTER TABLE daily_workouts 
DROP COLUMN IF EXISTS wods,
ADD COLUMN IF NOT EXISTS main_workout jsonb,
ADD COLUMN IF NOT EXISTS secondary_wod jsonb,
ADD COLUMN IF NOT EXISTS time_type text,
ADD COLUMN IF NOT EXISTS time_params jsonb;

-- Clear existing data and insert sample data that matches the expected structure
DELETE FROM daily_workouts;

-- Insert today's Cross Training workout
INSERT INTO daily_workouts (
  title,
  description,
  duration,
  difficulty,
  type,
  warmup,
  main_workout,
  secondary_wod,
  cooldown,
  time_type,
  time_params,
  scheduled_date,
  is_active
) VALUES (
  'ULTIMATE BURN',
  'Entrenamiento intenso para quemar grasa y mejorar resistencia. Equipo: kettlebell, box, barra, cuerda.',
  50,
  'Intermedio',
  'Cardio + Fuerza',
  '["5 min salto de cuerda (ritmo moderado)", "15 burpees (escala a step-ups)", "20 lunges alternas (mantén rodilla cerca del suelo)", "10 push-ups (escala a rodillas)"]'::jsonb,
  '{
    "rounds": 4,
    "skill_work": ["3 min kettlebell swing technique (3 sets de 10 reps con peso ligero, cues: cadera impulsa)"],
    "exercises": [
      {
        "name": "Kettlebell Swings",
        "sets": 4,
        "reps": 20,
        "notes": "24kg/16kg, potencia desde cadera",
        "scaling": "Use 16kg/12kg",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/kb-russian-swing.png"
      },
      {
        "name": "Box Jumps",
        "sets": 4,
        "reps": 15,
        "notes": "24/20 inch, aterriza suave",
        "scaling": "Step-ups o menor altura",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/box-jump.png"
      },
      {
        "name": "Thrusters",
        "sets": 4,
        "reps": 10,
        "notes": "40kg/30kg, codos altos",
        "scaling": "Use dumbbells o barra ligera",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/thruster.png"
      },
      {
        "name": "Double Unders",
        "sets": 4,
        "reps": 30,
        "notes": "Mantén ritmo constante",
        "scaling": "60 single unders",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/double-unders.png"
      }
    ],
    "description": "4 rondas For Time con time cap de 20 min. Registra tiempo final.",
    "accessory_work": ["2 min hollow hold (fortalece core)"]
  }'::jsonb,
  '{
    "time_type": "AMRAP",
    "time_params": {"minutes": 5, "description": "Tantas rondas como sea posible"},
    "exercises": [
      {
        "name": "Push-ups",
        "reps": 10,
        "notes": "Mantén ritmo constante",
        "scaling": "Reduce reps o usa rodillas",
        "image_url": "/assets/placeholder-exercise.jpg"
      },
      {
        "name": "Air Squats",
        "reps": 15,
        "notes": "Mantén profundidad completa",
        "scaling": "Reduce rango de movimiento",
        "image_url": "/assets/placeholder-exercise.jpg"
      }
    ]
  }'::jsonb,
  '["3 min caminata ligera", "Estiramientos estáticos (cuádriceps, hombros - 30 seg cada)", "Foam roll espalda"]'::jsonb,
  'For Time',
  '{"cap": 20, "description": "Completa 4 rondas en el menor tiempo posible", "rest_between_sets": 60}'::jsonb,
  CURRENT_DATE,
  true
),
(
  'ABS ATTACK',
  'Foco en abdominales y estabilidad central para principiantes. Equipo: mat.',
  30,
  'Principiante',
  'Core',
  '["Caminata ligera 5 min", "Círculos de cadera (20 por lado)", "Plank básico 20 seg (mantén alineación)"]'::jsonb,
  '{
    "rounds": 3,
    "skill_work": ["2 min plank technique (practice breathing, cues: core engaged)"],
    "exercises": [
      {
        "name": "Plank",
        "sets": 3,
        "reps": "30 seg",
        "notes": "Mantén cuerpo recto",
        "scaling": "Reduce a 15 seg",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/plank.png"
      },
      {
        "name": "Leg Raises",
        "sets": 3,
        "reps": 15,
        "notes": "Levanta piernas controlado",
        "scaling": "Bend knees",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/leg-raises.png"
      },
      {
        "name": "Bicycle Crunches",
        "sets": 3,
        "reps": 20,
        "notes": "10 por lado, toca codo con rodilla",
        "scaling": "Slow tempo",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/bicycle-crunches.png"
      }
    ],
    "description": "3 rondas EMOM con time cap de 15 min. Enfócate en control.",
    "accessory_work": ["2 sets de 10 bird dogs (estabilidad)"]
  }'::jsonb,
  '{
    "time_type": "For Time",
    "time_params": {"description": "Completar en el menor tiempo posible"},
    "exercises": [
      {
        "name": "Sit-ups",
        "reps": 20,
        "notes": "Mantén control",
        "scaling": "Reduce reps",
        "image_url": "/assets/placeholder-exercise.jpg"
      },
      {
        "name": "Mountain Climbers",
        "reps": 30,
        "notes": "Ritmo constante",
        "scaling": "Slow tempo",
        "image_url": "/assets/placeholder-exercise.jpg"
      }
    ]
  }'::jsonb,
  '["2 min caminata ligera", "Estiramientos abdominales (30 seg)", "Respiración profunda (4-7-8 x 3)"]'::jsonb,
  'EMOM',
  '{"minutes": 9, "description": "Cada minuto un ejercicio, repite 3 veces"}'::jsonb,
  CURRENT_DATE + INTERVAL '1 day',
  true
),
(
  'WARRIOR STRENGTH',
  'Entrenamiento de fuerza avanzado para desarrollar potencia y resistencia.',
  60,
  'Avanzado',
  'Fuerza',
  '["2 min movilidad articular (arm circles, leg swings)", "15 push-ups (escala a rodillas)", "20 air squats (mantén profundidad)", "5 pull-ups ligeros (usa banda si necesario)"]'::jsonb,
  '{
    "rounds": 4,
    "skill_work": ["3 min deadlift technique (practice hip hinge, cues: chest up, back straight)"],
    "exercises": [
      {
        "name": "Deadlifts",
        "sets": 4,
        "reps": 10,
        "notes": "70% 1RM, descansa 2 min",
        "scaling": "Reduce a 50% 1RM o kettlebell",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/deadlift.png"
      },
      {
        "name": "Strict Pull-ups",
        "sets": 4,
        "reps": 8,
        "notes": "Full range of motion",
        "scaling": "Use banda o jumping pull-ups",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/pull-ups.png"
      },
      {
        "name": "Front Squats",
        "sets": 4,
        "reps": 12,
        "notes": "60% 1RM, codos altos",
        "scaling": "Use goblet squats",
        "image_url": "https://mpznpclslffggogricbl.supabase.co/storage/v1/object/public/exercise-images/front-squat.png"
      }
    ],
    "description": "4 rondas de fuerza con time cap de 25 min. Prioriza técnica.",
    "accessory_work": ["3 sets de 10 glute bridges (fortalece posterior chain)"]
  }'::jsonb,
  null,
  '["5 min caminata ligera", "Estiramientos estáticos (hombros, espalda, piernas - 30 seg cada)", "4-7-8 breathing x 5 ciclos"]'::jsonb,
  'For Quality',
  '{"cap": 25, "description": "Completa con técnica perfecta", "rest_between_sets": 120}'::jsonb,
  CURRENT_DATE + INTERVAL '2 days',
  true
);