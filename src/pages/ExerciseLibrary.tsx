import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Dumbbell, Activity, Target, Clock, Weight } from "lucide-react";

// Import exercise images
import assaultBikeImg from "@/assets/assault_bike.png";
import burpeesImg from "@/assets/burpees.png";
import correrImg from "@/assets/correr.png";

interface WorkoutType {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit2: string | null;
}

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState<WorkoutType[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<WorkoutType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [searchTerm, selectedCategory, exercises]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_types")
        .select("id, name, category, unit, unit2")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching exercises:", error);
        return;
      }

      if (!data) {
        setExercises([]);
        return;
      }

      // Normalizar categorías y eliminar duplicados por nombre
      const processedData = data.map(exercise => ({
        ...exercise,
        category: exercise.category?.trim() || 'Sin categoría'
      }));

      const uniqueExercises = processedData.reduce((acc: WorkoutType[], current) => {
        const exists = acc.find(exercise => exercise.name === current.name);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      setExercises(uniqueExercises);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }

    setFilteredExercises(filtered);
  };

  const getCategories = () => {
    const categories = Array.from(new Set(exercises.map(exercise => exercise.category)));
    return categories.sort();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "fuerza": return Weight;
      case "cardio": return Activity;
      case "resistencia": return Target;
      case "db": return Dumbbell;
      default: return Dumbbell;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "fuerza": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700";
      case "cardio": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
      case "resistencia": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      case "db": return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getUnitDisplay = (unit: string, unit2?: string | null) => {
    const units = [unit, unit2].filter(Boolean);
    return units.join(" × ");
  };

  const getExerciseDescription = (name: string, category: string) => {
    const descriptions: { [key: string]: string } = {
      "Sentadillas": "Ejercicio fundamental para trabajar piernas y glúteos. Mantén la espalda recta y baja hasta que los muslos estén paralelos al suelo.",
      "Press de banca": "Ejercicio básico para pectorales. Acuéstate en el banco y presiona la barra desde el pecho hacia arriba.",
      "Back Squat": "Sentadilla con barra en la espalda. Coloca la barra en los trapecios y realiza la sentadilla manteniendo el torso erguido.",
      "Plancha": "Ejercicio isométrico para core. Mantén el cuerpo recto como una tabla, apoyándote en antebrazos y puntas de los pies.",
      "Correr": "Actividad cardiovascular básica. Mantén un ritmo constante y una postura erguida.",
      "DB Shoulder Press": "Press de hombros con mancuernas. Presiona las mancuernas desde los hombros hacia arriba.",
      "DB Snatch": "Movimiento explosivo con mancuerna desde el suelo por encima de la cabeza en un solo movimiento.",
      "DB Farmer's Carry": "Camina cargando mancuernas pesadas a los lados del cuerpo manteniendo postura erguida.",
      "DB Rows": "Remo con mancuerna. Inclínate hacia adelante y tira de la mancuerna hacia el abdomen.",
      "DB Thrusters": "Combinación de sentadilla frontal y press de hombros con mancuernas."
    };
    return descriptions[name] || `Ejercicio de ${category.toLowerCase()}. Descripción detallada próximamente disponible.`;
  };

  const getExerciseImage = (name: string) => {
    const imageMap: { [key: string]: string } = {
      "Assault Bike": assaultBikeImg,
      "Burpees": burpeesImg,
      "Correr": correrImg,
    };
    return imageMap[name] || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Biblioteca de Ejercicios</h1>
          <p className="text-muted-foreground">Descubre todos los ejercicios disponibles con instrucciones detalladas</p>
        </div>

        {/* Filtros */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar ejercicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("all")}
            >
              Todas las categorías
            </Badge>
            {getCategories().map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer ${selectedCategory === category ? "" : getCategoryColor(category)}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{exercises.length}</div>
              <div className="text-sm text-muted-foreground">Total Ejercicios</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{getCategories().length}</div>
              <div className="text-sm text-muted-foreground">Categorías</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{filteredExercises.length}</div>
              <div className="text-sm text-muted-foreground">Mostrados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">Próximamente</div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de ejercicios */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => {
            const CategoryIcon = getCategoryIcon(exercise.category);
            return (
              <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                        <Badge variant="outline" className={`text-xs mt-1 ${getCategoryColor(exercise.category)}`}>
                          {exercise.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {getExerciseDescription(exercise.name, exercise.category)}
                  </p>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Medición:</h4>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {getUnitDisplay(exercise.unit, exercise.unit2)}
                      </span>
                    </div>
                  </div>

                  {/* Imagen del ejercicio */}
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {getExerciseImage(exercise.name) ? (
                      <img 
                        src={getExerciseImage(exercise.name)!} 
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <CategoryIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">Imagen próximamente</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron ejercicios</h3>
            <p className="text-muted-foreground">Prueba con otros términos de búsqueda o selecciona una categoría diferente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLibrary;