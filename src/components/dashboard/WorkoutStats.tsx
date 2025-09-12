import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

interface WorkoutStatsProps {
  userId: string;
}

export const WorkoutStats = ({ userId }: WorkoutStatsProps) => {
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    setLoading(true);
    
    // Obtener solo datos de workout_sessions (entrenamientos completos), no PRs
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('title, exercises')
      .eq('user_id', userId);

    if (sessionData && sessionData.length > 0) {
      const categoryCount: { [key: string]: number } = {};
      let total = 0;

      // Contar solo entrenamientos de sesiones completas
      sessionData.forEach((session: any) => {
        if (session.exercises && Array.isArray(session.exercises)) {
          // Categorizar por tipo de entrenamiento basándose en el título
          let category = "CrossTraining";
          if (session.title.toLowerCase().includes('fitness') || session.title.toLowerCase().includes('gym')) {
            category = "Fitness & Gym";
          }
          
          categoryCount[category] = (categoryCount[category] || 0) + 1;
          total++;
        }
      });

      const categoryStats = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      setStats(categoryStats);
    } else {
      setStats([]);
    }

    setLoading(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Fuerza': 'bg-red-500',
      'Cardio': 'bg-blue-500',
      'Resistencia': 'bg-green-500',
      'HIIT': 'bg-purple-500',
      'Flexibilidad': 'bg-yellow-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'Fuerza': 'destructive',
      'Cardio': 'default',
      'Resistencia': 'secondary',
      'HIIT': 'outline',
      'Entrenamiento Completo': 'default'
    };
    return variants[category] || 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Aún no tienes entrenamientos registrados.
          <br />
          ¡Comienza añadiendo tu primer ejercicio!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats.map((stat, index) => (
        <div key={stat.category} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={getCategoryBadgeVariant(stat.category)}>
                {stat.category}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{stat.count} ejercicios</span>
              <span>({stat.percentage}%)</span>
            </div>
          </div>
          <Progress 
            value={stat.percentage} 
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
};