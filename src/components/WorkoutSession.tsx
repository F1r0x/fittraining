import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, Play, Pause, Zap, TrendingUp, Award, RotateCcw, Target, Timer, SkipForward, Search, BarChart3, Plus } from "lucide-react";
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

  // Get current exercise info
  const getCurrentExerciseInfo = useCallback(() => {
    const allExercises = getAllExercises();
    if (currentExerciseIndex >= allExercises.length) return null;
    
    let sectionOffset = 0;
    if (currentExerciseIndex < warmupExercises.length) {
      return {
        section: "warmup",
        exercise: warmupExercises[currentExerciseIndex],
        roundNumber: null,
        exerciseInRound: currentExerciseIndex,
      };
    }
    
    sectionOffset += warmupExercises.length;
    if (currentExerciseIndex < sectionOffset + skillWorkExercises.length) {
      return {
        section: "skill_work",
        exercise: skillWorkExercises[currentExerciseIndex - sectionOffset],
        roundNumber: null,
        exerciseInRound: currentExerciseIndex - sectionOffset,
      };
    }
    
    sectionOffset += skillWorkExercises.length;
    if (currentExerciseIndex < sectionOffset + (5 * mainExercises.length)) {
      const indexInMain = currentExerciseIndex - sectionOffset;
      const roundNumber = Math.floor(indexInMain / mainExercises.length) + 1;
      const exerciseInRound = indexInMain % mainExercises.length;
      return {
        section: "main",
        exercise: mainExercises[exerciseInRound],
        roundNumber,
        exerciseInRound,
      };
    }
    
    sectionOffset += 5 * mainExercises.length;
    if (currentExerciseIndex < sectionOffset + secondaryExercises.length) {
      return {
        section: "secondary",
        exercise: secondaryExercises[currentExerciseIndex - sectionOffset],
        roundNumber: null,
        exerciseInRound: currentExerciseIndex - sectionOffset,
      };
    }
    
    sectionOffset += secondaryExercises.length;
    return {
      section: "cooldown",
      exercise: cooldownExercises[currentExerciseIndex - sectionOffset],
      roundNumber: null,
      exerciseInRound: currentExerciseIndex - sectionOffset,
    };
  }, [getAllExercises, currentExerciseIndex, warmupExercises, skillWorkExercises, mainExercises, secondaryExercises, cooldownExercises]);

  // Complete workout function
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

  // Early finish functions
  const finishMainWorkoutEarly = useCallback(() => {
    if (!isMainWorkoutRunning) return;
    const initialTime = workout.main_workout?.time_params?.minutes ? (workout.main_workout.time_params.minutes * 60) : (20 * 60);
    setActualMainWodTime(initialTime - mainWorkoutTimeLeft);
    setIsMainWorkoutRunning(false);
    setMainWorkoutTimeLeft(0);
    const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
    setCurrentExerciseIndex(baseIndex);
    setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
  }, [isMainWorkoutRunning, mainWorkoutTimeLeft, workout, warmupExercises.length, skillWorkExercises.length, mainExercises.length, secondaryExercises.length]);

  const finishAmrapEarly = useCallback(() => {
    if (!isAmrapRunning) return;
    const initialTime = workout.secondary_wod?.time_params?.minutes ? (workout.secondary_wod.time_params.minutes * 60) : 0;
    setActualSecondaryWodTime(initialTime - amrapTimeLeft);
    setIsAmrapRunning(false);
    setAmrapTimeLeft(0);
    const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length;
    setCurrentExerciseIndex(baseIndex);
    setCurrentSection("cooldown");
  }, [isAmrapRunning, amrapTimeLeft, workout, warmupExercises.length, skillWorkExercises.length, mainExercises.length, secondaryExercises.length]);

  // Start current exercise
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
  }, [getAllExercises, currentExerciseIndex, currentSection, isAmrapSection, isAmrapRunning]);

  // Complete current exercise
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
      if (exerciseInfo && exerciseInfo.section === "main" && exerciseInfo.exerciseInRound === mainExercises.length - 1 && currentRound < 5) {
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
    } else {
      handleComplete();
    }
    setIsCompleting(false);
  }, [isCompleting, completedExercises, currentExerciseIndex, getAllExercises, getCurrentExerciseInfo, mainExercises.length, currentRound, handleComplete, warmupExercises.length, skillWorkExercises.length, secondaryExercises.length]);

  // Skip rest function
  const skipRest = useCallback(() => {
    setIsResting(false);
    if (currentRound < 5) {
      setCurrentRound((prev) => prev + 1);
      const baseIndex = warmupExercises.length + skillWorkExercises.length;
      setCurrentExerciseIndex(baseIndex + (currentRound * mainExercises.length));
      setCurrentSection("main");
    } else {
      const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
      setCurrentExerciseIndex(baseIndex);
      setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
    }
  }, [currentRound, mainExercises.length, warmupExercises.length, skillWorkExercises.length, secondaryExercises.length]);

  // Other callback functions
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

  const completeMainRound = useCallback(() => {
    if (!isMainWorkoutRunning || mainWorkoutTimeLeft <= 0) return;
    setCurrentMainRound((prev) => prev + 1);
    if (currentMainRound + 1 > 5) {
      finishMainWorkoutEarly();
    }
  }, [isMainWorkoutRunning, mainWorkoutTimeLeft, currentMainRound, finishMainWorkoutEarly]);

  const startMainWorkout = useCallback(() => {
    setIsMainWorkoutRunning(true);
    setCurrentMainRound(1);
  }, []);

  const completeAmrapRound = useCallback(() => {
    if (!isAmrapRunning || amrapTimeLeft <= 0) return;
    setAmrapRounds((prev) => prev + 1);
  }, [isAmrapRunning, amrapTimeLeft]);

  const startAmrap = useCallback(() => {
    setIsAmrapRunning(true);
    setAmrapRounds(0);
  }, []);

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
        if (restTimeLeft <= 1) {
          setIsResting(false);
          if (currentRound < 5) {
            setCurrentRound((prev) => prev + 1);
            const baseIndex = warmupExercises.length + skillWorkExercises.length;
            setCurrentExerciseIndex(baseIndex + (currentRound * mainExercises.length));
            setCurrentSection("main");
          } else {
            const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
            setCurrentExerciseIndex(baseIndex);
            setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
          }
        }
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
  }, [isPaused, isTotalRunning, isSubRunning, isResting, isAmrapRunning, isMainWorkoutRunning, totalTimeLeft, exerciseTimes, restTimeLeft, amrapTimeLeft, mainWorkoutTimeLeft, currentExerciseIndex, currentRound, workout, handleComplete, warmupExercises.length, skillWorkExercises.length, mainExercises.length, secondaryExercises.length]);

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
    exerciseTime,
    section,
    roundNumber,
  }: {
    exercise: Exercise;
    index: number;
    isCurrent: boolean;
    isCompleted: boolean;
    exerciseTime: number;
    section: string;
    roundNumber?: number;
  }) => (
    <Card className={`transition-all duration-300 ${
      isCurrent 
        ? `ring-2 ring-${sectionColors[section as keyof typeof sectionColors]} shadow-lg` 
        : ""
    } ${
      isCompleted ? "bg-green-50 border-green-200" : ""
    }`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : isCurrent ? (
              <Target className="w-5 h-5 text-primary" />
            ) : (
              <div className={`w-5 h-5 rounded-full border-2 border-${sectionColors[section as keyof typeof sectionColors]}`} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm sm:text-base truncate">
                {exercise.name}
                {roundNumber && ` (Ronda ${roundNumber})`}
              </h4>
              <Badge 
                variant="secondary" 
                className={`text-xs bg-${sectionColors[section as keyof typeof sectionColors]}/20 text-${sectionColors[section as keyof typeof sectionColors]}`}
              >
                {section === "skill_work" ? "Técnica" : 
                 section === "warmup" ? "Calentamiento" :
                 section === "main" ? "Principal" :
                 section === "secondary" ? "Secundario" : "Enfriamiento"}
              </Badge>
            </div>
            
            {exercise.sets && exercise.reps && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                {exercise.sets} x {exercise.reps} reps
              </p>
            )}
            
            {exercise.duration && (
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm">
                  {isCurrent && exercise.isTimed ? formatTime(exerciseTime) : formatTime(exercise.duration)}
                </span>
              </div>
            )}
            
            {exercise.notes && (
              <p className="text-xs text-muted-foreground mb-2">{exercise.notes}</p>
            )}
            
            {exercise.scaling && (
              <p className="text-xs text-blue-600 mb-2">Escalado: {exercise.scaling}</p>
            )}
            
            {exercise.image_url && (
              <img 
                src={exercise.image_url} 
                alt={exercise.name}
                className="w-full h-24 object-cover rounded mt-2"
              />
            )}
            
            {isCurrent && !isCompleted && exercise.isTimed && (
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => setIsSubRunning(!isSubRunning)}
                  size="sm"
                  className="flex-1"
                >
                  {isSubRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  {isSubRunning ? "Pausar" : "Iniciar"}
                </Button>
              </div>
            )}
            
            {isCurrent && !isCompleted && !exercise.isTimed && (
              <Button
                onClick={completeCurrentExercise}
                size="sm"
                className="w-full mt-3"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Completar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="bg-gradient-hero relative overflow-y-auto min-h-screen pt-16">
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-4xl mx-auto backdrop-blur-sm bg-white/95 border-0 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  {workout.title}
                </CardTitle>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{workout.type}</Badge>
                  <Badge variant="outline" className="text-xs">{workout.difficulty}</Badge>
                  <Badge variant="outline" className="text-xs">{workout.duration} min</Badge>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {formatTime(totalTimeLeft)}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Tiempo Total</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <Progress 
                value={(completedExercises.filter(Boolean).length / completedExercises.length) * 100} 
                className="h-2 sm:h-3"
              />
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Progreso: {completedExercises.filter(Boolean).length}/{completedExercises.length} ejercicios
              </p>
            </div>

            {/* Control Buttons */}
            {!isTotalRunning && !completed && (
              <Button 
                onClick={startWorkout} 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar Entrenamiento
              </Button>
            )}

            {isTotalRunning && !completed && (
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={togglePause} size="lg" variant="outline">
                  {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                  {isPaused ? "Reanudar" : "Pausar"}
                </Button>
                
                {isResting && (
                  <Button onClick={skipRest} size="lg" className="bg-orange-600 hover:bg-orange-700">
                    <SkipForward className="w-5 h-5 mr-2" />
                    Saltar Descanso ({formatTime(restTimeLeft)})
                  </Button>
                )}
                
                {isMainWorkoutRunning && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={completeMainRound} size="sm" variant="outline">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Ronda Completada ({currentMainRound}/5)
                    </Button>
                    <Button onClick={finishMainWorkoutEarly} size="sm" className="bg-red-600 hover:bg-red-700">
                      <SkipForward className="w-4 h-4 mr-1" />
                      Terminar WOD Principal ({formatTime(mainWorkoutTimeLeft)})
                    </Button>
                  </div>
                )}
                
                {isAmrapRunning && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={completeAmrapRound} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Ronda AMRAP ({amrapRounds} completadas)
                    </Button>
                    <Button onClick={finishAmrapEarly} size="sm" className="bg-red-600 hover:bg-red-700">
                      <SkipForward className="w-4 h-4 mr-1" />
                      Terminar AMRAP ({formatTime(amrapTimeLeft)})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Rest Section */}
            {isResting && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="text-center py-6">
                  <RotateCcw className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-bold text-orange-800">Descanso entre Rondas</h3>
                  <div className="text-3xl font-bold text-orange-600 mt-2">
                    {formatTime(restTimeLeft)}
                  </div>
                  <p className="text-orange-700 mt-2">Prepárate para la siguiente ronda</p>
                </CardContent>
              </Card>
            )}

            {/* Warmup Section */}
            {warmupExercises.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-fitness-red mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Calentamiento ({warmupExercises.length} ejercicios)
                </h3>
                <div className="grid gap-3">
                  {warmupExercises.map((exercise, idx) => (
                    <ExerciseCard
                      key={`warmup-${idx}`}
                      exercise={exercise}
                      index={idx}
                      isCurrent={currentSection === "warmup" && currentExerciseIndex === idx}
                      isCompleted={completedExercises[idx] || false}
                      exerciseTime={exerciseTimes[idx] || 0}
                      section="warmup"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Skill Work Section */}
            {skillWorkExercises.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-fitness-blue mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Trabajo de Técnica ({skillWorkExercises.length} ejercicios)
                </h3>
                <div className="grid gap-3">
                  {skillWorkExercises.map((exercise, idx) => {
                    const globalIndex = warmupExercises.length + idx;
                    return (
                      <ExerciseCard
                        key={`skill-${idx}`}
                        exercise={exercise}
                        index={globalIndex}
                        isCurrent={currentSection === "skill_work" && currentExerciseIndex === globalIndex}
                        isCompleted={completedExercises[globalIndex] || false}
                        exerciseTime={exerciseTimes[globalIndex] || 0}
                        section="skill_work"
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Workout Section */}
            {mainExercises.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-fitness-orange flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    WOD Principal - 5 Rondas {workout.main_workout?.time_type === "For Time" ? "(For Time)" : ""}
                  </h3>
                  {workout.main_workout?.time_type === "For Time" && !isMainWorkoutRunning && currentSection === "main" && (
                    <Button onClick={startMainWorkout} size="sm" className="bg-fitness-orange hover:bg-fitness-orange/90">
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar WOD Principal
                    </Button>
                  )}
                  {isMainWorkoutRunning && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-fitness-orange">
                        {formatTime(mainWorkoutTimeLeft)}
                      </div>
                      <p className="text-xs text-muted-foreground">Tiempo restante</p>
                    </div>
                  )}
                </div>
                <div className="grid gap-3">
                  {Array.from({ length: 5 }, (_, roundIdx) => (
                    <div key={`round-${roundIdx}`} className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={currentRound === roundIdx + 1 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          Ronda {roundIdx + 1}
                        </Badge>
                        {currentRound > roundIdx + 1 && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      {mainExercises.map((exercise, exIdx) => {
                        const globalIndex = warmupExercises.length + skillWorkExercises.length + (roundIdx * mainExercises.length) + exIdx;
                        const isCurrent = currentSection === "main" && currentExerciseIndex === globalIndex;
                        return (
                          <ExerciseCard
                            key={`main-${roundIdx}-${exIdx}`}
                            exercise={exercise}
                            index={globalIndex}
                            isCurrent={isCurrent}
                            isCompleted={completedExercises[globalIndex] || false}
                            exerciseTime={exerciseTimes[globalIndex] || 0}
                            section="main"
                            roundNumber={roundIdx + 1}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary Workout Section */}
            {secondaryExercises.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-fitness-orange flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {isAmrapSection ? `AMRAP ${workout.secondary_wod?.time_params?.minutes} min` : "WOD Secundario"}
                  </h3>
                  {isAmrapSection && !isAmrapRunning && currentSection === "secondary" && (
                    <Button onClick={startAmrap} size="sm" className="bg-fitness-orange hover:bg-fitness-orange/90">
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar AMRAP
                    </Button>
                  )}
                  {isAmrapRunning && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-fitness-orange">
                        {formatTime(amrapTimeLeft)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {amrapRounds} rondas completadas
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid gap-3">
                  {secondaryExercises.map((exercise, idx) => {
                    const globalIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + idx;
                    return (
                      <ExerciseCard
                        key={`secondary-${idx}`}
                        exercise={exercise}
                        index={globalIndex}
                        isCurrent={currentSection === "secondary" && currentExerciseIndex === globalIndex}
                        isCompleted={completedExercises[globalIndex] || false}
                        exerciseTime={exerciseTimes[globalIndex] || 0}
                        section="secondary"
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cooldown Section */}
            {cooldownExercises.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-fitness-blue mb-4 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Enfriamiento ({cooldownExercises.length} ejercicios)
                </h3>
                <div className="grid gap-3">
                  {cooldownExercises.map((exercise, idx) => {
                    const globalIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length + idx;
                    return (
                      <ExerciseCard
                        key={`cooldown-${idx}`}
                        exercise={exercise}
                        index={globalIndex}
                        isCurrent={currentSection === "cooldown" && currentExerciseIndex === globalIndex}
                        isCompleted={completedExercises[globalIndex] || false}
                        exerciseTime={exerciseTimes[globalIndex] || 0}
                        section="cooldown"
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completion Message */}
            {completed && (
              <div className="text-center py-6 sm:py-8 animate-fade-in">
                <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold">¡Entrenamiento Completado!</h3>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">Tiempo total: {formatTime(workout.duration * 60 - totalTimeLeft)}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                    Calentamiento: {warmupExercises.length} ejercicios
                  </Badge>
                  {skillWorkExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-blue/20 text-fitness-blue text-xs">
                      Técnica: {skillWorkExercises.length} ejercicios
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange text-xs">
                    Principal: 5 rondas completadas
                  </Badge>
                  {secondaryExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange text-xs">
                      {isAmrapSection ? `AMRAP: ${amrapRounds} rondas` : `Secundario: ${secondaryExercises.length} ejercicios`}
                    </Badge>
                  )}
                  {cooldownExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-purple/20 text-fitness-purple text-xs">
                      Enfriamiento: {cooldownExercises.length} ejercicios
                    </Badge>
                  )}
                </div>
                {user && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    ✅ Progreso guardado en tu perfil
                  </p>
                )}
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                  <Button onClick={() => navigate("/")} className="text-sm sm:text-base">Volver al Inicio</Button>
                  {user && (
                    <Button 
                      onClick={() => setShowResultsForm(true)} 
                      className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver Resultados
                    </Button>
                  )}
                  {user && (
                    <Button onClick={() => navigate("/dashboard")} className="bg-primary text-sm sm:text-base">
                      Ver Mi Dashboard
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Form Modal */}
      {showResultsForm && (
        <WorkoutResultsForm
          isOpen={showResultsForm}
          workout={workout}
          totalTime={workout.duration * 60 - totalTimeLeft}
          userId={user.id}
          mainWodTimeSpent={actualMainWodTime}
          secondaryWodTimeSpent={actualSecondaryWodTime}
          onClose={() => setShowResultsForm(false)}
        />
      )}
    </section>
  );
};

export default WorkoutSession;
