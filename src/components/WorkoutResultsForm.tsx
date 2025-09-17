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

interface WorkoutResultsFormProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutData;
  totalTime: number;
  userId: string;
}

interface ExerciseResult {
  name: string;
  value: number;
  unit: string;
}

interface RoundData {
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
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(Math.floor(totalTime / 60));
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(totalTime % 60);
  const [mainWodRounds, setMainWodRounds] = useState<RoundData[]>([]);
  const [secondaryWodRounds, setSecondaryWodRounds] = useState<RoundData[]>([]);
  const [mainWodTimeMinutes, setMainWodTimeMinutes] = useState(0);
  const [mainWodTimeSeconds, setMainWodTimeSeconds] = useState(0);
  const [secondaryWodTimeMinutes, setSecondaryWodTimeMinutes] = useState(0);
  const [secondaryWodTimeSeconds, setSecondaryWodTimeSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize exercise results for WODs
  useEffect(() => {
    if (workout.main_workout) {
      const exercises = workout.main_workout.exercises || workout.main_workout.rounds?.[0]?.exercises || [];
      const initialRound: RoundData = {
        round: 1,
        exercises: exercises.map(ex => ({
          name: ex.name,
          value: 0,
          unit: ex.reps ? 'reps' : 'time'
        }))
      };
      setMainWodRounds([initialRound]);
    }

    if (workout.secondary_wod) {
      const exercises = workout.secondary_wod.exercises || workout.secondary_wod.rounds?.[0]?.exercises || [];
      const initialRound: RoundData = {
        round: 1,
        exercises: exercises.map(ex => ({
          name: ex.name,
          value: 0,
          unit: ex.reps ? 'reps' : 'time'
        }))
      };
      setSecondaryWodRounds([initialRound]);
    }
  }, [workout]);

  const updateExerciseResult = (roundIndex: number, exerciseIndex: number, value: number, isSecondary: boolean = false) => {
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
    if (workout.main_workout) {
      const maxRounds = workout.main_workout.rounds?.length || 1;
      if (mainWodRounds.length >= maxRounds) return;
      
      const exercises = workout.main_workout.exercises || workout.main_workout.rounds?.[0]?.exercises || [];
      const newRound: RoundData = {
        round: mainWodRounds.length + 1,
        exercises: exercises.map(ex => ({
          name: ex.name,
          value: 0,
          unit: ex.reps ? 'reps' : 'time'
        }))
      };
      setMainWodRounds(prev => [...prev, newRound]);
    }
  };

  const addSecondaryRound = () => {
    if (workout.secondary_wod) {
      const maxRounds = workout.secondary_wod.rounds?.length || 1;
      if (secondaryWodRounds.length >= maxRounds) return;
      
      const exercises = workout.secondary_wod.exercises || workout.secondary_wod.rounds?.[0]?.exercises || [];
      const newRound: RoundData = {
        round: secondaryWodRounds.length + 1,
        exercises: exercises.map(ex => ({
          name: ex.name,
          value: 0,
          unit: ex.reps ? 'reps' : 'time'
        }))
      };
      setSecondaryWodRounds(prev => [...prev, newRound]);
    }
  };

  const handleSave = async () => {
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
            value: result.value,
            unit: result.unit,
            round: round.round,
          }))
        ),
        ...secondaryWodRounds.flatMap(round =>
          round.exercises.map(result => ({
            name: result.name,
            section: 'secondary',
            completed: true,
            value: result.value,
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
      const mainWodTime = mainWodTimeMinutes * 60 + mainWodTimeSeconds;
      const secondaryWodTime = secondaryWodTimeMinutes * 60 + secondaryWodTimeSeconds;

      let description = `${workout.description || ''} - Escala: ${scale.toUpperCase()}`;
      if (workout.main_workout) {
        description += ` - WOD Principal: ${mainWodTimeMinutes}:${mainWodTimeSeconds.toString().padStart(2, '0')} (${mainWodRounds.length} rondas)`;
      }
      if (workout.secondary_wod) {
        description += ` - WOD Secundario: ${secondaryWodTimeMinutes}:${secondaryWodTimeSeconds.toString().padStart(2, '0')} (${secondaryWodRounds.length} rondas)`;
      }
      description += ` - Tiempo Total: ${totalTimeMinutes}:${totalTimeSeconds.toString().padStart(2, '0')}`;

      const sessionData = {
        user_id: userId,
        title: `${workout.title} (Entrenamiento Diario)`,
        description: description,
        exercises: exercisesData,
        total_time: totalTimeInSeconds,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            {workout.type.toUpperCase()}
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
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          </div>
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={result.value || ''}
                            onChange={(e) => updateExerciseResult(roundIndex, exerciseIndex, Number(e.target.value), false)}
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
              {workout.main_workout.rounds && mainWodRounds.length < workout.main_workout.rounds.length && (
                <div className="flex justify-center">
                  <Button onClick={addMainRound} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg">
                    Añadir ronda
                  </Button>
                </div>
              )}
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
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          </div>
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={result.value || ''}
                            onChange={(e) => updateExerciseResult(roundIndex, exerciseIndex, Number(e.target.value), true)}
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
              {workout.secondary_wod.rounds && secondaryWodRounds.length < workout.secondary_wod.rounds.length && (
                <div className="flex justify-center">
                  <Button onClick={addSecondaryRound} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg">
                    Añadir ronda
                  </Button>
                </div>
              )}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={totalTimeMinutes}
                      onChange={(e) => setTotalTimeMinutes(Number(e.target.value))}
                      className="w-16 text-center text-2xl font-mono bg-muted"
                      min="0"
                      max="59"
                    />
                    <span className="text-2xl font-mono">:</span>
                    <Input
                      type="number"
                      value={totalTimeSeconds}
                      onChange={(e) => setTotalTimeSeconds(Math.min(59, Number(e.target.value)))}
                      className="w-16 text-center text-2xl font-mono bg-muted"
                      min="0"
                      max="59"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">WOD COMPLETADO</span>
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
              {loading ? 'Guardando...' : 'Guardar Resultados'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};