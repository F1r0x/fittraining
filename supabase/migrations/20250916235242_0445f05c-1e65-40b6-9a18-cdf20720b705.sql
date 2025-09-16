-- Create exercises table for exercise library
CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  video_url text,
  description text,
  muscle_groups text[],
  difficulty text,
  equipment text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to exercises
CREATE POLICY "Exercises are viewable by everyone" 
ON public.exercises 
FOR SELECT 
USING (true);

-- Add trigger for timestamps
CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert exercise data
INSERT INTO public.exercises (name, image_url, description, muscle_groups, difficulty, equipment) VALUES
('Deadlifts', '/src/assets/deadlift.jpg', 'Levantamiento de peso muerto desde el suelo', ARRAY['Espalda', 'Glúteos', 'Piernas'], 'Intermedio', ARRAY['Barra', 'Discos']),
('Peso muerto', '/src/assets/deadlift.jpg', 'Levantamiento de peso muerto desde el suelo', ARRAY['Espalda', 'Glúteos', 'Piernas'], 'Intermedio', ARRAY['Barra', 'Discos']),
('Burpees', '/src/assets/burpees.png', 'Ejercicio completo que combina flexión, salto y sentadilla', ARRAY['Todo el cuerpo'], 'Avanzado', ARRAY['Peso corporal']),
('Correr', '/src/assets/correr.png', 'Ejercicio cardiovascular de carrera', ARRAY['Piernas', 'Cardiovascular'], 'Principiante', ARRAY['Ninguno']),
('Assault Bike', '/src/assets/assault_bike.png', 'Bicicleta de asalto para cardio intenso', ARRAY['Piernas', 'Brazos', 'Cardiovascular'], 'Intermedio', ARRAY['Assault Bike']),
('KB Russian Swing', '/src/assets/kettlebell-swing.jpg', 'Balanceo ruso con kettlebell', ARRAY['Glúteos', 'Core', 'Hombros'], 'Intermedio', ARRAY['Kettlebell']),
('Pull-ups', '/src/assets/pull-ups.jpg', 'Dominadas en barra', ARRAY['Espalda', 'Bíceps'], 'Intermedio', ARRAY['Barra de dominadas']),
('Pull-ups/Dominadas', '/src/assets/pull-ups.jpg', 'Dominadas en barra', ARRAY['Espalda', 'Bíceps'], 'Intermedio', ARRAY['Barra de dominadas']),
('Strict Pull-ups', '/src/assets/pull-ups.jpg', 'Dominadas estrictas sin impulso', ARRAY['Espalda', 'Bíceps'], 'Avanzado', ARRAY['Barra de dominadas']),
('Front Squats', '/src/assets/front-squat.jpg', 'Sentadillas frontales con barra', ARRAY['Piernas', 'Core'], 'Intermedio', ARRAY['Barra', 'Discos']),
('Front Squat', '/src/assets/front-squat.jpg', 'Sentadilla frontal con barra', ARRAY['Piernas', 'Core'], 'Intermedio', ARRAY['Barra', 'Discos']),
('Plank Hold', '/src/assets/plank.jpg', 'Plancha isométrica', ARRAY['Core', 'Hombros'], 'Principiante', ARRAY['Peso corporal']),
('Plank/Plancha', '/src/assets/plank.jpg', 'Plancha isométrica', ARRAY['Core', 'Hombros'], 'Principiante', ARRAY['Peso corporal']),
('Box Jumps', '/src/assets/box-jumps.jpg', 'Saltos al cajón', ARRAY['Piernas', 'Glúteos'], 'Intermedio', ARRAY['Cajón pliométrico']),
('Thrusters', '/src/assets/thrusters.jpg', 'Movimiento combinado de sentadilla y press', ARRAY['Piernas', 'Hombros', 'Core'], 'Avanzado', ARRAY['Barra', 'Mancuernas']),
('Thruster', '/src/assets/thrusters.jpg', 'Movimiento combinado de sentadilla y press', ARRAY['Piernas', 'Hombros', 'Core'], 'Avanzado', ARRAY['Barra', 'Mancuernas']),
('Double Unders', '/src/assets/double-unders.jpg', 'Saltos dobles con cuerda', ARRAY['Piernas', 'Cardiovascular'], 'Avanzado', ARRAY['Cuerda de saltar']),
('Double Unders/Saltos Dobles', '/src/assets/double-unders.jpg', 'Saltos dobles con cuerda', ARRAY['Piernas', 'Cardiovascular'], 'Avanzado', ARRAY['Cuerda de saltar']);