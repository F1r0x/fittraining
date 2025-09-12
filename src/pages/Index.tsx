import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Dumbbell, ArrowRight, Trophy, Users, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-gym-background/20 to-fitness-orange/5">
        <div className="absolute inset-0 bg-gradient-glow opacity-10"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              <span className="text-foreground">TU </span>
              <span className="bg-gradient-primary bg-clip-text text-transparent">ENTRENAMIENTO</span>
              <br />
              <span className="text-foreground">PERFECTO</span>
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground mb-12 font-light max-w-3xl mx-auto leading-relaxed">
              Elige tu disciplina favorita y comienza a transformar tu físico hoy mismo
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* CrossTraining Card */}
            <Card className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border-0 shadow-intense hover:shadow-glow transition-all duration-500 hover:scale-105 cursor-pointer animate-slide-up"
                  onClick={() => navigate('/crosstraining')}
                  style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse shadow-glow">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-black mb-3">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    CrossTraining
                  </span>
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Entrena como un atleta élite con nuestros WODs diarios
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 relative z-10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-fitness-orange mb-1">500+</div>
                    <div className="text-xs text-muted-foreground">Entrenamientos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-fitness-orange mb-1">10K+</div>
                    <div className="text-xs text-muted-foreground">Atletas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-fitness-orange mb-1">95%</div>
                    <div className="text-xs text-muted-foreground">Satisfacción</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Trophy className="w-4 h-4 text-fitness-orange" />
                    <span>WODs de alta intensidad</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="w-4 h-4 text-fitness-orange" />
                    <span>Comunidad de atletas</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Target className="w-4 h-4 text-fitness-orange" />
                    <span>Mejora tu rendimiento</span>
                  </div>
                </div>

                <Button 
                  size="lg"
                  className="w-full bg-gradient-primary hover:opacity-90 transition-all transform group-hover:scale-105 shadow-workout"
                >
                  Comenzar CrossTraining
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* Fitness/Gym Card */}
            <Card className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border-0 shadow-gym-intense hover:shadow-gym-glow transition-all duration-500 hover:scale-105 cursor-pointer animate-slide-up"
                  onClick={() => navigate('/fitness')}
                  style={{ animationDelay: '0.4s' }}>
              <div className="absolute inset-0 bg-gradient-gym-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="w-20 h-20 bg-gradient-gym-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse shadow-gym-glow">
                  <Dumbbell className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-black mb-3">
                  <span className="bg-gradient-gym-primary bg-clip-text text-transparent">
                    Fitness & Gym
                  </span>
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Desarrolla fuerza y músculo con rutinas de gimnasio profesionales
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 relative z-10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gym-accent mb-1">1000+</div>
                    <div className="text-xs text-muted-foreground">Rutinas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gym-accent mb-1">25K+</div>
                    <div className="text-xs text-muted-foreground">Miembros</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gym-accent mb-1">98%</div>
                    <div className="text-xs text-muted-foreground">Resultados</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Trophy className="w-4 h-4 text-gym-accent" />
                    <span>Rutinas personalizadas</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="w-4 h-4 text-gym-accent" />
                    <span>Seguimiento de progreso</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Target className="w-4 h-4 text-gym-accent" />
                    <span>Desarrollo muscular</span>
                  </div>
                </div>

                <Button 
                  size="lg"
                  className="w-full bg-gradient-gym-primary hover:opacity-90 transition-all transform group-hover:scale-105 shadow-gym-workout"
                >
                  Comenzar Fitness
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom CTA */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              ¿No estás seguro? ¡Prueba ambos!
            </h3>
            <p className="text-muted-foreground mb-8">
              Ambas disciplinas están diseñadas para llevarte al siguiente nivel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/crosstraining')}
                className="border-fitness-orange text-fitness-orange hover:bg-fitness-orange hover:text-white"
              >
                Ver CrossTraining
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/fitness')}
                className="border-gym-primary text-gym-primary hover:bg-gym-primary hover:text-white"
              >
                Ver Fitness & Gym
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;