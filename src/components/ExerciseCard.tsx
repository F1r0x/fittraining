import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExerciseCardProps {
  exercise: {
    name: string;
    sets?: number;
    reps?: number | string;
    duration?: number;
    notes?: string;
    scaling?: string;
    image_url?: string;
  };
  isCompleted?: boolean;
  formatTime: (seconds: number | undefined) => string;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isCompleted = false,
  formatTime,
}) => {
  return (
    <Card className={`mb-2 p-4 ${isCompleted ? "opacity-50" : ""}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {exercise.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exercise.sets !== undefined && exercise.reps !== undefined && (
          <p className="text-sm mb-1">
            {exercise.sets} sets x {exercise.reps}
          </p>
        )}
        {exercise.duration !== undefined && (
          <p className="text-sm mb-1">⏱ {formatTime(exercise.duration)}</p>
        )}
        {exercise.notes && (
          <p className="text-sm italic mb-1">📋 {exercise.notes}</p>
        )}
        {exercise.scaling && (
          <p className="text-sm mb-1">⚡ {exercise.scaling}</p>
        )}
        {exercise.image_url && (
          <img
            src={exercise.image_url}
            alt={exercise.name}
            className="w-full h-32 object-contain mt-2 rounded"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseCard;
