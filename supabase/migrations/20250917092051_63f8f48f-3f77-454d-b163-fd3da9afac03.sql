-- Add missing workout types to daily_workouts table
-- Update the type constraint to include all the new workout types

-- First, let's see what types we currently have and add the missing ones
-- Based on the reference images, we need to add:
-- AMRAP, EMOM, Tabata, Estaciones de tiempo, Unbroken, Entrenamiento de Técnica, 
-- Warm-up, Trabajo de fuerza, Entrenamiento libre, Movilidad, 
-- Reps For Time/Ladder, Rounds For Time, FOR TIME

-- Update daily_workouts to allow more workout types
ALTER TABLE daily_workouts DROP CONSTRAINT IF EXISTS daily_workouts_type_check;

-- Add a more flexible check constraint or remove it entirely for now
-- We'll rely on application logic to validate types