import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, Play, Pause, Zap, TrendingUp, Award, RotateCcw, Target, LogIn, Timer, SkipForward, Search, BarChart3 } from "lucide-react";
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
  const [mainWorkoutTimeLeft, setMainWorkoutTimeLeft] = useState(0);
  const [isMainWorkoutRunning, setIsMainWorkoutRunning] = useState(false);
  const [currentMainRound, setCurrentMainRound] = useState(1);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [actualMainWodTime, setActualMainWodTime] = useState(0);
  const [actualSecondaryWodTime, setActualSecondaryWodTime] = useState(0);

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
    setMainWorkoutTimeLeft(0);
    setIsMainWorkoutRunning(false);
    setCurrentMainRound(1);

    try {
      // Parse warmup exercises
      const warmup: Exercise[] = Array.isArray(workout.warmup) ? workout.warmup.map((ex: any, idx: number) => {
        console.log("Parsing warmup exercise:", ex, "type:", typeof ex);
        if (typeof ex === 'string') {
          return parseExercise(ex, idx, "warmup");
        }
        // Handle object case for warmup
        const exercise = {
          id: idx,
          name: String(ex.name || "Unknown Exercise"),
          isTimed: ex.duration !== undefined,
          duration: ex.duration,
          reps: ex.reps,
          notes: ex.notes,
          scaling: ex.scaling,
          image_url: ex.image_url,
          section: "warmup" as const,
        };
        console.log("Created warmup exercise:", exercise);
        return exercise;
      }) : [];

      // Parse skill work
      const skillWork: Exercise[] = Array.isArray(workout.main_workout?.skill_work) ? workout.main_workout.skill_work.map((ex: any, idx: number) => {
        console.log("Parsing skill work exercise:", ex, "type:", typeof ex);
        if (typeof ex === 'string') {
          return parseExercise(ex, idx + warmup.length, "skill_work");
        }
        // Handle object case for skill work
        const exercise = {
          id: idx + warmup.length,
          name: String(ex.name || "Unknown Exercise"),
          isTimed: ex.duration !== undefined,
          duration: ex.duration,
          reps: ex.reps,
          notes: ex.notes,
          scaling: ex.scaling,
          image_url: ex.image_url,
          section: "skill_work" as const,
        };
        console.log("Created skill work exercise:", exercise);
        return exercise;
      }) : [];

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
      
      // Set main workout duration (time per round * 5 rounds + rest time)
      if (workout.main_workout?.time_params?.minutes) {
        setMainWorkoutTimeLeft(workout.main_workout.time_params.minutes * 60);
      } else {
        // Default main workout time if not specified
        setMainWorkoutTimeLeft(20 * 60); // 20 minutes default
      }

      // Parse cooldown
      const cooldown: Exercise[] = Array.isArray(workout.cooldown) ? workout.cooldown.map((ex: any, idx: number) => {
        console.log("Parsing cooldown exercise:", ex, "type:", typeof ex);
        if (typeof ex === 'string') {
          return parseExercise(ex, idx + warmup.length + skillWork.length + main.length + secondary.length, "cooldown");
        }
        // Handle object case for cooldown
        const exercise = {
          id: idx + warmup.length + skillWork.length + main.length + secondary.length,
          name: String(ex.name || "Unknown Exercise"),
          isTimed: ex.duration !== undefined,
          duration: ex.duration,
          reps: ex.reps,
          notes: ex.notes,
          scaling: ex.scaling,
          image_url: ex.image_url,
          section: "cooldown" as const,
        };
        console.log("Created cooldown exercise:", exercise);
        return exercise;
      }) : [];

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
      // Guardar el tiempo completo cuando el timer se acaba
      const initialTime = workout.secondary_wod?.time_params?.minutes ? (workout.secondary_wod.time_params.minutes * 60) : 0;
      setActualSecondaryWodTime(initialTime);
      
      setIsAmrapRunning(false);
      // Move to cooldown when AMRAP finishes
      const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length;
      setCurrentExerciseIndex(baseIndex);
      setCurrentSection("cooldown");
    }
    return () => clearInterval(interval);
  }, [isAmrapRunning, amrapTimeLeft, warmupExercises.length, skillWorkExercises.length, mainExercises.length, secondaryExercises.length]);

  // Main workout timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMainWorkoutRunning && mainWorkoutTimeLeft > 0) {
      interval = setInterval(() => setMainWorkoutTimeLeft((prev) => prev - 1), 1000);
    } else if (mainWorkoutTimeLeft <= 0 && isMainWorkoutRunning) {
      // Guardar el tiempo completo cuando el timer se acaba
      const initialTime = workout.main_workout?.time_params?.minutes ? (workout.main_workout.time_params.minutes * 60) : (20 * 60);
      setActualMainWodTime(initialTime);
      
      setIsMainWorkoutRunning(false);
      // Move to secondary WOD when main workout time finishes
      const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
      setCurrentExerciseIndex(baseIndex);
      setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
    }
    return () => clearInterval(interval);
  }, [isMainWorkoutRunning, mainWorkoutTimeLeft, warmupExercises.length, skillWorkExercises.length, mainExercises.length, secondaryExercises.length]);

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

  const completeMainRound = () => {
    if (!isMainWorkoutRunning || mainWorkoutTimeLeft <= 0) return;
    const newRound = currentMainRound + 1;
    setCurrentMainRound(newRound);
    
    if (newRound > 5) {
      // Main workout completed, move to secondary
      setIsMainWorkoutRunning(false);
      const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
      setCurrentExerciseIndex(baseIndex);
      setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
    }
    
    console.log("Main workout round completed, round:", newRound);
  };

  const finishMainWorkoutEarly = () => {
    if (!isMainWorkoutRunning) return;
    // Guardar el tiempo real transcurrido antes de resetear
    const initialTime = workout.main_workout?.time_params?.minutes ? (workout.main_workout.time_params.minutes * 60) : (20 * 60);
    setActualMainWodTime(initialTime - mainWorkoutTimeLeft);
    
    setIsMainWorkoutRunning(false);
    setMainWorkoutTimeLeft(0);
    // Move to secondary WOD when main workout finishes early
    const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
    setCurrentExerciseIndex(baseIndex);
    setCurrentSection(secondaryExercises.length > 0 ? "secondary" : "cooldown");
    console.log("Main workout finished early, rounds completed:", currentMainRound);
  };

  const startMainWorkout = () => {
    setIsMainWorkoutRunning(true);
    setCurrentMainRound(1);
  };

  const completeAmrapRound = () => {
    if (!isAmrapRunning || amrapTimeLeft <= 0) return;
    const newRounds = amrapRounds + 1;
    setAmrapRounds(newRounds);
    console.log("AMRAP round completed, total rounds:", newRounds);
  };

  const finishAmrapEarly = () => {
    if (!isAmrapRunning) return;
    // Guardar el tiempo real transcurrido antes de resetear
    const initialTime = workout.secondary_wod?.time_params?.minutes ? (workout.secondary_wod.time_params.minutes * 60) : 0;
    setActualSecondaryWodTime(initialTime - amrapTimeLeft);
    
    setIsAmrapRunning(false);
    setAmrapTimeLeft(0);
    // Move to cooldown when AMRAP finishes early
    const baseIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length;
    setCurrentExerciseIndex(baseIndex);
    setCurrentSection("cooldown");
    console.log("AMRAP finished early, total rounds:", amrapRounds);
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
    
    const exerciseInfo = getCurrentExerciseInfo();
    console.log("Completing exercise:", exerciseInfo);

    // If we're in an AMRAP section, don't use the regular completion logic
    if (exerciseInfo.section === "secondary" && isAmrapSection && isAmrapRunning) {
      // For AMRAP, we don't automatically advance - user must manually complete rounds
      return;
    }

    setIsCompleting(true);

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
      
      // Set the correct section based on the next exercise
      const nextIndex = currentExerciseIndex + 1;
      if (nextIndex < warmupExercises.length) {
        setCurrentSection("warmup");
      } else if (nextIndex < warmupExercises.length + skillWorkExercises.length) {
        setCurrentSection("skill_work");
      } else if (nextIndex < warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length)) {
        setCurrentSection("main");
      } else if (nextIndex < warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length) {
        setCurrentSection("secondary");
      } else {
        setCurrentSection("cooldown");
      }
      
      startCurrentExercise();
    } else {
      console.log("🎯 All exercises completed! Calling handleComplete");
      console.log("Current exercise index:", currentExerciseIndex, "Total exercises:", allExercises.length);
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
    console.log("🏁 handleComplete called - setting completed to true");
    setIsTotalRunning(false);
    setIsResting(false);
    setIsAmrapRunning(false);
    setIsMainWorkoutRunning(false);
    setCompleted(true);
    console.log("✅ Completed state set to true");

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
              {currentExerciseInfo.section === "main" && (
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                  <Badge variant="outline" className="bg-fitness-orange/20 text-fitness-orange border-fitness-orange text-xs sm:text-sm">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Ronda {currentRound}/5
                  </Badge>
                  {isMainWorkoutRunning && (
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary text-xs sm:text-sm">
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      WOD: {formatTime(mainWorkoutTimeLeft)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {!isTotalRunning && !completed && (
              <div className="flex gap-2 mt-4">
                <Button onClick={startWorkout} className="bg-gradient-primary text-white text-sm sm:text-base">
                  <Play className="mr-2 w-4 h-4" /> Iniciar Entrenamiento
                </Button>
                {/* Debug button - remove in production */}
                <Button onClick={handleComplete} variant="outline" className="text-xs sm:text-sm">
                  🏁 Test Complete
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 py-4 sm:py-6">
            <Progress value={(currentExerciseIndex / allExercises.length) * 100} className="h-2" />

            {/* Warmup Section */}
            {warmupExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-fitness-red" />
                  <h3 className="text-xl font-bold text-fitness-red">Calentamiento</h3>
                  <Badge variant="secondary" className="bg-fitness-red/20 text-fitness-red">
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
                  <h3 className="text-xl font-bold text-fitness-orange">Entrenamiento Principal ({workout.main_workout?.time_type || "For Time"})</h3>
                  <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange">
                    Ronda {currentMainRound}/5
                  </Badge>
                  {isMainWorkoutRunning && (
                    <Badge variant="outline" className="border-fitness-orange text-fitness-orange">
                      <Timer className="w-3 h-3 mr-1" />
                      {formatTime(mainWorkoutTimeLeft)}
                    </Badge>
                  )}
                </div>

                {/* Main Workout UI - Interactive format when workout is running and we're in main section */}
                {currentExerciseInfo.section === "main" && isTotalRunning && (
                  <div className="p-4 sm:p-6 rounded-xl border-2 border-fitness-orange bg-fitness-orange/10">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                        <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-fitness-orange" />
                        <span className="text-2xl sm:text-4xl font-bold text-fitness-orange">
                          {formatTime(mainWorkoutTimeLeft)}
                        </span>
                      </div>
                      <p className="text-sm sm:text-lg font-semibold text-fitness-orange mb-2">
                        {workout.main_workout?.time_type || "For Time"} - 5 Rondas
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-fitness-orange">
                        Ronda actual: {currentMainRound}/5
                      </p>
                    </div>
                    
                    {!isMainWorkoutRunning && mainWorkoutTimeLeft > 0 && (
                      <div className="text-center mb-4">
                        <Button 
                          onClick={startMainWorkout} 
                          className="bg-fitness-orange text-white hover:bg-fitness-orange/80 text-sm sm:text-base"
                          size="default"
                        >
                          <Play className="mr-2 w-4 h-4" /> Iniciar WOD Principal
                        </Button>
                      </div>
                    )}
                    
                    {isMainWorkoutRunning && (
                      <div className="space-y-4">
                        <h4 className="text-base sm:text-lg font-semibold text-center text-fitness-orange">
                          Ejercicios de la ronda:
                        </h4>
                        {mainExercises.map((ex, idx) => (
                          <div key={ex.id} className="p-3 rounded border bg-background/50">
                            <div className="font-medium text-sm sm:text-base">{ex.name}</div>
                            {ex.reps && (
                              <div className="text-xs sm:text-sm text-muted-foreground">{ex.reps} repeticiones</div>
                            )}
                            {ex.notes && (
                              <div className="text-xs text-muted-foreground italic">{ex.notes}</div>
                            )}
                            {ex.image_url && (
                              <div className="mt-2 flex justify-center">
                                <div className="w-full aspect-video max-w-[280px] sm:max-w-[320px]">
                                  <img
                                    src={ex.image_url}
                                    alt={`Demostración de ${ex.name}`}
                                    className="w-full h-full object-cover rounded-md mx-auto"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <div className="text-center pt-4">
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button 
                              onClick={completeMainRound}
                              className="bg-green-600 text-white hover:bg-green-700 text-sm sm:text-base"
                              size="default"
                              disabled={mainWorkoutTimeLeft <= 0 || currentMainRound > 5}
                            >
                              <CheckCircle className="mr-2 w-4 h-4" /> Completar Ronda
                            </Button>
                            <Button 
                              onClick={finishMainWorkoutEarly}
                              variant="destructive"
                              size="default"
                              disabled={mainWorkoutTimeLeft <= 0}
                              className="text-sm sm:text-base"
                            >
                              <SkipForward className="mr-2 w-4 h-4" /> Finalizar WOD Principal
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {mainWorkoutTimeLeft <= 0 && (
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600 mb-4">
                          ¡WOD Principal Completado!
                        </p>
                        <p className="text-lg">
                          Rondas completadas: <span className="font-bold text-fitness-orange">{currentMainRound - 1}/5</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show individual exercises when not started or not in main section */}
                {(!isTotalRunning || currentExerciseInfo.section !== "main") && mainExercises.map((ex, idx) => {
                  const globalIndex = warmupExercises.length + skillWorkExercises.length + (currentRound - 1) * mainExercises.length + idx;
                  return (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      index={globalIndex}
                      isCurrent={false}
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
                  <div className="p-4 sm:p-6 rounded-xl border-2 border-fitness-orange bg-fitness-orange/10">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                        <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-fitness-orange" />
                        <span className="text-2xl sm:text-4xl font-bold text-fitness-orange">
                          {formatTime(amrapTimeLeft)}
                        </span>
                      </div>
                      <p className="text-sm sm:text-lg font-semibold text-fitness-orange mb-2">
                        AMRAP - Completa tantas rondas como puedas
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-fitness-orange">
                        Rondas completadas: {amrapRounds}
                      </p>
                    </div>
                    
                    {!isAmrapRunning && amrapTimeLeft > 0 && (
                      <div className="text-center mb-4">
                        <Button 
                          onClick={startAmrap} 
                          className="bg-fitness-orange text-white hover:bg-fitness-orange/80 text-sm sm:text-base"
                          size="default"
                        >
                          <Play className="mr-2 w-4 h-4" /> Iniciar AMRAP
                        </Button>
                      </div>
                    )}
                    
                    {isAmrapRunning && (
                      <div className="space-y-4">
                        <h4 className="text-base sm:text-lg font-semibold text-center text-fitness-orange">
                          Ejercicios de la ronda:
                        </h4>
                        {secondaryExercises.map((ex, idx) => (
                          <div key={ex.id} className="p-3 rounded border bg-background/50">
                            <div className="font-medium text-sm sm:text-base">{ex.name}</div>
                            {ex.reps && (
                              <div className="text-xs sm:text-sm text-muted-foreground">{ex.reps} repeticiones</div>
                            )}
                            {ex.notes && (
                              <div className="text-xs text-muted-foreground italic">{ex.notes}</div>
                            )}
                          </div>
                        ))}
                        
                        <div className="text-center pt-4">
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button 
                              onClick={completeAmrapRound}
                              className="bg-green-600 text-white hover:bg-green-700 text-sm sm:text-base"
                              size="default"
                              disabled={amrapTimeLeft <= 0}
                            >
                              <CheckCircle className="mr-2 w-4 h-4" /> Completar Ronda
                            </Button>
                            <Button 
                              onClick={finishAmrapEarly}
                              variant="destructive"
                              size="default"
                              disabled={amrapTimeLeft <= 0}
                              className="text-sm sm:text-base"
                            >
                              <SkipForward className="mr-2 w-4 h-4" /> Finalizar AMRAP
                            </Button>
                          </div>
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
                <div className="p-4 rounded-xl border-2 border-fitness-blue/30 bg-gradient-to-r from-fitness-blue/10 to-fitness-blue/5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-fitness-blue" />
                    <h3 className="text-xl font-bold text-fitness-blue">Enfriamiento</h3>
                    <Badge variant="secondary" className="bg-fitness-blue/20 text-fitness-blue">
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
        
        {/* Workout Results Form */}
        {showResultsForm && user && (
          <WorkoutResultsForm
            isOpen={showResultsForm}
            onClose={() => setShowResultsForm(false)}
            workout={workout}
            totalTime={workout.duration * 60 - totalTimeLeft}
            userId={user.id}
            mainWodTimeSpent={actualMainWodTime > 0 ? actualMainWodTime : (workout.main_workout?.time_params?.minutes ? (workout.main_workout.time_params.minutes * 60) - mainWorkoutTimeLeft : 0)}
            secondaryWodTimeSpent={actualSecondaryWodTime > 0 ? actualSecondaryWodTime : (isAmrapSection ? (workout.secondary_wod?.time_params?.minutes ? (workout.secondary_wod.time_params.minutes * 60) - amrapTimeLeft : 0) : 0)}
          />
        )}
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
  const navigate = useNavigate();
  
  const sectionColors = {
    warmup: "fitness-red",
    skill_work: "fitness-blue", 
    main: "fitness-orange",
    secondary: "fitness-orange",
    cooldown: "fitness-blue",
  };

  return (
    <div
      className={`p-3 sm:p-4 rounded-xl border transition-all ${
        isCurrent ? `bg-${sectionColors[exercise.section]}/20 border-${sectionColors[exercise.section]} shadow-glow animate-pulse` : isCompleted ? "bg-green-500/20 border-green-500" : "bg-muted/50"
      } ${exercise.section === "main" ? "ml-3 sm:ml-6" : ""}`}
    >
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm sm:text-lg flex items-center flex-wrap gap-1 sm:gap-2">
            {exercise.section === "main" ? <Award className={`w-4 h-4 sm:w-5 sm:h-5 text-${sectionColors[exercise.section]} flex-shrink-0`} /> : <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 text-${sectionColors[exercise.section]} flex-shrink-0`} />}
            <span className="truncate">{String(exercise.name)}</span>
            {(exercise.section === "warmup" || exercise.section === "skill_work" || exercise.section === "cooldown") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/exercise-library')}
                className={`text-${sectionColors[exercise.section]} hover:bg-${sectionColors[exercise.section]}/10 h-6 w-6 sm:h-8 sm:w-8 p-0`}
              >
                <Search className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            )}
          </span>
          
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {exercise.isTimed && exercise.duration && (
              <span className={`flex items-center text-xs sm:text-sm font-semibold text-${sectionColors[exercise.section]} bg-${sectionColors[exercise.section]}/10 px-2 py-1 rounded-full`}>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {formatTime(exerciseTime)}
              </span>
            )}
            {!exercise.isTimed && exercise.sets && exercise.reps && (
              <span className={`text-xs sm:text-sm font-semibold text-${sectionColors[exercise.section]}`}>
                {exercise.sets} sets x {exercise.reps} {exercise.notes ? `(${exercise.notes})` : ""}
              </span>
            )}
          </div>
          
          {exercise.scaling && (
            <p className="text-muted-foreground text-xs italic mt-1">{exercise.scaling}</p>
          )}
          {exercise.image_url && (exercise.section === "main" || exercise.section === "secondary") && (
            <div className="mt-2 flex justify-center">
              <div className="w-full aspect-video max-w-[280px] sm:max-w-[320px]">
                <img
                  src={exercise.image_url}
                  alt={`Demostración de ${exercise.name}`}
                  className="w-full h-full object-cover rounded-md mx-auto"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {isCurrent && isTotalRunning && !isCompleted && (
          exercise.isTimed ? (
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <span className={`text-lg sm:text-xl font-bold text-${sectionColors[exercise.section]}`}>{formatTime(exerciseTime)}</span>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleSubRunning} className="h-8 w-8 p-0">
                  {isSubRunning ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
                </Button>
                <Button variant="outline" onClick={completeExercise} disabled={isCompleting} size="sm" className="text-xs sm:text-sm">
                  Completar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={completeExercise} className={`bg-${sectionColors[exercise.section]} text-white text-xs sm:text-sm`} disabled={isCompleting} size="sm">
              <CheckCircle className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> Completado
            </Button>
          )
        )}
        {isCompleted && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />}
      </div>
    </div>
  );
};

export default WorkoutSession;