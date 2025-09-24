import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Timer, CheckCircle } from 'lucide-react';
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

interface WorkoutSession {
  id: string;
  title: string;
  description: string | null;
  exercises: any;
  date: string;
  total_time?: number;
}

interface DailyWorkoutEditorProps {
  session: WorkoutSession;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExerciseResult {
  name: string;
  value: number | '';
  unit: string;
}

interface RoundData {
  round: number;
  exercises: ExerciseResult[];
}

export const DailyWorkoutEditor: React.FC<DailyWorkoutEditorProps> = ({
  session,
  userId,
  onClose,
  onSuccess,
}) => {
  const [scale, setScale] = useState<'scaled' | 'rx'>('scaled');
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(0);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [mainWodRounds, setMainWodRounds] = useState<RoundData[]>([]);
  const [secondaryWodRounds, setSecondaryWodRounds] = useState<RoundData[]>([]);
  const [mainWodTimeMinutes, setMainWodTimeMinutes] = useState(0);
  const [mainWodTimeSeconds, setMainWodTimeSeconds] = useState(0);
  const [secondaryWodTimeMinutes, setSecondaryWodTimeMinutes] = useState(0);
  const [secondaryWodTimeSeconds, setSecondaryWodTimeSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const { toast } = useToast();

  // Parse the workout session data into our format
  useEffect(() => {
    if (session) {
      // Extract scale from description
      const descMatch = session.description?.match(/Escala:\s*(\w+)/i);
      if (descMatch) {
        setScale(descMatch[1].toLowerCase() as 'scaled' | 'rx');
      }

      // Extract times from description
      const mainTimeMatch = session.description?.match(/WOD Principal:\s*(\d+):(\d+)/);
      if (mainTimeMatch) {
        setMainWodTimeMinutes(parseInt(mainTimeMatch[1]));
        setMainWodTimeSeconds(parseInt(mainTimeMatch[2]));
      }

      const secondaryTimeMatch = session.description?.match(/WOD Secundario:\s*(\d+):(\d+)/);
      if (secondaryTimeMatch) {
        setSecondaryWodTimeMinutes(parseInt(secondaryTimeMatch[1]));
        setSecondaryWodTimeSeconds(parseInt(secondaryTimeMatch[2]));
      }

      const totalTimeMatch = session.description?.match(/Tiempo Total:\s*(\d+):(\d+)/);
      if (totalTimeMatch) {
        setTotalTimeMinutes(parseInt(totalTimeMatch[1]));
        setTotalTimeSeconds(parseInt(totalTimeMatch[2]));
      } else if (session.total_time) {
        setTotalTimeMinutes(Math.floor(session.total_time / 60));
        setTotalTimeSeconds(session.total_time % 60);
      }

      // Parse exercises into workout structure
      const exercises = session.exercises || [];
      const warmupExercises: Exercise[] = [];
      const mainExercises: Exercise[] = [];
      const secondaryExercises: Exercise[] = [];
      const cooldownExercises: Exercise[] = [];

      // Group exercises by section
      const mainExerciseNames = new Set<string>();
      const secondaryExerciseNames = new Set<string>();
      
      exercises.forEach((ex: any) => {
        if (ex.section === 'warmup') {
          warmupExercises.push({
            name: ex.name,
            reps: ex.reps || ex.duration?.toString() || '',
          });
        } else if (ex.section === 'main') {
          mainExerciseNames.add(ex.name);
        } else if (ex.section === 'secondary') {
          secondaryExerciseNames.add(ex.name);
        } else if (ex.section === 'cooldown') {
          cooldownExercises.push({
            name: ex.name,
            reps: ex.reps || ex.duration?.toString() || '',
          });
        }
      });

      // Create main exercises
      mainExerciseNames.forEach(name => {
        mainExercises.push({ name, reps: 'Completar' });
      });

      // Create secondary exercises
      secondaryExerciseNames.forEach(name => {
        secondaryExercises.push({ name, reps: 'Completar' });
      });

      // Create workout structure
      const workoutData: WorkoutData = {
        id: session.id,
        title: session.title.replace(' (Entrenamiento Diario)', ''),
        type: 'WOD',
        difficulty: 'RX',
        description: session.description || '',
        duration: Math.floor((session.total_time || 0) / 60),
        warmup: warmupExercises,
        main_workout: mainExercises.length > 0 ? { exercises: mainExercises } : undefined,
        secondary_wod: secondaryExercises.length > 0 ? { exercises: secondaryExercises } : undefined,
        cooldown: cooldownExercises,
      };

      setWorkout(workoutData);

      // Initialize rounds from exercises
      if (mainExercises.length > 0) {
        const mainRounds: RoundData[] = [];
        const roundsData: { [roundNum: number]: ExerciseResult[] } = {};

        exercises.forEach((ex: any) => {
          if (ex.section === 'main' && ex.round) {
            if (!roundsData[ex.round]) {
              roundsData[ex.round] = [];
            }
            roundsData[ex.round].push({
              name: ex.name,
              value: ex.value || '',
              unit: ex.unit || 'reps'
            });
          }
        });

        Object.keys(roundsData).forEach(roundNum => {
          mainRounds.push({
            round: parseInt(roundNum),
            exercises: roundsData[parseInt(roundNum)]
          });
        });

        if (mainRounds.length === 0) {
          // Create initial round if none exist
          mainRounds.push({
            round: 1,
            exercises: mainExercises.map(ex => ({
              name: ex.name,
              value: '',
              unit: 'reps'
            }))
          });
        }

        setMainWodRounds(mainRounds);
      }

      if (secondaryExercises.length > 0) {
        const secondaryRounds: RoundData[] = [];
        const roundsData: { [roundNum: number]: ExerciseResult[] } = {};

        exercises.forEach((ex: any) => {
          if (ex.section === 'secondary' && ex.round) {
            if (!roundsData[ex.round]) {
              roundsData[ex.round] = [];
            }
            roundsData[ex.round].push({
              name: ex.name,
              value: ex.value || '',
              unit: ex.unit || 'reps'
            });
          }
        });

        Object.keys(roundsData).forEach(roundNum => {
          secondaryRounds.push({
            round: parseInt(roundNum),
            exercises: roundsData[parseInt(roundNum)]
          });
        });

        if (secondaryRounds.length === 0) {
          // Create initial round if none exist
          secondaryRounds.push({
            round: 1,
            exercises: secondaryExercises.map(ex => ({
              name: ex.name,
              value: '',
              unit: 'reps'
            }))
          });
        }

        setSecondaryWodRounds(secondaryRounds);
      }
    }
  }, [session]);

  const updateExerciseResult = (roundIndex: number, exerciseIndex: number, value: number | '', isSecondary: boolean = false) => {
    if (isSecondary) {
      setSecondaryWodRounds(prev => {
        const updated = [...prev];
        updated[roundIndex].exercises[exerciseIndex].value = value;
        return updated;
      });
    } else {
      setMainWodRounds(prev => {
        const updated = [...prev];
        updated[roundIndex].exercises[exerciseIndex].value = value;
        return updated;
      });
    }
  };

  const addMainRound = () => {
    if (workout?.main_workout) {
      const exercises = workout.main_workout.exercises || [];
      const newRound: RoundData = {
        round: mainWodRounds.length + 1,
        exercises: exercises.map(ex => ({
          name: ex.name,
          value: '',
          unit: 'reps'
        }))
      };
      setMainWodRounds(prev => [...prev, newRound]);
    }
  };

  const addSecondaryRound = () => {
    if (workout?.secondary_wod) {
      const exercises = workout.secondary_wod.exercises || [];
      const newRound: RoundData = {
        round: secondaryWodRounds.length + 1,
        exercises: exercises.map(ex => ({
          name: ex.name,
          value: '',
          unit: 'reps'
        }))
      };
      setSecondaryWodRounds(prev => [...prev, newRound]);
    }
  };

  const handleSave = async () => {
    if (!workout) return;
    
    setLoading(true);
    try {
      // Prepare exercises data
      const exercisesData = [
        ...workout.warmup.map(ex => ({
          name: ex.name,
          section: 'warmup',
          completed: true,
          duration: ex.duration || 0,
          reps: ex.reps || '',
        })),
        ...mainWodRounds.flatMap(round => 
          round.exercises.map(result => ({
            name: result.name,
            section: 'main',
            completed: true,
            value: result.value === '' ? 0 : result.value,
            unit: result.unit,
            round: round.round,
          }))
        ),
        ...secondaryWodRounds.flatMap(round =>
          round.exercises.map(result => ({
            name: result.name,
            section: 'secondary',
            completed: true,
            value: result.value === '' ? 0 : result.value,
            unit: result.unit,
            round: round.round,
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

      const totalTimeInSeconds = totalTimeMinutes * 60 + totalTimeSeconds;

      let description = `${workout.description || ''} - Escala: ${scale.toUpperCase()}`;
      if (workout.main_workout) {
        description += ` - WOD Principal: ${mainWodTimeMinutes}:${mainWodTimeSeconds.toString().padStart(2, '0')} (${mainWodRounds.length} rondas)`;
      }
      if (workout.secondary_wod) {
        description += ` - WOD Secundario: ${secondaryWodTimeMinutes}:${secondaryWodTimeSeconds.toString().padStart(2, '0')} (${secondaryWodRounds.length} rondas)`;
      }
      description += ` - Tiempo Total: ${totalTimeMinutes}:${totalTimeSeconds.toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('workout_sessions')
        .update({
          title: `${workout.title} (Entrenamiento Diario)`,
          description: description,
          exercises: exercisesData,
          total_time: totalTimeInSeconds,
          date: session.date,
        })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Entrenamiento actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating workout:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!workout) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            EDITAR {workout.type.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scaling Options */}
          <div className="flex justify-center gap-2">
            <Button
              variant={scale === 'scaled' ? 'default' : 'outline'}
              onClick={() => setScale('scaled')}
              className="rounded-full px-8 bg-primary text-primary-foreground"
            >
              Scaled
            </Button>
            <Button
              variant={scale === 'rx' ? 'default' : 'outline'}
              onClick={() => setScale('rx')}
              className="rounded-full px-8"
            >
              RX
            </Button>
          </div>

          {/* Warmup - Read Only */}
          {workout.warmup.length > 0 && (
            <Card className="border-warmup-border bg-warmup-background">
              <CardHeader>
                <CardTitle className="text-warmup-text text-lg">Calentamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workout.warmup.map((exercise, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-warmup-accent rounded-full"></div>
                        <div className="w-2 h-2 bg-warmup-accent rounded-full"></div>
                      </div>
                      <span className="text-foreground">{exercise.name}</span>
                      {exercise.reps && <span className="text-sm text-muted-foreground">({exercise.reps})</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main WOD - Editable */}
          {workout.main_workout && (
            <div className="space-y-4">
              {mainWodRounds.map((round, roundIndex) => (
                <Card key={round.round}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {mainWodRounds.length > 1 ? `WOD Principal - Ronda ${round.round}` : 'WOD Principal'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {round.exercises.map((result, exerciseIndex) => (
                      <div key={exerciseIndex} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-muted rounded-full"></div>
                            <div className="w-2 h-2 bg-muted rounded-full"></div>
                          </div>
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={result.value}
                            onChange={(e) => updateExerciseResult(roundIndex, exerciseIndex, e.target.value === '' ? '' : Number(e.target.value), false)}
                            className="w-20 text-center bg-muted"
                            placeholder="0"
                          />
                          <span className="text-sm text-muted-foreground">{result.unit}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              
              {/* Tiempo del WOD Principal */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">Tiempo WOD Principal:</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={mainWodTimeMinutes}
                          onChange={(e) => setMainWodTimeMinutes(Number(e.target.value))}
                          className="w-16 text-center font-mono bg-muted"
                          min="0"
                          placeholder="0"
                        />
                        <span className="font-mono">:</span>
                        <Input
                          type="number"
                          value={mainWodTimeSeconds}
                          onChange={(e) => setMainWodTimeSeconds(Math.min(59, Number(e.target.value)))}
                          className="w-16 text-center font-mono bg-muted"
                          min="0"
                          max="59"
                          placeholder="00"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botón añadir ronda WOD Principal */}
              <div className="flex justify-center">
                <Button onClick={addMainRound} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir ronda {mainWodRounds.length + 1}
                </Button>
              </div>
            </div>
          )}

          {/* Secondary WOD - Editable */}
          {workout.secondary_wod && (
            <div className="space-y-4">
              {secondaryWodRounds.map((round, roundIndex) => (
                <Card key={round.round}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {secondaryWodRounds.length > 1 ? `WOD Secundario - Ronda ${round.round}` : 'WOD Secundario'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {round.exercises.map((result, exerciseIndex) => (
                      <div key={exerciseIndex} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-muted rounded-full"></div>
                            <div className="w-2 h-2 bg-muted rounded-full"></div>
                          </div>
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={result.value}
                            onChange={(e) => updateExerciseResult(roundIndex, exerciseIndex, e.target.value === '' ? '' : Number(e.target.value), true)}
                            className="w-20 text-center bg-muted"
                            placeholder="0"
                          />
                          <span className="text-sm text-muted-foreground">{result.unit}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              
              {/* Tiempo del WOD Secundario */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">Tiempo WOD Secundario:</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={secondaryWodTimeMinutes}
                          onChange={(e) => setSecondaryWodTimeMinutes(Number(e.target.value))}
                          className="w-16 text-center font-mono bg-muted"
                          min="0"
                          placeholder="0"
                        />
                        <span className="font-mono">:</span>
                        <Input
                          type="number"
                          value={secondaryWodTimeSeconds}
                          onChange={(e) => setSecondaryWodTimeSeconds(Math.min(59, Number(e.target.value)))}
                          className="w-16 text-center font-mono bg-muted"
                          min="0"
                          max="59"
                          placeholder="00"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botón añadir ronda WOD Secundario */}
              <div className="flex justify-center">
                <Button onClick={addSecondaryRound} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir ronda {secondaryWodRounds.length + 1}
                </Button>
              </div>
            </div>
          )}

          {/* Cooldown - Read Only */}
          {workout.cooldown && workout.cooldown.length > 0 && (
            <Card className="border-technique-border bg-technique-background">
              <CardHeader>
                <CardTitle className="text-technique-text text-lg">Enfriamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workout.cooldown.map((exercise, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-technique-accent rounded-full"></div>
                        <div className="w-2 h-2 bg-technique-accent rounded-full"></div>
                      </div>
                      <span className="text-foreground">{exercise.name}</span>
                      {exercise.reps && <span className="text-sm text-muted-foreground">({exercise.reps})</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timer and Completion */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg">Tiempo Total del Entrenamiento:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={totalTimeMinutes}
                      onChange={(e) => setTotalTimeMinutes(Number(e.target.value))}
                      className="w-16 text-center text-2xl font-mono bg-muted"
                      min="0"
                      placeholder="0"
                    />
                    <span className="text-2xl font-mono">:</span>
                    <Input
                      type="number"
                      value={totalTimeSeconds}
                      onChange={(e) => setTotalTimeSeconds(Math.min(59, Number(e.target.value)))}
                      className="w-16 text-center text-2xl font-mono bg-muted"
                      min="0"
                      max="59"
                      placeholder="00"
                    />
                  </div>
                </div>
                
                {/* Resumen de tiempos */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Resumen de tiempos:</h4>
                  <div className="space-y-1 text-sm">
                    {workout.main_workout && (
                      <div className="flex justify-between">
                        <span>WOD Principal:</span>
                        <span className="font-mono">{mainWodTimeMinutes}:{mainWodTimeSeconds.toString().padStart(2, '0')}</span>
                      </div>
                    )}
                    {workout.secondary_wod && (
                      <div className="flex justify-between">
                        <span>WOD Secundario:</span>
                        <span className="font-mono">{secondaryWodTimeMinutes}:{secondaryWodTimeSeconds.toString().padStart(2, '0')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Tiempo Total:</span>
                      <span className="font-mono">{totalTimeMinutes}:{totalTimeSeconds.toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-primary pt-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">ENTRENAMIENTO EDITADO</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="px-8">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-primary px-8">
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};