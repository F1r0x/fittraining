import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Target, Zap, Timer, Award, Play, TrendingUp } from "lucide-react";
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
      <section id="entrenamiento-diario" className="py-32 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-lg">Cargando entrenamiento épico...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!workout) {
    return (
      <section id="entrenamiento-diario" className="py-32 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <Zap className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground text-xl">No hay entrenamientos disponibles hoy.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="entrenamiento-diario" className="py-32 bg-gradient-hero relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-20"></div>
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-fitness-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 mb-6 px-6 py-3 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
            <Timer className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-primary font-semibold uppercase tracking-wide">Entrenamiento del Día</span>
          </div>
          
          <h2 className="text-5xl md:text-5xl font-black mb-6 leading-tight">
            <span className="text-foreground">ENTRENA </span>
            <span className="px-4 py-2 rounded-xl bg-gradient-primary text-white">GRATIS</span>
          </h2>
          
          <p className="text-muted-foreground text-xl md:text-2xl font-light capitalize tracking-wide">
            {today}
          </p>
        </div>
        
        {/* Main Workout Card */}
        <div className="max-w-6xl mx-auto animate-workout-enter">
          <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-intense overflow-hidden relative group pt-20">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            
            {/* Header with dramatic styling */}
            <CardHeader className="text-center pb-8 pt-10 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow animate-pulse-glow">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <CardTitle className="text-4xl md:text-6xl font-black mb-4 mt-6">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  "{workout.title}"
                </span>
              </CardTitle>
              
              <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto">
                {workout.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-12 pb-12">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group p-6 bg-gradient-stats rounded-2xl shadow-workout hover:shadow-intense transition-all duration-300 hover:scale-105 animate-stat-bounce" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="p-3 bg-primary/20 rounded-full">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-2xl font-bold text-primary">{workout.duration} min</span>
                  </div>
                  <p className="text-muted-foreground text-center font-medium">Duración Total</p>
                </div>
                
                <div className="group p-6 bg-gradient-stats rounded-2xl shadow-workout hover:shadow-intense transition-all duration-300 hover:scale-105 animate-stat-bounce" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="p-3 bg-fitness-blue/20 rounded-full">
                      <Users className="w-6 h-6 text-fitness-blue" />
                    </div>
                    <span className="text-2xl font-bold text-fitness-blue">{workout.difficulty}</span>
                  </div>
                  <p className="text-muted-foreground text-center font-medium">Nivel de Intensidad</p>
                </div>
                
                <div className="group p-6 bg-gradient-stats rounded-2xl shadow-workout hover:shadow-intense transition-all duration-300 hover:scale-105 animate-stat-bounce" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="p-3 bg-fitness-orange/20 rounded-full">
                      <Target className="w-6 h-6 text-fitness-orange" />
                    </div>
                    <span className="text-2xl font-bold text-fitness-orange text-center leading-tight">{workout.type}</span>
                  </div>
                  <p className="text-muted-foreground text-center font-medium">Tipo de Entrenamiento</p>
                </div>
              </div>
              
              {/* Workout Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Warmup Section */}
                <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-primary/20 rounded-full">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary">Calentamiento</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {workout.warmup.map((exercise, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-fitness-gray/50 rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:bg-fitness-gray/70 group"
                      >
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold group-hover:bg-primary/30 transition-colors">
                          {index + 1}
                        </div>
                        <span className="text-foreground font-medium text-lg">{exercise}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Main Workout Section */}
                <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-fitness-orange/20 rounded-full">
                      <Award className="w-6 h-6 text-fitness-orange" />
                    </div>
                    <h3 className="text-2xl font-bold text-fitness-orange">WOD Principal</h3>
                  </div>
                  
                  <div className="p-6 bg-gradient-workout rounded-2xl border border-primary/20 shadow-workout">
                    <h4 className="font-bold text-foreground mb-6 text-xl flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span>{workout.main_workout.description}</span>
                    </h4>
                    
                    <div className="space-y-4">
                      {workout.main_workout.exercises.map((exercise, index) => (
                        <div 
                          key={index}
                          className="flex items-center space-x-4 p-4 bg-card/50 rounded-xl border border-fitness-orange/20 hover:border-fitness-orange/40 transition-all duration-300 hover:bg-card/70 group"
                        >
                          <div className="w-10 h-10 bg-fitness-orange/20 rounded-full flex items-center justify-center text-fitness-orange font-bold group-hover:bg-fitness-orange/30 transition-colors">
                            {index + 1}
                          </div>
                          <span className="text-foreground font-medium text-lg">{exercise}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Call to Action */}
              <div className="mt-16 text-center animate-slide-up" style={{ animationDelay: '0.8s' }}>
                <div className="p-8 bg-gradient-primary rounded-3xl shadow-intense relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-glow opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-white mb-4 flex items-center justify-center space-x-3">
                      <Play className="w-8 h-8" />
                      <span>¿LISTO PARA EL DESAFÍO?</span>
                    </h3>
                    <p className="text-white/90 mb-8 text-lg font-medium max-w-2xl mx-auto">
                      Supera tus límites y conviértete en la mejor versión de ti mismo. Cada repetición cuenta, cada segundo importa.
                    </p>
                    <Button 
                      size="lg"
                      className="bg-white text-background hover:bg-gray-100 font-bold text-xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                    >
                      <Zap className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                      COMENZAR ENTRENAMIENTO
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DailyWorkout;