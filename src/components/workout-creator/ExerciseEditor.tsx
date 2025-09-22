import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { X, Plus } from "lucide-react";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number | string;
  notes?: string;
  scaling?: string;
  image_url?: string;
  weight?: number;
  weight_unit?: string;
  distance?: number;
  distance_unit?: string;
  time?: number;
  time_unit?: string;
  measure1_value?: number;
  measure1_unit?: string;
  measure2_value?: number;
  measure2_unit?: string;
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
      notes: "",
      scaling: "",
      measure1_value: undefined,
      measure1_unit: "",
      measure2_value: undefined,
      measure2_unit: ""
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

  // Helper function to update exercise values based on measure unit
  const updateExerciseMeasure = (index: number, measureField: 'measure1' | 'measure2', value: number, unit: string) => {
    const updated = exercises.map((exercise, i) => {
      if (i !== index) return exercise;
      
      const updatedExercise = { ...exercise };
      
      // Clear previous values for this measure
      if (measureField === 'measure1') {
        updatedExercise.measure1_value = value;
        updatedExercise.measure1_unit = unit;
      } else {
        updatedExercise.measure2_value = value;
        updatedExercise.measure2_unit = unit;
      }
      
      // Map to appropriate fields based on unit
      switch (unit) {
        case 'reps':
          updatedExercise.reps = value;
          break;
        case 'kg':
        case 'lb':
        case '%BW':
        case '%PR':
          updatedExercise.weight = value;
          updatedExercise.weight_unit = unit;
          break;
        case 'm':
        case 'km':
        case 'cal':
          updatedExercise.distance = value;
          updatedExercise.distance_unit = unit;
          break;
        case 'seg':
        case 'min':
          updatedExercise.time = value;
          updatedExercise.time_unit = unit;
          break;
      }
      
      return updatedExercise;
    });
    onUpdate(updated);
  };

  const unitOptions = [
    { value: 'reps', label: 'Repeticiones' },
    { value: 'kg', label: 'Kilogramos' },
    { value: 'lb', label: 'Libras' },
    { value: '%BW', label: '% Peso Corporal' },
    { value: '%PR', label: '% PR' },
    { value: 'm', label: 'Metros' },
    { value: 'km', label: 'Kilómetros' },
    { value: 'cal', label: 'Calorías' },
    { value: 'seg', label: 'Segundos' },
    { value: 'min', label: 'Minutos' },
  ];

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
                <Combobox
                  value={exercise.name}
                  onValueChange={(value) => {
                    updateExercise(index, 'name', value);
                    // Si se selecciona de la biblioteca, cargar datos adicionales
                    const selected = availableExercises.find(ex => ex.name === value);
                    if (selected) {
                      selectFromLibrary(index, selected);
                    }
                  }}
                  options={[
                    ...availableExercises.map(ex => ({
                      value: ex.name,
                      label: ex.name
                    }))
                  ]}
                  placeholder="Escribir o seleccionar ejercicio..."
                  searchPlaceholder="Buscar o escribir ejercicio..."
                  emptyText="Escriba el nombre del ejercicio"
                />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medida 1</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Valor"
                    value={exercise.measure1_value || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && exercise.measure1_unit) {
                        updateExerciseMeasure(index, 'measure1', value, exercise.measure1_unit);
                      } else {
                        updateExercise(index, 'measure1_value', value);
                      }
                    }}
                  />
                  <Select 
                    value={exercise.measure1_unit || ""} 
                    onValueChange={(unit) => {
                      const value = exercise.measure1_value;
                      if (value && !isNaN(value)) {
                        updateExerciseMeasure(index, 'measure1', value, unit);
                      } else {
                        updateExercise(index, 'measure1_unit', unit);
                      }
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medida 2 (Opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Valor"
                    value={exercise.measure2_value || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && exercise.measure2_unit) {
                        updateExerciseMeasure(index, 'measure2', value, exercise.measure2_unit);
                      } else {
                        updateExercise(index, 'measure2_value', value);
                      }
                    }}
                  />
                  <Select 
                    value={exercise.measure2_unit || ""} 
                    onValueChange={(unit) => {
                      const value = exercise.measure2_value;
                      if (value && !isNaN(value)) {
                        updateExerciseMeasure(index, 'measure2', value, unit);
                      } else {
                        updateExercise(index, 'measure2_unit', unit);
                      }
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>URL de Imagen (Opcional)</Label>
                <Input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={exercise.image_url || ""}
                  onChange={(e) => updateExercise(index, 'image_url', e.target.value)}
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