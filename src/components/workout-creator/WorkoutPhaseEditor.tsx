import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { ExerciseEditor } from "./ExerciseEditor";

interface WorkoutPhase {
  time_type?: string;
  time_params?: {
    minutes?: number;
    cap?: number;
    description?: string;
  };
  exercises: any[];
  description?: string;
  skill_work?: string[];
  accessory_work?: string[];
  rounds?: number;
  instructions?: string[];
}

interface WorkoutPhaseEditorProps {
  title: string;
  phase: WorkoutPhase;
  onUpdate: (phase: WorkoutPhase) => void;
  availableExercises?: any[];
}

export const WorkoutPhaseEditor = ({ title, phase, onUpdate, availableExercises }: WorkoutPhaseEditorProps) => {
  const updatePhase = (field: keyof WorkoutPhase, value: any) => {
    onUpdate({ ...phase, [field]: value });
  };

  const updateTimeParams = (field: string, value: any) => {
    const timeParams = { ...phase.time_params, [field]: value };
    onUpdate({ ...phase, time_params: timeParams });
  };

  const addToArray = (arrayName: 'skill_work' | 'accessory_work' | 'instructions', value: string) => {
    if (!value.trim()) return;
    const current = phase[arrayName] || [];
    updatePhase(arrayName, [...current, value.trim()]);
  };

  const removeFromArray = (arrayName: 'skill_work' | 'accessory_work' | 'instructions', index: number) => {
    const current = phase[arrayName] || [];
    updatePhase(arrayName, current.filter((_, i) => i !== index));
  };

  const ArrayEditor = ({ 
    arrayName, 
    label, 
    placeholder 
  }: { 
    arrayName: 'skill_work' | 'accessory_work' | 'instructions';
    label: string;
    placeholder: string;
  }) => {
    const items = phase[arrayName] || [];
    const [newItem, setNewItem] = useState("");

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray(arrayName, newItem);
                setNewItem("");
              }
            }}
          />
          <Button
            onClick={() => {
              addToArray(arrayName, newItem);
              setNewItem("");
            }}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {item}
                <Button
                  onClick={() => removeFromArray(arrayName, index)}
                  size="sm"
                  variant="ghost"
                  className="h-auto p-0 ml-2 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="outline" className="text-xs">
            {phase.time_type || 'Sin configurar'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuración de Tiempo */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Configuración de Tiempo</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Entrenamiento</Label>
              <Select 
                value={phase.time_type || ""} 
                onValueChange={(value) => updatePhase('time_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="For Time">For Time</SelectItem>
                  <SelectItem value="AMRAP">AMRAP</SelectItem>
                  <SelectItem value="EMOM">EMOM</SelectItem>
                  <SelectItem value="Tabata">Tabata</SelectItem>
                  <SelectItem value="Rest">Rest</SelectItem>
                  <SelectItem value="Rounds">Rounds</SelectItem>
                  <SelectItem value="Chipper">Chipper</SelectItem>
                  <SelectItem value="Ladder">Ladder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                min="1"
                value={phase.time_params?.minutes || ""}
                onChange={(e) => updateTimeParams('minutes', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tiempo Límite (minutos)</Label>
              <Input
                type="number"
                min="1"
                value={phase.time_params?.cap || ""}
                onChange={(e) => updateTimeParams('cap', parseInt(e.target.value))}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción del Tiempo</Label>
            <Input
              placeholder="Ej: Completar en el menor tiempo posible"
              value={phase.time_params?.description || ""}
              onChange={(e) => updateTimeParams('description', e.target.value)}
            />
          </div>
        </div>

        {/* Información General */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Información General</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Descripción de la Fase</Label>
              <Textarea
                placeholder="Descripción general de esta fase del entrenamiento"
                value={phase.description || ""}
                onChange={(e) => updatePhase('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Número de Rondas</Label>
              <Input
                type="number"
                min="1"
                value={phase.rounds || ""}
                onChange={(e) => updatePhase('rounds', parseInt(e.target.value))}
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>

        {/* Arrays de Configuración */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Configuración Adicional</h4>
          <div className="grid grid-cols-1 gap-4">
            <ArrayEditor
              arrayName="skill_work"
              label="Trabajo de Técnica"
              placeholder="Ej: 3 min técnica de snatch"
            />
            
            <ArrayEditor
              arrayName="accessory_work"
              label="Trabajo Accesorio"
              placeholder="Ej: 2 sets de hollow holds"
            />
            
            <ArrayEditor
              arrayName="instructions"
              label="Instrucciones Específicas"
              placeholder="Ej: Mantener buena forma en todo momento"
            />
          </div>
        </div>

        {/* Editor de Ejercicios */}
        <div className="space-y-4">
          <ExerciseEditor
            exercises={phase.exercises}
            onUpdate={(exercises) => updatePhase('exercises', exercises)}
            availableExercises={availableExercises}
          />
        </div>
      </CardContent>
    </Card>
  );
};
