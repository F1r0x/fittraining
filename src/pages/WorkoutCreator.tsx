import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Save, Dumbbell } from "lucide-react";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number | string;
  notes?: string;
  scaling?: string;
  image_url?: string;
  video_url?: string;
}

interface WorkoutPhase {
  time_type?: string;
  time_params?: {
    minutes?: number;
    cap?: number;
    description?: string;
  };
  exercises: Exercise[];
  description?: string;
  skill_work?: string[];
  accessory_work?: string[];
  rounds?: number;
  instructions?: string[];
}

interface WorkoutFormData {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  duration: number;
  warmup: WorkoutPhase;
  main_workout: WorkoutPhase;
  secondary_wod?: WorkoutPhase;
  cooldown: WorkoutPhase;
  scheduled_date?: string;
}

const WorkoutCreator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<WorkoutFormData>({
    title: "",
    description: "",
    type: "Entrenamiento Diario",
    difficulty: "Principiante",
    duration: 45,
    warmup: {
      time_type: 'For Time',
      time_params: { minutes: 8, description: 'Calentamiento progresivo' },
      exercises: [{ name: "", sets: 1, reps: 0, notes: "5 min calentamiento dinámico", scaling: "" }],
      description: 'Calentamiento completo para preparar el cuerpo',
      skill_work: [],
      accessory_work: [],
      rounds: 1,
      instructions: ['Mantén ritmo constante', 'Escucha a tu cuerpo']
    },
    main_workout: {
      skill_work: ["3 min técnica general"],
      exercises: [{ name: "", sets: 5, reps: 10, notes: "", scaling: "" }],
      description: "Completar las rondas en el menor tiempo posible",
      accessory_work: ["2 sets movimientos accesorios"],
      rounds: 5,
      time_type: "For Time",
      time_params: { cap: 20, description: "Tiempo límite 20 minutos" },
      instructions: ['Mantén buena forma', 'Descansa si es necesario', 'Registra tu tiempo']
    },
    secondary_wod: {
      time_type: "AMRAP",
      time_params: { minutes: 5, description: "Tantas rondas como sea posible" },
      exercises: [],
      description: 'WOD secundario para finalizar',
      skill_work: [],
      accessory_work: [],
      rounds: 0,
      instructions: ['Mantén la intensidad', 'Cuenta las rondas completadas']
    },
    cooldown: {
      time_type: 'Rest',
      time_params: { minutes: 5, description: 'Enfriamiento y relajación' },
      exercises: [{ name: "", sets: 1, reps: 0, notes: "5 min estiramientos", scaling: "" }],
      description: 'Enfriamiento para recuperación muscular',
      skill_work: [],
      accessory_work: [],
      rounds: 1,
      instructions: ['Respiración profunda', 'Mantén estiramientos 30 segundos']
    }
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setAvailableExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const workoutData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        difficulty: formData.difficulty,
        duration: formData.duration,
        warmup: formData.warmup as any,
        main_workout: formData.main_workout as any,
        secondary_wod: formData.secondary_wod as any,
        cooldown: formData.cooldown as any,
        scheduled_date: formData.scheduled_date || null,
        is_active: true
      };

      const { error } = await supabase
        .from('daily_workouts')
        .insert(workoutData);

      if (error) throw error;

      toast({
        title: "Entrenamiento creado",
        description: "El entrenamiento se ha guardado exitosamente.",
      });

    } catch (error) {
      console.error('Error creating workout:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el entrenamiento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Crear Entrenamiento</h1>
          </div>
          <p className="text-muted-foreground">Panel de administración para crear nuevos entrenamientos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Título del entrenamiento"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <Textarea
                placeholder="Descripción del entrenamiento"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear Entrenamiento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkoutCreator;