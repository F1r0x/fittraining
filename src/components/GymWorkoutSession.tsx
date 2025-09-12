import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Dumbbell,
  ArrowLeft,
  Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GymWorkoutData {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  type: string;
  warmup: string[];
  main_workout: {
    description: string;
    exercises: string[];
  };
}

const GymWorkoutSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const workout = location.state?.workout as GymWorkoutData;
  
  const [currentPhase, setCurrentPhase] = useState<'warmup' | 'main' | 'completed'>('warmup');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!workout) {
      navigate('/fitness');
      return;
    }
  }, [workout, navigate]);

  if (!workout) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentExercises = () => {
    return currentPhase === 'warmup' ? workout.warmup : workout.main_workout.exercises;
  };

  const getCurrentExercise = () => {
    const exercises = getCurrentExercises();
    return exercises[currentExerciseIndex] || '';
  };

  const getPhaseProgress = () => {
    const exercises = getCurrentExercises();
    return ((currentExerciseIndex + 1) / exercises.length) * 100;
  };

  const getTotalProgress = () => {
    const totalExercises = workout.warmup.length + workout.main_workout.exercises.length;
    let completedCount = 0;
    
    if (currentPhase === 'main') {
      completedCount = workout.warmup.length + currentExerciseIndex + 1;
    } else if (currentPhase === 'completed') {
      completedCount = totalExercises;
    } else {
      completedCount = currentExerciseIndex + 1;
    }
    
    return (completedCount / totalExercises) * 100;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimer(0);
  };

  const handleNextExercise = () => {
    const exercises = getCurrentExercises();
    const exerciseKey = currentPhase === 'warmup' ? currentExerciseIndex : workout.warmup.length + currentExerciseIndex;
    
    if (!completedExercises.includes(exerciseKey)) {
      setCompletedExercises([...completedExercises, exerciseKey]);
    }

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      if (currentPhase === 'warmup') {
        setCurrentPhase('main');
        setCurrentExerciseIndex(0);
        toast({
          title: "¡Calentamiento Completado!",
          description: "Ahora comenzamos con la rutina principal. ¡Vamos!",
        });
      } else {
        setCurrentPhase('completed');
        setIsRunning(false);
        toast({
          title: "¡Entrenamiento Completado!",
          description: `¡Excelente trabajo! Has completado tu sesión de ${workout.title}`,
        });
      }
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    } else if (currentPhase === 'main') {
      setCurrentPhase('warmup');
      setCurrentExerciseIndex(workout.warmup.length - 1);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // Guardar el entrenamiento en la base de datos
      const allExercises = [...workout.warmup, ...workout.main_workout.exercises];
      
      const { error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          title: `${workout.title} - Fitness`,
          description: `${workout.description}. Dificultad: ${workout.difficulty}. Tipo: ${workout.type}`,
          exercises: allExercises.map((exercise, index) => ({
            name: exercise,
            completed: true,
            order: index + 1
          })),
          total_time: timer,
          date: new Date().toISOString().split('T')[0],
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving workout:', error);
        toast({
          title: "Error",
          description: "Hubo un problema al registrar tu entrenamiento.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Sesión Registrada!",
          description: "Tu entrenamiento de fitness ha sido registrado exitosamente.",
        });
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al registrar tu entrenamiento.",
        variant: "destructive",
      });
    }

    navigate('/dashboard');
  };

  if (currentPhase === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-gym-hero py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-gym-intense text-center">
            <CardHeader className="pb-6">
              <div className="w-16 h-16 bg-gradient-gym-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-black mb-2">
                <span className="bg-gradient-gym-primary bg-clip-text text-transparent">
                  ¡FELICITACIONES!
                </span>
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                Has completado tu entrenamiento de {workout.title}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-gym-stats rounded-lg">
                  <div className="text-2xl font-bold text-gym-primary">{formatTime(timer)}</div>
                  <div className="text-sm text-muted-foreground">Tiempo Total</div>
                </div>
                <div className="p-4 bg-gradient-gym-stats rounded-lg">
                  <div className="text-2xl font-bold text-gym-accent">{workout.warmup.length + workout.main_workout.exercises.length}</div>
                  <div className="text-sm text-muted-foreground">Ejercicios Completados</div>
                </div>
              </div>
              
              <Button
                onClick={handleCompleteWorkout}
                size="lg"
                className="w-full bg-gradient-gym-primary hover:opacity-90 transition-all transform hover:scale-105"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Finalizar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-gym-hero py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/fitness')}
            className="border-gym-primary text-gym-primary hover:bg-gym-primary hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-1">{workout.title}</h1>
            <Badge variant="outline" className="border-gym-primary text-gym-primary">
              {currentPhase === 'warmup' ? 'Calentamiento' : 'Rutina Principal'}
            </Badge>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gym-primary">{formatTime(timer)}</div>
            <div className="text-sm text-muted-foreground">Tiempo</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="mb-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progreso Total</span>
              <span className="text-gym-primary font-medium">{Math.round(getTotalProgress())}%</span>
            </div>
            <Progress value={getTotalProgress()} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {currentPhase === 'warmup' ? 'Calentamiento' : 'Rutina Principal'}
              </span>
              <span className="text-gym-accent font-medium">{Math.round(getPhaseProgress())}%</span>
            </div>
            <Progress value={getPhaseProgress()} className="h-2" />
          </div>
        </div>

        {/* Current Exercise */}
        <Card className="mb-6 bg-card/60 backdrop-blur-xl border-0 shadow-gym-workout">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-gym-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl mb-2">
              Ejercicio {currentExerciseIndex + 1} de {getCurrentExercises().length}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="p-6 bg-gradient-gym-workout rounded-xl">
              <p className="text-lg font-medium text-foreground leading-relaxed">
                {getCurrentExercise()}
              </p>
            </div>
            
            {/* Timer Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={isRunning ? handlePause : handleStart}
                size="lg"
                className="bg-gym-primary hover:bg-gym-secondary"
              >
                {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isRunning ? 'Pausar' : 'Iniciar'}
              </Button>
              
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="border-gym-primary text-gym-primary hover:bg-gym-primary hover:text-white"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reiniciar
              </Button>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0 && currentPhase === 'warmup'}
                variant="outline"
                className="border-gym-accent text-gym-accent hover:bg-gym-accent hover:text-white"
              >
                Anterior
              </Button>
              
              <Button
                onClick={handleNextExercise}
                className="bg-gradient-gym-primary hover:opacity-90"
              >
                {currentExerciseIndex === getCurrentExercises().length - 1 
                  ? (currentPhase === 'warmup' ? 'Ir a Principal' : 'Completar') 
                  : 'Siguiente'}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exercise List */}
        <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-gym-workout">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gym-primary" />
              <span>Lista de Ejercicios</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {getCurrentExercises().map((exercise, index) => {
                const exerciseKey = currentPhase === 'warmup' ? index : workout.warmup.length + index;
                const isCompleted = completedExercises.includes(exerciseKey);
                const isCurrent = index === currentExerciseIndex;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-gym-primary/20 border border-gym-primary/40' 
                        : isCompleted 
                        ? 'bg-gym-accent/10 border border-gym-accent/20' 
                        : 'bg-gym-muted/20 border border-gym-muted/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCompleted 
                        ? 'bg-gym-accent text-white' 
                        : isCurrent 
                        ? 'bg-gym-primary text-white' 
                        : 'bg-gym-muted text-gym-accent'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className={`flex-1 ${
                      isCompleted ? 'text-gym-accent line-through' : 'text-foreground'
                    } ${isCurrent ? 'font-medium' : ''}`}>
                      {exercise}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GymWorkoutSession;