import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WeeklyChartProps {
  userId: string;
}

export const WeeklyChart = ({ userId }: WeeklyChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyData();
  }, [userId]);

  const fetchWeeklyData = async () => {
    setLoading(true);
    
    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }

    const weekData = await Promise.all(
      days.map(async (date) => {
        const { count } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('date', date);

        const dayName = new Date(date).toLocaleDateString('es', { 
          weekday: 'short' 
        }).toUpperCase();

        return {
          day: dayName,
          workouts: count || 0,
          date
        };
      })
    );

    setChartData(weekData);
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