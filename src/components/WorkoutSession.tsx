import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, Play, Pause, Zap, TrendingUp, Award, RotateCcw, Target, LogIn, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Exercise {
  id: number;
  name: string;
  isTimed: boolean;
  duration?: number;
  sets?: number;
  reps?: string | number;
  notes?: string;
  scaling?: string;
  image_url?: string;
  section: "warmup" | "skill_work" | "main" | "secondary" | "cooldown";
}

interface Round {
  roundNumber: number;
  exercises: Exercise[];
  completed: boolean;
}

interface SecondaryWod {
  time_type: string;
  time_params: { minutes?: number; cap?: number; description: string };
  exercises: Exercise[];
}

const WorkoutSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const workout = location.state?.workout;
  const [totalTimeLeft, setTotalTimeLeft] = useState(workout?.duration * 60 || 45 * 60);
  const [isTotalRunning, setIsTotalRunning] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [exerciseTimes, setExerciseTimes] = useState<number[]>([]);
  const [isSubRunning, setIsSubRunning] = useState(false);
  const [warmupExercises, setWarmupExercises] = useState<Exercise[]>([]);
  const [skillWorkExercises, setSkillWorkExercises] = useState<Exercise[]>([]);
  const [mainRounds, setMainRounds] = useState<Round[]>([]);
  const [secondaryExercises, setSecondaryExercises] = useState<Exercise[]>([]);
  const [cooldownExercises, setCooldownExercises] = useState<Exercise[]>([]);
  const [completed, setCompleted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentSection, setCurrentSection] = useState<"warmup" | "skill_work" | "main" | "secondary" | "cooldown" | "rest">("warmup");
  const [restTimeLeft, setRestTimeLeft] = useState(90); // 90 seconds rest between main rounds
  const [isResting, setIsResting] = useState(false);

  // Define formatTime function
  const formatTime = (seconds: number | undefined): string => {
    if (seconds === undefined || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (workout) {
      try {
        // Parse warmup exercises
        const warmup: Exercise[] = Array.isArray(workout.warmup) ? workout.warmup.map((ex: string, idx: number) =>
          parseExercise(ex, idx, "warmup")
        ) : [];

        // Parse skill work
        const skillWork: Exercise[] = Array.isArray(workout.main_workout?.skill_work) ? workout.main_workout.skill_work.map((ex: string, idx: number) =>
          parseExercise(ex, idx + warmup.length, "skill_work")
        ) : [];

        // Parse main workout exercises
        const mainExercises: Exercise[] = Array.isArray(workout.main_workout?.exercises) ? workout.main_workout.exercises.map((ex: any, idx: number) => ({
          id: idx + warmup.length + skillWork.length,
          name: ex.name || "Unknown Exercise",
          isTimed: false,
          sets: ex.sets || 5,
          reps: ex.reps || "Completar",
          notes: ex.notes,
          scaling: ex.scaling,
          image_url: ex.image_url || "/assets/placeholder-exercise.jpg",
          section: "main" as const,
        })) : [];

        // Create 5 rounds for main workout
        const rounds: Round[] = [];
        for (let i = 0; i < 5; i++) {
          rounds.push({
            roundNumber: i + 1,
            exercises: mainExercises.map(ex => ({
              ...ex,
              id: ex.id + (i * mainExercises.length),
            })),
            completed: false,
          });
        }

        // Parse secondary WOD
        const secondary: Exercise[] = Array.isArray(workout.secondary_wod?.exercises) ? workout.secondary_wod.exercises.map((ex: any, idx: number) => ({
          id: idx + warmup.length + skillWork.length + (5 * mainExercises.length),
          name: ex.name || "Unknown Exercise",
          isTimed: ex.reps === undefined || workout.secondary_wod?.time_type === "EMOM",
          duration: workout.secondary_wod?.time_type === "EMOM" ? 60 : undefined,
          reps: ex.reps,
          notes: ex.notes,
          scaling: ex.scaling,
          image_url: ex.image_url || "/assets/placeholder-exercise.jpg",
          section: "secondary" as const,
        })) : [];

        // Parse cooldown
        const cooldown: Exercise[] = Array.isArray(workout.cooldown) ? workout.cooldown.map((ex: string, idx: number) =>
          parseExercise(ex, idx + warmup.length + skillWork.length + (5 * mainExercises.length) + secondary.length, "cooldown")
        ) : [];

        setWarmupExercises(warmup);
        setSkillWorkExercises(skillWork);
        setMainRounds(rounds);
        setSecondaryExercises(secondary);
        setCooldownExercises(cooldown);

        // Initialize exercise times
        const totalExercises = warmup.length + skillWork.length + (rounds.length * mainExercises.length) + secondary.length + cooldown.length;
        const initialTimes: number[] = [
          ...warmup.map(ex => ex.isTimed && ex.duration ? ex.duration : 0),
          ...skillWork.map(ex => ex.isTimed && ex.duration ? ex.duration : 0),
          ...rounds.flatMap(() => mainExercises.map(ex => ex.isTimed && ex.duration ? ex.duration : 0)),
          ...secondary.map(ex => ex.isTimed && ex.duration ? ex.duration : 0),
          ...cooldown.map(ex => ex.isTimed && ex.duration ? ex.duration : 0),
        ];

        setExerciseTimes(initialTimes);
        setCompletedExercises(new Array(totalExercises).fill(false));

        console.log("Warmup:", warmup);
        console.log("Skill Work:", skillWork);
        console.log("Main Rounds:", rounds);
        console.log("Secondary WOD:", secondary);
        console.log("Cooldown:", cooldown);
        console.log("Initial Times:", initialTimes);
      } catch (error) {
        console.error("Error parsing workout data:", error);
      }
    }
  }, [workout]);

  const parseExercise = (ex: string, id: number, section: "warmup" | "skill_work" | "cooldown"): Exercise => {
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
      image_url: "/assets/placeholder-exercise.jpg",
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
        setExerciseTimes((prev) => {
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimeLeft > 0) {
      interval = setInterval(() => setRestTimeLeft((prev) => prev - 1), 1000);
    } else if (restTimeLeft <= 0 && isResting) {
      setIsResting(false);
      setCurrentSection("main");
      setCurrentExerciseIndex((prev) => prev + 1);
      startCurrentExercise();
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeLeft]);

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
    return [
      ...warmupExercises,
      ...skillWorkExercises,
      ...mainRounds.flatMap((round) => round.exercises),
      ...secondaryExercises,
      ...cooldownExercises,
    ];
  };

  const getCurrentExerciseInfo = () => {
    const allExercises = getAllExercises();
    let sectionOffset = 0;

    if (currentExerciseIndex < warmupExercises.length) {
      return {
        section: "warmup" as const,
        exercise: warmupExercises[currentExerciseIndex],
        roundNumber: null,
        exerciseInRound: null,
      };
    }
    sectionOffset += warmupExercises.length;

    if (currentExerciseIndex < sectionOffset + skillWorkExercises.length) {
      return {
        section: "skill_work" as const,
        exercise: skillWorkExercises[currentExerciseIndex - sectionOffset],
        roundNumber: null,
        exerciseInRound: null,
      };
    }
    sectionOffset += skillWorkExercises.length;

    if (currentExerciseIndex < sectionOffset + (mainRounds.length * mainRounds[0]?.exercises.length)) {
      const mainIndex = currentExerciseIndex - sectionOffset;
      const exercisesPerRound = mainRounds[0]?.exercises.length || 0;
      const roundIndex = Math.floor(mainIndex / exercisesPerRound);
      const exerciseInRound = mainIndex % exercisesPerRound;
      return {
        section: "main" as const,
        exercise: mainRounds[roundIndex]?.exercises[exerciseInRound],
        roundNumber: roundIndex + 1,
        exerciseInRound,
      };
    }
    sectionOffset += mainRounds.length * (mainRounds[0]?.exercises.length || 0);

    if (currentExerciseIndex < sectionOffset + secondaryExercises.length) {
      return {
        section: "secondary" as const,
        exercise: secondaryExercises[currentExerciseIndex - sectionOffset],
        roundNumber: null,
        exerciseInRound: null,
      };
    }
    sectionOffset += secondaryExercises.length;

    return {
      section: "cooldown" as const,
      exercise: cooldownExercises[currentExerciseIndex - sectionOffset],
      roundNumber: null,
      exerciseInRound: null,
    };
  };

  const completeCurrentExercise = () => {
    if (isCompleting || completedExercises[currentExerciseIndex]) return;
    setIsCompleting(true);

    const exerciseInfo = getCurrentExerciseInfo();
    console.log("Completing exercise:", exerciseInfo);

    setCompletedExercises((prev) => {
      const newCompleted = [...prev];
      newCompleted[currentExerciseIndex] = true;
      return newCompleted;
    });
    setIsSubRunning(false);

    const allExercises = getAllExercises();
    if (currentExerciseIndex < allExercises.length - 1) {
      if (exerciseInfo.section === "main" && exerciseInfo.exerciseInRound === (mainRounds[0]?.exercises.length - 1)) {
        const roundIndex = (exerciseInfo.roundNumber || 1) - 1;
        setMainRounds((prev) => {
          const newRounds = [...prev];
          newRounds[roundIndex].completed = true;
          return newRounds;
        });
        if (roundIndex < mainRounds.length - 1) {
          setCurrentSection("rest");
          setIsResting(true);
          setRestTimeLeft(90);
          setIsCompleting(false);
          return;
        }
      }
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSection(allExercises[currentExerciseIndex + 1].section);
      startCurrentExercise();
    } else {
      handleComplete();
    }
    setIsCompleting(false);
  };

  const handleComplete = async () => {
    setIsTotalRunning(false);
    setIsResting(false);
    setCompleted(true);

    if (user) {
      try {
        const timeTaken = workout.duration * 60 - totalTimeLeft;
        const exercisesList = [
          ...warmupExercises.map((ex) => ({
            name: ex.name,
            section: "warmup",
            completed: true,
            duration: ex.duration,
          })),
          ...skillWorkExercises.map((ex) => ({
            name: ex.name,
            section: "skill_work",
            completed: true,
            duration: ex.duration,
          })),
          ...mainRounds.flatMap((round, idx) =>
            round.exercises.map((ex) => ({
              name: ex.name,
              section: "main",
              round: idx + 1,
              completed: completedExercises[mainRounds[0].exercises.length * idx + warmupExercises.length + skillWorkExercises.length],
              duration: ex.duration,
            }))
          ),
          ...secondaryExercises.map((ex) => ({
            name: ex.name,
            section: "secondary",
            completed: true,
            duration: ex.duration,
          })),
          ...cooldownExercises.map((ex) => ({
            name: ex.name,
            section: "cooldown",
            completed: true,
            duration: ex.duration,
          })),
        ];

        await supabase.from("workout_sessions").insert({
          user_id: user.id,
          title: `${workout.title} (Entrenamiento Diario)`,
          description: workout.description || `Entrenamiento diario completado - ${workout.difficulty} - ${workout.type}`,
          exercises: exercisesList,
          total_time: timeTaken,
          date: new Date().toISOString().split("T")[0],
          completed_at: new Date().toISOString(),
        });

        console.log("Session saved successfully");
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }
  };

  if (!workout) {
    console.error("No workout data received. Location state:", location.state);
    return (
      <div className="text-center py-20">
        <p className="text-red-500">No se pudo cargar el entrenamiento. Por favor, regresa a la página principal e intenta de nuevo.</p>
        <Button onClick={() => navigate("/")}>Volver al Inicio</Button>
      </div>
    );
  }

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
                  Ronda {currentExerciseInfo.roundNumber}/5
                </Badge>
              )}
              {currentExerciseInfo.section === "secondary" && (
                <Badge variant="outline" className="bg-fitness-orange/20 text-fitness-orange border-fitness-orange">
                  <Target className="w-4 h-4 mr-1" />
                  EMOM {workout.secondary_wod?.time_params.minutes} min
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

            {/* Rest Timer */}
            {isResting && (
              <div className="p-4 rounded-xl bg-fitness-blue/20 border-fitness-blue animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-fitness-blue flex items-center">
                    <Timer className="w-5 h-5 mr-2" />
                    Descanso entre rondas
                  </span>
                  <span className="text-xl font-bold text-fitness-blue">{formatTime(restTimeLeft)}</span>
                </div>
              </div>
            )}

            {/* Warmup Section */}
            {warmupExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold text-primary">Calentamiento</h3>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {warmupExercises.filter((_, idx) => completedExercises[idx]).length}/{warmupExercises.length}
                  </Badge>
                </div>
                {warmupExercises.map((ex, idx) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    index={idx}
                    isCurrent={idx === currentExerciseIndex && currentExerciseInfo.section === "warmup" && !completedExercises[idx]}
                    isCompleted={completedExercises[idx]}
                    isTotalRunning={isTotalRunning}
                    isSubRunning={isSubRunning}
                    exerciseTime={exerciseTimes[idx]}
                    toggleSubRunning={() => setIsSubRunning(!isSubRunning)}
                    completeExercise={completeCurrentExercise}
                    isCompleting={isCompleting}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Skill Work Section */}
            {skillWorkExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-fitness-blue" />
                  <h3 className="text-xl font-bold text-fitness-blue">Trabajo de Técnica</h3>
                  <Badge variant="secondary" className="bg-fitness-blue/20 text-fitness-blue">
                    {skillWorkExercises.filter((_, idx) => completedExercises[idx + warmupExercises.length]).length}/{skillWorkExercises.length}
                  </Badge>
                </div>
                {skillWorkExercises.map((ex, idx) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    index={idx + warmupExercises.length}
                    isCurrent={idx + warmupExercises.length === currentExerciseIndex && currentExerciseInfo.section === "skill_work" && !completedExercises[idx + warmupExercises.length]}
                    isCompleted={completedExercises[idx + warmupExercises.length]}
                    isTotalRunning={isTotalRunning}
                    isSubRunning={isSubRunning}
                    exerciseTime={exerciseTimes[idx + warmupExercises.length]}
                    toggleSubRunning={() => setIsSubRunning(!isSubRunning)}
                    completeExercise={completeCurrentExercise}
                    isCompleting={isCompleting}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Main Workout Rounds */}
            {mainRounds.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-fitness-orange" />
                  <h3 className="text-xl font-bold text-fitness-orange">Entrenamiento Principal</h3>
                  <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                    {mainRounds.filter(round => round.completed).length}/5 Rondas
                  </Badge>
                </div>
                {mainRounds.map((round, roundIndex) => {
                  const roundStartIndex = warmupExercises.length + skillWorkExercises.length + (roundIndex * round.exercises.length);
                  return (
                    <div key={round.roundNumber} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-fitness-orange" />
                        <span className="font-bold text-fitness-orange">Ronda {round.roundNumber}</span>
                        {round.completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      {round.exercises.map((ex, exerciseIdx) => {
                        const globalIndex = roundStartIndex + exerciseIdx;
                        return (
                          <ExerciseCard
                            key={ex.id}
                            exercise={ex}
                            index={globalIndex}
                            isCurrent={globalIndex === currentExerciseIndex && currentExerciseInfo.section === "main" && !completedExercises[globalIndex]}
                            isCompleted={completedExercises[globalIndex]}
                            isTotalRunning={isTotalRunning}
                            isSubRunning={isSubRunning}
                            exerciseTime={exerciseTimes[globalIndex]}
                            toggleSubRunning={() => setIsSubRunning(!isSubRunning)}
                            completeExercise={completeCurrentExercise}
                            isCompleting={isCompleting}
                            formatTime={formatTime}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Secondary WOD */}
            {secondaryExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-fitness-orange" />
                  <h3 className="text-xl font-bold text-fitness-orange">WOD Secundario (EMOM {workout.secondary_wod?.time_params.minutes} min)</h3>
                  <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                    {secondaryExercises.filter((_, idx) => completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length)]).length}/{secondaryExercises.length}
                  </Badge>
                </div>
                {secondaryExercises.map((ex, idx) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    index={idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length)}
                    isCurrent={idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length) === currentExerciseIndex && currentExerciseInfo.section === "secondary" && !completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length)]}
                    isCompleted={completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length)]}
                    isTotalRunning={isTotalRunning}
                    isSubRunning={isSubRunning}
                    exerciseTime={exerciseTimes[idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length)]}
                    toggleSubRunning={() => setIsSubRunning(!isSubRunning)}
                    completeExercise={completeCurrentExercise}
                    isCompleting={isCompleting}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Cooldown Section */}
            {cooldownExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-fitness-purple" />
                  <h3 className="text-xl font-bold text-fitness-purple">Enfriamiento</h3>
                  <Badge variant="secondary" className="bg-fitness-purple/20 text-fitness-purple">
                    {cooldownExercises.filter((_, idx) => completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length) + secondaryExercises.length]).length}/{cooldownExercises.length}
                  </Badge>
                </div>
                {cooldownExercises.map((ex, idx) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    index={idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length) + secondaryExercises.length}
                    isCurrent={idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length) + secondaryExercises.length === currentExerciseIndex && currentExerciseInfo.section === "cooldown" && !completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length) + secondaryExercises.length]}
                    isCompleted={completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length) + secondaryExercises.length]}
                    isTotalRunning={isTotalRunning}
                    isSubRunning={isSubRunning}
                    exerciseTime={exerciseTimes[idx + warmupExercises.length + skillWorkExercises.length + (mainRounds.length * mainRounds[0].exercises.length) + secondaryExercises.length]}
                    toggleSubRunning={() => setIsSubRunning(!isSubRunning)}
                    completeExercise={completeCurrentExercise}
                    isCompleting={isCompleting}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Authentication Notice */}
            {!user && (
              <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                <LogIn className="h-4 w-4" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  Para guardar tu progreso y hacer seguimiento de tus entrenamientos,
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary underline ml-1"
                    onClick={() => navigate("/auth")}
                  >
                    regístrate e inicia sesión aquí
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Completion Message */}
            {completed && (
              <div className="text-center py-8 animate-fade-in">
                <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold">¡Entrenamiento Completado!</h3>
                <p className="text-muted-foreground mt-2">Tiempo total: {formatTime(workout.duration * 60 - totalTimeLeft)}</p>
                <div className="flex justify-center gap-2 mt-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    Calentamiento: {warmupExercises.length} ejercicios
                  </Badge>
                  {skillWorkExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-blue/20 text-fitness-blue">
                      Técnica: {skillWorkExercises.length} ejercicios
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                    Principal: 5 rondas completadas
                  </Badge>
                  {secondaryExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                      Secundario: {secondaryExercises.length} ejercicios
                    </Badge>
                  )}
                  {cooldownExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-purple/20 text-fitness-purple">
                      Enfriamiento: {cooldownExercises.length} ejercicios
                    </Badge>
                  )}
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

// Componente reutilizable para mostrar ejercicios
const ExerciseCard = ({
  exercise,
  index,
  isCurrent,
  isCompleted,
  isTotalRunning,
  isSubRunning,
  exerciseTime,
  toggleSubRunning,
  completeExercise,
  isCompleting,
  formatTime,
}: {
  exercise: Exercise;
  index: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isTotalRunning: boolean;
  isSubRunning: boolean;
  exerciseTime: number;
  toggleSubRunning: () => void;
  completeExercise: () => void;
  isCompleting: boolean;
  formatTime: (seconds: number | undefined) => string;
}) => {
  const sectionColors = {
    warmup: "primary",
    skill_work: "fitness-blue",
    main: "fitness-orange",
    secondary: "fitness-orange",
    cooldown: "fitness-purple",
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isCurrent ? `bg-${sectionColors[exercise.section]}/20 border-${sectionColors[exercise.section]} shadow-glow animate-pulse` : isCompleted ? "bg-green-500/20 border-green-500" : "bg-muted/50"
      } ${exercise.section === "main" ? "ml-6" : ""}`}
    >
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="flex-1">
          <span className="font-medium text-lg flex items-center">
            {exercise.section === "main" ? <Award className={`mr-2 w-5 h-5 text-${sectionColors[exercise.section]}`} /> : <TrendingUp className={`mr-2 w-5 h-5 text-${sectionColors[exercise.section]}`} />}
            {exercise.name}
            {exercise.isTimed && exercise.duration && (
              <span className={`ml-3 flex items-center text-sm font-semibold text-${sectionColors[exercise.section]} bg-${sectionColors[exercise.section]}/10 px-2 py-1 rounded-full`}>
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(exerciseTime)}
              </span>
            )}
            {!exercise.isTimed && exercise.sets && exercise.reps && (
              <span className={`ml-3 text-sm font-semibold text-${sectionColors[exercise.section]}`}>
                {exercise.sets} sets x {exercise.reps} {exercise.notes ? `(${exercise.notes})` : ""}
              </span>
            )}
          </span>
          {exercise.scaling && (
            <p className="text-muted-foreground text-xs italic mt-1">Scaling: {exercise.scaling}</p>
          )}
          {/* Mostrar imagen solo si no es warmup */}
          {exercise.image_url && exercise.section !== "warmup" && (
            <div className="mt-2 w-full aspect-video max-w-[320px]">
              <img
                src={exercise.image_url}
                alt={`Demostración de ${exercise.name}`}
                className="w-full h-full object-cover rounded-md"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/assets/placeholder-exercise.jpg";
                }}
              />
            </div>
          )}
        </div>
        {isCurrent && isTotalRunning && !isCompleted && (
          exercise.isTimed ? (
            <div className="flex items-center space-x-2">
              <span className={`text-xl font-bold text-${sectionColors[exercise.section]}`}>{formatTime(exerciseTime)}</span>
              <Button variant="ghost" size="icon" onClick={toggleSubRunning}>
                {isSubRunning ? <Pause /> : <Play />}
              </Button>
              <Button variant="outline" onClick={completeExercise} disabled={isCompleting}>
                Completar
              </Button>
            </div>
          ) : (
            <Button onClick={completeExercise} className={`bg-${sectionColors[exercise.section]} text-white`} disabled={isCompleting}>
              <CheckCircle className="mr-2" /> Completado
            </Button>
          )
        )}
        {isCompleted && <CheckCircle className="w-6 h-6 text-green-500" />}
      </div>
    </div>
  );
};

export default WorkoutSession;