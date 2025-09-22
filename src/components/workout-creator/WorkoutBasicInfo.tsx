import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WorkoutBasicInfoProps {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  duration: number;
  scheduledDate?: string;
  onUpdate: (field: string, value: string | number | undefined) => void;
}

export const WorkoutBasicInfo = ({
  title,
  description,
  type,
  difficulty,
  duration,
  scheduledDate,
  onUpdate
}: WorkoutBasicInfoProps) => {
  const selectedDate = scheduledDate ? new Date(scheduledDate) : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Básica del Entrenamiento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Entrenamiento</Label>
            <Input
              id="title"
              placeholder="Ej: ULTIMATE BURN"
              value={title}
              onChange={(e) => onUpdate('title', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Entrenamiento</Label>
            <Select value={type} onValueChange={(value) => onUpdate('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrenamiento Diario">Entrenamiento Diario</SelectItem>
                <SelectItem value="WOD CrossFit">WOD CrossFit</SelectItem>
                <SelectItem value="Gimnasio">Gimnasio</SelectItem>
                <SelectItem value="Cardio">Cardio</SelectItem>
                <SelectItem value="Fuerza">Fuerza</SelectItem>
                <SelectItem value="Resistencia">Resistencia</SelectItem>
                <SelectItem value="Movilidad">Movilidad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Dificultad</Label>
            <Select value={difficulty} onValueChange={(value) => onUpdate('difficulty', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar dificultad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Principiante">Principiante</SelectItem>
                <SelectItem value="Intermedio">Intermedio</SelectItem>
                <SelectItem value="Avanzado">Avanzado</SelectItem>
                <SelectItem value="Elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="180"
              value={duration}
              onChange={(e) => onUpdate('duration', parseInt(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción del Entrenamiento</Label>
          <Textarea
            id="description"
            placeholder="Describe el entrenamiento, objetivos y enfoque..."
            value={description}
            onChange={(e) => onUpdate('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Fecha Programada (Opcional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => onUpdate('scheduled_date', date?.toISOString().split('T')[0])}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};