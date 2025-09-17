import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Timer, Weight, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  name: string;
  duration?: number;
  reps?: string;
  image_url?: string;
}

interface Round {
  exercises: Exercise[];
}

interface WorkoutData {
  id?: string;
  title: string;
  type: string;
  difficulty: string;
  description?: string;
  duration: number;
  warmup: Exercise[];
  main_workout?: {
    rounds?: Round[];
    exercises?: Exercise[];
  };
  secondary_wod?: {
    rounds?: Round[];
    exercises?: Exercise[];
  };
  cooldown?: Exercise[];
}

interface WorkoutResultsFormProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutData;
  totalTime: number;
  userId: string;
}

interface ExerciseResult {
  name: string;
  sets: Array<{
    reps?: number;
    weight?: number;
    time?: number;
    unit?: string;
  }>;
}

interface RoundResult {
  round: number;
  exercises: ExerciseResult[];
}

export const WorkoutResultsForm: React.FC<WorkoutResultsFormProps> = ({
  isOpen,
  onClose,
  workout,
  totalTime,
  userId,
}) => {
  const [scale, setScale] = useState<'scaled' | 'rx'>('scaled');
  const [completedRounds, setCompletedRounds] = useState(1);
  const [totalTimeInput, setTotalTimeInput] = useState(Math.floor(totalTime / 60));
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize round results based on workout structure
  useEffect(() => {
    if (workout.main_workout) {
      const rounds: RoundResult[] = [];
      
      if (workout.main_workout.rounds) {
        // Multi-round workout
        for (let i = 0; i < Math.min(completedRounds, workout.main_workout.rounds.length); i++) {
          const round = workout.main_workout.rounds[i];
          rounds.push({
            round: i + 1,
            exercises: round.exercises.map(exercise => ({
              name: exercise.name,
              sets: [{
                reps: 0,
                weight: 0,
                time: 0,
                unit: 'reps'
              }]
            }))
          });
        }
      } else if (workout.main_workout.exercises) {
        // Single round workout
        rounds.push({
          round: 1,
          exercises: workout.main_workout.exercises.map(exercise => ({
            name: exercise.name,
            sets: [{
              reps: 0,
              weight: 0,
              time: 0,
              unit: 'reps'
            }]
          }))
        });
      }
      
      setRoundResults(rounds);
    }
  }, [workout, completedRounds]);

  const updateExerciseResult = (roundIndex: number, exerciseIndex: number, setIndex: number, field: string, value: number) => {
    setRoundResults(prev => {
      const newResults = [...prev];
      if (!newResults[roundIndex].exercises[exerciseIndex].sets[setIndex]) {
        newResults[roundIndex].exercises[exerciseIndex].sets[setIndex] = { reps: 0, weight: 0, time: 0, unit: 'reps' };
      }
      (newResults[roundIndex].exercises[exerciseIndex].sets[setIndex] as any)[field] = value;
      return newResults;
    });
  };

  const addSet = (roundIndex: number, exerciseIndex: number) => {
    setRoundResults(prev => {
      const newResults = [...prev];
      newResults[roundIndex].exercises[exerciseIndex].sets.push({
        reps: 0,
        weight: 0,
        time: 0,
        unit: 'reps'
      });
      return newResults;
    });
  };

  const removeSet = (roundIndex: number, exerciseIndex: number, setIndex: number) => {
    setRoundResults(prev => {
      const newResults = [...prev];
      if (newResults[roundIndex].exercises[exerciseIndex].sets.length > 1) {
        newResults[roundIndex].exercises[exerciseIndex].sets.splice(setIndex, 1);
      }
      return newResults;
    });
  };

  const addRound = () => {
    if (workout.main_workout?.exercises) {
      const newRound: RoundResult = {
        round: roundResults.length + 1,
        exercises: workout.main_workout.exercises.map(exercise => ({
          name: exercise.name,
          sets: [{
            reps: 0,
            weight: 0,
            time: 0,
            unit: 'reps'
          }]
        }))
      };
      setRoundResults(prev => [...prev, newRound]);
      setCompletedRounds(prev => prev + 1);
    }
  };

  const removeRound = () => {
    if (roundResults.length > 1) {
      setRoundResults(prev => prev.slice(0, -1));
      setCompletedRounds(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare exercises data with results
      const exercisesData = [
        ...workout.warmup.map(ex => ({
          name: ex.name,
          section: 'warmup',
          completed: true,
          duration: ex.duration || 0,
          reps: ex.reps || '',
        })),
        ...roundResults.flatMap(round => 
          round.exercises.map(exercise => ({
            name: exercise.name,
            section: 'main',
            completed: true,
            round: round.round,
            sets: exercise.sets.filter(set => set.reps || set.weight || set.time),
          }))
        ),
        ...(workout.cooldown?.map(ex => ({
          name: ex.name,
          section: 'cooldown',
          completed: true,
          duration: ex.duration || 0,
          reps: ex.reps || '',
        })) || [])
      ];

      const sessionData = {
        user_id: userId,
        title: `${workout.title} (Entrenamiento Diario)`,
        description: `${workout.description || ''} - Escala: ${scale.toUpperCase()} - Rondas completadas: ${completedRounds} - Tiempo: ${totalTimeInput}min`,
        exercises: exercisesData,
        total_time: totalTimeInput * 60,
        date: new Date().toISOString().split('T')[0],
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('workout_sessions')
        .insert(sessionData);

      if (error) throw error;

      toast({
        title: "Resultados guardados",
        description: "Tus resultados del entrenamiento han sido guardados exitosamente.",
      });

      onClose();
    } catch (error) {
      console.error('Error saving workout results:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los resultados. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Registrar Resultados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workout Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{workout.title}</span>
                <Badge variant="outline">{workout.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    variant={scale === 'scaled' ? 'default' : 'outline'}
                    onClick={() => setScale('scaled')}
                    className="rounded-full"
                  >
                    Scaled
                  </Button>
                  <Button
                    variant={scale === 'rx' ? 'default' : 'outline'}
                    onClick={() => setScale('rx')}
                    className="rounded-full"
                  >
                    RX
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  <Input
                    type="number"
                    value={totalTimeInput}
                    onChange={(e) => setTotalTimeInput(Number(e.target.value))}
                    className="w-20"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rounds Results */}
          {roundResults.map((round, roundIndex) => (
            <Card key={round.round}>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">
                  Ronda {round.round}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {round.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                      <span className="font-medium">{exercise.name}</span>
                    </div>
                    
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="flex items-center gap-3 pl-5">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.reps || ''}
                            onChange={(e) => updateExerciseResult(roundIndex, exerciseIndex, setIndex, 'reps', Number(e.target.value))}
                            className="w-16 text-center"
                          />
                          <span className="text-sm text-muted-foreground">reps</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Weight className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.weight || ''}
                            onChange={(e) => updateExerciseResult(roundIndex, exerciseIndex, setIndex, 'weight', Number(e.target.value))}
                            className="w-16 text-center"
                          />
                          <span className="text-sm text-muted-foreground">kg</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.time || ''}
                            onChange={(e) => updateExerciseResult(roundIndex, exerciseIndex, setIndex, 'time', Number(e.target.value))}
                            className="w-16 text-center"
                          />
                          <span className="text-sm text-muted-foreground">s</span>
                        </div>

                        {exercise.sets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(roundIndex, exerciseIndex, setIndex)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addSet(roundIndex, exerciseIndex)}
                      className="ml-5 text-primary"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Añadir serie
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Round Controls */}
          {workout.main_workout?.exercises && (
            <div className="flex justify-center gap-3">
              <Button onClick={addRound} className="bg-primary">
                Añadir ronda
              </Button>
              {roundResults.length > 1 && (
                <Button onClick={removeRound} variant="outline">
                  Borrar ronda
                </Button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-primary">
              {loading ? 'Guardando...' : 'Guardar Resultados'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};