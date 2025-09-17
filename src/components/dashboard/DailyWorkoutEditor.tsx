import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Timer, Trophy, Plus, Trash2, Zap, Target } from "lucide-react";
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

interface WOD {
  name: string;
  rounds: Round[];
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

export const DailyWorkoutEditor = ({ session, userId, onClose, onSuccess }: DailyWorkoutEditorProps) => {
  const [selectedScale, setSelectedScale] = useState('scaled2');
  const [warmupExercises, setWarmupExercises] = useState<Exercise[]>([]);
  const [wods, setWods] = useState<WOD[]>([]);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [workoutType, setWorkoutType] = useState('FOR TIME');
  const [timer, setTimer] = useState('00:00');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (session.exercises && Array.isArray(session.exercises)) {
      // Analizar la estructura de ejercicios para separar calentamiento y WODs
      const exerciseFrequency: { [key: string]: number } = {};
      
      // Contar frecuencia de cada ejercicio
      session.exercises.forEach((ex: any) => {
        const exerciseName = ex.name || 'Ejercicio sin nombre';
        exerciseFrequency[exerciseName] = (exerciseFrequency[exerciseName] || 0) + 1;
      });

      // Identificar ejercicios de calentamiento (aparecen solo 1 vez) y WOD (aparecen múltiples veces)
      const warmupExs: Exercise[] = [];
      const wodExerciseGroups: { [key: string]: any[] } = {};
      
      session.exercises.forEach((ex: any, index: number) => {
        const exerciseName = ex.name || 'Ejercicio sin nombre';
        
        if (exerciseFrequency[exerciseName] === 1) {
          // Es ejercicio de calentamiento (aparece una sola vez)
          warmupExs.push({
            name: exerciseName,
            sets: [{
              id: crypto.randomUUID(),
              unit: 'reps',
              value: ex.sets?.[0]?.reps?.toString() || ''
            }]
          });
        } else {
          // Es ejercicio del WOD principal (se repite en rondas)
          if (!wodExerciseGroups[exerciseName]) {
            wodExerciseGroups[exerciseName] = [];
          }
          wodExerciseGroups[exerciseName].push(ex);
        }
      });

      // Detectar tipo de workout del título
      if (session.title.includes('MAX REPS')) {
        setWorkoutType('MAX REPS');
      } else if (session.title.includes('RONDAS Y REPS')) {
        setWorkoutType('RONDAS Y REPS');
      } else {
        setWorkoutType('FOR TIME');
      }

      // Construir WODs y sus rondas
      const wodsData: WOD[] = [];
      
      if (Object.keys(wodExerciseGroups).length > 0) {
        // Determinar número de rondas basado en el ejercicio que más se repite
        const maxRounds = Math.max(...Object.values(wodExerciseGroups).map(group => group.length));
        
        // Crear las rondas para el WOD principal
        const rounds: Round[] = [];
        for (let roundIndex = 0; roundIndex < maxRounds; roundIndex++) {
          const roundExercises: Exercise[] = Object.entries(wodExerciseGroups).map(([exerciseName, exercises]) => {
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
            rounds.push({
              roundNumber: roundIndex + 1,
              exercises: roundExercises
            });
          }
        }

        wodsData.push({
          name: "WOD PRINCIPAL",
          rounds: rounds
        });
      }

      setWarmupExercises(warmupExs);
      setWods(wodsData);
    }
  }, [session]);

  const updateWarmupSet = (exerciseIndex: number, setIndex: number, field: 'unit' | 'value', value: string) => {
    const newWarmupExercises = [...warmupExercises];
    newWarmupExercises[exerciseIndex].sets[setIndex][field] = value;
    setWarmupExercises(newWarmupExercises);
  };

  const updateWodSet = (wodIndex: number, roundIndex: number, exerciseIndex: number, setIndex: number, field: 'unit' | 'value', value: string) => {
    const newWods = [...wods];
    newWods[wodIndex].rounds[roundIndex].exercises[exerciseIndex].sets[setIndex][field] = value;
    setWods(newWods);
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

  const addWodSet = (wodIndex: number, roundIndex: number, exerciseIndex: number) => {
    const newWods = [...wods];
    newWods[wodIndex].rounds[roundIndex].exercises[exerciseIndex].sets.push({
      id: crypto.randomUUID(),
      unit: 'reps',
      value: ''
    });
    setWods(newWods);
  };

  const removeWarmupSet = (exerciseIndex: number, setIndex: number) => {
    const newWarmupExercises = [...warmupExercises];
    if (newWarmupExercises[exerciseIndex].sets.length > 1) {
      newWarmupExercises[exerciseIndex].sets = 
        newWarmupExercises[exerciseIndex].sets.filter((_, index) => index !== setIndex);
      setWarmupExercises(newWarmupExercises);
    }
  };

  const removeWodSet = (wodIndex: number, roundIndex: number, exerciseIndex: number, setIndex: number) => {
    const newWods = [...wods];
    if (newWods[wodIndex].rounds[roundIndex].exercises[exerciseIndex].sets.length > 1) {
      newWods[wodIndex].rounds[roundIndex].exercises[exerciseIndex].sets = 
        newWods[wodIndex].rounds[roundIndex].exercises[exerciseIndex].sets.filter((_, index) => index !== setIndex);
      setWods(newWods);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    // Reconstruir la estructura de exercises para guardar en la base de datos
    const exercisesData = [];
    
    // Agregar ejercicios de calentamiento (una sola vez cada uno)
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
    
    // Agregar ejercicios de los WODs (repetidos por cada ronda)
    for (const wod of wods) {
      for (const round of wod.rounds) {
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
    }

    const totalRounds = wods.length > 0 ? wods[0].rounds.length : 0;

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

  const getTotalRounds = () => {
    return wods.length > 0 ? wods[0].rounds.length : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-1 sm:p-4 z-50">
      <Card className="w-full max-w-sm sm:max-w-4xl max-h-[98vh] sm:max-h-[90vh] overflow-y-auto mx-1 sm:mx-0">
        <CardHeader className="pb-3 sm:pb-4 px-2 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              <CardTitle className="text-sm sm:text-2xl font-bold text-foreground">
                {getTotalRounds()} ROUNDS {workoutType}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 sm:h-8 sm:w-8 p-0">
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          
          {/* Scale Selection */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-4">
            {SCALES.map((scale) => (
              <Button
                key={scale.id}
                variant={selectedScale === scale.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedScale(scale.id)}
                className={`text-xs px-2 py-1 sm:px-3 sm:py-2 ${selectedScale === scale.id ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {scale.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-6 px-2 sm:px-6 pb-4 sm:pb-6">
          {/* Warmup Section */}
          {warmupExercises.length > 0 && (
            <Card className="border border-border">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground">CALENTAMIENTO</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4 px-2 sm:px-6">
                {warmupExercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="space-y-2 sm:space-y-3">
                    <h4 className="font-medium text-sm sm:text-lg text-foreground">{exercise.name}</h4>
                    
                    {exercise.sets.map((set, setIndex) => (
                      <div key={set.id} className="flex flex-col gap-2 p-2 sm:p-3 bg-muted rounded-lg border border-border">
                        <Badge variant="outline" className="text-xs self-start">
                          Serie {setIndex + 1}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <Select
                            value={set.unit}
                            onValueChange={(value) => updateWarmupSet(exerciseIndex, setIndex, 'unit', value)}
                          >
                            <SelectTrigger className="flex-1 sm:w-32 bg-background text-xs sm:text-sm">
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
                            className="flex-1 bg-background text-sm"
                          />
                        </div>

                        <div className="flex gap-1 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addWarmupSet(exerciseIndex)}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                          >
                            <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          
                          {exercise.sets.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeWarmupSet(exerciseIndex, setIndex)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
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

          {/* WODs */}
          {wods.map((wod, wodIndex) => (
            <Card key={wodIndex} className="border-2 border-primary">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-xl font-bold text-primary">{wod.name}</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4 px-2 sm:px-6">
                {/* Rounds */}
                {wod.rounds.map((round, roundIndex) => (
                  <Card key={roundIndex} className="border border-border">
                    <CardHeader className="pb-2 sm:pb-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="h-2 w-2 sm:h-3 sm:w-3 bg-primary rounded-full"></div>
                        <h4 className="text-sm sm:text-lg font-semibold text-primary">RONDA {round.roundNumber}</h4>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-4 px-2 sm:px-6">
                      {round.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="space-y-2 sm:space-y-3">
                          <h5 className="font-medium text-sm sm:text-lg text-foreground">{exercise.name}</h5>
                          
                          {exercise.sets.map((set, setIndex) => (
                            <div key={set.id} className="flex flex-col gap-2 p-2 sm:p-3 bg-muted rounded-lg border border-border">
                              <Badge variant="outline" className="text-xs self-start">
                                Serie {setIndex + 1}
                              </Badge>
                              
                              <div className="flex items-center gap-2">
                                <Select
                                  value={set.unit}
                                  onValueChange={(value) => updateWodSet(wodIndex, roundIndex, exerciseIndex, setIndex, 'unit', value)}
                                >
                                  <SelectTrigger className="flex-1 sm:w-32 bg-background text-xs sm:text-sm">
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
                                  onChange={(e) => updateWodSet(wodIndex, roundIndex, exerciseIndex, setIndex, 'value', e.target.value)}
                                  className="flex-1 bg-background text-sm"
                                />
                              </div>

                              <div className="flex gap-1 justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addWodSet(wodIndex, roundIndex, exerciseIndex)}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                >
                                  <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                                </Button>
                                
                                {exercise.sets.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeWodSet(wodIndex, roundIndex, exerciseIndex, setIndex)}
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
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
              </CardContent>
            </Card>
          ))}

          {/* Timer and Rounds Counter */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Card className="border border-border">
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-3">
                  <Timer className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">TIEMPO</span>
                </div>
                <Input
                  type="text"
                  value={timer}
                  onChange={(e) => setTimer(e.target.value)}
                  className="text-lg sm:text-2xl font-bold text-center bg-background border-0 text-foreground p-1 sm:p-2"
                  placeholder="00:00"
                />
              </CardContent>
            </Card>
            
            <Card className="border border-border">
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-xs font-medium mb-1 sm:mb-3 text-foreground">RONDAS</div>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Input
                    type="number"
                    value={completedRounds}
                    onChange={(e) => setCompletedRounds(parseInt(e.target.value) || 0)}
                    className="text-lg sm:text-2xl font-bold text-center w-10 sm:w-20 bg-background border-0 p-1 sm:p-2"
                    placeholder="0"
                  />
                  <span className="text-lg sm:text-2xl font-bold text-muted-foreground">/{getTotalRounds()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-lg py-3 sm:py-4"
            size="lg"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {loading ? 'Guardando...' : 'Guardar Entrenamiento'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};