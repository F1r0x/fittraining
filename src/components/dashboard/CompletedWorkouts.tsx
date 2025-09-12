import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, Zap } from "lucide-react";

interface CompletedWorkout {
  id: string;
  completedAt: string;
  timeTaken: number | null;
  workout: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    type: string;
    source: 'daily' | 'session';
    duration?: number;
  };
}

interface CompletedWorkoutsProps {
  userId: string;
  filterType?: "CrossTraining" | "Fitness";
  showBothTypes?: boolean;
}

const CompletedWorkouts = ({ userId, filterType, showBothTypes = false }: CompletedWorkoutsProps) => {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedWorkouts();
  }, [userId, filterType, showBothTypes]);

  const fetchCompletedWorkouts = async () => {
    setLoading(true);
    
    try {
      // Fetch from workout_sessions (full workouts)
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (sessionError) {
        console.error('Error fetching completed workouts:', sessionError);
        return;
      }

      let allWorkouts: CompletedWorkout[] = [];

      // Add workout sessions
      if (sessionData) {
        const sessionWorkouts = sessionData.map(session => ({
          id: session.id,
          completedAt: session.completed_at,
          timeTaken: session.total_time,
          workout: {
            id: session.id,
            title: session.title,
            description: session.description,
            difficulty: 'Variable',
            type: session.title.toLowerCase().includes('fitness') || session.title.toLowerCase().includes('gym') ? 'Fitness' : 'CrossTraining',
            source: 'session' as const
          }
        }));
        allWorkouts = [...allWorkouts, ...sessionWorkouts];
      }

      // Apply filters
      if (filterType && !showBothTypes) {
        allWorkouts = allWorkouts.filter(workout => {
          if (filterType === 'CrossTraining') {
            return !workout.workout.title.toLowerCase().includes('fitness') && 
                   !workout.workout.title.toLowerCase().includes('gym');
          } else if (filterType === 'Fitness') {
            return workout.workout.title.toLowerCase().includes('fitness') ||
                   workout.workout.title.toLowerCase().includes('gym');
          }
          return true;
        });
      }

      // Sort by completion date and limit
      allWorkouts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      allWorkouts = allWorkouts.slice(0, 10);

      setCompletedWorkouts(allWorkouts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'principiante':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'avanzado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'fuerza':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cardio':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'crosstraining':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'fitness':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (completedWorkouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No hay entrenamientos completados aún.
          <br />
          ¡Comienza tu primer entrenamiento!
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
                {workout.workout?.title || 'Entrenamiento'}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {workout.workout?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(workout.workout?.difficulty || '')}>
                {workout.workout?.difficulty}
              </Badge>
              <Badge className={getTypeColor(workout.workout?.type || '')}>
                {workout.workout?.type}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(workout.completedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(workout.timeTaken || 0)}</span>
              </div>
              {workout.workout?.duration && (
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>{workout.workout.duration} min planificados</span>
                </div>
              )}
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
          <button className="text-primary hover:underline text-sm">
            Ver más entrenamientos
          </button>
        </div>
      )}
    </div>
  );
};

export default CompletedWorkouts;