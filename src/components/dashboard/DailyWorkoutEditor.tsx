import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Save, Timer, Trophy } from "lucide-react";
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
  reps?: string;
  weight?: string;
  time?: string;
  distance?: string;
  calories?: string;
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
  { id: 'scaled2', label: 'scaled 2', color: 'bg-blue-500 text-white' },
  { id: 'scaled', label: 'scaled', color: 'bg-white text-black border border-gray-300' },
  { id: 'rx', label: 'RX', color: 'bg-white text-black border border-gray-300' },
  { id: 'elite', label: 'elite', color: 'bg-white text-black border border-gray-300' }
];

export const DailyWorkoutEditor = ({ session, userId, onClose, onSuccess }: DailyWorkoutEditorProps) => {
  const [selectedScale, setSelectedScale] = useState('scaled2');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [totalRounds, setTotalRounds] = useState(5);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [workoutType, setWorkoutType] = useState('FOR TIME');
  const [timer, setTimer] = useState('00:00');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (session.exercises && Array.isArray(session.exercises)) {
      // Agrupar ejercicios por nombre para identificar la estructura
      const exerciseGroups: { [key: string]: any[] } = {};
      session.exercises.forEach((ex: any) => {
        const exerciseName = ex.name || 'Ejercicio sin nombre';
        if (!exerciseGroups[exerciseName]) {
          exerciseGroups[exerciseName] = [];
        }
        exerciseGroups[exerciseName].push(ex);
      });

      // Determinar el número de rondas basado en el grupo con más ejercicios
      const maxRounds = Math.max(...Object.values(exerciseGroups).map(group => group.length));
      setTotalRounds(maxRounds);

      // Detectar tipo de workout del título
      if (session.title.includes('MAX REPS')) {
        setWorkoutType('MAX REPS');
      } else if (session.title.includes('RONDAS Y REPS')) {
        setWorkoutType('RONDAS Y REPS');
      } else {
        setWorkoutType('FOR TIME');
      }

      // Construir la estructura de rondas
      const roundsData: Round[] = [];
      for (let roundIndex = 0; roundIndex < maxRounds; roundIndex++) {
        const roundExercises: Exercise[] = Object.entries(exerciseGroups).map(([exerciseName, exercises]) => {
          const exercise = exercises[roundIndex] || exercises[0]; // Usar el ejercicio de esta ronda o el primero disponible
          
          return {
            name: exerciseName,
            sets: [{
              id: crypto.randomUUID(),
              reps: exercise.sets?.[0]?.reps?.toString() || '',
              weight: exercise.sets?.[0]?.weight?.toString() || '',
              time: exercise.sets?.[0]?.time?.toString() || '',
              distance: exercise.sets?.[0]?.distance?.toString() || '',
              calories: exercise.sets?.[0]?.calories?.toString() || ''
            }]
          };
        });

        roundsData.push({
          roundNumber: roundIndex + 1,
          exercises: roundExercises
        });
      }

      setRounds(roundsData);
    }
  }, [session]);

  const updateExerciseSet = (roundIndex: number, exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: string) => {
    const newRounds = [...rounds];
    if (field !== 'id') {
      newRounds[roundIndex].exercises[exerciseIndex].sets[setIndex][field] = value;
      setRounds(newRounds);
    }
  };

  const addSet = (roundIndex: number, exerciseIndex: number) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].exercises[exerciseIndex].sets.push({
      id: crypto.randomUUID(),
      reps: '',
      weight: '',
      time: '',
      distance: '',
      calories: ''
    });
    setRounds(newRounds);
  };

  const removeSet = (roundIndex: number, exerciseIndex: number, setIndex: number) => {
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
    
    for (const round of rounds) {
      for (const exercise of round.exercises) {
        const sets = exercise.sets
          .filter(set => set.reps || set.weight || set.time || set.distance || set.calories)
          .map((set, index) => {
            const setData: any = { setNumber: index + 1 };
            if (set.reps) setData.reps = parseFloat(set.reps) || 0;
            if (set.weight) setData.weight = parseFloat(set.weight) || 0;
            if (set.time) setData.time = parseFloat(set.time) || 0;
            if (set.distance) setData.distance = parseFloat(set.distance) || 0;
            if (set.calories) setData.calories = parseFloat(set.calories) || 0;
            return setData;
          });

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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-2xl font-bold">
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
                variant={selectedScale === scale.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedScale(scale.id)}
                className={selectedScale === scale.id ? scale.color : 'bg-white text-black border border-gray-300'}
              >
                {scale.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Workout Details */}
          <div className="space-y-4">
            {rounds.map((round, roundIndex) => (
              <Card key={roundIndex} className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-blue-700">RONDA {round.roundNumber}</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {round.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-lg">{exercise.name}</span>
                          {exercise.sets[0]?.reps && (
                            <span className="font-bold text-lg">{exercise.sets[0].reps} reps</span>
                          )}
                        </div>
                      </div>
                      {(exercise.name.toLowerCase().includes('clean') || 
                        exercise.name.toLowerCase().includes('press') || 
                        exercise.name.toLowerCase().includes('snatch') ||
                        exercise.name.toLowerCase().includes('devil')) && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={exercise.sets[0]?.weight || ''}
                            onChange={(e) => updateExerciseSet(roundIndex, exerciseIndex, 0, 'weight', e.target.value)}
                            className="w-16 text-center bg-gray-100 border-0"
                            placeholder="0"
                          />
                          <span className="text-blue-500 font-medium">kg</span>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* MAX REPS Section */}
          {workoutType === 'MAX REPS' && rounds[0]?.exercises.length > 0 && (
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-4">MAX REPS {rounds[0].exercises[0].name.toUpperCase()}</h3>
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  <Input
                    type="number"
                    value={rounds[0].exercises[0].sets[0]?.reps || ''}
                    onChange={(e) => updateExerciseSet(0, 0, 0, 'reps', e.target.value)}
                    className="text-4xl font-bold text-center w-32 bg-transparent border-none"
                    placeholder="0"
                  />
                  <div className="text-lg font-medium text-gray-600">REPS</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RONDAS Y REPS Section */}
          {workoutType === 'RONDAS Y REPS' && (
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  RONDAS Y REPS (SI NO SE LLEGA AL DEVIL)
                </h3>
                <div className="flex gap-4 justify-center">
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <Input
                      type="number"
                      value={completedRounds}
                      onChange={(e) => setCompletedRounds(parseInt(e.target.value) || 0)}
                      className="text-3xl font-bold text-center w-20 bg-transparent border-none"
                      placeholder="0"
                    />
                    <div className="text-sm font-medium text-gray-600">RONDAS</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <Input
                      type="number"
                      value={rounds[0]?.exercises[0]?.sets[0]?.reps || ''}
                      onChange={(e) => updateExerciseSet(0, 0, 0, 'reps', e.target.value)}
                      className="text-3xl font-bold text-center w-20 bg-transparent border-none"
                      placeholder="0"
                    />
                    <div className="text-sm font-medium text-gray-600">REPS</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timer and Rounds Counter */}
          <div className="flex gap-4 justify-center">
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm font-medium">TIEMPO</span>
                </div>
                <Input
                  type="text"
                  value={timer}
                  onChange={(e) => setTimer(e.target.value)}
                  className="text-2xl font-bold text-center bg-transparent border-none"
                  placeholder="00:00"
                />
              </CardContent>
            </Card>
            
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <div className="text-sm font-medium mb-2">RONDAS COMPLETADAS</div>
                <div className="text-3xl font-bold flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    value={completedRounds}
                    onChange={(e) => setCompletedRounds(parseInt(e.target.value) || 0)}
                    className="text-3xl font-bold text-center w-16 bg-transparent border-none"
                    placeholder="0"
                  />
                  <span className="text-gray-500">/ {totalRounds}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
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