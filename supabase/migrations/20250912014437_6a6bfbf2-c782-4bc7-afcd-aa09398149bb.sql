-- Crear tabla para entrenamientos diarios de gimnasio/fitness
CREATE TABLE public.gym_daily_workouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  duration integer NOT NULL,
  difficulty text NOT NULL,
  type text NOT NULL,
  warmup jsonb NOT NULL,
  main_workout jsonb NOT NULL,
  cooldown jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.gym_daily_workouts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS (mismo patrón que daily_workouts)
CREATE POLICY "Gym workouts are viewable by everyone" 
ON public.gym_daily_workouts 
FOR SELECT 
USING (is_active = true);

-- Insertar algunos entrenamientos de ejemplo de gimnasio/fitness
INSERT INTO public.gym_daily_workouts (title, description, duration, difficulty, type, warmup, main_workout) VALUES
('Push & Pull Hypertrophy', 'Entrenamiento de empuje y tracción para desarrollo muscular', 60, 'Intermedio', 'Hipertrofia', 
 '["5 min caminata en cinta", "Movilidad de hombros - 2 min", "Flexiones inclinadas - 10 reps", "Remo con banda elástica - 15 reps"]',
 '{"description": "4 series de cada ejercicio con 90 seg descanso", "exercises": ["Press banca con barra - 8-10 reps", "Remo en polea baja - 8-10 reps", "Press militar con mancuernas - 10-12 reps", "Dominadas asistidas - 6-8 reps", "Fondos en paralelas - 8-12 reps", "Curl de bíceps con barra - 10-12 reps"]}'),

('Leg Day Strength', 'Entrenamiento intenso de piernas para ganar fuerza', 75, 'Avanzado', 'Fuerza', 
 '["10 min bicicleta estática", "Sentadillas sin peso - 20 reps", "Estocadas dinámicas - 10 cada pierna", "Activación de glúteos con banda - 15 reps"]',
 '{"description": "5 series con descansos de 2-3 minutos", "exercises": ["Sentadilla con barra - 5-6 reps", "Peso muerto rumano - 6-8 reps", "Prensa de piernas - 10-12 reps", "Zancadas con mancuernas - 8 cada pierna", "Extensión de cuádriceps - 12-15 reps", "Curl femoral acostado - 10-12 reps"]}'),

('Core & Cardio HIIT', 'Entrenamiento de core combinado con cardio de alta intensidad', 45, 'Intermedio', 'HIIT', 
 '["Marcha en el sitio - 3 min", "Rotaciones de tronco - 2 min", "Plancha - 30 seg", "Jumping jacks suaves - 1 min"]',
 '{"description": "6 rondas de 45 seg trabajo / 15 seg descanso", "exercises": ["Mountain climbers", "Burpees modificados", "Plancha lateral (alternando)", "Bicycle crunches", "Squat jumps", "Russian twists con peso"]}'),

('Upper Body Pump', 'Entrenamiento de tren superior con alto volumen', 50, 'Principiante', 'Volumen', 
 '["Movilidad articular - 5 min", "Press con mancuernas ligeras - 15 reps", "Remo en máquina - 15 reps", "Elevaciones laterales sin peso - 20 reps"]',
 '{"description": "3 series con 60 seg descanso entre ejercicios", "exercises": ["Press banca con mancuernas - 12-15 reps", "Remo en máquina sentado - 12-15 reps", "Press de hombros en máquina - 12-15 reps", "Jalón al pecho - 12-15 reps", "Flexiones de tríceps en máquina - 15 reps", "Curl martillo con mancuernas - 12 reps"]}'),

('Full Body Functional', 'Entrenamiento funcional de cuerpo completo', 55, 'Intermedio', 'Funcional', 
 '["Activación general - 5 min", "Sentadillas con peso corporal - 15 reps", "Flexiones de rodilla - 10 reps", "Rotaciones de brazos - 30 seg"]',
 '{"description": "4 circuitos de 3 series cada uno", "exercises": ["Sentadilla con press de hombros", "Peso muerto con mancuernas", "Flexiones con rotación", "Estocadas con giro de tronco", "Plancha con elevación de brazo", "Swing con kettlebell"]}');

-- Crear función de trigger para actualizar updated_at
CREATE TRIGGER update_gym_daily_workouts_updated_at
BEFORE UPDATE ON public.gym_daily_workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();