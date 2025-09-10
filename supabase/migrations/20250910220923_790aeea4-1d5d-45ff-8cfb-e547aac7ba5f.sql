-- Actualizar referencias para consolidar ejercicios duplicados
WITH duplicates AS (
  SELECT 
    name,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids
  FROM workout_types 
  GROUP BY name 
  HAVING COUNT(*) > 1
)
UPDATE workouts 
SET workout_type_id = d.keep_id
FROM duplicates d
WHERE workouts.workout_type_id = ANY(d.all_ids[2:]);

-- Eliminar ejercicios duplicados manteniendo el más antiguo
DELETE FROM workout_types 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
    FROM workout_types
  ) t 
  WHERE rn > 1
);