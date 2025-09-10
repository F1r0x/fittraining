import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkoutType {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit2?: string | null;
}

interface WorkoutFormProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const WorkoutForm = ({ userId, onClose, onSuccess }: WorkoutFormProps) => {
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState(""); // para la segunda unidad
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkoutTypes();
  }, []);

  const fetchWorkoutTypes = async () => {
    const { data } = await supabase
      .from('workout_types')
      .select('*')
      .order('category', { ascending: true });

    if (data) setWorkoutTypes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !value) return;

    setLoading(true);

    // Check if there's already a record for this exercise type
    const { data: existingRecord, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('workout_type_id', selectedType.id)
      .single();

    const newValue = parseFloat(value);
    const newValue2 = value2 ? parseFloat(value2) : null;

    // Check if this is a new personal record
    let isNewRecord = false;
    if (!existingRecord || fetchError) {
      isNewRecord = true;
    } else {
      // Compare based on the exercise type to determine if it's a PR
      if (selectedType.unit === 'weight' || selectedType.unit === 'reps') {
        isNewRecord = newValue > existingRecord.value;
      } else if (selectedType.unit === 'time') {
        isNewRecord = newValue < existingRecord.value; // For time, lower is better
      } else if (selectedType.unit === 'distance') {
        isNewRecord = newValue > existingRecord.value;
      }
    }

    let error;
    if (existingRecord && isNewRecord) {
      // Update existing record with new PR
      ({ error } = await supabase
        .from('workouts')
        .update({
          value: newValue,
          value2: newValue2,
          notes: notes.trim() || null,
          date
        })
        .eq('id', existingRecord.id));
    } else if (!existingRecord) {
      // Insert new record
      ({ error } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          workout_type_id: selectedType.id,
          value: newValue,
          value2: newValue2,
          notes: notes.trim() || null,
          date
        }));
    }

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el Personal Record",
        variant: "destructive",
      });
    } else if (isNewRecord) {
      toast({
        title: "¡Nuevo Personal Record! 🏆",
        description: `Has establecido un nuevo PR en ${selectedType.name}`,
      });
      onSuccess();
      onClose();
    } else if (!isNewRecord && existingRecord) {
      toast({
        title: "No es un Personal Record",
        description: `Tu mejor marca sigue siendo ${existingRecord.value} ${getUnitLabel(selectedType.unit)}`,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'reps': return 'repeticiones';
      case 'time': return 'segundos';
      case 'weight': return 'kilogramos';
      case 'distance': return 'metros';
      case 'cals': return 'calorías';
      default: return unit;
    }
  };

  const groupedWorkoutTypes = workoutTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, WorkoutType[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registrar Personal Record</CardTitle>
              <CardDescription>Registra tu mejor marca en un ejercicio</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Select de tipo de ejercicio */}
            <div className="space-y-2">
              <Label htmlFor="workout-type">Tipo de Ejercicio</Label>
              <Select onValueChange={(value) => setSelectedType(workoutTypes.find(t => t.id === value) || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un ejercicio" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedWorkoutTypes).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor principal */}
            {selectedType && (
              <div className="space-y-2">
                <Label htmlFor="value">Valor ({getUnitLabel(selectedType.unit)})</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.1"
                  placeholder={`Ingresa el valor en ${getUnitLabel(selectedType.unit)}`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Segunda unidad si existe */}
            {selectedType?.unit2 && (
              <div className="space-y-2">
                <Label htmlFor="value2">Valor ({getUnitLabel(selectedType.unit2)})</Label>
                <Input
                  id="value2"
                  type="number"
                  step="0.1"
                  placeholder={`Ingresa el valor en ${getUnitLabel(selectedType.unit2)}`}
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                />
              </div>
            )}

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea id="notes" placeholder="Contexto del PR, condiciones, etc..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none" />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={!selectedType || !value || loading} className="flex-1 bg-gradient-primary hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Registrar PR'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
