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

interface MainWorkout {
  skill_work?: string[];
  exercises: Exercise[];
  description: string;
  accessory_work?: string[];
  rounds?: number;
  time_type?: string;
  time_params?: { minutes?: number; cap?: number; description?: string };
}

interface SecondaryWod {
  time_type: string;
  time_params: { minutes?: number; cap?: number; description: string };
  exercises: Exercise[];
}

interface WorkoutFormData {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  duration: number;
  warmup: string[];
  main_workout: MainWorkout;
  secondary_wod?: SecondaryWod;
  cooldown?: string[];
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
    warmup: ["5 min calentamiento dinámico"],
    main_workout: {
      skill_work: ["3 min técnica general"],
      exercises: [{ name: "", sets: 5, reps: 10, notes: "", scaling: "" }],
      description: "Completar las rondas en el menor tiempo posible",
      accessory_work: ["2 sets movimientos accesorios"],
      rounds: 5,
      time_type: "For Time",
      time_params: { cap: 20, description: "Tiempo límite 20 minutos" }
    },
    cooldown: ["5 min estiramientos"]
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

  const handleInputChange = (field: keyof WorkoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMainWorkoutChange = (field: keyof MainWorkout, value: any) => {
    setFormData(prev => ({
      ...prev,
      main_workout: { ...prev.main_workout, [field]: value }
    }));
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: any) => {
    const newExercises = [...formData.main_workout.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    handleMainWorkoutChange('exercises', newExercises);
  };

  const addExercise = () => {
    const newExercise: Exercise = { name: "", sets: 5, reps: 10, notes: "", scaling: "" };
    handleMainWorkoutChange('exercises', [...formData.main_workout.exercises, newExercise]);
  };

  const removeExercise = (index: number) => {
    const newExercises = formData.main_workout.exercises.filter((_, i) => i !== index);
    handleMainWorkoutChange('exercises', newExercises);
  };

  const handleArrayChange = (field: 'warmup' | 'cooldown', index: number, value: string) => {
    const newArray = [...(formData[field] || [])];
    newArray[index] = value;
    handleInputChange(field, newArray);
  };

  const addArrayItem = (field: 'warmup' | 'cooldown') => {
    const newArray = [...(formData[field] || []), ""];
    handleInputChange(field, newArray);
  };

  const removeArrayItem = (field: 'warmup' | 'cooldown', index: number) => {
    const newArray = (formData[field] || []).filter((_, i) => i !== index);
    handleInputChange(field, newArray);
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

      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "Entrenamiento Diario",
        difficulty: "Principiante",
        duration: 45,
        warmup: ["5 min calentamiento dinámico"],
        main_workout: {
          skill_work: ["3 min técnica general"],
          exercises: [{ name: "", sets: 5, reps: 10, notes: "", scaling: "" }],
          description: "Completar las rondas en el menor tiempo posible",
          accessory_work: ["2 sets movimientos accesorios"],
          rounds: 5,
          time_type: "For Time",
          time_params: { cap: 20, description: "Tiempo límite 20 minutos" }
        },
        cooldown: ["5 min estiramientos"]
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
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título del Entrenamiento</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Entrenamiento de Fuerza"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrenamiento Diario">Entrenamiento Diario</SelectItem>
                      <SelectItem value="Metcon">Metcon</SelectItem>
                      <SelectItem value="Strength">Strength</SelectItem>
                      <SelectItem value="EMOM">EMOM</SelectItem>
                      <SelectItem value="AMRAP">AMRAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Principiante">Principiante</SelectItem>
                      <SelectItem value="Intermedio">Intermedio</SelectItem>
                      <SelectItem value="Avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    min="10"
                    max="180"
                  />
                </div>
                <div>
                  <Label htmlFor="main_time_type">Tipo de Tiempo Principal</Label>
                  <Select value={formData.main_workout.time_type || "For Time"} onValueChange={(value) => handleMainWorkoutChange('time_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="For Time">For Time</SelectItem>
                      <SelectItem value="AMRAP">AMRAP</SelectItem>
                      <SelectItem value="EMOM">EMOM</SelectItem>
                      <SelectItem value="Tabata">Tabata</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción general del entrenamiento"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="scheduled_date">Fecha Programada (opcional)</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date || ''}
                  onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Calentamiento */}
          <Card>
            <CardHeader>
              <CardTitle>Calentamiento</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.warmup.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item}
                    onChange={(e) => handleArrayChange('warmup', index, e.target.value)}
                    placeholder="Ejercicio de calentamiento"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem('warmup', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('warmup')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Ejercicio de Calentamiento
              </Button>
            </CardContent>
          </Card>

          {/* Entrenamiento Principal */}
          <Card>
            <CardHeader>
              <CardTitle>Entrenamiento Principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rounds">Rondas</Label>
                  <Input
                    id="rounds"
                    type="number"
                    value={formData.main_workout.rounds || 5}
                    onChange={(e) => handleMainWorkoutChange('rounds', parseInt(e.target.value))}
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <Label htmlFor="workout_description">Descripción del Entrenamiento</Label>
                  <Input
                    id="workout_description"
                    value={formData.main_workout.description}
                    onChange={(e) => handleMainWorkoutChange('description', e.target.value)}
                    placeholder="Completar las rondas en el menor tiempo posible"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="main_time_cap">Tiempo límite (minutos)</Label>
                  <Input
                    id="main_time_cap"
                    type="number"
                    value={formData.main_workout.time_params?.cap || ''}
                    onChange={(e) => handleMainWorkoutChange('time_params', {
                      ...formData.main_workout.time_params,
                      cap: parseInt(e.target.value) || undefined
                    })}
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label htmlFor="main_time_minutes">Duración (minutos)</Label>
                  <Input
                    id="main_time_minutes"
                    type="number"
                    value={formData.main_workout.time_params?.minutes || ''}
                    onChange={(e) => handleMainWorkoutChange('time_params', {
                      ...formData.main_workout.time_params,
                      minutes: parseInt(e.target.value) || undefined
                    })}
                    placeholder="Para AMRAP/EMOM"
                  />
                </div>
                <div>
                  <Label htmlFor="main_time_description">Descripción del Tiempo</Label>
                  <Input
                    id="main_time_description"
                    value={formData.main_workout.time_params?.description || ''}
                    onChange={(e) => handleMainWorkoutChange('time_params', {
                      ...formData.main_workout.time_params,
                      description: e.target.value
                    })}
                    placeholder="Tiempo límite 20 minutos"
                  />
                </div>
              </div>

              <div>
                <Label className="text-lg font-semibold">Ejercicios</Label>
                {formData.main_workout.exercises.map((exercise, index) => (
                  <Card key={index} className="mt-4">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label>Ejercicio</Label>
                          <Select
                            value={exercise.name}
                            onValueChange={(value) => handleExerciseChange(index, 'name', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar ejercicio" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableExercises.map((ex) => (
                                <SelectItem key={ex.id} value={ex.name}>
                                  {ex.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Sets</Label>
                          <Input
                            type="number"
                            value={exercise.sets || 0}
                            onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label>Reps</Label>
                          <Input
                            value={exercise.reps || ''}
                            onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                            placeholder="10 o 10-15"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeExercise(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Notas</Label>
                          <Input
                            value={exercise.notes || ''}
                            onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                            placeholder="Notas adicionales"
                          />
                        </div>
                        <div>
                          <Label>Scaling</Label>
                          <Input
                            value={exercise.scaling || ''}
                            onChange={(e) => handleExerciseChange(index, 'scaling', e.target.value)}
                            placeholder="Opciones de escalamiento"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addExercise}
                  className="w-full mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Ejercicio
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WOD Secundario (opcional) */}
          <Card>
            <CardHeader>
              <CardTitle>WOD Secundario (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has_secondary"
                  checked={!!formData.secondary_wod}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        secondary_wod: {
                          time_type: "AMRAP",
                          time_params: { minutes: 5, description: "Tantas rondas como sea posible" },
                          exercises: [{ name: "", reps: 10, notes: "", scaling: "" }]
                        }
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, secondary_wod: undefined }));
                    }
                  }}
                />
                <Label htmlFor="has_secondary">Incluir WOD Secundario</Label>
              </div>
              
              {formData.secondary_wod && (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Tiempo Secundario</Label>
                      <Select 
                        value={formData.secondary_wod.time_type} 
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          secondary_wod: prev.secondary_wod ? { ...prev.secondary_wod, time_type: value } : undefined
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AMRAP">AMRAP</SelectItem>
                          <SelectItem value="EMOM">EMOM</SelectItem>
                          <SelectItem value="For Time">For Time</SelectItem>
                          <SelectItem value="Tabata">Tabata</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duración (minutos)</Label>
                      <Input
                        type="number"
                        value={formData.secondary_wod.time_params?.minutes || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          secondary_wod: prev.secondary_wod ? {
                            ...prev.secondary_wod,
                            time_params: { ...prev.secondary_wod.time_params, minutes: parseInt(e.target.value) || undefined }
                          } : undefined
                        }))}
                        placeholder="5"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Ejercicios Secundarios</Label>
                    {formData.secondary_wod.exercises.map((exercise, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Select
                          value={exercise.name}
                          onValueChange={(value) => {
                            const newExercises = [...formData.secondary_wod!.exercises];
                            newExercises[index] = { ...newExercises[index], name: value };
                            setFormData(prev => ({
                              ...prev,
                              secondary_wod: prev.secondary_wod ? { ...prev.secondary_wod, exercises: newExercises } : undefined
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar ejercicio" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableExercises.map((ex) => (
                              <SelectItem key={ex.id} value={ex.name}>
                                {ex.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={exercise.reps || ''}
                          onChange={(e) => {
                            const newExercises = [...formData.secondary_wod!.exercises];
                            newExercises[index] = { ...newExercises[index], reps: parseInt(e.target.value) || 0 };
                            setFormData(prev => ({
                              ...prev,
                              secondary_wod: prev.secondary_wod ? { ...prev.secondary_wod, exercises: newExercises } : undefined
                            }));
                          }}
                          placeholder="Reps"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newExercises = formData.secondary_wod!.exercises.filter((_, i) => i !== index);
                            setFormData(prev => ({
                              ...prev,
                              secondary_wod: prev.secondary_wod ? { ...prev.secondary_wod, exercises: newExercises } : undefined
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newExercise = { name: "", reps: 10, notes: "", scaling: "" };
                        setFormData(prev => ({
                          ...prev,
                          secondary_wod: prev.secondary_wod ? {
                            ...prev.secondary_wod,
                            exercises: [...prev.secondary_wod.exercises, newExercise]
                          } : undefined
                        }));
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Ejercicio Secundario
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enfriamiento */}
          <Card>
            <CardHeader>
              <CardTitle>Enfriamiento</CardTitle>
            </CardHeader>
            <CardContent>
              {(formData.cooldown || []).map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item}
                    onChange={(e) => handleArrayChange('cooldown', index, e.target.value)}
                    placeholder="Ejercicio de enfriamiento"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem('cooldown', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('cooldown')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Ejercicio de Enfriamiento
              </Button>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button type="submit" disabled={loading} size="lg" className="px-8">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Entrenamiento
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkoutCreator;