import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";  // Asume Shadcn Progress; si no, instala con Lovable/Shadcn
import { Clock, CheckCircle, Play, Pause, Zap, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";  // Tu cliente Supabase

interface Exercise {
  id: number;
  name: string;
  isTimed: boolean;
  duration?: number;  // Segundos si timed
  reps?: string;  // Ej. "10x"
}

const WorkoutSession = () => {
  const location = useLocation();
  const workout = location.state?.workout;  // Recibe de DailyWorkout
  const [totalTimeLeft, setTotalTimeLeft] = useState(workout?.duration * 60);  // Segundos
  const [isTotalRunning, setIsTotalRunning] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [subTimeLeft, setSubTimeLeft] = useState(0);
  const [isSubRunning, setIsSubRunning] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (workout) {
      // Combina warmup y main_workout en lista flat con parseo
      const allExercises: Exercise[] = [
        ...workout.warmup.map((ex: string, idx: number) => parseExercise(ex, idx, 'warmup')),
        ...workout.main_workout.exercises.map((ex: string, idx: number) => parseExercise(ex, idx + workout.warmup.length, 'main'))
      ];
      setExercises(allExercises);
    }
  }, [workout]);

  // Parseo simple: Detecta timed (minutos/segundos) vs reps
  const parseExercise = (ex: string, id: number, type: 'warmup' | 'main'): Exercise => {
    const lowerEx = ex.toLowerCase();
    const timeMatch = lowerEx.match(/(\d+)\s*(minutos?|segundos?)/);
    return {
      id,
      name: ex,
      isTimed: !!timeMatch,
      duration: timeMatch ? parseInt(timeMatch[1]) * (timeMatch[2].startsWith('min') ? 60 : 1) : undefined,
      reps: timeMatch ? undefined : ex.match(/\d+x?/)?.[0] || 'Completar'
    };
  };

  // Temporizador principal
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTotalRunning && totalTimeLeft > 0) {
      interval = setInterval(() => setTotalTimeLeft((prev) => prev - 1), 1000);
    } else if (totalTimeLeft <= 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isTotalRunning, totalTimeLeft]);

  // Sub-temporizador para ejercicios timed
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubRunning && subTimeLeft > 0) {
      interval = setInterval(() => setSubTimeLeft((prev) => prev - 1), 1000);
    } else if (subTimeLeft <= 0 && isSubRunning) {
      setIsSubRunning(false);
      // Auto-avanzar si timed completado
      advanceExercise();
    }
    return () => clearInterval(interval);
  }, [isSubRunning, subTimeLeft]);

  const startWorkout = () => {
    setIsTotalRunning(true);
    startCurrentExercise();
  };

  const startCurrentExercise = () => {
    const current = exercises[currentExerciseIndex];
    if (current.isTimed && current.duration) {
      setSubTimeLeft(current.duration);
      setIsSubRunning(true);
    }
  };

  const advanceExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setSubTimeLeft(0);
      setIsSubRunning(false);
      startCurrentExercise();
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsTotalRunning(false);
    setCompleted(true);
    // Opcional: Loggear en Supabase (asumiendo user auth)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_progress').insert({
        user_id: user.id,
        workout_id: workout.id,
        completed_at: new Date(),
        time_taken: workout.duration * 60 - totalTimeLeft
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!workout) return <div className="text-center py-20">No workout data available.</div>;

  return (
    <section className="min-h-screen bg-gradient-hero relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-glow opacity-20"></div>
      <div className="container mx-auto px-4 relative z-10 max-w-4xl">
        <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-intense">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-black bg-gradient-primary bg-clip-text text-transparent">
              {workout.title}
            </CardTitle>
            <p className="text-muted-foreground">{workout.description}</p>
            <div className="flex justify-center items-center mt-4">
              <Clock className="w-6 h-6 mr-2 text-primary" />
              <span className="text-xl font-bold">{formatTime(totalTimeLeft)}</span>
            </div>
            {!isTotalRunning && !completed && (
              <Button onClick={startWorkout} className="mt-4 bg-gradient-primary text-white">
                <Play className="mr-2" /> Iniciar Entrenamiento
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={(currentExerciseIndex / exercises.length) * 100} className="h-2" />
            {exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className={`p-4 rounded-xl border transition-all ${
                  idx === currentExerciseIndex
                    ? 'bg-primary/20 border-primary shadow-glow animate-pulse'
                    : idx < currentExerciseIndex
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg flex items-center">
                    {idx < workout.warmup.length ? <TrendingUp className="mr-2 w-5 h-5 text-primary" /> : <Award className="mr-2 w-5 h-5 text-fitness-orange" />}
                    {ex.name}
                  </span>
                  {idx === currentExerciseIndex && isTotalRunning && (
                    ex.isTimed ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-primary">{formatTime(subTimeLeft)}</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsSubRunning(!isSubRunning)}>
                          {isSubRunning ? <Pause /> : <Play />}
                        </Button>
                        <Button variant="outline" onClick={advanceExercise}>
                          Completar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={advanceExercise} className="bg-fitness-orange text-white">
                        <CheckCircle className="mr-2" /> Completado
                      </Button>
                    )
                  )}
                  {idx < currentExerciseIndex && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
              </div>
            ))}
            {completed && (
              <div className="text-center py-8 animate-fade-in">
                <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold">¡Entrenamiento Completado!</h3>
                <p className="text-muted-foreground mt-2">Tiempo total: {formatTime(workout.duration * 60 - totalTimeLeft)}</p>
                <Button onClick={() => window.location.href = '/'} className="mt-4">
                  Volver al Inicio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WorkoutSession;