import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Target } from "lucide-react";

const DailyWorkout = () => {
  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <section id="entrenamiento-diario" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">Entrenamiento </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">Gratuito</span>
          </h2>
          <p className="text-muted-foreground text-lg capitalize">{today}</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-primary mb-2">
                "BEAST MODE"
              </CardTitle>
              <p className="text-muted-foreground">
                Entrenamiento completo de fuerza y cardio
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center justify-center space-x-2 p-4 bg-fitness-gray rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-semibold">45 min</span>
                </div>
                <div className="flex items-center justify-center space-x-2 p-4 bg-fitness-gray rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-semibold">Intermedio</span>
                </div>
                <div className="flex items-center justify-center space-x-2 p-4 bg-fitness-gray rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-semibold">Fuerza + Cardio</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-4">Calentamiento (10 min)</h3>
                  <ul className="space-y-2 text-foreground">
                    <li>• 5 min trote suave</li>
                    <li>• 20 jumping jacks</li>
                    <li>• 15 air squats</li>
                    <li>• 10 arm circles</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-primary mb-4">WOD Principal (30 min)</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-fitness-gray-light rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">5 Rondas por Tiempo:</h4>
                      <ul className="space-y-1 text-foreground">
                        <li>• 15 Burpees</li>
                        <li>• 20 Box Jumps (24"/20")</li>
                        <li>• 25 Kettlebell Swings (24kg/16kg)</li>
                        <li>• 30 Double Unders</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-primary rounded-lg text-center">
                <h3 className="text-xl font-bold text-white mb-2">¿Listo para el desafío?</h3>
                <p className="text-white/90 mb-4">
                  Registra tu tiempo y compártelo con la comunidad
                </p>
                <Button 
                  variant="secondary" 
                  className="bg-white text-background hover:bg-gray-100 font-semibold"
                >
                  Comenzar Entrenamiento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DailyWorkout;