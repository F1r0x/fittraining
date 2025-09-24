import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, Play, Pause, Zap, TrendingUp, Award, RotateCcw, Target, Timer, SkipForward, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WorkoutResultsForm } from "./WorkoutResultsForm";

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

const sectionColors = {
  warmup: "fitness-red",
  skill_work: "fitness-blue",
  main: "fitness-orange",
  secondary: "fitness-orange",
  cooldown: "fitness-blue",
};

const WorkoutSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const workout = location.state?.workout;
  const [totalTimeLeft, setTotalTimeLeft] = useState<number>(workout?.duration * 60 || 45 * 60);
  const [isTotalRunning, setIsTotalRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [exerciseTimes, setExerciseTimes] = useState<number[]>([]);
  const [isSubRunning, setIsSubRunning] = useState<boolean>(false);
  const [warmupExercises, setWarmupExercises] = useState<Exercise[]>([]);
  const [skillWorkExercises, setSkillWorkExercises] = useState<Exercise[]>([]);
  const [mainExercises, setMainExercises] = useState<Exercise[]>([]);
  const [secondaryExercises, setSecondaryExercises] = useState<Exercise[]>([]);
  const [cooldownExercises, setCooldownExercises] = useState<Exercise[]>([]);
  const [completed, setCompleted] = useState<boolean>(false);
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([]);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<"warmup" | "skill_work" | "main" | "secondary" | "cooldown" | "rest">("warmup");
  const [restTimeLeft, setRestTimeLeft] = useState<number>(90);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [amrapTimeLeft, setAmrapTimeLeft] = useState<number>(0);
  const [isAmrapRunning, setIsAmrapRunning] = useState<boolean>(false);
  const [amrapRounds, setAmrapRounds] = useState<number>(0);
  const [isAmrapSection, setIsAmrapSection] = useState<boolean>(false);
  const [mainWorkoutTimeLeft, setMainWorkoutTimeLeft] = useState<number>(0);
  const [isMainWorkoutRunning, setIsMainWorkoutRunning] = useState<boolean>(false);
  const [currentMainRound, setCurrentMainRound] = useState<number>(1);
  const [showResultsForm, setShowResultsForm] = useState<boolean>(false);
  const [actualMainWodTime, setActualMainWodTime] = useState<number>(0);
  const [actualSecondaryWodTime, setActualSecondaryWodTime] = useState<number>(0);

  // Formato de tiempo
  const formatTime = useCallback((seconds: number | undefined): string => {
    if (seconds === undefined || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }, []);

  // Parseo de ejercicios desde daily_workouts
  const parseExercise = useCallback((ex: any, idx: number, section: Exercise["section"]): Exercise => {
    if (typeof ex === "string") {
      const isTimed = ex.includes("min") || ex.includes("seg");
      const durationMatch = ex.match(/(\d+)\s*(min|seg)/);
      const duration = durationMatch ? (durationMatch[2] === "min" ? parseInt(durationMatch[1]) * 60 : parseInt(durationMatch[1])) : undefined;
      const repsMatch = ex.match(/(\d+)\s*reps/);
      const reps = repsMatch ? parseInt(repsMatch[1]) : undefined;
      return {
        id: idx,
        name: ex.split(" - ")[0].trim() || ex,
        isTimed,
        duration,
        reps,
        sets: duration ? undefined : 1,
        notes: ex.includes(" - ") ? ex.split(" - ")[1] : undefined,
        section,
      };
    }
    return {
      id: idx,
      name: String(ex.name || "Ejercicio desconocido"),
      isTimed: ex.duration !== undefined || ex.time_type === "For Time",
      duration: ex.duration,
      sets: ex.sets,
      reps: ex.reps,
      notes: ex.notes,
      scaling: ex.scaling,
      image_url: ex.image_url,
      section,
    };
  }, []);

  // Obtener todos los ejercicios
  const getAllExercises = useCallback(() => {
    const repeatedMain = Array(5).fill(null).flatMap((_, roundIdx) =>
      mainExercises.map((ex) => ({
        ...ex,
        id: ex.id + roundIdx * mainExercises.length,
      }))
    );
    return [
      ...warmupExercises,
      ...skillWorkExercises,
      ...repeatedMain,
      ...secondaryExercises,
      ...cooldownExercises,
    ];
  }, [warmupExercises, skillWorkExercises, mainExercises, secondaryExercises, cooldownExercises]);

  // Cargar ejercicios y estado inicial
  useEffect(() => {
    if (!workout) return;

    try {
      const warmup = Array.isArray(workout.warmup?.exercises || workout.warmup)
        ? (workout.warmup.exercises || workout.warmup).map((ex: any, idx: number) => parseExercise(ex, idx, "warmup"))
        : [];
      const skillWork = Array.isArray(workout.warmup?.skill_work)
        ? workout.warmup.skill_work.map((ex: any, idx: number) => parseExercise(ex, idx, "skill_work"))
        : [];
      const main = Array.isArray(workout.main_workout?.exercises)
        ? workout.main_workout.exercises.map((ex: any, idx: number) => parseExercise(ex, idx, "main"))
        : [];
      const secondary = Array.isArray(workout.secondary_wod?.exercises)
        ? workout.secondary_wod.exercises.map((ex: any, idx: number) => parseExercise(ex, idx, "secondary"))
        : [];
      const cooldown = Array.isArray(workout.cooldown?.exercises || workout.cooldown)
        ? (workout.cooldown.exercises || workout.cooldown).map((ex: any, idx: number) => parseExercise(ex, idx, "cooldown"))
        : [];

      setWarmupExercises(warmup);
      setSkillWorkExercises(skillWork);
      setMainExercises(main);
      setSecondaryExercises(secondary);
      setCooldownExercises(cooldown);

      const totalExercises = warmup.length + skillWork.length + (5 * main.length) + secondary.length + cooldown.length;
      setExerciseTimes(new Array(totalExercises).fill(0).map((_, i) => {
        const ex = [...warmup, ...skillWork, ...Array(5).fill(main).flat(), ...secondary, ...cooldown][i];
        return ex?.duration || 0;
      }));
      setCompletedExercises(new Array(totalExercises).fill(false));

      setTotalTimeLeft(workout.duration * 60 || 45 * 60);
      setAmrapTimeLeft(workout.secondary_wod?.time_params?.minutes ? workout.secondary_wod.time_params.minutes * 60 : 0);
      setMainWorkoutTimeLeft(workout.main_workout?.time_params?.minutes ? workout.main_workout.time_params.minutes * 60 : 20 * 60);
      setIsAmrapSection(workout.secondary_wod?.time_type === "AMRAP");
    } catch (error) {
      console.error("Error parsing workout:", error);
    }
  }, [workout, parseExercise]);

  // Cargar progreso desde localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`workoutProgress_${workout?.id}`);
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setCurrentExerciseIndex(parsed.currentExerciseIndex || 0);
      setCurrentRound(parsed.currentRound || 1);
      setExerciseTimes(parsed.exerciseTimes || []);
      setCompletedExercises(parsed.completedExercises || []);
      setIsTotalRunning(parsed.isTotalRunning || false);
      setCurrentSection(parsed.currentSection || "warmup");
      setRestTimeLeft(parsed.restTimeLeft || 90);
      setIsResting(parsed.isResting || false);
      setAmrapTimeLeft(parsed.amrapTimeLeft || 0);
      setIsAmrapRunning(parsed.isAmrapRunning || false);
      setAmrapRounds(parsed.amrapRounds || 0);
      setIsAmrapSection(parsed.isAmrapSection || false);
      setMainWorkoutTimeLeft(parsed.mainWorkoutTimeLeft || 0);
      setIsMainWorkoutRunning(parsed.isMainWorkoutRunning || false);
      setCurrentMainRound(parsed.currentMainRound || 1);
    }
  }, [workout?.id]);

  // Guardar progreso en localStorage
  useEffect(() => {
    if (!completed && workout?.id) {
      localStorage.setItem(`workoutProgress_${workout.id}`, JSON.stringify({
        currentExerciseIndex,
        currentRound,
        exerciseTimes,
        completedExercises,
        isTotalRunning,
        currentSection,
        restTimeLeft,
        isResting,
        amrapTimeLeft,
        isAmrapRunning,
        amrapRounds,
        isAmrapSection,
        mainWorkoutTimeLeft,
        isMainWorkoutRunning,
        currentMainRound,
      }));
    } else if (completed) {
      localStorage.removeItem(`workoutProgress_${workout.id}`);
    }
  }, [currentExerciseIndex, currentRound, exerciseTimes, completedExercises, isTotalRunning, currentSection, restTimeLeft, isResting, amrapTimeLeft, isAmrapRunning, amrapRounds, isAmrapSection, mainWorkoutTimeLeft, isMainWorkoutRunning, currentMainRound, completed, workout?.id]);

  // Completar entrenamiento
  const handleComplete = useCallback(async () => {
    setIsTotalRunning(false);
    setIsResting(false);
    setIsAmrapRunning(false);
    setIsMainWorkoutRunning(false);
    setCompleted(true);
    setShowResultsForm(true);

    if (user) {
      try {
        const timeTaken = workout.duration * 60 - totalTimeLeft;
        const exercisesList = getAllExercises().map((ex, idx) => ({
          name: ex.name,
          section: ex.section,
          duration: ex.isTimed ? exerciseTimes[idx] : undefined,
          completed: completedExercises[idx],
          round: ex.section === "main" ? Math.floor((idx - warmupExercises.length - skillWorkExercises.length) / mainExercises.length) + 1 : undefined,
        }));

        await supabase.from("workout_sessions").insert({
          user_id: user.id,
          title: `${workout.title} (Entrenamiento Diario)`,
          description: workout.description || `Entrenamiento diario completado - ${workout.difficulty} - ${workout.type}`,
          exercises: exercisesList,
          total_time: timeTaken,
          date: new Date().toISOString().split("T")[0],
          completed_at: new Date().toISOString(),
        });

        await supabase.from("user_progress").insert({
          user_id: user.id,
          workout_id: workout.id,
          time_taken: timeTaken,
          completed_at: new Date().toISOString(),
        });

        console.log("Session and progress saved successfully");
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }
  }, [user, workout, totalTimeLeft, getAllExercises, exerciseTimes, completedExercises, warmupExercises.length, skillWorkExercises.length, mainExercises.length]);

  // Temporizadores consolidados
  useEffect(() => {
    if (isPaused || (!isTotalRunning && !isSubRunning && !isResting && !isAmrapRunning && !isMainWorkoutRunning)) return;

    const interval = setInterval(() => {
      if (isTotalRunning && totalTimeLeft > 0) {
        setTotalTimeLeft((prev) => prev - 1);
        if (totalTimeLeft <= 1) handleComplete();
      }
      if (isSubRunning && exerciseTimes[currentExerciseIndex] > 0) {
        setExerciseTimes((prev) => {
          const newTimes = [...prev];
          newTimes[currentExerciseIndex] -= 1;
          return newTimes;
        });
        if (exerciseTimes[currentExerciseIndex] <= 1) setIsSubRunning(false);
      }
      if (isResting && restTimeLeft > 0) {
        setRestTimeLeft((prev) => prev - 1);
        if (restTimeLeft <= 1) skipRest();
      }
      if (isAmrapRunning && amrapTimeLeft > 0) {
        setAmrapTimeLeft((prev) => prev - 1);
        if (amrapTimeLeft <= 1) {
          const initialTime = workout.secondary_wod?.time_params?.minutes ? (workout.secondary_wod.time_params.minutes * 60) : 0;
          setActualSecondaryWodTime(initialTime);
          setIsAmrapRunning(false);
          const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length;
          setCurrentExerciseIndex(baseIndex);
          setCurrentSection("cooldown");
        }
      }
      if (isMainWorkoutRunning && mainWorkoutTimeLeft > 0) {
        setMainWorkoutTimeLeft((prev) => prev - 1);
        if (mainWorkoutTimeLeft <= 1) {
          const initialTime = workout.main_workout?.time_params?.minutes ? (workout.main_workout.time_params.minutes * 60) : (20 * 60);
          setActualMainWodTime(initialTime);
          setIsMainWorkoutRunning(false);
          const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
          setCurrentExerciseIndex(baseIndex);
          setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isTotalRunning, isSubRunning, isResting, isAmrapRunning, isMainWorkoutRunning, totalTimeLeft, exerciseTimes, restTimeLeft, amrapTimeLeft, mainWorkoutTimeLeft, currentExerciseIndex, currentRound, workout, skipRest, handleComplete]);

  // Funciones optimizadas
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const newPaused = !prev;
      setIsTotalRunning(!newPaused);
      setIsSubRunning(!newPaused && getAllExercises()[currentExerciseIndex]?.isTimed);
      setIsResting(!newPaused && isResting);
      setIsAmrapRunning(!newPaused && isAmrapSection);
      setIsMainWorkoutRunning(!newPaused && currentSection === "main");
      return newPaused;
    });
  }, [getAllExercises, currentExerciseIndex, isResting, isAmrapSection, currentSection]);

  const startWorkout = useCallback(() => {
    setIsTotalRunning(true);
    startCurrentExercise();
  }, [startCurrentExercise]);

  const startCurrentExercise = useCallback(() => {
    const current = getAllExercises()[currentExerciseIndex];
    if (!current) return;

    if (currentSection === "secondary" && isAmrapSection && !isAmrapRunning) {
      setIsAmrapRunning(true);
      return;
    }

    if (current.isTimed) {
      setIsSubRunning(true);
    } else if (currentSection === "warmup" || currentSection === "cooldown") {
      setTimeout(() => completeCurrentExercise(), 2000);
    }
  }, [getAllExercises, currentExerciseIndex, currentSection, isAmrapSection, isAmrapRunning, completeCurrentExercise]);

  const completeCurrentExercise = useCallback(() => {
    if (isCompleting || completedExercises[currentExerciseIndex]) return;

    setIsCompleting(true);
    setCompletedExercises((prev) => {
      const newCompleted = [...prev];
      newCompleted[currentExerciseIndex] = true;
      return newCompleted;
    });
    setIsSubRunning(false);

    const allExercises = getAllExercises();
    if (currentExerciseIndex < allExercises.length - 1) {
      const exerciseInfo = getCurrentExerciseInfo();
      if (exerciseInfo.section === "main" && exerciseInfo.exerciseInRound === mainExercises.length - 1 && currentRound < 5) {
        setIsResting(true);
        setRestTimeLeft(90);
        setIsCompleting(false);
        return;
      }
      setCurrentExerciseIndex((prev) => prev + 1);
      let sectionOffset = warmupExercises.length;
      if (currentExerciseIndex + 1 < sectionOffset) {
        setCurrentSection("warmup");
      } else if (currentExerciseIndex + 1 < sectionOffset + skillWorkExercises.length) {
        setCurrentSection("skill_work");
      } else if (currentExerciseIndex + 1 < sectionOffset + skillWorkExercises.length + (5 * mainExercises.length)) {
        setCurrentSection("main");
        setCurrentRound(Math.floor((currentExerciseIndex + 1 - sectionOffset - skillWorkExercises.length) / mainExercises.length) + 1);
      } else if (currentExerciseIndex + 1 < sectionOffset + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length) {
        setCurrentSection("secondary");
      } else {
        setCurrentSection("cooldown");
      }
      startCurrentExercise();
    } else {
      handleComplete();
    }
    setIsCompleting(false);
  }, [isCompleting, completedExercises, currentExerciseIndex, getAllExercises, getCurrentExerciseInfo, mainExercises.length, currentRound, startCurrentExercise, handleComplete, warmupExercises.length, skillWorkExercises.length, secondaryExercises.length]);

  const skipRest = useCallback(() => {
    setIsResting(false);
    if (currentRound < 5) {
      setCurrentRound((prev) => prev + 1);
      const baseIndex = warmupExercises.length + skillWorkExercises.length;
      setCurrentExerciseIndex(baseIndex + (currentRound * mainExercises.length));
      setCurrentSection("main");
      startCurrentExercise();
    } else {
      const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
      setCurrentExerciseIndex(baseIndex);
      setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
      startCurrentExercise();
    }
  }, [currentRound, mainExercises.length, warmupExercises.length, skillWorkExercises.length, secondaryExercises.length, startCurrentExercise]);

  const completeMainRound = useCallback(() => {
    if (!isMainWorkoutRunning || mainWorkoutTimeLeft <= 0) return;
    setCurrentMainRound((prev) => prev + 1);
    if (currentMainRound + 1 > 5) {
      finishMainWorkoutEarly();
    }
  }, [isMainWorkoutRunning, mainWorkoutTimeLeft, currentMainRound, finishMainWorkoutEarly]);

  const finishMainWorkoutEarly = useCallback(() => {
    if (!isMainWorkoutRunning) return;
    const initialTime = workout.main_workout?.time_params?.minutes ? (workout.main_workout.time_params.minutes * 60) : (20 * 60);
    setActualMainWodTime(initialTime - mainWorkoutTimeLeft);
    setIsMainWorkoutRunning(false);
    setMainWorkoutTimeLeft(0);
    const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
    setCurrentExerciseIndex(baseIndex);
    setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
    startCurrentExercise();
  }, [isMainWorkoutRunning, mainWorkoutTimeLeft, workout, warmupExercises.length, skillWorkExercises.length, mainExercises.length, secondaryExercises.length, startCurrentExercise]);

  const startMainWorkout = useCallback(() => {
    setIsMainWorkoutRunning(true);
    setCurrentMainRound(1);
  }, []);

  const completeAmrapRound = useCallback(() => {
    if (!isAmrapRunning || amrapTimeLeft <= 0) return;
    setAmrapRounds((prev) => prev + 1);
  }, [isAmrapRunning, amrapTimeLeft]);

  const finishAmrapEarly = useCallback(() => {
    if (!isAmrapRunning) return;
    const initialTime = workout.secondary_wod?.time_params?.minutes ? (workout.secondary_wod.time_params.minutes * 60) : 0;
    setActualSecondaryWodTime(initialTime - amrapTimeLeft);
    setIsAmrapRunning(false);
    setAmrapTimeLeft(0);
    const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length;
    setCurrentExerciseIndex(baseIndex);
    setCurrentSection("cooldown");
    startCurrentExercise();
  }, [isAmrapRunning, amrapTimeLeft, workout, warmupExercises.length, skillWorkExercises.length, mainExercises.length, secondaryExercises.length, startCurrentExercise]);

  const startAmrap = useCallback(() => {
    setIsAmrapRunning(true);
    setAmrapRounds(0);
  }, []);

  const getCurrentExerciseInfo = useMemo(() => {
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

    if (currentExerciseIndex < sectionOffset + 5 * mainExercises.length) {
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
  }, [currentExerciseIndex, warmupExercises, skillWorkExercises, mainExercises, secondaryExercises, cooldownExercises]);

  const allExercises = useMemo(() => getAllExercises(), [getAllExercises]);

  if (!workout) {
    return (
      <section className="bg-gradient-hero relative overflow-y-auto min-h-screen pt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <Alert variant="destructive">
            <AlertDescription>
              No se pudo cargar el entrenamiento. Por favor, regresa a la página principal e intenta de nuevo.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/")} className="mt-4">
            Volver al Inicio
          </Button>
        </div>
      </section>
    );
  }

  // Componente ExerciseCard
  const ExerciseCard = ({
    exercise,
    index,
    isCurrent,
    isCompleted,
    isSubRunning,
    exerciseTime,
    completeExercise,
    isCompleting,
  }: {
    exercise: Exercise;
    index: number;
    isCurrent: boolean;
    isCompleted: boolean;
    isSubRunning: boolean;
    exerciseTime: number;
    completeExercise: () => void;
    isCompleting: boolean;
  }) => {
    return (
      <div
        className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
          isCurrent
            ? `bg-${sectionColors[exercise.section]}/20 border-${sectionColors[exercise.section]} shadow-glow animate-pulse`
            : isCompleted
            ? "bg-green-500/20 border-green-500"
            : "bg-muted/50"
        } ${exercise.section === "main" ? "ml-3 sm:ml-6" : ""}`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex-1">
            <h3 className="font-semibold text-sm sm:text-base">{exercise.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {exercise.sets && `Series: ${exercise.sets} | `}
              {exercise.reps && `Reps: ${exercise.reps}`}
              {exercise.duration && ` | Duración: ${formatTime(exerciseTime)}`}
              {exercise.notes && ` | Notas: ${exercise.notes}`}
            </p>
            {exercise.scaling && (
              <p className="text-xs text-muted-foreground mt-1">Escalado: {exercise.scaling}</p>
            )}
          </div>
          {isCurrent && !isCompleted && (
            <div className="flex gap-2 mt-2 sm:mt-0">
              {exercise.isTimed && (
                <Button
                  onClick={() => setIsSubRunning((prev) => !prev)}
                  variant="outline"
                  size="sm"
                  disabled={isCompleting}
                  aria-label={isSubRunning ? `Pausar ${exercise.name}` : `Iniciar ${exercise.name}`}
                >
                  {isSubRunning ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  {isSubRunning ? "Pausar" : "Iniciar"}
                </Button>
              )}
              <Button
                onClick={completeExercise}
                className={`bg-${sectionColors[exercise.section]} text-white text-xs sm:text-sm`}
                disabled={isCompleting}
                size="sm"
                aria-label={`Completar ${exercise.name}`}
              >
                <CheckCircle className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
                Completado
              </Button>
            </div>
          )}
        </div>
        {exercise.image_url && (
          <div className="mt-2 flex justify-center">
            <div className="w-full aspect-video max-w-[280px] sm:max-w-[320px]">
              <img
                src={exercise.image_url}
                alt={`Demostración de ${exercise.name}`}
                className="w-full h-full object-cover rounded-md mx-auto"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/assets/placeholder-exercise.jpg";
                }}
              />
            </div>
          </div>
        )}
        {exercise.scaling && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 text-xs sm:text-sm"
            onClick={() => navigate("/exercise-library", { state: { exerciseName: exercise.name } })}
            aria-label={`Ver detalles de escalado para ${exercise.name}`}
          >
            <Search className="w-3 h-3 mr-1" />
            Ver en Biblioteca
          </Button>
        )}
      </div>
    );
  };

  return (
    <section className="bg-gradient-hero relative overflow-y-auto min-h-screen pt-16">
      <div className="absolute inset-0 bg-gradient-glow opacity-20"></div>
      <div className="container mx-auto px-2 sm:px-4 relative z-10 max-w-4xl py-4 sm:py-8">
        <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-intense">
          <CardHeader className="text-center px-4 py-4 sm:py-6">
            <CardTitle className="text-2xl sm:text-3xl font-black bg-gradient-primary bg-clip-text text-transparent">
              {workout.title}
            </CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground">{workout.description}</p>
            <div className="flex flex-col sm:flex-row justify-center items-center mt-4 gap-2 sm:gap-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary" />
                <span className="text-lg sm:text-xl font-bold">{formatTime(totalTimeLeft)}</span>
              </div>
              {currentSection === "main" && (
                <Badge
                  variant="outline"
                  className="bg-fitness-orange/20 text-fitness-orange border-fitness-orange text-xs sm:text-sm"
                >
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Ronda {currentRound}/5
                </Badge>
              )}
              {isAmrapSection && isAmrapRunning && (
                <Badge
                  variant="outline"
                  className="bg-primary/20 text-primary border-primary text-xs sm:text-sm"
                >
                  <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  AMRAP: {formatTime(amrapTimeLeft)} (Rondas: {amrapRounds})
                </Badge>
              )}
            </div>
            {!isTotalRunning && !completed && (
              <Button
                onClick={startWorkout}
                className="mt-4 bg-gradient-primary text-white text-sm sm:text-base"
                aria-label="Iniciar entrenamiento"
              >
                <Play className="mr-2 w-4 h-4" />
                Iniciar Entrenamiento
              </Button>
            )}
            {isTotalRunning && !completed && (
              <Button
                onClick={togglePause}
                className="mt-4 bg-gradient-primary text-white text-sm sm:text-base"
                variant={isPaused ? "default" : "outline"}
                aria-label={isPaused ? "Reanudar entrenamiento" : "Pausar entrenamiento"}
              >
                {isPaused ? <Play className="mr-2 w-4 h-4" /> : <Pause className="mr-2 w-4 h-4" />}
                {isPaused ? "Reanudar" : "Pausar"}
              </Button>
            )}
            {isResting && (
              <Button
                onClick={skipRest}
                className="mt-4 bg-fitness-blue text-white text-sm sm:text-base"
                aria-label="Saltar descanso"
              >
                <SkipForward className="mr-2 w-4 h-4" />
                Saltar Descanso ({formatTime(restTimeLeft)})
              </Button>
            )}
            {isAmrapRunning && (
              <Button
                onClick={completeAmrapRound}
                className="mt-4 bg-fitness-orange text-white text-sm sm:text-base"
                aria-label="Completar ronda AMRAP"
              >
                <CheckCircle className="mr-2 w-4 h-4" />
                Completar Ronda AMRAP
              </Button>
            )}
            {isAmrapRunning && (
              <Button
                onClick={finishAmrapEarly}
                variant="outline"
                className="mt-4 text-sm sm:text-base"
                aria-label="Finalizar AMRAP antes"
              >
                <RotateCcw className="mr-2 w-4 h-4" />
                Finalizar AMRAP
              </Button>
            )}
            {isMainWorkoutRunning && (
              <Button
                onClick={finishMainWorkoutEarly}
                variant="outline"
                className="mt-4 text-sm sm:text-base"
                aria-label="Finalizar entrenamiento principal antes"
              >
                <RotateCcw className="mr-2 w-4 h-4" />
                Finalizar WOD Principal
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 py-4 sm:py-6">
            <Progress value={(currentExerciseIndex / allExercises.length) * 100} className="h-2" />
            {isResting ? (
              <div className="text-center animate-fade-in">
                <h3 className="text-lg sm:text-xl font-semibold text-fitness-blue">Descanso</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Tiempo restante: {formatTime(restTimeLeft)}
                </p>
              </div>
            ) : (
              <>
                {warmupExercises.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg sm:text-xl font-semibold text-fitness-red">Calentamiento</h3>
                    {warmupExercises.map((exercise, idx) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        index={idx}
                        isCurrent={currentExerciseIndex === idx && currentSection === "warmup"}
                        isCompleted={completedExercises[idx]}
                        isSubRunning={isSubRunning && currentExerciseIndex === idx}
                        exerciseTime={exerciseTimes[idx]}
                        completeExercise={completeCurrentExercise}
                        isCompleting={isCompleting}
                      />
                    ))}
                    <Badge
                      variant="outline"
                      className="bg-fitness-red/20 text-fitness-red border-fitness-red"
                    >
                      Progreso: {warmupExercises.filter((_, i) => completedExercises[i]).length}/{warmupExercises.length}
                    </Badge>
                  </div>
                )}
                {skillWorkExercises.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg sm:text-xl font-semibold text-fitness-blue">Trabajo Técnico</h3>
                    {skillWorkExercises.map((exercise, idx) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        index={idx + warmupExercises.length}
                        isCurrent={currentExerciseIndex === idx + warmupExercises.length && currentSection === "skill_work"}
                        isCompleted={completedExercises[idx + warmupExercises.length]}
                        isSubRunning={isSubRunning && currentExerciseIndex === idx + warmupExercises.length}
                        exerciseTime={exerciseTimes[idx + warmupExercises.length]}
                        completeExercise={completeCurrentExercise}
                        isCompleting={isCompleting}
                      />
                    ))}
                    <Badge
                      variant="outline"
                      className="bg-fitness-blue/20 text-fitness-blue border-fitness-blue"
                    >
                      Progreso: {skillWorkExercises.filter((_, i) => completedExercises[i + warmupExercises.length]).length}/{skillWorkExercises.length}
                    </Badge>
                  </div>
                )}
                {mainExercises.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg sm:text-xl font-semibold text-fitness-orange">Entrenamiento Principal (For Time)</h3>
                    {mainExercises.map((exercise, idx) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={{ ...exercise, section: "main" }}
                        index={warmupExercises.length + skillWorkExercises.length + idx}
                        isCurrent={currentExerciseIndex >= warmupExercises.length + skillWorkExercises.length && currentExerciseIndex < warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length && currentSection === "main"}
                        isCompleted={completedExercises[warmupExercises.length + skillWorkExercises.length + idx]}
                        isSubRunning={isSubRunning && currentExerciseIndex === warmupExercises.length + skillWorkExercises.length + idx}
                        exerciseTime={exerciseTimes[warmupExercises.length + skillWorkExercises.length + idx]}
                        completeExercise={completeCurrentExercise}
                        isCompleting={isCompleting}
                      />
                    ))}
                    <Badge
                      variant="outline"
                      className="bg-fitness-orange/20 text-fitness-orange border-fitness-orange"
                    >
                      Progreso: {mainExercises.filter((_, i) => completedExercises[i + warmupExercises.length + skillWorkExercises.length]).length}/{mainExercises.length * 5}
                    </Badge>
                    {currentSection === "main" && (
                      <Button
                        onClick={completeMainRound}
                        className="bg-fitness-orange text-white"
                        aria-label="Completar ronda principal"
                      >
                        <CheckCircle className="mr-2 w-4 h-4" />
                        Completar Ronda
                      </Button>
                    )}
                  </div>
                )}
                {secondaryExercises.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg sm:text-xl font-semibold text-fitness-orange">WOD Secundario (AMRAP)</h3>
                    {secondaryExercises.map((exercise, idx) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        index={warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + idx}
                        isCurrent={currentExerciseIndex >= warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length && currentExerciseIndex < warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + secondaryExercises.length && currentSection === "secondary"}
                        isCompleted={completedExercises[warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + idx]}
                        isSubRunning={isSubRunning && currentExerciseIndex === warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + idx}
                        exerciseTime={exerciseTimes[warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + idx]}
                        completeExercise={completeCurrentExercise}
                        isCompleting={isCompleting}
                      />
                    ))}
                    <Badge
                      variant="outline"
                      className="bg-fitness-orange/20 text-fitness-orange border-fitness-orange"
                    >
                      Progreso: {secondaryExercises.filter((_, i) => completedExercises[i + warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length]).length}/{secondaryExercises.length}
                    </Badge>
                  </div>
                )}
                {cooldownExercises.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg sm:text-xl font-semibold text-fitness-blue">Enfriamiento</h3>
                    {cooldownExercises.map((exercise, idx) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        index={warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + secondaryExercises.length + idx}
                        isCurrent={currentExerciseIndex >= warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + secondaryExercises.length && currentSection === "cooldown"}
                        isCompleted={completedExercises[warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + secondaryExercises.length + idx]}
                        isSubRunning={isSubRunning && currentExerciseIndex === warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + secondaryExercises.length + idx}
                        exerciseTime={exerciseTimes[warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + secondaryExercises.length + idx]}
                        completeExercise={completeCurrentExercise}
                        isCompleting={isCompleting}
                      />
                    ))}
                    <Badge
                      variant="outline"
                      className="bg-fitness-blue/20 text-fitness-blue border-fitness-blue"
                    >
                      Progreso: {cooldownExercises.filter((_, i) => completedExercises[i + warmupExercises.length + skillWorkExercises.length + 5 * mainExercises.length + secondaryExercises.length]).length}/{cooldownExercises.length}
                    </Badge>
                  </div>
                )}
              </>
            )}
            {showResultsForm && (
              <WorkoutResultsForm
                workout={workout}
                totalTime={workout.duration * 60 - totalTimeLeft}
                completedExercises={allExercises.map((ex, idx) => ({
                  ...ex,
                  completed: completedExercises[idx],
                  duration: exerciseTimes[idx],
                }))}
                onClose={() => setShowResultsForm(false)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WorkoutSession;