import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Target, Zap, Timer, Award, Play, TrendingUp, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number | string;
  notes?: string;
  scaling?: string;
  image_url?: string;
  video_url?: string;
}

interface MainWorkout {
  skill_work?: string[];
  exercises: Exercise[];
  description: string;
  accessory_work?: string[];
}

interface DailyWorkoutData {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  type: string;
  warmup: string[];
  main_workout: MainWorkout;
  cooldown?: string[];
  secondary_wod?: string[];
  time_type: string;
  time_params: { cap?: number; rest_between_sets?: number; minutes?: number; description: string };
}

const exerciseNameMapping: { [key: string]: string } = {
  'Deadlifts': 'Peso muerto',
  'Strict Pull-ups': 'Pull-ups/Dominadas',
  'Front Squats': 'Front Squat',
  'Plank Hold': 'Plank/Plancha',
  'Kettlebell Swings': 'KB Russian Swing',
  'Box Jumps': 'Box Jumps',
  'Thrusters': 'Thruster',
  'Double Unders': 'Double Unders/Saltos Dobles',
  'Leg Raises': 'Leg Raises',
  'Bicycle Crunches': 'Bicycle Crunches',
};

const DailyWorkout = () => {
  const [workout, setWorkout] = useState<DailyWorkoutData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    fetchTodaysWorkout();
  }, []);

  const navigate = useNavigate();

  const fetchTodaysWorkout = async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      let workouts: any[] = [];
      let error: any;

      ({ data: workouts, error } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('is_active', true)
        .eq('scheduled_date', currentDate)
        .limit(1));

      if (!workouts || workouts.length === 0) {
        ({ data: workouts, error } = await supabase
          .from('daily_workouts')
          .select('*')
          .eq('is_active', true)
          .order('scheduled_date', { ascending: false })
          .limit(1));
      }

      if (error) {
        console.error('Error fetching workouts:', error);
        return;
      }

      if (workouts && workouts.length > 0) {
        const selectedWorkoutRaw = workouts[0];

        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('name, image_url');

        if (exercisesError) {
          console.error('Error fetching exercises:', exercisesError);
        }

        const exerciseImageMap = exercisesData?.reduce((map: { [key: string]: string }, exercise: { name: string; image_url: string }) => {
          map[exercise.name] = exercise.image_url;
          return map;
        }, {}) || {};

        let transformedMainWorkout: MainWorkout = selectedWorkoutRaw.main_workout;
        if (selectedWorkoutRaw.main_workout.rounds && Array.isArray(selectedWorkoutRaw.main_workout.exercises)) {
          transformedMainWorkout = {
            skill_work: ["3 min técnica general (enfócate en forma y movilidad)"],
            exercises: selectedWorkoutRaw.main_workout.exercises.map((exercise: string, index: number) => {
              const [reps, ...nameParts] = exercise.split(' ');
              const name = nameParts.join(' ').trim();
              const mappedName = exerciseNameMapping[name] || name;
              return {
                name,
                sets: selectedWorkoutRaw.main_workout.rounds,
                reps: Number(reps) || 10,
                notes: 'Ajusta peso según nivel',
                scaling: 'Reduce reps o usa peso más ligero',
                image_url: exerciseImageMap[mappedName] || '/assets/placeholder-exercise.jpg',
              };
            }),
            description: selectedWorkoutRaw.main_workout.description || 'Completar las rondas en el menor tiempo posible',
            accessory_work: ['2 sets de 10 movimientos accesorios (elige según necesidades)'],
          };
        }

        const processedExercises = await Promise.all(
          transformedMainWorkout.exercises.map(async (exercise: Exercise) => {
            let imageUrl = exercise.image_url;
            let videoUrl = exercise.video_url;

            if (!imageUrl) {
              const mappedName = exerciseNameMapping[exercise.name] || exercise.name;
              imageUrl = exerciseImageMap[mappedName] || '/assets/placeholder-exercise.jpg';
            }

            if (imageUrl && imageUrl.includes('supabase.co')) {
              const { data: signedData, error } = await supabase.storage
                .from('exercise-images')
                .createSignedUrl(imageUrl.replace(/.*exercise-images\//, ''), 3600);
              if (signedData && !error) {
                imageUrl = signedData.signedUrl;
              }
            }

            if (videoUrl) {
              const { data: signedData, error } = await supabase.storage
                .from('exercise-videos')
                .createSignedUrl(videoUrl.replace(/.*exercise-videos\//, ''), 3600);
              if (signedData && !error) {
                videoUrl = signedData.signedUrl;
              }
            }

            return { ...exercise, image_url: imageUrl, video_url: videoUrl };
          })
        );

        const transformedWorkout: DailyWorkoutData = {
          id: selectedWorkoutRaw.id,
          title: selectedWorkoutRaw.title,
          description: selectedWorkoutRaw.description || '',
          duration: selectedWorkoutRaw.duration,
          difficulty: selectedWorkoutRaw.difficulty,
          type: selectedWorkoutRaw.type,
          warmup: Array.isArray(selectedWorkoutRaw.warmup) ? selectedWorkoutRaw.warmup : [],
          main_workout: {
            ...transformedMainWorkout,
            exercises: processedExercises,
          },
          cooldown: Array.isArray(selectedWorkoutRaw.cooldown) ? selectedWorkoutRaw.cooldown : ['5 min caminata ligera', 'Estiramientos estáticos (30 seg cada grupo muscular)'],
          secondary_wod: Array.isArray(selectedWorkoutRaw.secondary_wod)
            ? selectedWorkoutRaw.secondary_wod
            : ['AMRAP 5 min: 10 burpees, 15 air squats'],
          time_type: selectedWorkoutRaw.time_type || 'For Time',
          time_params: selectedWorkoutRaw.time_params || { description: 'Completar en el menor tiempo posible' },
        };

        setWorkout(transformedWorkout);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="entrenamiento-diario" className="py-12 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-primary mx-auto"></div>
            <p className="mt-3 text-muted-foreground text-lg">Cargando entrenamiento épico...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!workout) {
    return (
      <section id="entrenamiento-diario" className="py-12 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <Zap className="w-12 h-12 text-primary mx-auto mb-3 animate-pulse" />
            <p className="text-muted-foreground text-lg">No hay entrenamientos disponibles hoy.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="entrenamiento-diario" className="py-12 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-20"></div>
      <div className="absolute top-10 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-fitness-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
            <Timer className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-primary font-semibold uppercase tracking-wide">Entrenamiento del Día</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 leading-tight px-4">
            <span className="text-foreground">ENTRENA </span>
            <span className="px-2 sm:px-3 py-1 rounded-lg bg-gradient-primary text-white text-base sm:text-2xl md:text-4xl">GRATIS</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-light capitalize tracking-wide px-4">
            {today}
          </p>
        </div>

        {/* Summary Card */}
        <Card className="max-w-5xl mx-auto mb-6 bg-card/80 backdrop-blur-xl border-0 shadow-intense animate-fade-in">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl md:text-3xl font-black bg-gradient-primary bg-clip-text text-transparent">
              {workout.title}
            </CardTitle>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">{workout.description}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-base font-semibold text-primary">{workout.duration} min</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-5 h-5 text-fitness-blue" />
              <span className="text-base font-semibold text-fitness-blue">{workout.difficulty}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Target className="w-5 h-5 text-fitness-orange" />
              <span className="text-base font-semibold text-fitness-orange">{workout.type}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Warmup */}
          <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-workout animate-fade-in">
            <CardHeader className="flex items-center space-x-2">
              <div className="p-2 bg-primary/20 rounded-full">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-primary">Calentamiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workout.warmup.map((exercise, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-fitness-gray/30 rounded-lg border border-primary/10 hover:border-primary/20 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                    {index + 1}
                  </div>
                  <span className="text-foreground font-medium text-base">{exercise}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skill Work */}
          {workout.main_workout.skill_work?.length > 0 && (
            <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-workout animate-fade-in">
              <CardHeader className="flex items-center space-x-2">
                <div className="p-2 bg-fitness-blue/20 rounded-full">
                  <Dumbbell className="w-5 h-5 text-fitness-blue" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-fitness-blue">Trabajo de Técnica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workout.main_workout.skill_work.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-fitness-gray/30 rounded-lg border border-fitness-blue/10 hover:border-fitness-blue/20 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-fitness-blue/20 rounded-full flex items-center justify-center text-fitness-blue font-bold">
                      {index + 1}
                    </div>
                    <span className="text-foreground font-medium text-base">{skill}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* WODs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main WOD */}
            <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-workout animate-fade-in">
              <CardHeader className="flex items-center space-x-2">
                <div className="p-2 bg-fitness-orange/20 rounded-full">
                  <Award className="w-5 h-5 text-fitness-orange" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-fitness-orange">
                  WOD Principal ({workout.time_type}
                  {workout.time_params.cap ? `, Cap: ${workout.time_params.cap} min` : workout.time_params.minutes ? `, ${workout.time_params.minutes} min` : ''})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">{workout.main_workout.description}</p>
                {workout.main_workout.exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="p-2 bg-card/50 rounded-lg border border-fitness-orange/10 hover:border-fitness-orange/20 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-fitness-orange/20 rounded-full flex items-center justify-center text-fitness-orange font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-foreground font-medium text-base">{exercise.name}</span>
                        {(exercise.sets || exercise.reps) && (
                          <p className="text-muted-foreground text-sm">{exercise.sets ? `${exercise.sets} sets x ` : ''}{exercise.reps} {exercise.notes ? `(${exercise.notes})` : ''}</p>
                        )}
                        {exercise.scaling && (
                          <p className="text-muted-foreground text-xs italic">Scaling: {exercise.scaling}</p>
                        )}
                        {exercise.video_url ? (
                          <div className="mt-2 w-full aspect-video max-w-[320px]">
                            <ReactPlayer
                              url={exercise.video_url}
                              width="100%"
                              height="100%"
                              controls
                              className="rounded-md"
                              onError={() => console.error(`Error loading video: ${exercise.video_url}`)}
                            />
                          </div>
                        ) : exercise.image_url ? (
                          <div className="mt-2 w-full aspect-video max-w-[320px]">
                            <img
                              src={exercise.image_url}
                              alt={`Demostración de ${exercise.name}`}
                              className="w-full h-full object-cover rounded-md"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/placeholder-exercise.jpg';
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Secondary WOD */}
            {workout.secondary_wod?.length > 0 && (
              <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-workout animate-fade-in">
                <CardHeader className="flex items-center space-x-2">
                  <div className="p-2 bg-fitness-orange/20 rounded-full">
                    <Zap className="w-5 h-5 text-fitness-orange" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-fitness-orange">WOD Secundario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workout.secondary_wod.map((exercise, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 bg-fitness-gray/30 rounded-lg border border-fitness-orange/10 hover:border-fitness-orange/20 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-fitness-orange/20 rounded-full flex items-center justify-center text-fitness-orange font-bold">
                        {index + 1}
                      </div>
                      <span className="text-foreground font-medium text-base">{exercise}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Accessory Work */}
          {workout.main_workout.accessory_work?.length > 0 && (
            <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-workout animate-fade-in">
              <CardHeader className="flex items-center space-x-2">
                <div className="p-2 bg-fitness-green/20 rounded-full">
                  <Dumbbell className="w-5 h-5 text-fitness-green" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-fitness-green">Trabajo Accesorio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workout.main_workout.accessory_work.map((accessory, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-fitness-gray/30 rounded-lg border border-fitness-green/10 hover:border-fitness-green/20 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-fitness-green/20 rounded-full flex items-center justify-center text-fitness-green font-bold">
                      {index + 1}
                    </div>
                    <span className="text-foreground font-medium text-base">{accessory}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Cooldown */}
          {workout.cooldown?.length > 0 && (
            <Card className="bg-card/60 backdrop-blur-xl border-0 shadow-workout animate-fade-in">
              <CardHeader className="flex items-center space-x-2">
                <div className="p-2 bg-fitness-purple/20 rounded-full">
                  <TrendingUp className="w-5 h-5 text-fitness-purple" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-fitness-purple">Enfriamiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workout.cooldown.map((exercise, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-fitness-gray/30 rounded-lg border border-fitness-purple/10 hover:border-fitness-purple/20 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-fitness-purple/20 rounded-full flex items-center justify-center text-fitness-purple font-bold">
                      {index + 1}
                    </div>
                    <span className="text-foreground font-medium text-base">{exercise}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <Card className="bg-gradient-primary text-white shadow-intense animate-fade-in">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl sm:text-2xl font-black mb-3 flex items-center justify-center space-x-2">
                <Play className="w-6 h-6" />
                <span>¿LISTO PARA EL DESAFÍO?</span>
              </h3>
              <p className="text-white/90 mb-6 text-base font-medium max-w-xl mx-auto">
                Supera tus límites y conviértete en la mejor versión de ti mismo.
              </p>
              <Button
                size="lg"
                className="bg-white text-background hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                onClick={() => navigate('/workout-session', { state: { workout } })}
              >
                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                COMENZAR ENTRENAMIENTO
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DailyWorkout;