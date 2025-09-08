import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Workout {
  id: string;
  value: number;
  notes: string | null;
  date: string;
  workout_types: {
    name: string;
    category: string;
    unit: string;
  };
}

interface RecentWorkoutsProps {
  userId: string;
  onUpdate: () => void;
}

export const RecentWorkouts = ({ userId, onUpdate }: RecentWorkoutsProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentWorkouts();
  }, [userId]);

  const fetchRecentWorkouts = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        id,
        value,
        notes,
        date,
        workout_types!inner(name, category, unit)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setWorkouts(data as Workout[]);
    }

    setLoading(false);
  };

  const handleDelete = async (workoutId: string) => {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el entrenamiento",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Eliminado",
        description: "Entrenamiento eliminado correctamente",
      });
      fetchRecentWorkouts();
      onUpdate();
    }
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'reps': return 'reps';
      case 'time': return 's';
      case 'weight': return 'kg';
      case 'distance': return 'km';
      default: return unit;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'Fuerza': 'destructive',
      'Cardio': 'default',
      'Resistencia': 'secondary',
      'HIIT': 'outline'
    };
    return variants[category] || 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No tienes entrenamientos registrados aún.
          <br />
          ¡Añade tu primer entrenamiento!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{workout.workout_types.name}</span>
              <Badge variant={getCategoryBadgeVariant(workout.workout_types.category)}>
                {workout.workout_types.category}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">
                {workout.value} {getUnitLabel(workout.workout_types.unit)}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(workout.date), 'dd MMM', { locale: es })}
                </span>
              </div>
            </div>
            {workout.notes && (
              <p className="text-xs text-muted-foreground italic">
                "{workout.notes}"
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(workout.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};