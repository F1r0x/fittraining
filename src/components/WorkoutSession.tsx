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
        // Handle object case for warmup - now handles measure1_unit/measure1_value
        const isTimedExercise = ex.measure1_unit === 'segundos' || ex.measure1_unit === 'minutos' || ex.duration !== undefined;
        let duration = ex.duration;
        let reps = ex.reps;

        // Handle measure1_* fields from daily_workouts
        if (ex.measure1_unit && ex.measure1_value) {
          if (ex.measure1_unit === 'segundos') {
            duration = ex.measure1_value;
          } else if (ex.measure1_unit === 'minutos') {
            duration = ex.measure1_value * 60;
          } else if (ex.measure1_unit === 'reps') {
            reps = ex.measure1_value;
          }
        }

        const exercise = {
          id: idx,
          name: String(ex.name || "Unknown Exercise"),
          isTimed: isTimedExercise,
          duration: duration,
          reps: reps,
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
        // Handle object case for skill work - now handles measure1_unit/measure1_value
        const isTimedExercise = ex.measure1_unit === 'segundos' || ex.measure1_unit === 'minutos' || ex.duration !== undefined;
        let duration = ex.duration;
        let reps = ex.reps;

        // Handle measure1_* fields from daily_workouts
        if (ex.measure1_unit && ex.measure1_value) {
          if (ex.measure1_unit === 'segundos') {
            duration = ex.measure1_value;
          } else if (ex.measure1_unit === 'minutos') {
            duration = ex.measure1_value * 60;
          } else if (ex.measure1_unit === 'reps') {
            reps = ex.measure1_value;
          }
        }

        const exercise = {
          id: idx + warmup.length,
          name: String(ex.name || "Unknown Exercise"),
          isTimed: isTimedExercise,
          duration: duration,
          reps: reps,
          notes: ex.notes,
          scaling: ex.scaling,
          image_url: ex.image_url,
          section: "skill_work" as const,
        };
        console.log("Created skill work exercise:", exercise);
        return exercise;
      }) : [];

      // Parse main workout exercises - now handles measure1_unit/measure1_value
      const main: Exercise[] = Array.isArray(workout.main_workout?.exercises) ? workout.main_workout.exercises.map((ex: any, idx: number) => {
        const isTimedExercise = ex.measure1_unit === 'segundos' || ex.measure1_unit === 'minutos' || ex.duration !== undefined;
        let duration = ex.duration;
        let reps = ex.reps;

        // Handle measure1_* fields from daily_workouts
        if (ex.measure1_unit && ex.measure1_value) {
          if (ex.measure1_unit === 'segundos') {
            duration = ex.measure1_value;
          } else if (ex.measure1_unit === 'minutos') {
            duration = ex.measure1_value * 60;
          } else if (ex.measure1_unit === 'reps') {
            reps = ex.measure1_value;
          }
        }

        return {
          id: idx + warmup.length + skillWork.length,
          name: ex.name || "Unknown Exercise",
          isTimed: isTimedExercise,
          duration: duration,
          sets: ex.sets || 5,
          reps: reps || "Completar",
          notes: ex.notes,
          scaling: ex.scaling,
          image_url: ex.image_url || "/assets/placeholder-exercise.jpg",
          section: "main" as const,
        };
      }) : [];

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
          // Handle case where secondary_wod is an object with exercises - now handles measure1_unit/measure1_value
          secondary = workout.secondary_wod.exercises.map((ex: any, idx: number) => {
            const isTimedExercise = ex.measure1_unit === 'segundos' || ex.measure1_unit === 'minutos' || ex.duration !== undefined || (workout.secondary_wod.time_type === "EMOM");
            let duration = ex.duration;
            let reps = ex.reps;

            // Handle measure1_* fields from daily_workouts
            if (ex.measure1_unit && ex.measure1_value) {
              if (ex.measure1_unit === 'segundos') {
                duration = ex.measure1_value;
              } else if (ex.measure1_unit === 'minutos') {
                duration = ex.measure1_value * 60;
              } else if (ex.measure1_unit === 'reps') {
                reps = ex.measure1_value;
              }
            }

            // EMOM defaults to 60 seconds if no duration specified
            if (workout.secondary_wod.time_type === "EMOM" && !duration) {
              duration = 60;
            }

            return {
              id: idx + warmup.length + skillWork.length + main.length,
              name: ex.name || "Unknown Exercise",
              isTimed: isTimedExercise,
              duration: duration,
              reps: reps,
              notes: ex.notes,
              scaling: ex.scaling,
              image_url: ex.image_url || "/assets/placeholder-exercise.jpg",
              section: "secondary" as const,
            };
          });
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
        // Handle object case for cooldown - now handles measure1_unit/measure1_value
        const isTimedExercise = ex.measure1_unit === 'segundos' || ex.measure1_unit === 'minutos' || ex.duration !== undefined;
        let duration = ex.duration;
        let reps = ex.reps;

        // Handle measure1_* fields from daily_workouts
        if (ex.measure1_unit && ex.measure1_value) {
          if (ex.measure1_unit === 'segundos') {
            duration = ex.measure1_value;
          } else if (ex.measure1_unit === 'minutos') {
            duration = ex.measure1_value * 60;
          } else if (ex.measure1_unit === 'reps') {
            reps = ex.measure1_value;
          }
        }

        const exercise = {
          id: idx + warmup.length + skillWork.length + main.length + secondary.length,
          name: String(ex.name || "Unknown Exercise"),
          isTimed: isTimedExercise,
          duration: duration,
          reps: reps,
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
      
      console.log("Debugging exercise parsing:");
      console.log("Warmup exercises:", warmup.map(ex => ({ name: ex.name, isTimed: ex.isTimed, duration: ex.duration, reps: ex.reps })));
      console.log("Main exercises:", main.map(ex => ({ name: ex.name, isTimed: ex.isTimed, duration: ex.duration, reps: ex.reps })));
      console.log("Cooldown exercises:", cooldown.map(ex => ({ name: ex.name, isTimed: ex.isTimed, duration: ex.duration, reps: ex.reps })));
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
  };

  const startMainWorkout = () => {
    if (isMainWorkoutRunning) return;
    setIsMainWorkoutRunning(true);
    setCurrentMainRound(1);
    
    console.log("Starting main workout with time:", mainWorkoutTimeLeft);
  };

  const getAllExercises = (): Exercise[] => {
    const all: Exercise[] = [];
    all.push(...warmupExercises);
    all.push(...skillWorkExercises);
    
    // Add 5 rounds of main exercises
    for (let round = 1; round <= 5; round++) {
      all.push(...mainExercises.map(ex => ({ ...ex, id: ex.id + (round - 1) * 1000 })));
    }
    
    all.push(...secondaryExercises);
    all.push(...cooldownExercises);
    
    return all;
  };

  const getCurrentExerciseInfo = () => {
    const allExercises = getAllExercises();
    const current = allExercises[currentExerciseIndex];
    
    if (!current) {
      return { 
        exercise: null, 
        section: currentSection,
        exerciseIndex: 0,
        totalInSection: 0,
        roundInfo: null
      };
    }

    let sectionExercises: Exercise[] = [];
    let exerciseIndex = 0;
    let roundInfo = null;

    if (currentSection === "warmup") {
      sectionExercises = warmupExercises;
      exerciseIndex = currentExerciseIndex;
    } else if (currentSection === "skill_work") {
      sectionExercises = skillWorkExercises;
      exerciseIndex = currentExerciseIndex - warmupExercises.length;
    } else if (currentSection === "main") {
      sectionExercises = mainExercises;
      const mainStartIndex = warmupExercises.length + skillWorkExercises.length;
      const relativeIndex = currentExerciseIndex - mainStartIndex;
      const roundNumber = Math.floor(relativeIndex / mainExercises.length) + 1;
      exerciseIndex = relativeIndex % mainExercises.length;
      roundInfo = { current: roundNumber, total: 5 };
    } else if (currentSection === "secondary") {
      sectionExercises = secondaryExercises;
      const secondaryStartIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
      exerciseIndex = currentExerciseIndex - secondaryStartIndex;
    } else if (currentSection === "cooldown") {
      sectionExercises = cooldownExercises;
      const cooldownStartIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length;
      exerciseIndex = currentExerciseIndex - cooldownStartIndex;
    }

    return {
      exercise: current,
      section: currentSection,
      exerciseIndex: exerciseIndex,
      totalInSection: sectionExercises.length,
      roundInfo
    };
  };

  const completeCurrentExercise = () => {
    setIsCompleting(true);
    setIsSubRunning(false);
    
    setTimeout(() => {
      const newCompletedExercises = [...completedExercises];
      newCompletedExercises[currentExerciseIndex] = true;
      setCompletedExercises(newCompletedExercises);

      const nextIndex = currentExerciseIndex + 1;
      const allExercises = getAllExercises();

      if (nextIndex >= allExercises.length) {
        handleComplete();
        setIsCompleting(false);
        return;
      }

      // Check if we need to switch sections
      const warmupEnd = warmupExercises.length;
      const skillWorkEnd = warmupEnd + skillWorkExercises.length;
      const mainEnd = skillWorkEnd + (5 * mainExercises.length);
      const secondaryEnd = mainEnd + secondaryExercises.length;

      if (nextIndex === warmupEnd && skillWorkExercises.length > 0) {
        setCurrentSection("skill_work");
      } else if (nextIndex === skillWorkEnd) {
        setCurrentSection("main");
      } else if (nextIndex === mainEnd && secondaryExercises.length > 0) {
        setCurrentSection("secondary");
      } else if (nextIndex === secondaryEnd) {
        setCurrentSection("cooldown");
      } else if (currentSection === "main") {
        // Check if we need rest between rounds
        const mainStartIndex = skillWorkEnd;
        const relativeIndex = nextIndex - mainStartIndex;
        const roundNumber = Math.floor(relativeIndex / mainExercises.length) + 1;
        const exerciseInRound = relativeIndex % mainExercises.length;
        
        if (exerciseInRound === 0 && roundNumber > 1) {
          // Starting a new round, add rest
          setCurrentSection("rest");
          setIsResting(true);
          setRestTimeLeft(90);
          setIsCompleting(false);
          return;
        }
      }

      setCurrentExerciseIndex(nextIndex);
      startCurrentExercise();
      setIsCompleting(false);
    }, 500);
  };

  const handleComplete = async () => {
    setCompleted(true);
    setIsTotalRunning(false);
    setIsSubRunning(false);
    
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .insert([
            {
              user_id: user.id,
              workout_id: workout.id,
              time_taken: workout.duration * 60 - totalTimeLeft,
              completed_at: new Date().toISOString(),
            }
          ]);

        if (error) {
          console.error('Error saving workout progress:', error);
        } else {
          console.log('Workout progress saved successfully');
        }
      } catch (error) {
        console.error('Error saving workout progress:', error);
      }
    }
  };

  const skipToSection = (targetSection: "warmup" | "skill_work" | "main" | "secondary" | "cooldown") => {
    let targetIndex = 0;
    
    switch (targetSection) {
      case "warmup":
        targetIndex = 0;
        break;
      case "skill_work":
        targetIndex = warmupExercises.length;
        break;
      case "main":
        targetIndex = warmupExercises.length + skillWorkExercises.length;
        break;
      case "secondary":
        targetIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length);
        break;
      case "cooldown":
        targetIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length;
        break;
    }
    
    setCurrentExerciseIndex(targetIndex);
    setCurrentSection(targetSection);
    setIsResting(false);
    setIsAmrapRunning(false);
    setIsMainWorkoutRunning(false);
    
    if (targetSection === "secondary" && isAmrapSection) {
      setIsAmrapRunning(true);
    }
    
    startCurrentExercise();
  };

  const incrementAmrapRounds = () => {
    setAmrapRounds(prev => prev + 1);
  };

  if (!workout) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-fitness-red via-fitness-orange to-fitness-red flex items-center justify-center">
        <Alert>
          <AlertDescription>
            No se encontró información del entrenamiento. Por favor, vuelve a seleccionar un entrenamiento.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const currentExerciseInfo = getCurrentExerciseInfo();

  return (
    <section className="min-h-screen bg-gradient-to-br from-fitness-red via-fitness-orange to-fitness-red">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center pb-3 sm:pb-6">
            <CardTitle className="text-xl sm:text-3xl font-bold text-fitness-red mb-2 sm:mb-4">
              {workout.title}
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm sm:text-base">
              <Badge variant="secondary" className="bg-fitness-blue/20 text-fitness-blue">
                {workout.type}
              </Badge>
              <Badge variant="secondary" className="bg-fitness-red/20 text-fitness-red">
                {workout.difficulty}
              </Badge>
              <div className="flex items-center text-muted-foreground">
                <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span>{workout.duration} min</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Total Timer */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2 sm:mb-4">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-fitness-orange" />
                <span className="text-2xl sm:text-4xl font-bold text-fitness-orange">
                  {formatTime(totalTimeLeft)}
                </span>
              </div>
              {!isTotalRunning && !completed && (
                <Button onClick={startWorkout} className="text-sm sm:text-base">
                  <Play className="mr-2 w-4 h-4" /> Iniciar Entrenamiento
                </Button>
              )}
              {isTotalRunning && !completed && (
                <Button 
                  onClick={() => setIsTotalRunning(!isTotalRunning)} 
                  variant="outline"
                  className="text-sm sm:text-base"
                >
                  {isTotalRunning ? <Pause className="mr-2 w-4 h-4" /> : <Play className="mr-2 w-4 h-4" />}
                  {isTotalRunning ? "Pausar" : "Reanudar"}
                </Button>
              )}
            </div>

            {/* Section Navigation */}
            {isTotalRunning && !completed && (
              <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                {warmupExercises.length > 0 && (
                  <Button
                    onClick={() => skipToSection("warmup")}
                    variant={currentSection === "warmup" ? "default" : "outline"}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Calentamiento
                  </Button>
                )}
                {skillWorkExercises.length > 0 && (
                  <Button
                    onClick={() => skipToSection("skill_work")}
                    variant={currentSection === "skill_work" ? "default" : "outline"}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Técnica
                  </Button>
                )}
                {mainExercises.length > 0 && (
                  <Button
                    onClick={() => skipToSection("main")}
                    variant={currentSection === "main" ? "default" : "outline"}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Principal
                  </Button>
                )}
                {secondaryExercises.length > 0 && (
                  <Button
                    onClick={() => skipToSection("secondary")}
                    variant={currentSection === "secondary" ? "default" : "outline"}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Secundario
                  </Button>
                )}
                {cooldownExercises.length > 0 && (
                  <Button
                    onClick={() => skipToSection("cooldown")}
                    variant={currentSection === "cooldown" ? "default" : "outline"}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Enfriamiento
                  </Button>
                )}
              </div>
            )}

            {/* Current Section Info */}
            {isTotalRunning && !completed && currentExerciseInfo.exercise && (
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold mb-2 capitalize">
                  {currentSection === "skill_work" ? "Técnica" : 
                   currentSection === "warmup" ? "Calentamiento" :
                   currentSection === "main" ? "Entrenamiento Principal" :
                   currentSection === "secondary" ? "Entrenamiento Secundario" :
                   currentSection === "cooldown" ? "Enfriamiento" : "Descanso"}
                </h3>
                {currentExerciseInfo.roundInfo && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Ronda {currentExerciseInfo.roundInfo.current} de {currentExerciseInfo.roundInfo.total}
                  </p>
                )}
                <Progress 
                  value={(currentExerciseInfo.exerciseIndex / Math.max(currentExerciseInfo.totalInSection, 1)) * 100}
                  className="w-full max-w-md mx-auto mb-2"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ejercicio {currentExerciseInfo.exerciseIndex + 1} de {currentExerciseInfo.totalInSection}
                </p>
              </div>
            )}

            {/* Rest Period */}
            {isResting && (
              <div className="text-center p-4 sm:p-6 bg-muted rounded-lg">
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">Descanso entre rondas</h3>
                <div className="flex items-center justify-center mb-4">
                  <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 mr-2 text-fitness-blue animate-spin" />
                  <span className="text-2xl sm:text-4xl font-bold text-fitness-blue">
                    {formatTime(restTimeLeft)}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Prepárate para la ronda {currentRound + 1} de 5
                </p>
                <Button 
                  onClick={() => {
                    setIsResting(false);
                    setRestTimeLeft(0);
                  }}
                  variant="outline"
                  className="mt-2 sm:mt-4 text-sm sm:text-base"
                >
                  Saltar Descanso
                </Button>
              </div>
            )}

            {/* Warmup Section */}
            {warmupExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-fitness-red to-fitness-orange flex items-center justify-center">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-fitness-red to-fitness-orange bg-clip-text text-transparent">
                    Calentamiento ({warmupExercises.length} ejercicios)
                  </h3>
                </div>
                {currentSection === "warmup" || completed ? (
                  <div className="space-y-3 animate-fade-in">
                    {warmupExercises.map((ex, idx) => {
                      const globalIndex = idx;
                      return (
                        <ExerciseCard
                          key={ex.id}
                          exercise={ex}
                          index={globalIndex}
                          isCurrent={currentExerciseIndex === globalIndex && currentSection === "warmup"}
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
                ) : (
                  <div className="p-4 rounded-lg border-2 border-dashed border-fitness-red/30 bg-fitness-red/10">
                    <p className="text-center text-fitness-red font-medium">
                      {warmupExercises.length} ejercicios de calentamiento preparados
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Skill Work Section */}
            {skillWorkExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-fitness-blue to-fitness-red flex items-center justify-center">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-fitness-blue to-fitness-red bg-clip-text text-transparent">
                    Trabajo de Técnica ({skillWorkExercises.length} ejercicios)
                  </h3>
                </div>
                {currentSection === "skill_work" || completed ? (
                  <div className="space-y-3 animate-fade-in">
                    {skillWorkExercises.map((ex, idx) => {
                      const globalIndex = warmupExercises.length + idx;
                      return (
                        <ExerciseCard
                          key={ex.id}
                          exercise={ex}
                          index={globalIndex}
                          isCurrent={currentExerciseIndex === globalIndex && currentSection === "skill_work"}
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
                ) : (
                  <div className="p-4 rounded-lg border-2 border-dashed border-fitness-blue/30 bg-fitness-blue/10">
                    <p className="text-center text-fitness-blue font-medium">
                      {skillWorkExercises.length} ejercicios de técnica preparados
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Main Workout */}
            {mainExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-fitness-orange to-fitness-red flex items-center justify-center">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-fitness-orange to-fitness-red bg-clip-text text-transparent">
                    Entrenamiento Principal
                  </h3>
                </div>
                
                {currentSection === "main" && (
                  <div className="text-center p-4 bg-fitness-orange/20 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
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
                )}
                
                {currentSection !== "main" && !isMainWorkoutRunning && mainWorkoutTimeLeft > 0 && (
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

            {/* Secondary WOD */}
            {secondaryExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-fitness-orange to-fitness-red flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-fitness-orange to-fitness-red bg-clip-text text-transparent">
                    {isAmrapSection ? "AMRAP" : "Entrenamiento Secundario"}
                  </h3>
                </div>

                {/* AMRAP Timer */}
                {isAmrapSection && (
                  <div className="text-center p-4 bg-fitness-orange/20 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-fitness-orange" />
                      <span className="text-2xl sm:text-4xl font-bold text-fitness-orange">
                        {formatTime(amrapTimeLeft)}
                      </span>
                    </div>
                    <p className="text-sm sm:text-lg font-semibold text-fitness-orange mb-2">
                      AMRAP - Tantas rondas como sea posible
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-fitness-orange">
                      Rondas completadas: {amrapRounds}
                    </p>
                    {isAmrapRunning && (
                      <Button 
                        onClick={incrementAmrapRounds}
                        className="mt-3 bg-green-600 text-white hover:bg-green-700 text-sm sm:text-base"
                        size="default"
                      >
                        <CheckCircle className="mr-2 w-4 h-4" /> +1 Ronda Completada
                      </Button>
                    )}
                  </div>
                )}

                {currentSection === "secondary" || completed ? (
                  <div className="space-y-3 animate-fade-in">
                    {secondaryExercises.map((ex, idx) => {
                      const globalIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + idx;
                      return (
                        <ExerciseCard
                          key={ex.id}
                          exercise={ex}
                          index={globalIndex}
                          isCurrent={currentExerciseIndex === globalIndex && currentSection === "secondary"}
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
                ) : (
                  <div className="p-4 rounded-lg border-2 border-dashed border-fitness-orange/30 bg-fitness-orange/10">
                    <p className="text-center text-fitness-orange font-medium">
                      {secondaryExercises.length} ejercicios secundarios preparados
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Cooldown Section */}
            {cooldownExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-fitness-blue flex items-center justify-center">
                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-fitness-blue bg-clip-text text-transparent">
                    Enfriamiento ({cooldownExercises.length} ejercicios)
                  </h3>
                </div>
                {currentSection === "cooldown" || completed ? (
                  <div className="space-y-3 animate-fade-in">
                    {cooldownExercises.map((ex, idx) => {
                      const globalIndex = warmupExercises.length + skillWorkExercises.length + (5 * mainExercises.length) + secondaryExercises.length + idx;
                      return (
                        <ExerciseCard
                          key={ex.id}
                          exercise={ex}
                          index={globalIndex}
                          isCurrent={currentExerciseIndex === globalIndex && currentSection === "cooldown"}
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
                ) : (
                  <div className="p-4 rounded-lg border-2 border-dashed border-purple-500/30 bg-purple-500/10">
                    <p className="text-center text-purple-600 font-medium">
                      {cooldownExercises.length} ejercicios de enfriamiento preparados
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Completion Screen */}
            {completed && (
              <div className="text-center p-6 sm:p-8 bg-gradient-to-r from-green-500/20 to-fitness-orange/20 rounded-lg">
                <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">
                  ¡Entrenamiento Completado!
                </h2>
                <p className="text-base sm:text-lg mb-4 text-muted-foreground">
                  Tiempo total: <span className="font-bold text-fitness-orange">{formatTime(workout.duration * 60 - totalTimeLeft)}</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {warmupExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-red/20 text-fitness-red text-xs">
                      Calentamiento: {warmupExercises.length} ejercicios
                    </Badge>
                  )}
                  {skillWorkExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-blue/20 text-fitness-blue text-xs">
                      Técnica: {skillWorkExercises.length} ejercicios
                    </Badge>
                  )}
                  {mainExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange text-xs">
                      Principal: 5 rondas completadas
                    </Badge>
                  )}
                  {secondaryExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-fitness-orange/20 text-fitness-orange text-xs">
                      {isAmrapSection ? `AMRAP: ${amrapRounds} rondas` : `Secundario: ${secondaryExercises.length} ejercicios`}
                    </Badge>
                  )}
                  {cooldownExercises.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-600 text-xs">
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
          <span className="flex items-center flex-wrap gap-2">
            <h4 className={`font-semibold text-sm sm:text-base leading-tight ${
              isCurrent ? `text-${sectionColors[exercise.section]}` : isCompleted ? "text-green-600" : ""
            }`}>
              {exercise.name}
            </h4>
            {exercise.image_url && exercise.image_url !== "/assets/placeholder-exercise.jpg" && (
              <Button
                onClick={() => navigate(`/exercise-library?search=${encodeURIComponent(exercise.name)}`)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                title={`Ver demostración de ${exercise.name}`}
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