import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Dumbbell, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutBasicInfo } from "@/components/workout-creator/WorkoutBasicInfo";
import { WorkoutPhaseEditor } from "@/components/workout-creator/WorkoutPhaseEditor";
import { useUserRole } from "@/hooks/useUserRole";

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

// Default workout phase generators
const getDefaultWarmup = (): WorkoutPhase => ({
  time_type: 'For Time',
  time_params: { minutes: 8, description: 'Calentamiento progresivo' },
  exercises: [],
  description: 'Calentamiento completo para preparar el cuerpo',
  skill_work: [],
  accessory_work: [],
  rounds: 1,
  instructions: ['Mantén ritmo constante', 'Escucha a tu cuerpo']
});

const getDefaultMainWorkout = (): WorkoutPhase => ({
  time_type: "For Time",
  time_params: { cap: 20, description: "Tiempo límite 20 minutos" },
  exercises: [],
  description: "Completar las rondas en el menor tiempo posible",
  skill_work: ["3 min técnica general"],
  accessory_work: ["2 sets movimientos accesorios"],
  rounds: 5,
  instructions: ['Mantén buena forma', 'Descansa si es necesario', 'Registra tu tiempo']
});

const getDefaultSecondaryWod = (): WorkoutPhase => ({
  time_type: "AMRAP",
  time_params: { minutes: 5, description: "Tantas rondas como sea posible" },
  exercises: [],
  description: 'WOD secundario para finalizar',
  skill_work: [],
  accessory_work: [],
  rounds: 0,
  instructions: ['Mantén la intensidad', 'Cuenta las rondas completadas']
});

const getDefaultCooldown = (): WorkoutPhase => ({
  time_type: 'Rest',
  time_params: { minutes: 5, description: 'Enfriamiento y relajación' },
  exercises: [],
  description: 'Enfriamiento para recuperación muscular',
  skill_work: [],
  accessory_work: [],
  rounds: 1,
  instructions: ['Respiración profunda', 'Mantén estiramientos 30 segundos']
});

const WorkoutCreator = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: workoutId } = useParams();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState<WorkoutFormData>({
    title: "",
    description: "",
    type: "Entrenamiento Diario",
    difficulty: "Principiante",
    duration: 45,
    warmup: getDefaultWarmup(),
    main_workout: getDefaultMainWorkout(),
    secondary_wod: getDefaultSecondaryWod(),
    cooldown: getDefaultCooldown()
  });

  useEffect(() => {
    fetchExercises();
    if (workoutId) {
      setIsEditMode(true);
      loadWorkoutData();
    }
  }, [workoutId]);

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

  const loadWorkoutData = async () => {
    if (!workoutId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          description: data.description || "",
          type: data.type,
          difficulty: data.difficulty,
          duration: data.duration,
          warmup: (data.warmup as unknown as WorkoutPhase) || getDefaultWarmup(),
          main_workout: (data.main_workout as unknown as WorkoutPhase) || getDefaultMainWorkout(),
          secondary_wod: (data.secondary_wod as unknown as WorkoutPhase) || getDefaultSecondaryWod(),
          cooldown: (data.cooldown as unknown as WorkoutPhase) || getDefaultCooldown(),
          scheduled_date: data.scheduled_date || undefined
        });
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el entrenamiento para editar.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBasicInfo = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePhase = (phaseName: keyof Pick<WorkoutFormData, 'warmup' | 'main_workout' | 'secondary_wod' | 'cooldown'>, phase: WorkoutPhase) => {
    setFormData(prev => ({ ...prev, [phaseName]: phase }));
  };

  // Redirect if not admin
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso Restringido</h1>
          <p className="text-muted-foreground mb-6">Solo los administradores pueden crear entrenamientos.</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título del entrenamiento es obligatorio.",
        variant: "destructive",
      });
      return;
    }

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

      if (isEditMode && workoutId) {
        // Update existing workout
        const { error } = await supabase
          .from('daily_workouts')
          .update(workoutData)
          .eq('id', workoutId);

        if (error) throw error;

        toast({
          title: "Entrenamiento actualizado",
          description: "El entrenamiento se ha actualizado exitosamente.",
        });
      } else {
        // Create new workout
        const { error } = await supabase
          .from('daily_workouts')
          .insert(workoutData);

        if (error) throw error;

        toast({
          title: "Entrenamiento creado",
          description: "El entrenamiento se ha guardado exitosamente.",
        });

        // Reset form after successful creation
        setFormData({
          title: "",
          description: "",
          type: "Entrenamiento Diario",
          difficulty: "Principiante",
          duration: 45,
          warmup: getDefaultWarmup(),
          main_workout: getDefaultMainWorkout(),
          secondary_wod: getDefaultSecondaryWod(),
          cooldown: getDefaultCooldown()
        });
      }

    } catch (error: any) {
      console.error('Error creating workout:', error);
      
      let errorMessage = "No se pudo crear el entrenamiento. Inténtalo de nuevo.";
      
      if (error?.message) {
        if (error.message.includes('new row violates row-level security policy')) {
          errorMessage = "No tienes permisos para crear entrenamientos. Solo los administradores pueden realizar esta acción.";
        } else if (error.message.includes('duplicate key')) {
          errorMessage = "Ya existe un entrenamiento con este nombre.";
        } else if (error.message.includes('violates not-null constraint')) {
          errorMessage = "Faltan campos obligatorios en el entrenamiento.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: "Error al crear entrenamiento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b sticky top-0 z-50 py-6 px-4 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditMode ? "Editar Entrenamiento" : "Crear Entrenamiento"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditMode 
                    ? "Modifica la información del entrenamiento existente" 
                    : "Panel profesional para crear entrenamientos completos"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <WorkoutBasicInfo
              title={formData.title}
              description={formData.description}
              type={formData.type}
              difficulty={formData.difficulty}
              duration={formData.duration}
              scheduledDate={formData.scheduled_date}
              onUpdate={updateBasicInfo}
            />

            <Tabs defaultValue="warmup" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="warmup">Calentamiento</TabsTrigger>
                <TabsTrigger value="main_workout">WOD Principal</TabsTrigger>
                <TabsTrigger value="secondary_wod">WOD Secundario</TabsTrigger>
                <TabsTrigger value="cooldown">Enfriamiento</TabsTrigger>
              </TabsList>
              
              <TabsContent value="warmup" className="mt-6">
                <WorkoutPhaseEditor
                  title="Fase de Calentamiento"
                  phase={formData.warmup}
                  onUpdate={(phase) => updatePhase('warmup', phase)}
                  availableExercises={availableExercises}
                />
              </TabsContent>
              
              <TabsContent value="main_workout" className="mt-6">
                <WorkoutPhaseEditor
                  title="WOD Principal"
                  phase={formData.main_workout}
                  onUpdate={(phase) => updatePhase('main_workout', phase)}
                  availableExercises={availableExercises}
                />
              </TabsContent>
              
              <TabsContent value="secondary_wod" className="mt-6">
                <WorkoutPhaseEditor
                  title="WOD Secundario"
                  phase={formData.secondary_wod}
                  onUpdate={(phase) => updatePhase('secondary_wod', phase)}
                  availableExercises={availableExercises}
                />
              </TabsContent>
              
              <TabsContent value="cooldown" className="mt-6">
                <WorkoutPhaseEditor
                  title="Fase de Enfriamiento"
                  phase={formData.cooldown}
                  onUpdate={(phase) => updatePhase('cooldown', phase)}
                  availableExercises={availableExercises}
                />
              </TabsContent>
            </Tabs>

            {/* Bottom action buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 pb-4 px-4 border-t bg-background sticky bottom-0 shadow-lg">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                {formData.title ? `Entrenamiento: ${formData.title}` : 'Complete la información básica'}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !formData.title.trim()}
                  size="lg"
                  className="w-full sm:w-auto sm:min-w-40"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading 
                    ? (isEditMode ? "Actualizando..." : "Guardando...") 
                    : (isEditMode ? "Actualizar Entrenamiento" : "Guardar Entrenamiento")
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCreator;