import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Zap, Trophy, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletedWorkout {
  id: string;
  completed_at: string;
  time_taken: number;
  workout_id: string;
  daily_workouts?: {
    title: string;
    description: string;
    type: string;
    difficulty: string;
    duration: number;
  } | null;
}

interface CompletedWorkoutsProps {
  userId: string;
}

const CompletedWorkouts = ({ userId }: CompletedWorkoutsProps) => {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedWorkouts();
  }, [userId]);

  const fetchCompletedWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          id,
          completed_at,
          time_taken,
          workout_id
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch workout details separately
      const workoutsWithDetails = await Promise.all(
        (data || []).map(async (progress) => {
          if (progress.workout_id) {
            const { data: workoutData } = await supabase
              .from('daily_workouts')
              .select('title, description, type, difficulty, duration')
              .eq('id', progress.workout_id)
              .single();
            
            return {
              ...progress,
              daily_workouts: workoutData
            };
          }
          return {
            ...progress,
            daily_workouts: null
          };
        })
      );

      setCompletedWorkouts(workoutsWithDetails);
    } catch (error) {
      console.error('Error fetching completed workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'principiante': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'intermedio': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'avanzado': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fuerza': return 'bg-fitness-orange/20 text-fitness-orange';
      case 'cardio': return 'bg-primary/20 text-primary';
      case 'flexibilidad': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="p-4 border rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (completedWorkouts.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">Aún no has completado ningún entrenamiento</p>
        <p className="text-sm text-muted-foreground">
          ¡Completa tu primer entrenamiento para ver tus logros aquí!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {completedWorkouts.map((workout) => (
        <div
          key={workout.id}
          className="p-4 border rounded-xl hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-foreground">
                {workout.daily_workouts?.title || 'Entrenamiento'}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {workout.daily_workouts?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(workout.daily_workouts?.difficulty || '')}>
                {workout.daily_workouts?.difficulty}
              </Badge>
              <Badge className={getTypeColor(workout.daily_workouts?.type || '')}>
                {workout.daily_workouts?.type}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(workout.completed_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(workout.time_taken || 0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                <span>{workout.daily_workouts?.duration || 0} min planificados</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Completado</span>
            </div>
          </div>
        </div>
      ))}
      
      {completedWorkouts.length >= 10 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            Ver Más Entrenamientos
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompletedWorkouts;