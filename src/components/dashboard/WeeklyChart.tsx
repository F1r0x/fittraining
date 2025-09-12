import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WeeklyChartProps {
  userId: string;
  filterType?: "CrossTraining" | "Fitness";
}

export const WeeklyChart = ({ userId, filterType }: WeeklyChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyData();
  }, [userId, filterType]);

  const fetchWeeklyData = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('date, completed_at, title')
      .eq('user_id', userId);

    if (data && !error) {
      let filteredData = data;
      
      // Apply filter if specified
      if (filterType) {
        filteredData = data.filter(workout => {
          if (filterType === 'CrossTraining') {
            return !workout.title.toLowerCase().includes('fitness') && 
                   !workout.title.toLowerCase().includes('gym');
          } else if (filterType === 'Fitness') {
            return workout.title.toLowerCase().includes('fitness') ||
                   workout.title.toLowerCase().includes('gym');
          }
          return true;
        });
      }
      
      // Get last 7 days
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        last7Days.push({
          date: date.toISOString().split('T')[0],
          day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
          workouts: 0
        });
      }

      // Count workouts per day
      filteredData.forEach(workout => {
        const workoutDate = workout.date;
        const dayData = last7Days.find(day => day.date === workoutDate);
        if (dayData) {
          dayData.workouts++;
        }
      });

      setChartData(last7Days);
    }
    
    setLoading(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            {payload[0].value} entrenamiento{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-40 w-full bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="day" 
            className="text-xs"
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            className="text-xs"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="workouts" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            className="fill-primary"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};