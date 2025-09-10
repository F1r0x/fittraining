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
  value2?: number;
  notes: string | null;
  date: string;
  workout_types: {
    id: string;
    name: string;
    category: string;
    unit: string;
    unit2?: string;
  };
}

interface RecentWorkoutsProps {
  userId: string;
  onUpdate: () => void;
}

export const RecentWorkouts = ({ userId, onUpdate }: RecentWorkoutsProps) => {
  const [personalRecords, setPersonalRecords] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPersonalRecords();
  }, [userId]);

  const fetchPersonalRecords = async () => {
    if (!userId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('workouts')
      .select(`
        id,
        value,
        value2,
        notes,
        date,
        workout_types!inner(
          id,
          name,
          category,
          unit,
          unit2
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching personal records:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los Personal Records",
        variant: "destructive",
      });
    } else if (data) {
      setPersonalRecords(data);
    }

    setLoading(false);
  };

  const handleDelete = async (recordId: string) => {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', recordId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el Personal Record",
        variant: "destructive",
      });
    } else {
      toast({ title: "Éxito", description: "Personal Record eliminado correctamente" });
      fetchPersonalRecords();
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

  if (personalRecords.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tienes Personal Records registrados aún</p>
        <p className="text-sm text-muted-foreground mt-1">¡Registra tu primer PR!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {personalRecords.map((record) => (
        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-4">
            <Badge variant={getCategoryBadgeVariant(record.workout_types.category)}>
              {record.workout_types.category}
            </Badge>
            <div>
              <p className="font-medium flex items-center">
                {record.workout_types.name}
                <span className="ml-2 text-yellow-500">🏆</span>
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">
                  {record.value} {getUnitLabel(record.workout_types.unit)}
                  {record.value2 && record.workout_types.unit2 && (
                    <span> + {record.value2} {getUnitLabel(record.workout_types.unit2)}</span>
                  )}
                </span>
                <span>•</span>
                <span>{new Date(record.date).toLocaleDateString()}</span>
              </div>
              {record.notes && (
                <p className="text-sm text-muted-foreground mt-1 italic">
                  {record.notes}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};