import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Clock, Dumbbell, Target, Play, ArrowLeft, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Workout {
  id: string;
  title: string;
  description: string | null;
  type: string;
  difficulty: string;
  duration: number;
  warmup: any;
  main_workout: any;
  cooldown: any | null;
  created_at: string;
}

const PremiumWorkouts = () => {
  const [crossTrainingWorkouts, setCrossTrainingWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      
      // Fetch CrossTraining workouts
      const { data: crossTrainingData, error: crossTrainingError } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (crossTrainingError) {
        console.error("Error fetching cross training workouts:", crossTrainingError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los entrenamientos de CrossTraining",
          variant: "destructive"
        });
      } else {
        setCrossTrainingWorkouts(crossTrainingData || []);
      }

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al cargar los entrenamientos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'principiante':
      case 'beginner':
        return 'bg-green-500/20 text-green-700 hover:bg-green-500/30';
      case 'intermedio':
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30';
      case 'avanzado':
      case 'advanced':
        return 'bg-red-500/20 text-red-700 hover:bg-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 hover:bg-gray-500/30';
    }
  };

  const handleStartWorkout = (workout: Workout) => {
    navigate('/workout-session', { state: { workout } });
  };

  const handleEditWorkout = (workout: Workout) => {
    navigate(`/workout-creator/${workout.id}`);
  };

  const getExercisesPreview = (mainWorkout: any) => {
    if (!mainWorkout || !Array.isArray(mainWorkout)) return "Ver detalles";
    
    const exerciseNames = mainWorkout
      .slice(0, 3)
      .map((exercise: any) => exercise.name || exercise.exercise)
      .filter(Boolean);
    
    const preview = exerciseNames.join(", ");
    return mainWorkout.length > 3 
      ? `${preview}...` 
      : preview || "Ver detalles";
  };

  const WorkoutCard = ({ workout }: { workout: Workout }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            {workout.title}
          </CardTitle>
          <Badge className={getDifficultyColor(workout.difficulty)}>
            {workout.difficulty}
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground line-clamp-2">
          {workout.description || "Entrenamiento completo para mejorar tu rendimiento"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{workout.duration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            <span className="capitalize">{workout.type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>{getExercisesPreview(workout.main_workout)}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <Button 
            onClick={() => handleStartWorkout(workout)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Play className="h-4 w-4 mr-2" />
            Comenzar Entrenamiento
          </Button>
          
          {isAdmin && (
            <Button 
              onClick={() => handleEditWorkout(workout)}
              variant="outline"
              className="w-full"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Entrenamiento
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <RoleProtectedRoute allowedRoles={['afiliado', 'administrador']}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </RoleProtectedRoute>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={['afiliado', 'administrador']}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/crosstraining')}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a CrossTraining
            </Button>
            
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              Entrenamientos Premium
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Accede a nuestra biblioteca completa de entrenamientos de CrossTraining profesionales
              para alcanzar tus objetivos.
            </p>
          </div>

          {/* CrossTraining workouts */}
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {crossTrainingWorkouts.length > 0 ? (
                crossTrainingWorkouts.map((workout) => (
                  <WorkoutCard 
                    key={workout.id} 
                    workout={workout} 
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No hay entrenamientos de CrossTraining disponibles
                  </h3>
                  <p className="text-muted-foreground">
                    Los entrenamientos aparecerán aquí cuando estén disponibles.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
};

export default PremiumWorkouts;