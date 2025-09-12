import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Dumbbell, ArrowRight, Trophy, Users, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-background/80">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-glow opacity-20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-gym-glow opacity-15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-fitness-orange/5 via-transparent to-gym-primary/5 opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Main Title */}
            <div className="mb-12 sm:mb-16 lg:mb-20 animate-fade-in pt-8 sm:pt-12 lg:pt-16">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-8 leading-[0.9]">
                <span className="text-foreground block mb-2">TU</span>
                <span className="bg-gradient-primary bg-clip-text text-transparent block mb-2">
                  ENTRENAMIENTO
                </span>
                <span className="text-foreground block">PERFECTO</span>
              </h1>
              
              <div className="w-24 h-1 bg-gradient-primary mx-auto mb-8 rounded-full"></div>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground font-light max-w-4xl mx-auto leading-relaxed">
                Elige tu disciplina favorita y comienza a transformar tu físico hoy mismo
              </p>
            </div>

            {/* Training Options */}
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-7xl mx-auto mb-12 sm:mb-16 lg:mb-20">
              {/* CrossTraining Card */}
              <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-2xl border border-fitness-orange/20 shadow-2xl hover:shadow-glow transition-all duration-700 hover:scale-[1.02] cursor-pointer animate-slide-up"
                    onClick={() => navigate('/crosstraining')}
                    style={{ animationDelay: '0.3s' }}>
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-fitness-orange/5 via-transparent to-fitness-orange/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Glowing Border Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-fitness-orange/20 via-fitness-orange/5 to-fitness-orange/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                
                <CardHeader className="text-center pb-8 pt-8 relative z-10">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-glow group-hover:shadow-intense transition-all duration-500 group-hover:rotate-3">
                      <Zap className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-primary opacity-20 rounded-3xl blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                  </div>
                  
                  <CardTitle className="text-3xl lg:text-4xl font-black mb-4">
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      CrossTraining
                    </span>
                  </CardTitle>
                  
                  <CardDescription className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                    Entrena como un atleta élite con nuestros WODs diarios diseñados para maximizar tu rendimiento
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8 pb-8 relative z-10">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-background/20 rounded-2xl backdrop-blur-sm">
                    <div className="text-center group-hover:animate-stat-bounce">
                      <div className="text-2xl lg:text-3xl font-bold text-fitness-orange mb-1">500+</div>
                      <div className="text-xs lg:text-sm text-muted-foreground">WODs</div>
                    </div>
                    <div className="text-center group-hover:animate-stat-bounce" style={{ animationDelay: '0.1s' }}>
                      <div className="text-2xl lg:text-3xl font-bold text-fitness-orange mb-1">10K+</div>
                      <div className="text-xs lg:text-sm text-muted-foreground">Atletas</div>
                    </div>
                    <div className="text-center group-hover:animate-stat-bounce" style={{ animationDelay: '0.2s' }}>
                      <div className="text-2xl lg:text-3xl font-bold text-fitness-orange mb-1">95%</div>
                      <div className="text-xs lg:text-sm text-muted-foreground">Satisfacción</div>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 text-sm lg:text-base p-3 rounded-xl bg-background/10 group-hover:bg-fitness-orange/5 transition-colors duration-300">
                      <div className="w-8 h-8 bg-fitness-orange/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-fitness-orange" />
                      </div>
                      <span className="font-medium">WODs de alta intensidad</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm lg:text-base p-3 rounded-xl bg-background/10 group-hover:bg-fitness-orange/5 transition-colors duration-300">
                      <div className="w-8 h-8 bg-fitness-orange/20 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-fitness-orange" />
                      </div>
                      <span className="font-medium">Comunidad de atletas</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm lg:text-base p-3 rounded-xl bg-background/10 group-hover:bg-fitness-orange/5 transition-colors duration-300">
                      <div className="w-8 h-8 bg-fitness-orange/20 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-fitness-orange" />
                      </div>
                      <span className="font-medium">Mejora tu rendimiento</span>
                    </div>
                  </div>

                  <Button 
                    size="lg"
                    className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300 transform group-hover:scale-[1.02] shadow-workout hover:shadow-intense text-base lg:text-lg py-6"
                  >
                    Comenzar CrossTraining
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>

              {/* Fitness/Gym Card */}
              <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-2xl border border-gym-primary/20 shadow-2xl hover:shadow-gym-glow transition-all duration-700 hover:scale-[1.02] cursor-pointer animate-slide-up"
                    onClick={() => navigate('/fitness')}
                    style={{ animationDelay: '0.5s' }}>
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gym-primary/5 via-transparent to-gym-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Glowing Border Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-gym-primary/20 via-gym-primary/5 to-gym-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                
                <CardHeader className="text-center pb-8 pt-8 relative z-10">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-gym-primary rounded-3xl flex items-center justify-center mx-auto shadow-gym-glow group-hover:shadow-gym-intense transition-all duration-500 group-hover:rotate-3">
                      <Dumbbell className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-gym-primary opacity-20 rounded-3xl blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                  </div>
                  
                  <CardTitle className="text-3xl lg:text-4xl font-black mb-4">
                    <span className="bg-gradient-gym-primary bg-clip-text text-transparent">
                      Fitness & Gym
                    </span>
                  </CardTitle>
                  
                  <CardDescription className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                    Desarrolla fuerza y músculo con rutinas de gimnasio profesionales diseñadas para resultados reales
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8 pb-8 relative z-10">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-background/20 rounded-2xl backdrop-blur-sm">
                    <div className="text-center group-hover:animate-stat-bounce">
                      <div className="text-2xl lg:text-3xl font-bold text-gym-accent mb-1">1000+</div>
                      <div className="text-xs lg:text-sm text-muted-foreground">Rutinas</div>
                    </div>
                    <div className="text-center group-hover:animate-stat-bounce" style={{ animationDelay: '0.1s' }}>
                      <div className="text-2xl lg:text-3xl font-bold text-gym-accent mb-1">25K+</div>
                      <div className="text-xs lg:text-sm text-muted-foreground">Miembros</div>
                    </div>
                    <div className="text-center group-hover:animate-stat-bounce" style={{ animationDelay: '0.2s' }}>
                      <div className="text-2xl lg:text-3xl font-bold text-gym-accent mb-1">98%</div>
                      <div className="text-xs lg:text-sm text-muted-foreground">Resultados</div>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 text-sm lg:text-base p-3 rounded-xl bg-background/10 group-hover:bg-gym-primary/5 transition-colors duration-300">
                      <div className="w-8 h-8 bg-gym-primary/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-gym-accent" />
                      </div>
                      <span className="font-medium">Rutinas personalizadas</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm lg:text-base p-3 rounded-xl bg-background/10 group-hover:bg-gym-primary/5 transition-colors duration-300">
                      <div className="w-8 h-8 bg-gym-primary/20 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-gym-accent" />
                      </div>
                      <span className="font-medium">Seguimiento de progreso</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm lg:text-base p-3 rounded-xl bg-background/10 group-hover:bg-gym-primary/5 transition-colors duration-300">
                      <div className="w-8 h-8 bg-gym-primary/20 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-gym-accent" />
                      </div>
                      <span className="font-medium">Desarrollo muscular</span>
                    </div>
                  </div>

                  <Button 
                    size="lg"
                    className="w-full bg-gradient-gym-primary hover:opacity-90 transition-all duration-300 transform group-hover:scale-[1.02] shadow-gym-workout hover:shadow-gym-intense text-base lg:text-lg py-6"
                  >
                    Comenzar Fitness
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Bottom CTA Section */}
            <div className="animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.7s' }}>
              <div className="text-center mb-12">
                <h3 className="text-2xl lg:text-3xl font-bold mb-6 text-foreground">
                  ¿No estás seguro cuál elegir?
                </h3>
                <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
                  Ambas disciplinas están diseñadas para llevarte al siguiente nivel.<br className="hidden sm:block" />
                  Cada una con su enfoque único para maximizar tus resultados.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 lg:gap-6 max-w-2xl mx-auto">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/crosstraining')}
                  className="group border-2 border-fitness-orange/30 text-fitness-orange hover:bg-fitness-orange hover:text-white hover:border-fitness-orange transition-all duration-300 py-6 text-base lg:text-lg font-semibold"
                >
                  <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Explorar CrossTraining
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/fitness')}
                  className="group border-2 border-gym-primary/30 text-gym-primary hover:bg-gym-primary hover:text-white hover:border-gym-primary transition-all duration-300 py-6 text-base lg:text-lg font-semibold"
                >
                  <Dumbbell className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Explorar Fitness & Gym
                </Button>
              </div>
              
              {/* Additional Features */}
              <div className="mt-12 sm:mt-16 lg:mt-20 grid md:grid-cols-3 gap-6 sm:gap-8 text-center pb-8 sm:pb-12 lg:pb-16">
                <div className="group animate-fade-in" style={{ animationDelay: '0.9s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-fitness-orange/20 to-gym-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-8 h-8 text-foreground" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-foreground">Resultados Garantizados</h4>
                  <p className="text-muted-foreground text-sm">Programas probados por miles de atletas</p>
                </div>
                <div className="group animate-fade-in" style={{ animationDelay: '1.1s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-gym-primary/20 to-fitness-orange/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-foreground" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-foreground">Comunidad Activa</h4>
                  <p className="text-muted-foreground text-sm">Únete a miles de personas como tú</p>
                </div>
                <div className="group animate-fade-in" style={{ animationDelay: '1.3s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-fitness-orange/20 to-gym-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-8 h-8 text-foreground" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-foreground">Seguimiento Personalizado</h4>
                  <p className="text-muted-foreground text-sm">Registra tu progreso y ve tu evolución</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;