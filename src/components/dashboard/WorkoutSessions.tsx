import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Eye, Dumbbell, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface WorkoutSession {
  id: string;
  title: string;
  description: string | null;
  exercises: any;
  total_time: number | null;
  date: string;
  completed_at: string;
}

interface WorkoutSessionsProps {
  userId: string;
  onEditSession?: (session: WorkoutSession) => void;
}

export const WorkoutSessions = ({ userId, onEditSession }: WorkoutSessionsProps) => {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkoutSessions();
  }, [userId]);

  const fetchWorkoutSessions = async () => {
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching workout sessions:', error);
    } else if (data) {
      setWorkoutSessions(data);
    }

    setLoading(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) {
      return;
    }

    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el entrenamiento",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Entrenamiento eliminado",
        description: "El entrenamiento se ha eliminado correctamente"
      });
      fetchWorkoutSessions();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (workoutSessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No tienes entrenamientos registrados aún</p>
        <p className="text-sm text-muted-foreground mt-1">¡Registra tu primer entrenamiento!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {workoutSessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{session.title}</h3>
                    {session.total_time && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(session.total_time)}
                      </Badge>
                    )}
                  </div>
                  
                  {session.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {session.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(session.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                    <span>
                      {Array.isArray(session.exercises) ? session.exercises.length : 0} ejercicios
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSession(session)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  {onEditSession && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditSession(session)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workout Session Detail Modal */}
      {selectedSession && (
        <WorkoutSessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </>
  );
};

interface WorkoutSessionDetailProps {
  session: WorkoutSession;
  onClose: () => void;
}

const WorkoutSessionDetail = ({ session, onClose }: WorkoutSessionDetailProps) => {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {session.title}
              </CardTitle>
              <CardDescription>
                {format(new Date(session.date), "d 'de' MMMM, yyyy", { locale: es })}
                {session.total_time && (
                  <span className="ml-2">• Duración: {formatDuration(session.total_time)}</span>
                )}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {session.description && (
            <div>
              <h4 className="font-medium mb-2">Descripción</h4>
              <p className="text-muted-foreground">{session.description}</p>
            </div>
          )}
          
            <div>
              <h4 className="font-medium mb-4">Ejercicios Realizados</h4>
              <div className="space-y-4">
                {Array.isArray(session.exercises) && session.exercises.length > 0 ? (
                  session.exercises.map((exercise: any, index: number) => (
                    <Card key={index} className="border-dashed">
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-3">{exercise.name || 'Ejercicio sin nombre'}</h5>
                        
                        {exercise.sets && Array.isArray(exercise.sets) && exercise.sets.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Series:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {exercise.sets.map((set: any, setIndex: number) => (
                                <div key={setIndex} className="bg-muted/50 p-2 rounded text-sm">
                                  <div className="font-medium">Serie {setIndex + 1}</div>
                                  {set.reps && <div>Reps: {set.reps}</div>}
                                  {set.weight && <div>Peso: {set.weight} kg</div>}
                                  {set.time && <div>Tiempo: {set.time}s</div>}
                                  {set.distance && <div>Distancia: {set.distance}m</div>}
                                  {set.calories && <div>Calorías: {set.calories}</div>}
                                  {set.rest && <div>Descanso: {set.rest}s</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin series registradas</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No hay ejercicios registrados</p>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};