import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

interface ExerciseSet {
  reps?: number;
  weight?: number;
  time?: number;
  distance?: number;
  rest?: number;
}

interface WorkoutSessionFormProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const WorkoutSessionForm = ({ userId, onClose, onSuccess }: WorkoutSessionFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: "1", name: "", sets: [{ reps: 0, weight: 0 }] }
  ]);
  const [totalTime, setTotalTime] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: "",
      sets: [{ reps: 0, weight: 0 }]
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const updateExerciseName = (exerciseId: string, name: string) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, name } : ex
    ));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId 
        ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0 }] }
        : ex
    ));
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: ex.sets.filter((_, index) => index !== setIndex) }
        : ex
    ));
  };

  const updateSet = (exerciseId: string, setIndex: number, field: keyof ExerciseSet, value: number) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            sets: ex.sets.map((set, index) =>
              index === setIndex ? { ...set, [field]: value } : set
            )
          }
        : ex
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || exercises.length === 0 || exercises.some(ex => !ex.name)) {
      toast({
        title: "Error",
        description: "Por favor completa el título y al menos un ejercicio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        title,
        description: description.trim() || null,
        total_time: totalTime ? parseInt(totalTime) : null,
        exercises: JSON.stringify(exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets
        }))),
        date
      });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el entrenamiento",
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Éxito!",
        description: "Entrenamiento registrado correctamente",
      });
      onSuccess();
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registrar Entrenamiento Completo</CardTitle>
              <CardDescription>Registra una sesión completa de entrenamiento con múltiples ejercicios</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Entrenamiento *</Label>
                <Input
                  id="title"
                  placeholder="ej. Entrenamiento de Fuerza - Día 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del entrenamiento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalTime">Tiempo Total (minutos)</Label>
              <Input
                id="totalTime"
                type="number"
                placeholder="45"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
              />
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ejercicios</h3>
                <Button type="button" onClick={addExercise} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Ejercicio
                </Button>
              </div>

              {exercises.map((exercise, exerciseIndex) => (
                <Card key={exercise.id} className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Nombre del ejercicio"
                          value={exercise.name}
                          onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                          className="flex-1"
                        />
                        {exercises.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeExercise(exercise.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Sets */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Series</Label>
                          <Button
                            type="button"
                            onClick={() => addSet(exercise.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Añadir Serie
                          </Button>
                        </div>

                        <div className="grid gap-2">
                          {exercise.sets.map((set, setIndex) => (
                            <div key={setIndex} className="grid grid-cols-6 gap-2 items-center bg-muted/30 p-2 rounded">
                              <Label className="text-xs">Serie {setIndex + 1}</Label>
                              
                              <div>
                                <Label className="text-xs">Reps</Label>
                                <Input
                                  type="number"
                                  placeholder="12"
                                  value={set.reps || ""}
                                  onChange={(e) => updateSet(exercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs">Peso (kg)</Label>
                                <Input
                                  type="number"
                                  placeholder="20"
                                  step="0.5"
                                  value={set.weight || ""}
                                  onChange={(e) => updateSet(exercise.id, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs">Tiempo (s)</Label>
                                <Input
                                  type="number"
                                  placeholder="30"
                                  value={set.time || ""}
                                  onChange={(e) => updateSet(exercise.id, setIndex, 'time', parseInt(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs">Dist. (m)</Label>
                                <Input
                                  type="number"
                                  placeholder="100"
                                  value={set.distance || ""}
                                  onChange={(e) => updateSet(exercise.id, setIndex, 'distance', parseInt(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              
                              {exercise.sets.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSet(exercise.id, setIndex)}
                                  className="h-8 w-8 p-0 hover:text-destructive"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !title || exercises.some(ex => !ex.name)} 
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
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