-- Create daily_workouts table for rotating workouts
CREATE TABLE public.daily_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Principiante', 'Intermedio', 'Avanzado')),
  type TEXT NOT NULL,
  warmup JSONB NOT NULL, -- array of warmup exercises
  main_workout JSONB NOT NULL, -- main workout structure
  cooldown JSONB, -- optional cooldown exercises
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.daily_workouts ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing (everyone can see workouts)
CREATE POLICY "Daily workouts are viewable by everyone" 
ON public.daily_workouts 
FOR SELECT 
USING (is_active = true);

-- Insert some sample workouts
INSERT INTO public.daily_workouts (title, description, duration, difficulty, type, warmup, main_workout) VALUES
('BEAST MODE', 'Entrenamiento completo de fuerza y cardio', 45, 'Intermedio', 'Fuerza + Cardio', 
 '["5 min trote suave", "20 jumping jacks", "15 air squats", "10 arm circles"]',
 '{"rounds": 5, "description": "5 Rondas por Tiempo:", "exercises": ["15 Burpees", "20 Box Jumps (24\"/20\")", "25 Kettlebell Swings (24kg/16kg)", "30 Double Unders"]}'
),
('WARRIOR STRENGTH', 'Enfoque en fuerza pura y resistencia', 50, 'Avanzado', 'Fuerza', 
 '["10 min movilidad articular", "15 push-ups", "20 squats", "Estiramientos dinámicos"]',
 '{"rounds": 4, "description": "4 Rondas de Fuerza:", "exercises": ["10 Deadlifts (70% 1RM)", "8 Pull-ups estrictas", "12 Front Squats", "1 min Plank hold"]}'
),
('CARDIO INFERNO', 'Quema calorías con alta intensidad', 35, 'Intermedio', 'Cardio', 
 '["5 min bicicleta estática", "Dynamic stretching", "10 mountain climbers"]',
 '{"rounds": 6, "description": "6 Rondas AMRAP 4 min:", "exercises": ["12 Thrusters", "15 Burpees", "20 Jump rope", "Descanso 1 min"]}'
),
('FUNCTIONAL FITNESS', 'Movimientos funcionales para el día a día', 40, 'Principiante', 'Funcional', 
 '["Caminata 5 min", "Círculos de brazos", "Squats sin peso", "Estiramientos básicos"]',
 '{"rounds": 3, "description": "3 Rondas por Tiempo:", "exercises": ["15 Air Squats", "10 Push-ups (modificados si es necesario)", "20 Walking Lunges", "30 seg Mountain Climbers"]}'
),
('POWER HOUR', 'Combinación explosiva de potencia y resistencia', 60, 'Avanzado', 'Potencia + Resistencia', 
 '["10 min calentamiento dinámico", "Activación muscular", "Movimientos balísticos"]',
 '{"rounds": 5, "description": "5 Rondas con descanso:", "exercises": ["8 Clean & Jerk", "12 Box Jump Overs", "16 Kettlebell Snatches", "20 Wall Balls", "Descanso 2 min"]}'
),
('CORE CRUSHER', 'Fortalecimiento del core y estabilidad', 30, 'Intermedio', 'Core + Estabilidad', 
 '["Activación del core", "Estiramientos de cadera", "Movilidad columna"]',
 '{"rounds": 4, "description": "4 Rondas EMOM:", "exercises": ["Min 1: 45 seg Plank", "Min 2: 20 Russian Twists", "Min 3: 15 V-ups", "Min 4: 30 seg Side Plank cada lado"]}'
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_workouts_updated_at
BEFORE UPDATE ON public.daily_workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();