import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number | string;
  notes?: string;
  scaling?: string;
  image_url?: string;
  video_url?: string;
  weight?: number;
  weight_unit?: string;
  distance?: number;
  distance_unit?: string;
}

interface ExerciseEditorProps {
  exercises: Exercise[];
  onUpdate: (exercises: Exercise[]) => void;
  availableExercises?: any[];
}

export const ExerciseEditor = ({ exercises, onUpdate, availableExercises = [] }: ExerciseEditorProps) => {
  const addExercise = () => {
    const newExercise: Exercise = {
      name: "",
      sets: 1,
      reps: 1,
      notes: "",
      scaling: "",
      weight: 0,
      weight_unit: "kg",
      distance: 0,
      distance_unit: "m"
    };
    onUpdate([...exercises, newExercise]);
  };

  const removeExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = exercises.map((exercise, i) => 
      i === index ? { ...exercise, [field]: value } : exercise
    );
    onUpdate(updated);
  };

  const selectFromLibrary = (index: number, selectedExercise: any) => {
    updateExercise(index, 'name', selectedExercise.name);
    if (selectedExercise.image_url) {
      updateExercise(index, 'image_url', selectedExercise.image_url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Ejercicios</h4>
        <Button onClick={addExercise} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Ejercicio
        </Button>
      </div>

      {exercises.map((exercise, index) => (
        <Card key={index} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Ejercicio {index + 1}</CardTitle>
              <Button
                onClick={() => removeExercise(index)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Ejercicio</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre del ejercicio"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                  />
                  {availableExercises.length > 0 && (
                    <Select onValueChange={(value) => {
                      const selected = availableExercises.find(ex => ex.id === value);
                      if (selected) selectFromLibrary(index, selected);
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Biblioteca" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableExercises.map((ex) => (
                          <SelectItem key={ex.id} value={ex.id}>
                            {ex.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sets</Label>
                <Input
                  type="number"
                  min="1"
                  value={exercise.sets || 1}
                  onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Repeticiones</Label>
                <Input
                  placeholder="10 o AMRAP"
                  value={exercise.reps || ""}
                  onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Peso</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={exercise.weight || ""}
                    onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value))}
                  />
                  <Select 
                    value={exercise.weight_unit || "kg"} 
                    onValueChange={(value) => updateExercise(index, 'weight_unit', value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="%BW">%BW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Distancia</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={exercise.distance || ""}
                    onChange={(e) => updateExercise(index, 'distance', parseFloat(e.target.value))}
                  />
                  <Select 
                    value={exercise.distance_unit || "m"} 
                    onValueChange={(value) => updateExercise(index, 'distance_unit', value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="km">km</SelectItem>
                      <SelectItem value="cal">cal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notas Técnicas</Label>
                <Textarea
                  placeholder="Instrucciones técnicas del ejercicio"
                  value={exercise.notes || ""}
                  onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Opciones de Escalamiento</Label>
                <Textarea
                  placeholder="Modificaciones para diferentes niveles"
                  value={exercise.scaling || ""}
                  onChange={(e) => updateExercise(index, 'scaling', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>URL de Imagen (Opcional)</Label>
                <Input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={exercise.image_url || ""}
                  onChange={(e) => updateExercise(index, 'image_url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>URL de Video (Opcional)</Label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={exercise.video_url || ""}
                  onChange={(e) => updateExercise(index, 'video_url', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {exercises.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No hay ejercicios agregados</p>
              <Button onClick={addExercise} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Ejercicio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};