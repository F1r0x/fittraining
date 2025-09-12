import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Clock, TrendingUp, Award } from "lucide-react";

interface FitnessStatsProps {
  userId: string;
}

interface FitnessData {
  totalFitnessWorkouts: number;
  totalFitnessTime: number;
  avgWorkoutTime: number;
  currentStreak: number;
  recentWorkouts: Array<{
    title: string;
    date: string;
    duration: number;
  }>;
}

export const FitnessStats = ({ userId }: FitnessStatsProps) => {
  const [data, setData] = useState<FitnessData>({
    totalFitnessWorkouts: 0,
    totalFitnessTime: 0,
    avgWorkoutTime: 0,
    currentStreak: 0,
    recentWorkouts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFitnessStats();
  }, [userId]);

  const fetchFitnessStats = async () => {
    try {
      // Obtener entrenamientos de fitness
      const { data: fitnessWorkouts, error } = await supabase
        .from('workout_sessions')
        .select('title, total_time, date, completed_at')
        .eq('user_id', userId)
        .like('title', '%Fitness%')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching fitness stats:', error);
        return;
      }

      const totalFitnessWorkouts = fitnessWorkouts?.length || 0;
      const totalFitnessTime = fitnessWorkouts?.reduce((sum, workout) => sum + (workout.total_time || 0), 0) || 0;
      const avgWorkoutTime = totalFitnessWorkouts > 0 ? Math.round(totalFitnessTime / totalFitnessWorkouts) : 0;

      // Calcular racha actual para fitness
      let currentStreak = 0;
      if (fitnessWorkouts && fitnessWorkouts.length > 0) {
        const today = new Date();
        let currentDate = new Date(today);
        currentDate.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 30; i++) { // Revisar últimos 30 días
          const dateStr = currentDate.toISOString().split('T')[0];
          const hasWorkout = fitnessWorkouts.some(workout => 
            new Date(workout.date).toISOString().split('T')[0] === dateStr
          );
          
          if (hasWorkout) {
            currentStreak++;
          } else {
            break;
          }
          
          currentDate.setDate(currentDate.getDate() - 1);
        }
      }

      // Últimos entrenamientos de fitness
      const recentWorkouts = fitnessWorkouts?.slice(0, 5).map(workout => ({
        title: workout.title.replace(' - Fitness', ''),
        date: workout.date,
        duration: workout.total_time || 0
      })) || [];

      setData({
        totalFitnessWorkouts,
        totalFitnessTime,
        avgWorkoutTime,
        currentStreak,
        recentWorkouts
      });
    } catch (error) {
      console.error('Error in fetchFitnessStats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-gym-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gym-primary/20 rounded-full mx-auto mb-2">
              <Dumbbell className="w-4 h-4 text-gym-primary" />
            </div>
            <div className="text-2xl font-bold text-gym-primary">{data.totalFitnessWorkouts}</div>
            <div className="text-xs text-muted-foreground">Entrenamientos</div>
          </CardContent>
        </Card>

        <Card className="border-gym-accent/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gym-accent/20 rounded-full mx-auto mb-2">
              <Clock className="w-4 h-4 text-gym-accent" />
            </div>
            <div className="text-2xl font-bold text-gym-accent">{formatTime(data.totalFitnessTime)}</div>
            <div className="text-xs text-muted-foreground">Tiempo Total</div>
          </CardContent>
        </Card>

        <Card className="border-gym-secondary/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gym-secondary/20 rounded-full mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-gym-secondary" />
            </div>
            <div className="text-2xl font-bold text-gym-secondary">{formatTime(data.avgWorkoutTime)}</div>
            <div className="text-xs text-muted-foreground">Promedio</div>
          </CardContent>
        </Card>

        <Card className="border-gym-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gym-primary/20 rounded-full mx-auto mb-2">
              <Award className="w-4 h-4 text-gym-primary" />
            </div>
            <div className="text-2xl font-bold text-gym-primary">{data.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Racha Días</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      {data.recentWorkouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Dumbbell className="w-5 h-5 text-gym-primary" />
              <span>Entrenamientos de Fitness Recientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentWorkouts.map((workout, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gym-muted/10 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{workout.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(workout.date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="border-gym-primary text-gym-primary">
                      {formatTime(workout.duration)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.totalFitnessWorkouts === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              ¡Comienza tu Journey de Fitness!
            </h3>
            <p className="text-muted-foreground">
              Completa tu primer entrenamiento de fitness para ver tus estadísticas aquí.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FitnessStats;