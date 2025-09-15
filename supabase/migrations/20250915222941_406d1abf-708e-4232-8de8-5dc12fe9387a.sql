-- Agregar columnas para WOD secundario y tipo de tiempo en daily_workouts
ALTER TABLE daily_workouts 
ADD COLUMN secondary_wod jsonb,
ADD COLUMN time_type text CHECK (time_type IN ('AMRAP', 'EMOM', 'For Time', 'Tabata', 'Custom')),
ADD COLUMN time_params jsonb;

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN daily_workouts.secondary_wod IS 'WOD secundario opcional con estructura similar al main_workout';
COMMENT ON COLUMN daily_workouts.time_type IS 'Tipo de estructura de tiempo: AMRAP, EMOM, For Time, Tabata, Custom';
COMMENT ON COLUMN daily_workouts.time_params IS 'Parámetros específicos del tipo de tiempo: {duration, rounds, work_time, rest_time, etc.}';

-- Actualizar algunos registros existentes con datos de ejemplo
UPDATE daily_workouts 
SET time_type = 'AMRAP',
    time_params = '{"duration": 20, "description": "Tantas rondas como sea posible en 20 minutos"}'
WHERE type = 'AMRAP' OR title ILIKE '%AMRAP%';

UPDATE daily_workouts 
SET time_type = 'For Time',
    time_params = '{"target_time": 15, "description": "Completar lo más rápido posible"}'
WHERE type = 'For Time' OR title ILIKE '%for time%';

UPDATE daily_workouts 
SET time_type = 'EMOM',
    time_params = '{"duration": 12, "interval": 60, "description": "Cada minuto en el minuto durante 12 minutos"}'   
WHERE type = 'EMOM' OR title ILIKE '%EMOM%';

UPDATE daily_workouts 
SET time_type = 'Tabata',
    time_params = '{"rounds": 8, "work_time": 20, "rest_time": 10, "description": "8 rondas de 20s trabajo / 10s descanso"}'
WHERE type = 'Tabata' OR title ILIKE '%tabata%';

-- Para entrenamientos sin tipo específico, usar Custom
UPDATE daily_workouts 
SET time_type = 'Custom',
    time_params = '{"description": "Entrenamiento personalizado"}'
WHERE time_type IS NULL;