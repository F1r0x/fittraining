import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkoutType {
  id: string;
  name: string;
  category: string;
}

interface WorkoutSet {
  id: string;
  unit: string;
  value: string;
}

interface WorkoutFormProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const UNIT_OPTIONS = [
  { value: 'reps', label: 'Repeticiones' },
  { value: 'kg', label: 'Kilogramos' },
  { value: 'time', label: 'Tiempo (seg)' },
  { value: 'distance', label: 'Distancia (m)' },
  { value: 'calories', label: 'Calorías' }
];

export const ImprovedWorkoutForm = ({ userId, onClose, onSuccess }: WorkoutFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<{
    name: string;
    sets: WorkoutSet[];
  }[]>([{
    name: "",
    sets: [{ id: crypto.randomUUID(), unit: 'reps', value: '' }]
  }]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkoutTypes();
  }, []);

  const fetchWorkoutTypes = async () => {
    const { data, error } = await supabase
      .from('workout_types')
      .select('id, name, category')
      .order('name');

    if (error) {
      console.error('Error fetching workout types:', error);
    } else if (data) {
      setWorkoutTypes(data);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, {
      name: "",
      sets: [{ id: crypto.randomUUID(), unit: 'reps', value: '' }]
    }]);
  };

  const removeExercise = (exerciseIndex: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, index) => index !== exerciseIndex));
    }
  };

  const updateExerciseName = (exerciseIndex: number, name: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].name = name;
    setExercises(newExercises);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.push({
      id: crypto.randomUUID(),
      unit: 'reps',
      value: ''
    });
    setExercises(newExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    if (newExercises[exerciseIndex].sets.length > 1) {
      newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, index) => index !== setIndex);
      setExercises(newExercises);
    }
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'unit' | 'value', value: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(newExercises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || exercises.some(ex => !ex.name.trim())) {
      toast({
        title: "Error",
        description: "Completa el título y los nombres de todos los ejercicios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const exercisesData = exercises.map(exercise => ({
      name: exercise.name,
      sets: exercise.sets.filter(set => set.value.trim()).map((set, index) => ({
        setNumber: index + 1,
        [set.unit]: parseFloat(set.value) || 0
      }))
    }));

    const { error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        exercises: exercisesData,
        date
      });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el entrenamiento",
        variant: "destructive"
      });
    } else {
      toast({
        title: "¡Entrenamiento guardado!",
        description: "Tu entrenamiento se ha registrado correctamente"
      });
      onSuccess();
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registrar Entrenamiento</CardTitle>
              <CardDescription>Registra tu sesión de entrenamiento completa</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título del entrenamiento */}
            <div className="space-y-2">
              <Label htmlFor="title">Título del Entrenamiento</Label>
              <Input
                id="title"
                placeholder="Ej: Entrenamiento de fuerza"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe tu entrenamiento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Ejercicios */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ejercicios</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExercise}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir Ejercicio
                </Button>
              </div>

              {exercises.map((exercise, exerciseIndex) => (
                <Card key={exerciseIndex} className="border-dashed">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 space-y-2">
                          <Select
                            value={exercise.name}
                            onValueChange={(value) => updateExerciseName(exerciseIndex, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona o escribe un ejercicio" />
                            </SelectTrigger>
                            <SelectContent>
                              {workoutTypes.map((workoutType) => (
                                <SelectItem key={workoutType.id} value={workoutType.name}>
                                  {workoutType.name} ({workoutType.category})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="O escribe un ejercicio personalizado"
                            value={exercise.name}
                            onChange={(e) => updateExerciseName(exerciseIndex, e.target.value)}
                          />
                        </div>
                        {exercises.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(exerciseIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Series</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSet(exerciseIndex)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Añadir Serie
                          </Button>
                        </div>

                        {exercise.sets.map((set, setIndex) => (
                          <div key={set.id} className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground min-w-[60px]">
                              Serie {setIndex + 1}:
                            </span>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Valor"
                              value={set.value}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'value', e.target.value)}
                              className="flex-1"
                            />
                            <Select
                              value={set.unit}
                              onValueChange={(value) => updateSet(exerciseIndex, setIndex, 'unit', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {UNIT_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {exercise.sets.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSet(exerciseIndex, setIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Entrenamiento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};