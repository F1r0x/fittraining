import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Timer, Trophy, Plus, Trash2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkoutSession {
  id: string;
  title: string;
  description: string | null;
  exercises: any;
  date: string;
}

interface DailyWorkoutEditorProps {
  session: WorkoutSession;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface WorkoutSet {
  id: string;
  unit: string;
  value: string;
}

interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

interface Round {
  roundNumber: number;
  exercises: Exercise[];
}

const SCALES = [
  { id: 'scaled2', label: 'scaled 2' },
  { id: 'scaled', label: 'scaled' },
  { id: 'rx', label: 'RX' },
  { id: 'elite', label: 'elite' }
];

const getUnitLabel = (unit: string) => {
  switch (unit) {
    case 'reps': return 'Repeticiones';
    case 'weight': return 'Kilogramos';
    case 'time': return 'Tiempo (s)';
    case 'distance': return 'Distancia (m)';
    case 'cals': return 'Calorías';
    default: return unit;
  }
};

const getAvailableUnits = () => {
  return ['reps', 'weight', 'time', 'distance', 'cals'];
};

// Función para identificar si un ejercicio es del calentamiento
const isWarmupExercise = (exerciseName: string) => {
  const warmupKeywords = ['calentamiento', 'warmup', 'warm-up', 'movilidad', 'activación', 'estiramientos'];
  return warmupKeywords.some(keyword => 
    exerciseName.toLowerCase().includes(keyword)
  );
};

export const DailyWorkoutEditor = ({ session, userId, onClose, onSuccess }: DailyWorkoutEditorProps) => {
  const [selectedScale, setSelectedScale] = useState('scaled2');
  const [warmupExercises, setWarmupExercises] = useState<Exercise[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [totalRounds, setTotalRounds] = useState(5);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [workoutType, setWorkoutType] = useState('FOR TIME');
  const [timer, setTimer] = useState('00:00');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (session.exercises && Array.isArray(session.exercises)) {
      // Separar ejercicios de calentamiento vs rondas principales
      const warmupExs: Exercise[] = [];
      const mainExerciseGroups: { [key: string]: any[] } = {};
      
      session.exercises.forEach((ex: any) => {
        const exerciseName = ex.name || 'Ejercicio sin nombre';
        
        if (isWarmupExercise(exerciseName)) {
          // Es ejercicio de calentamiento
          warmupExs.push({
            name: exerciseName,
            sets: [{
              id: crypto.randomUUID(),
              unit: 'reps',
              value: ex.sets?.[0]?.reps?.toString() || ''
            }]
          });
        } else {
          // Es ejercicio de rondas principales
          if (!mainExerciseGroups[exerciseName]) {
            mainExerciseGroups[exerciseName] = [];
          }
          mainExerciseGroups[exerciseName].push(ex);
        }
      });

      // Determinar el número de rondas basado en el grupo con más ejercicios
      const maxRounds = Object.keys(mainExerciseGroups).length > 0 
        ? Math.max(...Object.values(mainExerciseGroups).map(group => group.length))
        : 5;
      setTotalRounds(maxRounds);

      // Detectar tipo de workout del título
      if (session.title.includes('MAX REPS')) {
        setWorkoutType('MAX REPS');
      } else if (session.title.includes('RONDAS Y REPS')) {
        setWorkoutType('RONDAS Y REPS');
      } else {
        setWorkoutType('FOR TIME');
      }

      // Construir la estructura de rondas para ejercicios principales
      const roundsData: Round[] = [];
      for (let roundIndex = 0; roundIndex < maxRounds; roundIndex++) {
        const roundExercises: Exercise[] = Object.entries(mainExerciseGroups).map(([exerciseName, exercises]) => {
          const exercise = exercises[roundIndex] || exercises[0];
          
          return {
            name: exerciseName,
            sets: [{
              id: crypto.randomUUID(),
              unit: 'reps',
              value: exercise.sets?.[0]?.reps?.toString() || ''
            }]
          };
        });

        if (roundExercises.length > 0) {
          roundsData.push({
            roundNumber: roundIndex + 1,
            exercises: roundExercises
          });
        }
      }

      setWarmupExercises(warmupExs);
      setRounds(roundsData);
    }
  }, [session]);

  const updateWarmupSet = (exerciseIndex: number, setIndex: number, field: 'unit' | 'value', value: string) => {
    const newWarmupExercises = [...warmupExercises];
    newWarmupExercises[exerciseIndex].sets[setIndex][field] = value;
    setWarmupExercises(newWarmupExercises);
  };

  const updateRoundSet = (roundIndex: number, exerciseIndex: number, setIndex: number, field: 'unit' | 'value', value: string) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].exercises[exerciseIndex].sets[setIndex][field] = value;
    setRounds(newRounds);
  };

  const addWarmupSet = (exerciseIndex: number) => {
    const newWarmupExercises = [...warmupExercises];
    newWarmupExercises[exerciseIndex].sets.push({
      id: crypto.randomUUID(),
      unit: 'reps',
      value: ''
    });
    setWarmupExercises(newWarmupExercises);
  };

  const addRoundSet = (roundIndex: number, exerciseIndex: number) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].exercises[exerciseIndex].sets.push({
      id: crypto.randomUUID(),
      unit: 'reps',
      value: ''
    });
    setRounds(newRounds);
  };

  const removeWarmupSet = (exerciseIndex: number, setIndex: number) => {
    const newWarmupExercises = [...warmupExercises];
    if (newWarmupExercises[exerciseIndex].sets.length > 1) {
      newWarmupExercises[exerciseIndex].sets = 
        newWarmupExercises[exerciseIndex].sets.filter((_, index) => index !== setIndex);
      setWarmupExercises(newWarmupExercises);
    }
  };

  const removeRoundSet = (roundIndex: number, exerciseIndex: number, setIndex: number) => {
    const newRounds = [...rounds];
    if (newRounds[roundIndex].exercises[exerciseIndex].sets.length > 1) {
      newRounds[roundIndex].exercises[exerciseIndex].sets = 
        newRounds[roundIndex].exercises[exerciseIndex].sets.filter((_, index) => index !== setIndex);
      setRounds(newRounds);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    // Reconstruir la estructura de exercises para guardar en la base de datos
    const exercisesData = [];
    
    // Agregar ejercicios de calentamiento
    for (const exercise of warmupExercises) {
      const sets = exercise.sets
        .filter(set => set.value.trim())
        .map((set, index) => ({
          setNumber: index + 1,
          [set.unit]: parseFloat(set.value) || 0
        }));

      if (sets.length > 0) {
        exercisesData.push({
          name: exercise.name,
          sets: sets
        });
      }
    }
    
    // Agregar ejercicios de las rondas principales
    for (const round of rounds) {
      for (const exercise of round.exercises) {
        const sets = exercise.sets
          .filter(set => set.value.trim())
          .map((set, index) => ({
            setNumber: index + 1,
            [set.unit]: parseFloat(set.value) || 0
          }));

        if (sets.length > 0) {
          exercisesData.push({
            name: exercise.name,
            sets: sets
          });
        }
      }
    }

    const { error } = await supabase
      .from('workout_sessions')
      .update({
        title: session.title,
        description: `${workoutType} - Escala: ${selectedScale} - Rondas completadas: ${completedRounds}/${totalRounds} - Tiempo: ${timer}`,
        exercises: exercisesData,
        date: session.date
      })
      .eq('id', session.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el entrenamiento",
        variant: "destructive"
      });
    } else {
      toast({
        title: "¡Entrenamiento actualizado!",
        description: "Tu entrenamiento se ha registrado correctamente"
      });
      onSuccess();
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold text-foreground">
                {totalRounds} ROUNDS {workoutType}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Scale Selection */}
          <div className="flex gap-2 mt-4">
            {SCALES.map((scale) => (
              <Button
                key={scale.id}
                variant={selectedScale === scale.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedScale(scale.id)}
                className={selectedScale === scale.id ? 'bg-primary text-primary-foreground' : ''}
              >
                {scale.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Warmup Section */}
          {warmupExercises.length > 0 && (
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-foreground">CALENTAMIENTO</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {warmupExercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="space-y-3">
                    <h4 className="font-medium text-lg text-foreground">{exercise.name}</h4>
                    
                    {exercise.sets.map((set, setIndex) => (
                      <div key={set.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
                        <Badge variant="outline" className="text-xs min-w-fit">
                          Serie {setIndex + 1}
                        </Badge>
                        
                        <div className="flex items-center gap-2 flex-1">
                          <Select
                            value={set.unit}
                            onValueChange={(value) => updateWarmupSet(exerciseIndex, setIndex, 'unit', value)}
                          >
                            <SelectTrigger className="w-40 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border border-border z-50">
                              {getAvailableUnits().map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {getUnitLabel(unit)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.value}
                            onChange={(e) => updateWarmupSet(exerciseIndex, setIndex, 'value', e.target.value)}
                            className="flex-1 bg-background"
                          />
                        </div>

                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addWarmupSet(exerciseIndex)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          {exercise.sets.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeWarmupSet(exerciseIndex, setIndex)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Main Rounds */}
          <div className="space-y-4">
            {rounds.map((round, roundIndex) => (
              <Card key={roundIndex} className="border border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-primary rounded-full"></div>
                    <h3 className="text-lg font-semibold text-primary">RONDA {round.roundNumber}</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {round.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="space-y-3">
                      <h4 className="font-medium text-lg text-foreground">{exercise.name}</h4>
                      
                      {exercise.sets.map((set, setIndex) => (
                        <div key={set.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
                          <Badge variant="outline" className="text-xs min-w-fit">
                            Serie {setIndex + 1}
                          </Badge>
                          
                          <div className="flex items-center gap-2 flex-1">
                            <Select
                              value={set.unit}
                              onValueChange={(value) => updateRoundSet(roundIndex, exerciseIndex, setIndex, 'unit', value)}
                            >
                              <SelectTrigger className="w-40 bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border border-border z-50">
                                {getAvailableUnits().map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {getUnitLabel(unit)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="0"
                              value={set.value}
                              onChange={(e) => updateRoundSet(roundIndex, exerciseIndex, setIndex, 'value', e.target.value)}
                              className="flex-1 bg-background"
                            />
                          </div>

                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addRoundSet(roundIndex, exerciseIndex)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            
                            {exercise.sets.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeRoundSet(roundIndex, exerciseIndex, setIndex)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timer and Rounds Counter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Timer className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">TIEMPO</span>
                </div>
                <Input
                  type="text"
                  value={timer}
                  onChange={(e) => setTimer(e.target.value)}
                  className="text-2xl font-bold text-center bg-background border-0 text-foreground"
                  placeholder="00:00"
                />
              </CardContent>
            </Card>
            
            <Card className="border border-border">
              <CardContent className="p-4 text-center">
                <div className="text-sm font-medium mb-3 text-foreground">RONDAS COMPLETADAS</div>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    value={completedRounds}
                    onChange={(e) => setCompletedRounds(parseInt(e.target.value) || 0)}
                    className="text-2xl font-bold text-center w-20 bg-background border-0"
                    placeholder="0"
                  />
                  <span className="text-2xl font-bold text-muted-foreground">/ {totalRounds}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Entrenamiento'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};