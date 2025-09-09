import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, Play, Pause, Zap, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Exercise {
  id: number;
  name: string;
  isTimed: boolean;
  duration?: number; // Segundos si timed
  reps?: string; // Ej. "10x"
}

const WorkoutSession = () => {
  const location = useLocation();
  const workout = location.state?.workout;
  const [totalTimeLeft, setTotalTimeLeft] = useState(workout?.duration * 60);
  const [isTotalRunning, setIsTotalRunning] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseTimes, setExerciseTimes] = useState<number[]>([]);
  const [isSubRunning, setIsSubRunning] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completed, setCompleted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([]); // Track completed exercises

  useEffect(() => {
    if (workout) {
      const allExercises: Exercise[] = [
        ...workout.warmup.map((ex: string, idx: number) => parseExercise(ex, idx, "warmup")),
        ...workout.main_workout.exercises.map((ex: string, idx: number) => parseExercise(ex, idx + workout.warmup.length, "main")),
      ];
      setExercises(allExercises);
      const initialTimes = allExercises.map(ex => (ex.isTimed && ex.duration ? ex.duration : 0));
      setExerciseTimes(initialTimes);
      setCompletedExercises(new Array(allExercises.length).fill(false)); // Initialize completed state
      console.log("Ejercicios parseados:", allExercises);
      console.log("Tiempos iniciales:", initialTimes);
    }
  }, [workout]);

  const parseExercise = (ex: string, id: number, type: "warmup" | "main"): Exercise => {
    const lowerEx = ex.toLowerCase().trim();
    const timeMatch = lowerEx.match(/(\d+)\s*(minutos?|segundos?|min|s)/i);
    let duration: number | undefined;
    let isTimed = false;

    if (timeMatch) {
      isTimed = true;
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      duration = unit.startsWith("min") ? value * 60 : value;
    }

    return {
      id,
      name: ex,
      isTimed,
      duration,
      reps: isTimed ? undefined : ex.match(/\d+x?/)?.[0] || "Completar",
    };
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTotalRunning && totalTimeLeft > 0) {
      interval = setInterval(() => setTotalTimeLeft((prev) => prev - 1), 1000);
    } else if (totalTimeLeft <= 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isTotalRunning, totalTimeLeft]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubRunning && exerciseTimes[currentExerciseIndex] > 0) {
      interval = setInterval(() => {
        setExerciseTimes(prev => {
          const newTimes = [...prev];
          newTimes[currentExerciseIndex] -= 1;
          return newTimes;
        });
      }, 1000);
    } else if (exerciseTimes[currentExerciseIndex] <= 0 && isSubRunning) {
      setIsSubRunning(false);
      completeCurrentExercise();
    }
    return () => clearInterval(interval);
  }, [isSubRunning, currentExerciseIndex, exerciseTimes]);

  const startWorkout = () => {
    setIsTotalRunning(true);
    startCurrentExercise();
  };

  const startCurrentExercise = () => {
    const current = exercises[currentExerciseIndex];
    if (current.isTimed) {
      setIsSubRunning(true);
    }
  };

  const completeCurrentExercise = () => {
    console.log("Completando ejercicio:", currentExerciseIndex, exercises[currentExerciseIndex].name);
    setCompletedExercises(prev => {
      const newCompleted = [...prev];
      newCompleted[currentExerciseIndex] = true;
      return newCompleted;
    });
    setIsSubRunning(false); // Stop timer
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => {
        const newIndex = prev + 1;
        console.log("Avanzando a ejercicio:", newIndex);
        return newIndex;
      });
      startCurrentExercise();
    } else {
      console.log("Último ejercicio completado, finalizando...");
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsTotalRunning(false);
    setCompleted(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_progress").insert({
        user_id: user.id,
        workout_id: workout.id,
        completed_at: new Date(),
        time_taken: workout.duration * 60 - totalTimeLeft,
      });
    }
    console.log("Entrenamiento finalizado");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!workout) return <div className="text-center py-20">No workout data available.</div>;

  return (
    <section className="bg-gradient-hero relative overflow-y-auto min-h-screen pt-16">
      <div className="absolute inset-0 bg-gradient-glow opacity-20"></div>
      <div className="container mx-auto px-4 relative z-10 max-w-4xl py-8">
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
                  idx === currentExerciseIndex && !completedExercises[idx]
                    ? "bg-primary/20 border-primary shadow-glow animate-pulse"
                    : completedExercises[idx]
                    ? "bg-green-500/20 border-green-500"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-medium text-lg flex items-center">
                    {idx < workout.warmup.length ? (
                      <TrendingUp className="mr-2 w-5 h-5 text-primary" />
                    ) : (
                      <Award className="mr-2 w-5 h-5 text-fitness-orange" />
                    )}
                    {ex.name}
                    {ex.isTimed && ex.duration && (
                      <span className="ml-3 flex items-center text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(ex.duration)}
                      </span>
                    )}
                  </span>
                  {idx === currentExerciseIndex && isTotalRunning && !completedExercises[idx] && (
                    ex.isTimed ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-primary">{formatTime(exerciseTimes[idx])}</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsSubRunning(!isSubRunning)}>
                          {isSubRunning ? <Pause /> : <Play />}
                        </Button>
                        <Button variant="outline" onClick={completeCurrentExercise}>
                          Completar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={completeCurrentExercise} className="bg-fitness-orange text-white">
                        <CheckCircle className="mr-2" /> Completado
                      </Button>
                    )
                  )}
                  {completedExercises[idx] && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      {ex.isTimed && ex.duration && (
                        <span className="text-sm text-muted-foreground">
                          Completado en {formatTime(ex.duration - exerciseTimes[idx])}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {completed && (
              <div className="text-center py-8 animate-fade-in">
                <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold">¡Entrenamiento Completado!</h3>
                <p className="text-muted-foreground mt-2">Tiempo total: {formatTime(workout.duration * 60 - totalTimeLeft)}</p>
                <Button onClick={() => window.location.href = "/"} className="mt-4">
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