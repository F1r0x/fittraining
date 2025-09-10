-- Eliminar ejercicios duplicados manteniendo solo uno por nombre
DELETE FROM workout_types a 
USING workout_types b 
WHERE a.id < b.id 
AND a.name = b.name;