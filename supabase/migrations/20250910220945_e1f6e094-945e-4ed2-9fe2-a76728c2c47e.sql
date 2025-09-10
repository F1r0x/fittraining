-- Crear tabla temporal con ejercicios únicos (usando el primer id por orden alfabético)
CREATE TEMP TABLE unique_workout_types AS
SELECT DISTINCT ON (name) id, name, category, unit, unit2
FROM workout_types
ORDER BY name, id;

-- Actualizar referencias en workouts para usar los ejercicios únicos
UPDATE workouts 
SET workout_type_id = uwt.id
FROM workout_types wt
JOIN unique_workout_types uwt ON wt.name = uwt.name
WHERE workouts.workout_type_id = wt.id
AND wt.id != uwt.id;

-- Eliminar ejercicios duplicados
DELETE FROM workout_types 
WHERE id NOT IN (SELECT id FROM unique_workout_types);