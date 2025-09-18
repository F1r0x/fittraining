import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Calendar, Award, Activity, Dumbbell, Target, BarChart3 } from "lucide-react";
import { WorkoutForm } from "@/components/dashboard/WorkoutForm";
import { ImprovedWorkoutForm } from "@/components/dashboard/ImprovedWorkoutForm";
import { WorkoutStats } from "@/components/dashboard/WorkoutStats";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import CompletedWorkouts from "@/components/dashboard/CompletedWorkouts";
import { WorkoutSessions } from "@/components/dashboard/WorkoutSessions";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showImprovedForm, setShowImprovedForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    streak: 0,
    favoriteCategory: 'N/A'
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (data) setProfile(data);
  };

  const fetchStats = async () => {
    if (!user?.id) return;
    
    // Fetch only workout_sessions (complete workouts), not PRs
    const { data: sessionData } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id);

    const sessions = sessionData || [];
    
    // Count only complete workout sessions, not individual PRs
    const totalWorkouts = sessions.length;
    
    // Get current week workouts
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyWorkouts = sessions.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= startOfWeek;
    }).length;

    // Calculate streak from sessions (main workouts)
    const sortedWorkouts = sessions
      .map(w => new Date(w.date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const workoutDate of sortedWorkouts) {
      const workoutDateOnly = new Date(workoutDate);
      workoutDateOnly.setHours(0, 0, 0, 0);
      
      if (workoutDateOnly.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (workoutDateOnly.getTime() === currentDate.getTime() + 86400000) {
        // Yesterday
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Get most frequent category from workout sessions (CrossTraining only now)
    const favoriteCategory = sessions.length > 0 ? 'CrossTraining' : 'N/A';

    setStats({
      totalWorkouts,
      thisWeek: weeklyWorkouts,
      streak,
      favoriteCategory
    });
  };

  const refreshData = () => {
    fetchStats();
  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkout(workout);
    setShowWorkoutForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Hola, {profile?.display_name || user.email}! 💪
          </h1>
          <p className="text-muted-foreground">
            Bienvenido a tu panel personal de entrenamiento
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrenamientos Totales</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalWorkouts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.thisWeek}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.streak} días</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categoría Favorita</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.favoriteCategory}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <Button
            onClick={() => setShowWorkoutForm(true)}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Award className="h-5 w-5 mr-2" />
            Registrar PR
          </Button>
          
          <Button
            onClick={() => setShowImprovedForm(true)}
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Dumbbell className="h-5 w-5 mr-2" />
            Registrar Entrenamiento
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="crosstraining" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">CrossTraining</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Records</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Progress Chart */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Progreso Semanal</CardTitle>
                  <CardDescription>
                    Tu actividad de entrenamientos en los últimos 7 días
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WeeklyChart userId={user.id} />
                </CardContent>
              </Card>

              {/* Completed Workouts Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Entrenamientos Completados</CardTitle>
                  <CardDescription>
                    Resumen de actividad reciente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompletedWorkouts userId={user.id} showBothTypes={true} />
                </CardContent>
              </Card>

              {/* Workout Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas por Categoría</CardTitle>
                  <CardDescription>
                    Distribución de tus entrenamientos por tipo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WorkoutStats userId={user.id} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CrossTraining Tab */}
            <TabsContent value="crosstraining" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progreso Semanal CrossTraining</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WeeklyChart userId={user.id} filterType="CrossTraining" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas CrossTraining</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WorkoutStats userId={user.id} />
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Entrenamientos CrossTraining</CardTitle>
                  <CardDescription>
                    Historial de tus entrenamientos de CrossTraining con opción de editar resultados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WorkoutSessions 
                    userId={user.id} 
                    onEditSession={(session) => {
                      if (session.title.includes('(Entrenamiento Diario)')) {
                        // Los entrenamientos diarios de CrossTraining se editan con DailyWorkoutEditor
                        // que ya está incluido en WorkoutSessions
                      } else {
                        setEditingSession(session);
                        setShowImprovedForm(true);
                      }
                    }}
                    filterType="CrossTraining"
                    onRefresh={refreshData}
                  />
                </CardContent>
              </Card>
            </TabsContent>

          {/* Personal Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Personal Records */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Records 🏆</CardTitle>
                  <CardDescription>
                    Tus mejores marcas por ejercicio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentWorkouts userId={user.id} onUpdate={refreshData} onEdit={handleEditWorkout} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Workout Form Modals */}
        {showWorkoutForm && (
          <WorkoutForm
            userId={user.id}
            onClose={() => {
              setShowWorkoutForm(false);
              setEditingWorkout(null);
            }}
            onSuccess={() => {
              setShowWorkoutForm(false);
              setEditingWorkout(null);
              refreshData();
            }}
            editingWorkout={editingWorkout}
          />
        )}
        
        {showImprovedForm && (
          <ImprovedWorkoutForm
            userId={user.id}
            editingSession={editingSession}
            onClose={() => {
              setShowImprovedForm(false);
              setEditingSession(null);
            }}
            onSuccess={() => {
              setShowImprovedForm(false);
              setEditingSession(null);
              refreshData();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;