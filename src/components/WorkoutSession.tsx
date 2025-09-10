import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, Play, Pause, Zap, TrendingUp, Award, RotateCcw, Target, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Exercise {
  id: number;
  name: string;
  isTimed: boolean;
  duration?: number; // Segundos si timed
  reps?: string; // Ej. "10x"
  section: "warmup" | "main";
}

interface Round {
  roundNumber: number;
  exercises: Exercise[];
  completed: boolean;
}

const WorkoutSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const workout = location.state?.workout;
  const [totalTimeLeft, setTotalTimeLeft] = useState(workout?.duration * 60);
  const [isTotalRunning, setIsTotalRunning] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [exerciseTimes, setExerciseTimes] = useState<number[]>([]);
  const [isSubRunning, setIsSubRunning] = useState(false);
  const [warmupExercises, setWarmupExercises] = useState<Exercise[]>([]);
  const [mainRounds, setMainRounds] = useState<Round[]>([]);
  const [completed, setCompleted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentSection, setCurrentSection] = useState<"warmup" | "main">("warmup");

  useEffect(() => {
    if (workout) {
      // Parse warmup exercises
      const warmup: Exercise[] = workout.warmup.map((ex: string, idx: number) => 
        parseExercise(ex, idx, "warmup")
      );
      
      // Parse main workout exercises and create 4 rounds
      const mainExercises: Exercise[] = workout.main_workout.exercises.map((ex: string, idx: number) => 
        parseExercise(ex, idx + warmup.length, "main")
      );
      
      // Create 4 rounds for strength training
      const rounds: Round[] = [];
      for (let i = 0; i < 4; i++) {
        rounds.push({
          roundNumber: i + 1,
          exercises: mainExercises.map(ex => ({
            ...ex,
            id: ex.id + (i * mainExercises.length)
          })),
          completed: false
        });
      }
      
      setWarmupExercises(warmup);
      setMainRounds(rounds);
      
      // Initialize exercise times for all exercises
      const totalExercises = warmup.length + (rounds.length * mainExercises.length);
      const initialTimes: number[] = [];
      
      // Add warmup times
      warmup.forEach(ex => {
        initialTimes.push(ex.isTimed && ex.duration ? ex.duration : 0);
      });
      
      // Add times for each round
      rounds.forEach(() => {
        mainExercises.forEach(ex => {
          initialTimes.push(ex.isTimed && ex.duration ? ex.duration : 0);
        });
      });
      
      setExerciseTimes(initialTimes);
      setCompletedExercises(new Array(totalExercises).fill(false));
      
      console.log("Ejercicios de calentamiento:", warmup);
      console.log("Rondas principales:", rounds);
      console.log("Tiempos iniciales:", initialTimes);
    }
  }, [workout]);

  const parseExercise = (ex: string, id: number, section: "warmup" | "main"): Exercise => {
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
      section,
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
    }
    return () => clearInterval(interval);
  }, [isSubRunning, currentExerciseIndex, exerciseTimes]);

  const startWorkout = () => {
    setIsTotalRunning(true);
    startCurrentExercise();
  };

  const startCurrentExercise = () => {
    const allExercises = getAllExercises();
    const current = allExercises[currentExerciseIndex];
    if (current?.isTimed) {
      setIsSubRunning(true);
    }
  };

  const getAllExercises = (): Exercise[] => {
    const allExercises: Exercise[] = [...warmupExercises];
    mainRounds.forEach(round => {
      allExercises.push(...round.exercises);
    });
    return allExercises;
  };

  const getCurrentExerciseInfo = () => {
    if (currentExerciseIndex < warmupExercises.length) {
      return {
        section: "warmup" as const,
        exercise: warmupExercises[currentExerciseIndex],
        roundNumber: null,
        exerciseInRound: null
      };
    } else {
      const mainIndex = currentExerciseIndex - warmupExercises.length;
      const exercisesPerRound = mainRounds[0]?.exercises.length || 0;
      const roundIndex = Math.floor(mainIndex / exercisesPerRound);
      const exerciseInRound = mainIndex % exercisesPerRound;
      
      return {
        section: "main" as const,
        exercise: mainRounds[roundIndex]?.exercises[exerciseInRound],
        roundNumber: roundIndex + 1,
        exerciseInRound: exerciseInRound
      };
    }
  };

  const completeCurrentExercise = () => {
    if (isCompleting || completedExercises[currentExerciseIndex]) return;
    setIsCompleting(true);

    const exerciseInfo = getCurrentExerciseInfo();
    console.log("Completando ejercicio:", exerciseInfo);

    setCompletedExercises(prev => {
      const newCompleted = [...prev];
      newCompleted[currentExerciseIndex] = true;
      return newCompleted;
    });
    setIsSubRunning(false);

    const allExercises = getAllExercises();
    if (currentExerciseIndex < allExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      
      // Check if we completed a round
      if (exerciseInfo.section === "main" && exerciseInfo.exerciseInRound === (mainRounds[0]?.exercises.length || 0) - 1) {
        const roundIndex = (exerciseInfo.roundNumber || 1) - 1;
        setMainRounds(prev => {
          const newRounds = [...prev];
          newRounds[roundIndex].completed = true;
          return newRounds;
        });
      }
      
      startCurrentExercise();
    } else {
      handleComplete();
    }
    setIsCompleting(false);
  };

  const handleComplete = async () => {
    setIsTotalRunning(false);
    setCompleted(true);
    
    if (user) {
      try {
        const timeTaken = workout.duration * 60 - totalTimeLeft;
        const completedExercisesCount = completedExercises.filter(Boolean).length;
        const totalExercisesCount = allExercises.length;
        const completionPercentage = (completedExercisesCount / totalExercisesCount) * 100;
        
        // Guardar en user_progress (para compatibilidad)
        await supabase.from("user_progress").insert({
          user_id: user.id,
          workout_id: workout.id,
          completed_at: new Date().toISOString(),
          time_taken: timeTaken,
        });

        // Guardar como workout_session para que aparezca en el dashboard
        const exercisesList = [
          ...warmupExercises.map(ex => ({
            name: ex.name,
            section: "warmup",
            completed: true,
            duration: ex.duration
          })),
          ...getAllExercises().slice(warmupExercises.length).map((ex, idx) => ({
            name: ex.name,
            section: "main",
            round: Math.floor(idx / (mainRounds[0]?.exercises.length || 1)) + 1,
            completed: completedExercises[warmupExercises.length + idx],
            duration: ex.duration
          }))
        ];

        await supabase.from("workout_sessions").insert({
          user_id: user.id,
          title: `${workout.title} (Entrenamiento Diario)`,
          description: workout.description || `Entrenamiento diario completado - ${workout.difficulty} - ${workout.type}`,
          exercises: exercisesList,
          total_time: timeTaken,
          date: new Date().toISOString().split('T')[0],
          completed_at: new Date().toISOString()
        });
        
        console.log("Progreso y sesión guardados exitosamente");
      } catch (error) {
        console.error("Error guardando progreso:", error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!workout) return <div className="text-center py-20">No workout data available.</div>;

  const allExercises = getAllExercises();
  const currentExerciseInfo = getCurrentExerciseInfo();

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
            <div className="flex justify-center items-center mt-4 gap-4">
              <div className="flex items-center">
                <Clock className="w-6 h-6 mr-2 text-primary" />
                <span className="text-xl font-bold">{formatTime(totalTimeLeft)}</span>
              </div>
              {currentExerciseInfo.section === "main" && (
                <Badge variant="outline" className="bg-fitness-orange/20 text-fitness-orange border-fitness-orange">
                  <Target className="w-4 h-4 mr-1" />
                  Ronda {currentExerciseInfo.roundNumber}/4
                </Badge>
              )}
            </div>
            {!isTotalRunning && !completed && (
              <Button onClick={startWorkout} className="mt-4 bg-gradient-primary text-white">
                <Play className="mr-2" /> Iniciar Entrenamiento
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={(currentExerciseIndex / allExercises.length) * 100} className="h-2" />
            
            {/* Warmup Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-primary">Calentamiento</h3>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {warmupExercises.filter((_, idx) => completedExercises[idx]).length}/{warmupExercises.length}
                </Badge>
              </div>
              
              {warmupExercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  className={`p-4 rounded-xl border transition-all ${
                    idx === currentExerciseIndex && !completedExercises[idx] && currentExerciseInfo.section === "warmup"
                      ? "bg-primary/20 border-primary shadow-glow animate-pulse"
                      : completedExercises[idx]
                      ? "bg-green-500/20 border-green-500"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-medium text-lg flex items-center">
                      <TrendingUp className="mr-2 w-5 h-5 text-primary" />
                      {ex.name}
                      {ex.isTimed && ex.duration && (
                        <span className="ml-3 flex items-center text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(ex.duration)}
                        </span>
                      )}
                    </span>
                    {idx === currentExerciseIndex && isTotalRunning && !completedExercises[idx] && currentExerciseInfo.section === "warmup" && (
                      ex.isTimed ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-primary">{formatTime(exerciseTimes[idx])}</span>
                          <Button variant="ghost" size="icon" onClick={() => setIsSubRunning(!isSubRunning)}>
                            {isSubRunning ? <Pause /> : <Play />}
                          </Button>
                          <Button variant="outline" onClick={completeCurrentExercise} disabled={isCompleting}>
                            Completar
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={completeCurrentExercise} className="bg-primary text-white" disabled={isCompleting}>
                          <CheckCircle className="mr-2" /> Completado
                        </Button>
                      )
                    )}
                    {completedExercises[idx] && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Workout Rounds */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-fitness-orange" />
                <h3 className="text-xl font-bold text-fitness-orange">Entrenamiento Principal</h3>
                <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                  {mainRounds.filter(round => round.completed).length}/4 Rondas
                </Badge>
              </div>

              {mainRounds.map((round, roundIndex) => {
                const roundStartIndex = warmupExercises.length + (roundIndex * round.exercises.length);
                
                return (
                  <div key={round.roundNumber} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-fitness-orange" />
                      <span className="font-bold text-fitness-orange">Ronda {round.roundNumber}</span>
                      {round.completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    
                    {round.exercises.map((ex, exerciseIdx) => {
                      const globalIndex = roundStartIndex + exerciseIdx;
                      const isCurrentExercise = globalIndex === currentExerciseIndex && !completedExercises[globalIndex];
                      
                      return (
                        <div
                          key={ex.id}
                          className={`p-4 rounded-xl border transition-all ml-6 ${
                            isCurrentExercise && currentExerciseInfo.section === "main"
                              ? "bg-fitness-orange/20 border-fitness-orange shadow-glow animate-pulse"
                              : completedExercises[globalIndex]
                              ? "bg-green-500/20 border-green-500"
                              : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-medium text-lg flex items-center">
                              <Award className="mr-2 w-5 h-5 text-fitness-orange" />
                              {ex.name}
                              {ex.isTimed && ex.duration && (
                                <span className="ml-3 flex items-center text-sm font-semibold text-fitness-orange bg-fitness-orange/10 px-2 py-1 rounded-full">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {formatTime(ex.duration)}
                                </span>
                              )}
                            </span>
                            {isCurrentExercise && isTotalRunning && currentExerciseInfo.section === "main" && (
                              ex.isTimed ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl font-bold text-fitness-orange">{formatTime(exerciseTimes[globalIndex])}</span>
                                  <Button variant="ghost" size="icon" onClick={() => setIsSubRunning(!isSubRunning)}>
                                    {isSubRunning ? <Pause /> : <Play />}
                                  </Button>
                                  <Button variant="outline" onClick={completeCurrentExercise} disabled={isCompleting}>
                                    Completar
                                  </Button>
                                </div>
                              ) : (
                                <Button onClick={completeCurrentExercise} className="bg-fitness-orange text-white" disabled={isCompleting}>
                                  <CheckCircle className="mr-2" /> Completado
                                </Button>
                              )
                            )}
                            {completedExercises[globalIndex] && (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Authentication Notice for Non-Logged Users */}
            {!user && (
              <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                <LogIn className="h-4 w-4" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  Para guardar tu progreso y hacer seguimiento de tus entrenamientos, 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary underline ml-1"
                    onClick={() => navigate('/auth')}
                  >
                    regístrate e inicia sesión aquí
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {completed && (
              <div className="text-center py-8 animate-fade-in">
                <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold">¡Entrenamiento Completado!</h3>
                <p className="text-muted-foreground mt-2">Tiempo total: {formatTime(workout.duration * 60 - totalTimeLeft)}</p>
                <div className="flex justify-center gap-2 mt-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    Calentamiento: {warmupExercises.length} ejercicios
                  </Badge>
                  <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                    Principal: 4 rondas completadas
                  </Badge>
                </div>
                {user && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ✅ Progreso guardado en tu perfil
                  </p>
                )}
                <div className="flex justify-center gap-3 mt-4">
                  <Button onClick={() => navigate("/")} variant="outline">
                    Volver al Inicio
                  </Button>
                  {user && (
                    <Button onClick={() => navigate("/dashboard")} className="bg-primary">
                      Ver Mi Dashboard
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WorkoutSession;