-- Update secondary_wod structure to support detailed exercises like main_workout
-- First, let's update the existing record to have a structured secondary_wod

UPDATE daily_workouts 
SET secondary_wod = '{
  "time_type": "AMRAP",
  "time_params": {"minutes": 5, "description": "Tantas rondas como sea posible en 5 minutos"},
  "exercises": [
    {
      "name": "Burpees",
      "reps": 10,
      "notes": "Mantén ritmo constante",
      "scaling": "Step-ups en lugar de salto",
      "image_url": "/assets/burpees.png"
    },
    {
      "name": "Air Squats",
      "reps": 15,
      "notes": "Profundidad completa",
      "scaling": "Sentadillas asistidas con banco",
      "image_url": "/assets/correr.png"
    }
  ]
}'::jsonb
WHERE id = '9b492efe-9048-44a6-b4ab-57862ae2eac7';

-- Add more example workouts with structured secondary WODs
INSERT INTO daily_workouts (
  id, title, description, duration, difficulty, type, warmup, main_workout, cooldown, 
  secondary_wod, time_type, time_params, scheduled_date, is_active
) VALUES (
  gen_random_uuid(),
  'POWER SURGE',
  'Entrenamiento explosivo que combina fuerza y potencia. Ideal para desarrollar capacidades anaeróbicas.',
  45,
  'Intermedio',
  'CrossTraining',
  '["5 min movilidad dinámica", "10 jumping jacks", "15 bodyweight squats", "5 push-ups"]',
  '{
    "exercises": [
      {
        "name": "Thrusters",
        "sets": 5,
        "reps": 8,
        "notes": "Usa peso moderado, 65-75% 1RM",
        "scaling": "Goblet squats to press",
        "image_url": "/assets/assault_bike.png"
      },
      {
        "name": "Pull-ups",
        "sets": 5,
        "reps": 6,
        "notes": "Estrictas, usa bandas si necesario",
        "scaling": "Ring rows o jumping pull-ups",
        "image_url": "/assets/burpees.png"
      }
    ],
    "description": "5 rondas con descanso de 90 seg entre rondas"
  }',
  '["3 min caminata", "Estiramientos 5 min"]',
  '{
    "time_type": "EMOM",
    "time_params": {"minutes": 8, "description": "Cada minuto en el minuto por 8 minutos"},
    "exercises": [
      {
        "name": "Burpee Box Jump Overs",
        "reps": 5,
        "notes": "Alterna cada minuto con Mountain Climbers",
        "scaling": "Step-ups + burpees separados",
        "image_url": "/assets/burpees.png"
      },
      {
        "name": "Mountain Climbers",
        "reps": 20,
        "notes": "10 por pierna, controlado",
        "scaling": "Reduce a 15 total",
        "image_url": "/assets/correr.png"
      }
    ]
  }',
  'EMOM',
  '{"minutes": 8, "description": "Cada minuto en el minuto alternando ejercicios"}',
  CURRENT_DATE,
  true
) ON CONFLICT (id) DO NOTHING;