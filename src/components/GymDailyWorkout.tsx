import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Target, Zap, Timer, Award, Play, TrendingUp, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";  

// Interfaz actualizada: warmup y exercises ahora son arrays de objetos
interface Exercise {
  name: string;
  reps?: number;
  sets?: number;
  notes?: string;
}

interface GymWorkoutData {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  type: string;
  warmup: Exercise[]; // Cambiado de string[] a Exercise[]
  main_workout: {
    description: string;
    exercises: Exercise[]; // Cambiado de string[] a Exercise[]
  };
}

const GymDailyWorkout = () => {
  const [workout, setWorkout] = useState<GymWorkoutData | null>(null);
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

  const navigate = useNavigate();

  const fetchTodaysWorkout = async () => {
    try {
      const { data: workouts, error } = await supabase
        .from('gym_daily_workouts')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) {
        console.error('Error fetching gym workouts:', error);
        return;
      }

      if (workouts && workouts.length > 0) {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const selectedWorkoutRaw = workouts[dayOfYear % workouts.length];
        
        // Transformación actualizada: maneja objetos en lugar de strings
        const transformedWorkout: GymWorkoutData = {
          id: selectedWorkoutRaw.id,
          title: selectedWorkoutRaw.title,
          description: selectedWorkoutRaw.description || '',
          duration: selectedWorkoutRaw.duration,
          difficulty: selectedWorkoutRaw.difficulty,
          type: selectedWorkoutRaw.type,
          warmup: Array.isArray(selectedWorkoutRaw.warmup) 
            ? selectedWorkoutRaw.warmup.map((ex: any) => ({
                name: ex.name || String(ex), // Fallback a string si no es objeto
                reps: ex.reps,
                sets: ex.sets,
                notes: ex.notes,
              })) 
            : [],
          main_workout: {
            description: selectedWorkoutRaw.main_workout?.description || '',
            exercises: Array.isArray(selectedWorkoutRaw.main_workout?.exercises)
              ? selectedWorkoutRaw.main_workout.exercises.map((ex: any) => ({
                  name: ex.name || String(ex), // Fallback
                  reps: ex.reps,
                  sets: ex.sets,
                  notes: ex.notes,
                }))
              : [],
          }
        };
        
        setWorkout(transformedWorkout);
        // Debug: Log para verificar estructura
        console.log('Transformed workout:', transformedWorkout);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... (el resto del if loading y if !workout permanece igual)

  return (
    <section id="entrenamiento-diario-gym" className="py-16 bg-gradient-gym-hero relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-gym-glow opacity-20"></div>
      <div className="absolute top-10 left-1/4 w-64 h-64 bg-gym-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gym-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-gym-primary/10 backdrop-blur-sm rounded-full border border-gym-primary/20">
            <Dumbbell className="w-4 h-4 text-gym-primary animate-pulse" />
            <span className="text-gym-primary font-semibold uppercase tracking-wide">Rutina Fitness del Día</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 leading-tight px-4">
            <span className="text-foreground">ENTRENA </span>
            <span className="px-2 sm:px-3 py-1 rounded-lg bg-gradient-gym-primary text-white text-base sm:text-2xl md:text-4xl">FITNESS</span>
          </h2>
          
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-light capitalize tracking-wide px-4">
            {today}
          </p>
        </div>
        
        {/* Main Workout Card */}
        <div className="max-w-5xl mx-auto animate-workout-enter">
          <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-gym-intense overflow-hidden relative group pt-16">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-gym-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            
            {/* Header with dramatic styling */}
            <CardHeader className="text-center pb-6 pt-8 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-12 h-12 bg-gradient-gym-primary rounded-full flex items-center justify-center shadow-gym-glow animate-pulse">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <CardTitle className="text-3xl md:text-4xl font-black mb-3 mt-4">
                <span className="bg-gradient-gym-primary bg-clip-text text-transparent">
                  {workout.title}
                </span>
              </CardTitle>
              
              <p className="text-muted-foreground text-base md:text-lg font-medium max-w-xl mx-auto">
                {workout.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-8 pb-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="group p-3 sm:p-4 bg-gradient-gym-stats rounded-xl shadow-gym-workout hover:shadow-gym-intense transition-all duration-300 hover:scale-105 animate-stat-bounce" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="p-1.5 sm:p-2 bg-gym-primary/20 rounded-full">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gym-primary" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-gym-primary">{workout.duration} min</span>
                  </div>
                  <p className="text-muted-foreground text-center font-medium text-xs sm:text-sm">Duración Total</p>
                </div>
                
                <div className="group p-3 sm:p-4 bg-gradient-gym-stats rounded-xl shadow-gym-workout hover:shadow-gym-intense transition-all duration-300 hover:scale-105 animate-stat-bounce" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="p-1.5 sm:p-2 bg-gym-accent/20 rounded-full">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gym-accent" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-gym-accent">{workout.difficulty}</span>
                  </div>
                  <p className="text-muted-foreground text-center font-medium text-xs sm:text-sm">Nivel de Dificultad</p>
                </div>
                
                <div className="group p-3 sm:p-4 bg-gradient-gym-stats rounded-xl shadow-gym-workout hover:shadow-gym-intense transition-all duration-300 hover:scale-105 animate-stat-bounce" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="p-1.5 sm:p-2 bg-gym-secondary/20 rounded-full">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-gym-secondary" />
                    </div>
                    <span className="text-base sm:text-xl font-bold text-gym-secondary text-center leading-tight">{workout.type}</span>
                  </div>
                  <p className="text-muted-foreground text-center font-medium text-xs sm:text-sm">Tipo de Entrenamiento</p>
                </div>
              </div>
              
              {/* Workout Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Warmup Section */}
                <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-gym-primary/20 rounded-full">
                      <TrendingUp className="w-5 h-5 text-gym-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gym-primary">Calentamiento</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {workout.warmup.map((exercise, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gym-muted/50 rounded-lg border border-gym-primary/10 hover:border-gym-primary/30 transition-all duration-300 hover:bg-gym-muted/70 group"
                      >
                        <div className="w-8 h-8 bg-gym-primary/20 rounded-full flex items-center justify-center text-gym-primary font-bold group-hover:bg-gym-primary/30 transition-colors">
                          {index + 1}
                        </div>
                        {/* FIX: Renderiza propiedades del objeto, no el objeto entero */}
                        <div className="flex-1">
                          <span className="text-foreground font-medium text-base block">{exercise.name}</span>
                          {exercise.sets && exercise.reps && (
                            <span className="text-muted-foreground text-sm block">
                              {exercise.sets}x{exercise.reps} reps
                            </span>
                          )}
                          {exercise.notes && (
                            <span className="text-muted-foreground text-xs block italic">
                              {exercise.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Main Workout Section */}
                <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-gym-secondary/20 rounded-full">
                      <Award className="w-5 h-5 text-gym-secondary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gym-secondary">Rutina Principal</h3>
                  </div>
                  
                  <div className="p-4 bg-gradient-gym-workout rounded-xl border border-gym-primary/20 shadow-gym-workout">
                    <h4 className="font-bold text-foreground mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <Dumbbell className="w-4 h-4 text-gym-primary" />
                      <span>{workout.main_workout.description}</span>
                    </h4>
                    
                    <div className="space-y-3">
                      {workout.main_workout.exercises.map((exercise, index) => (
                        <div 
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-card/50 rounded-lg border border-gym-secondary/20 hover:border-gym-secondary/40 transition-all duration-300 hover:bg-card/70 group"
                        >
                          <div className="w-8 h-8 bg-gym-secondary/20 rounded-full flex items-center justify-center text-gym-secondary font-bold group-hover:bg-gym-secondary/30 transition-colors">
                            {index + 1}
                          </div>
                          {/* FIX: Igual que arriba, renderiza props específicas */}
                          <div className="flex-1">
                            <span className="text-foreground font-medium text-base block">{exercise.name}</span>
                            {exercise.sets && exercise.reps && (
                              <span className="text-muted-foreground text-sm block">
                                {exercise.sets}x{exercise.reps} reps
                              </span>
                            )}
                            {exercise.notes && (
                              <span className="text-muted-foreground text-xs block italic">
                                {exercise.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Call to Action */}
              <div className="mt-6 sm:mt-8 text-center animate-slide-up px-2 sm:px-0" style={{ animationDelay: '0.4s' }}>
                <div className="p-4 sm:p-6 bg-gradient-gym-primary rounded-2xl shadow-gym-intense relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-gym-glow opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg sm:text-2xl font-black text-white mb-2 sm:mb-3 flex items-center justify-center space-x-2">
                      <Play className="w-4 h-4 sm:w-6 sm:h-6" />
                      <span>¿LISTO PARA TRANSFORMARTE?</span>
                    </h3>
                    <p className="text-white/90 mb-4 sm:mb-6 text-xs sm:text-base font-medium max-w-xl mx-auto">
                      Alcanza tus objetivos fitness y construye el cuerpo que siempre has querido.
                    </p>
                    <Button 
                      size="lg"
                      className="bg-white text-gym-primary hover:bg-gray-100 font-bold text-sm sm:text-lg px-4 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group w-full sm:w-auto"
                      onClick={() => navigate('/gym-workout-session', { state: { workout } })}
                    >
                      <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 group-hover:animate-pulse" />
                      COMENZAR RUTINA
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

export default GymDailyWorkout;