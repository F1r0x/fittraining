import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, Play, Pause, Zap, TrendingUp, Award, RotateCcw, Target, LogIn, Timer, SkipForward } from "lucide-react";
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

interface SecondaryWod {
  time_type?: string;
  time_params?: { minutes?: number; cap?: number; description?: string };
  exercises?: Exercise[];
}

const WorkoutSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const workout = location.state?.workout;
  const [totalTimeLeft, setTotalTimeLeft] = useState(workout?.duration * 60 || 45 * 60);
  const [isTotalRunning, setIsTotalRunning] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [exerciseTimes, setExerciseTimes] = useState<number[]>([]);
  const [isSubRunning, setIsSubRunning] = useState(false);
  const [warmupExercises, setWarmupExercises] = useState<Exercise[]>([]);
  const [skillWorkExercises, setSkillWorkExercises] = useState<Exercise[]>([]);
  const [mainExercises, setMainExercises] = useState<Exercise[]>([]);
  const [secondaryExercises, setSecondaryExercises] = useState<Exercise[]>([]);
  const [cooldownExercises, setCooldownExercises] = useState<Exercise[]>([]);
  const [completed, setCompleted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentSection, setCurrentSection] = useState<"warmup" | "skill_work" | "main" | "secondary" | "cooldown" | "rest">("warmup");
  const [restTimeLeft, setRestTimeLeft] = useState(90); // 90 seconds rest between main rounds
  const [isResting, setIsResting] = useState(false);
  const [amrapTimeLeft, setAmrapTimeLeft] = useState(0);
  const [isAmrapRunning, setIsAmrapRunning] = useState(false);
  const [amrapRounds, setAmrapRounds] = useState(0);
  const [isAmrapSection, setIsAmrapSection] = useState(false);

  // Define formatTime function
  const formatTime = (seconds: number | undefined): string => {
    if (seconds === undefined || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (!workout) {
      console.error("No workout data received. Location state:", location.state);
      return;
    }

    // Reset states when a new workout is loaded
    setTotalTimeLeft(workout.duration * 60 || 45 * 60);
    setIsTotalRunning(false);
    setCurrentExerciseIndex(0);
    setCurrentRound(1);
    setExerciseTimes([]);
    setIsSubRunning(false);
    setWarmupExercises([]);
    setSkillWorkExercises([]);
    setMainExercises([]);
    setSecondaryExercises([]);
    setCooldownExercises([]);
    setCompleted(false);
    setCompletedExercises([]);
    setIsCompleting(false);
    setCurrentSection("warmup");
    setRestTimeLeft(90);
    setIsResting(false);
    setAmrapTimeLeft(0);
    setIsAmrapRunning(false);
    setAmrapRounds(0);
    setIsAmrapSection(false);

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
      const main: Exercise[] = Array.isArray(workout.main_workout?.exercises) ? workout.main_workout.exercises.map((ex: any, idx: number) => ({
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

      // Parse secondary WOD
      let secondary: Exercise[] = [];
      let isAmrap = false;
      let amrapDuration = 0;
      
      if (workout.secondary_wod) {
        // Check if it's an AMRAP
        if (workout.secondary_wod.time_type === "AMRAP" && workout.secondary_wod.time_params?.minutes) {
          isAmrap = true;
          amrapDuration = workout.secondary_wod.time_params.minutes * 60;
        }
        
        if (Array.isArray(workout.secondary_wod)) {
          // Handle case where secondary_wod is an array (e.g., "For Time: 20 sit-ups, 30 mountain climbers")
          secondary = workout.secondary_wod.map((ex: string, idx: number) =>
            parseExercise(ex, idx + warmup.length + skillWork.length + main.length, "secondary")
          );
        } else if (workout.secondary_wod.exercises && Array.isArray(workout.secondary_wod.exercises)) {
          // Handle case where secondary_wod is an object with exercises
          secondary = workout.secondary_wod.exercises.map((ex: any, idx: number) => ({
            id: idx + warmup.length + skillWork.length + main.length,
            name: ex.name || "Unknown Exercise",
            isTimed: ex.reps === undefined || (workout.secondary_wod.time_type === "EMOM"),
            duration: workout.secondary_wod.time_type === "EMOM" ? 60 : undefined,
            reps: ex.reps,
            notes: ex.notes,
            scaling: ex.scaling,
            image_url: ex.image_url || "/assets/placeholder-exercise.jpg",
            section: "secondary" as const,
          }));
        }
      }
      
      setIsAmrapSection(isAmrap);
      setAmrapTimeLeft(amrapDuration);

      // Parse cooldown
      const cooldown: Exercise[] = Array.isArray(workout.cooldown) ? workout.cooldown.map((ex: string, idx: number) =>
        parseExercise(ex, idx + warmup.length + skillWork.length + main.length + secondary.length, "cooldown")
      ) : [];

      setWarmupExercises(warmup);
      setSkillWorkExercises(skillWork);
      setMainExercises(main);
      setSecondaryExercises(secondary);
      setCooldownExercises(cooldown);

      // Initialize exercise times
      const totalExercises = warmup.length + skillWork.length + (5 * main.length) + secondary.length + cooldown.length;
      const initialTimes: number[] = [
        ...warmup.map(ex => ex.isTimed && ex.duration ? ex.duration : 0),
        ...skillWork.map(ex => ex.isTimed && ex.duration ? ex.duration : 0),
        ...new Array(5 * main.length).fill(0).map((_, idx) => {
          const baseIdx = idx % main.length;
          return main[baseIdx].isTimed && main[baseIdx].duration ? main[baseIdx].duration : 0;
        }),
        ...secondary.map(ex => ex.isTimed && ex.duration ? ex.duration : 0),
        ...cooldown.map(ex => ex.isTimed && ex.duration ? ex.duration : 0),
      ];

      setExerciseTimes(initialTimes);
      setCompletedExercises(new Array(totalExercises).fill(false));

      console.log("Parsed Workout:", {
        warmup,
        skillWork,
        main,
        secondary,
        cooldown,
        initialTimes,
        totalExercises,
      });
    } catch (error) {
      console.error("Error parsing workout data:", error);
    }
  }, [workout, location.state]);

  const parseExercise = (ex: string, id: number, section: "warmup" | "skill_work" | "cooldown" | "secondary"): Exercise => {
    const lowerEx = ex.toLowerCase().trim();
    const timeMatch = lowerEx.match(/(\d+)\s*(minutos?|segundos?|min|s)/i);
    let duration: number | undefined;
    let isTimed = false;
    let reps: string | number | undefined;

    if (timeMatch) {
      isTimed = true;
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      duration = unit.startsWith("min") ? value * 60 : value;
    } else {
      reps = lowerEx.match(/\d+x?/)?.[0] || "Completar";
    }

    return {
      id,
      name: ex.replace(timeMatch?.[0] || "", "").trim() || ex,
      isTimed,
      duration,
      reps,
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
    }
    return () => clearInterval(interval);
  }, [isSubRunning, currentExerciseIndex, exerciseTimes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimeLeft > 0) {
      interval = setInterval(() => setRestTimeLeft((prev) => prev - 1), 1000);
    } else if (restTimeLeft <= 0 && isResting) {
      setIsResting(false);
      if (currentRound < 5) {
        setCurrentRound((prev) => prev + 1);
        const baseIndex = warmupExercises.length + skillWorkExercises.length;
        setCurrentExerciseIndex(baseIndex + ((currentRound) * mainExercises.length));
        setCurrentSection("main");
        startCurrentExercise();
      } else {
        const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
        setCurrentExerciseIndex(baseIndex);
        setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
        startCurrentExercise();
      }
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeLeft, currentRound, mainExercises.length, secondaryExercises.length, warmupExercises.length, skillWorkExercises.length]);

  // AMRAP timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAmrapRunning && amrapTimeLeft > 0) {
      interval = setInterval(() => setAmrapTimeLeft((prev) => prev - 1), 1000);
    } else if (amrapTimeLeft <= 0 && isAmrapRunning) {
      setIsAmrapRunning(false);
      // Move to cooldown when AMRAP finishes
      const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length;
      setCurrentExerciseIndex(baseIndex);
      setCurrentSection("cooldown");
    }
    return () => clearInterval(interval);
  }, [isAmrapRunning, amrapTimeLeft, warmupExercises.length, skillWorkExercises.length, mainExercises.length, secondaryExercises.length]);

  const startWorkout = () => {
    setIsTotalRunning(true);
    startCurrentExercise();
  };

  const startCurrentExercise = () => {
    const allExercises = getAllExercises();
    const current = allExercises[currentExerciseIndex];
    
    // Check if we're starting the secondary section and it's an AMRAP
    if (currentSection === "secondary" && isAmrapSection && !isAmrapRunning) {
      setIsAmrapRunning(true);
      return;
    }
    
    if (current?.isTimed) {
      setIsSubRunning(true);
    }
  };

  const completeAmrapRound = () => {
    setAmrapRounds(prev => prev + 1);
  };

  const startAmrap = () => {
    setIsAmrapRunning(true);
    setAmrapRounds(0);
  };

  const getAllExercises = (): Exercise[] => {
    const repeatedMain = Array(5).fill(null).flatMap((_, roundIdx) =>
      mainExercises.map(ex => ({
        ...ex,
        id: ex.id + (roundIdx * mainExercises.length),
      }))
    );
    return [
      ...warmupExercises,
      ...skillWorkExercises,
      ...repeatedMain,
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

    if (currentExerciseIndex < sectionOffset + (5 * mainExercises.length)) {
      const mainIndex = currentExerciseIndex - sectionOffset;
      const roundIndex = Math.floor(mainIndex / mainExercises.length) + 1;
      const exerciseInRound = mainIndex % mainExercises.length;
      return {
        section: "main" as const,
        exercise: mainExercises[exerciseInRound],
        roundNumber: roundIndex,
        exerciseInRound,
      };
    }
    sectionOffset += 5 * mainExercises.length;

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
      if (exerciseInfo.section === "main" && exerciseInfo.exerciseInRound === mainExercises.length - 1) {
        if (currentRound < 5) {
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

  const skipRest = () => {
    setIsResting(false);
    if (currentRound < 5) {
      setCurrentRound((prev) => prev + 1);
      const baseIndex = warmupExercises.length + skillWorkExercises.length;
      setCurrentExerciseIndex(baseIndex + ((currentRound) * mainExercises.length));
      setCurrentSection("main");
      startCurrentExercise();
    } else {
      const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
      setCurrentExerciseIndex(baseIndex);
      setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
      startCurrentExercise();
    }
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
          ...mainExercises.flatMap((ex, idx) =>
            new Array(5).fill(null).map((_, round) => ({
              name: ex.name,
              section: "main",
              round: round + 1,
              completed: completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (round * mainExercises.length)],
              duration: ex.duration,
            }))
          ),
          ...secondaryExercises.map((ex) => ({
            name: ex.name,
            section: "secondary",
            completed: true,
            duration: ex.duration,
            amrapRounds: isAmrapSection ? amrapRounds : undefined,
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
                  Ronda {currentRound}/5
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
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-fitness-blue">{formatTime(restTimeLeft)}</span>
                    <Button variant="outline" size="sm" onClick={skipRest}>
                      <SkipForward className="w-4 h-4 mr-1" /> Saltar
                    </Button>
                  </div>
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

            {/* Main Workout */}
            {mainExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-fitness-orange" />
                  <h3 className="text-xl font-bold text-fitness-orange">Entrenamiento Principal</h3>
                  <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                    Ronda {currentRound}/5
                  </Badge>
                </div>
                {mainExercises.map((ex, idx) => {
                  const globalIndex = warmupExercises.length + skillWorkExercises.length + (currentRound - 1) * mainExercises.length + idx;
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
            )}

            {/* Secondary WOD */}
            {secondaryExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-fitness-orange" />
                  <h3 className="text-xl font-bold text-fitness-orange">WOD Secundario ({workout.secondary_wod?.time_type || "For Time"})</h3>
                  {isAmrapSection ? (
                    <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                      Rondas: {amrapRounds}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                      {secondaryExercises.filter((_, idx) => completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length)]).length}/{secondaryExercises.length}
                    </Badge>
                  )}
                </div>
                
                {/* AMRAP specific UI */}
                {isAmrapSection && currentExerciseInfo.section === "secondary" && (
                  <div className="p-6 rounded-xl border-2 border-fitness-orange bg-fitness-orange/10">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <Timer className="w-8 h-8 text-fitness-orange" />
                        <span className="text-4xl font-bold text-fitness-orange">
                          {formatTime(amrapTimeLeft)}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-fitness-orange mb-2">
                        AMRAP - Completa tantas rondas como puedas
                      </p>
                      <p className="text-2xl font-bold text-fitness-orange">
                        Rondas completadas: {amrapRounds}
                      </p>
                    </div>
                    
                    {!isAmrapRunning && amrapTimeLeft > 0 && (
                      <div className="text-center mb-4">
                        <Button 
                          onClick={startAmrap} 
                          className="bg-fitness-orange text-white hover:bg-fitness-orange/80"
                          size="lg"
                        >
                          <Play className="mr-2" /> Iniciar AMRAP
                        </Button>
                      </div>
                    )}
                    
                    {isAmrapRunning && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-center text-fitness-orange">
                          Ejercicios de la ronda:
                        </h4>
                        {secondaryExercises.map((ex, idx) => (
                          <div key={ex.id} className="p-3 rounded border bg-background/50">
                            <div className="font-medium">{ex.name}</div>
                            {ex.reps && (
                              <div className="text-sm text-muted-foreground">{ex.reps} repeticiones</div>
                            )}
                            {ex.notes && (
                              <div className="text-xs text-muted-foreground italic">{ex.notes}</div>
                            )}
                          </div>
                        ))}
                        
                        <div className="text-center pt-4">
                          <Button 
                            onClick={completeAmrapRound}
                            className="bg-green-600 text-white hover:bg-green-700"
                            size="lg"
                            disabled={amrapTimeLeft <= 0}
                          >
                            <CheckCircle className="mr-2" /> Completar Ronda
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {amrapTimeLeft <= 0 && (
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600 mb-4">
                          ¡AMRAP Completado!
                        </p>
                        <p className="text-lg">
                          Total de rondas: <span className="font-bold text-fitness-orange">{amrapRounds}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Regular secondary WOD UI (when not AMRAP or not current section) */}
                {(!isAmrapSection || currentExerciseInfo.section !== "secondary") && 
                  secondaryExercises.map((ex, idx) => {
                    const globalIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + idx;
                    return (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        index={globalIndex}
                        isCurrent={globalIndex === currentExerciseIndex && currentExerciseInfo.section === "secondary" && !completedExercises[globalIndex]}
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
                  })
                }
              </div>
            )}

            {/* Cooldown Section */}
            {cooldownExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-fitness-purple" />
                  <h3 className="text-xl font-bold text-fitness-purple">Enfriamiento</h3>
                  <Badge variant="secondary" className="bg-fitness-purple/20 text-fitness-purple">
                    {cooldownExercises.filter((_, idx) => completedExercises[idx + warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length]).length}/{cooldownExercises.length}
                  </Badge>
                </div>
                {cooldownExercises.map((ex, idx) => {
                  const globalIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length + idx;
                  return (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      index={globalIndex}
                      isCurrent={globalIndex === currentExerciseIndex && currentExerciseInfo.section === "cooldown" && !completedExercises[globalIndex]}
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
                      {isAmrapSection ? `AMRAP: ${amrapRounds} rondas` : `Secundario: ${secondaryExercises.length} ejercicios`}
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
                  <Button onClick={() => navigate("/")}>Volver al Inicio</Button>
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
          {exercise.image_url && exercise.section !== "warmup" && exercise.section !== "cooldown" && (
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