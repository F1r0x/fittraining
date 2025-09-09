import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DailyWorkoutData {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  type: string;
  warmup: string[];
  main_workout: {
    rounds?: number;
    description: string;
    exercises: string[];
  };
}

const DailyWorkout = () => {
  const [workout, setWorkout] = useState<DailyWorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    fetchTodaysWorkout();
  }, []);

  const fetchTodaysWorkout = async () => {
    try {
      // Get all active workouts
      const { data: workouts, error } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) {
        console.error('Error fetching workouts:', error);
        return;
      }

      if (workouts && workouts.length > 0) {
        // Use day of year to select which workout to show
        // This ensures the same workout shows for the entire day
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const selectedWorkoutRaw = workouts[dayOfYear % workouts.length];
        
        // Transform the data to match our interface
        const transformedWorkout: DailyWorkoutData = {
          id: selectedWorkoutRaw.id,
          title: selectedWorkoutRaw.title,
          description: selectedWorkoutRaw.description || '',
          duration: selectedWorkoutRaw.duration,
          difficulty: selectedWorkoutRaw.difficulty,
          type: selectedWorkoutRaw.type,
          warmup: Array.isArray(selectedWorkoutRaw.warmup) ? selectedWorkoutRaw.warmup as string[] : [],
          main_workout: selectedWorkoutRaw.main_workout as {
            rounds?: number;
            description: string;
            exercises: string[];
          }
        };
        
        setWorkout(transformedWorkout);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="entrenamiento-diario" className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!workout) {
    return (
      <section id="entrenamiento-diario" className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">No hay entrenamientos disponibles hoy.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="entrenamiento-diario" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">Entrenamiento </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">Gratuito</span>
          </h2>
          <p className="text-muted-foreground text-lg capitalize">{today}</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-primary mb-2">
                "{workout.title}"
              </CardTitle>
              <p className="text-muted-foreground">
                {workout.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center justify-center space-x-2 p-4 bg-fitness-gray rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-semibold">{workout.duration} min</span>
                </div>
                <div className="flex items-center justify-center space-x-2 p-4 bg-fitness-gray rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-semibold">{workout.difficulty}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 p-4 bg-fitness-gray rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-semibold">{workout.type}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-4">Calentamiento</h3>
                  <ul className="space-y-2 text-foreground">
                    {workout.warmup.map((exercise, index) => (
                      <li key={index}>• {exercise}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-primary mb-4">WOD Principal</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-fitness-gray-light rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">{workout.main_workout.description}</h4>
                      <ul className="space-y-1 text-foreground">
                        {workout.main_workout.exercises.map((exercise, index) => (
                          <li key={index}>• {exercise}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-primary rounded-lg text-center">
                <h3 className="text-xl font-bold text-white mb-2">¿Listo para el desafío?</h3>
                <p className="text-white/90 mb-4">
                  Registra tu tiempo y compártelo con la comunidad
                </p>
                <Button 
                  variant="secondary" 
                  className="bg-white text-background hover:bg-gray-100 font-semibold"
                >
                  Comenzar Entrenamiento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DailyWorkout;