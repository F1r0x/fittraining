import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Calendar, Award, Activity } from "lucide-react";
import { WorkoutForm } from "@/components/dashboard/WorkoutForm";
import { WorkoutStats } from "@/components/dashboard/WorkoutStats";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
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
    if (!user) return;

    // Total workouts
    const { count: totalWorkouts } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // This week workouts
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { count: thisWeek } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', oneWeekAgo.toISOString().split('T')[0]);

    // Favorite category
    const { data: categoryData } = await supabase
      .from('workouts')
      .select(`
        workout_types!inner(category)
      `)
      .eq('user_id', user.id);

    let favoriteCategory = 'N/A';
    if (categoryData && categoryData.length > 0) {
      const categoryCount: { [key: string]: number } = {};
      categoryData.forEach((item: any) => {
        const category = item.workout_types.category;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b
      ) || 'N/A';
    }

    setStats({
      totalWorkouts: totalWorkouts || 0,
      thisWeek: thisWeek || 0,
      streak: Math.min(thisWeek || 0, 7), // Simple streak calculation
      favoriteCategory
    });
  };

  const refreshData = () => {
    fetchStats();
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

        {/* Add Workout Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowWorkoutForm(true)}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Registrar Entrenamiento
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Progress Chart */}
          <Card className="lg:col-span-2">
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

          {/* Workout Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutStats userId={user.id} />
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle>Entrenamientos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentWorkouts userId={user.id} onUpdate={refreshData} />
            </CardContent>
          </Card>
        </div>

        {/* Workout Form Modal */}
        {showWorkoutForm && (
          <WorkoutForm
            userId={user.id}
            onClose={() => setShowWorkoutForm(false)}
            onSuccess={() => {
              setShowWorkoutForm(false);
              refreshData();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;