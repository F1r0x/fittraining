import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowRight, Trophy, Users, Target, Dumbbell, Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-crossfit.jpg";
import DailyWorkout from "@/components/DailyWorkout";
import PremiumPlans from "@/components/PremiumPlans";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        setUserRole('suscriptor');
      } else {
        setUserRole(data?.role || 'suscriptor');
      }
    } catch (error) {
      setUserRole('suscriptor');
    }
  };

  const canAccessPremium = user && userRole && ['afiliado', 'administrador'].includes(userRole);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        id="inicio" 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-glow opacity-10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-glow opacity-10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Main Title */}
            <div className="mb-12 sm:mb-16 lg:mb-20 animate-fade-in pt-8 sm:pt-12 lg:pt-16">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-8 leading-[0.9]">
                <span className="text-white block mb-2">TU</span>
                <span className="bg-gradient-primary bg-clip-text text-transparent block mb-2">
                  ENTRENAMIENTO
                </span>
                <span className="text-white block">PERFECTO</span>
              </h1>
              
              <div className="w-24 h-1 bg-gradient-primary mx-auto mb-8 rounded-full"></div>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 font-light max-w-4xl mx-auto leading-relaxed">
                Entrena como un atleta élite con CrossTraining y transforma tu físico hoy mismo
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16 lg:mb-20 max-w-lg mx-auto">
              <Button
                size="lg"
                onClick={() => {
                  document.getElementById("entrenamiento-diario")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className="bg-gradient-primary hover:opacity-90 transition-all transform hover:scale-105 animate-pulse-glow px-8 py-6 text-lg w-full sm:w-auto"
              >
                <Zap className="w-5 h-5 mr-2" />
                Entrenamiento Gratis Hoy
              </Button>

              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  document.getElementById("planes")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className="border-white text-white hover:bg-white hover:text-background transition-all duration-300 px-8 py-6 text-lg w-full sm:w-auto"
              >
                <Crown className="w-5 h-5 mr-2" />
                Ver Planes Premium
              </Button>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="text-center animate-slide-up">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">500+</div>
                <div className="text-gray-300 text-xs sm:text-base">Entrenamientos</div>
              </div>
              <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">10K+</div>
                <div className="text-gray-300 text-xs sm:text-base">Atletas Activos</div>
              </div>
              <div className="text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">95%</div>
                <div className="text-gray-300 text-xs sm:text-base">Satisfacción</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Workout Section */}
      <DailyWorkout />
      
      {/* Premium Workouts Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-primary/10 p-4">
                {canAccessPremium ? (
                  <Crown className="h-8 w-8 text-primary" />
                ) : (
                  <Lock className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Entrenamientos Premium
            </h2>
            
            {canAccessPremium ? (
              <>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Accede a nuestra biblioteca completa de entrenamientos profesionales. 
                  Rutinas especializadas para afiliados que buscan resultados excepcionales.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">200+</div>
                    <div className="text-muted-foreground">Rutinas Exclusivas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">24/7</div>
                    <div className="text-muted-foreground">Acceso Completo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">100%</div>
                    <div className="text-muted-foreground">Personalizado</div>
                  </div>
                </div>
                
                <Button
                  size="lg"
                  onClick={() => navigate('/premium-workouts')}
                  className="bg-gradient-primary hover:opacity-90 transition-all transform hover:scale-105 shadow-glow px-8 py-6 text-lg"
                >
                  <Dumbbell className="h-5 w-5 mr-2" />
                  Explorar Entrenamientos Premium
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  {!user ? 
                    'Regístrate para acceder a entrenamientos premium exclusivos.' :
                    'Actualiza a un plan Afiliado para acceder a entrenamientos premium exclusivos.'
                  }
                </p>
                
                <Button
                  size="lg"
                  onClick={() => user ? navigate('/#planes') : navigate('/auth')}
                  variant="outline"
                  className="px-8 py-6 text-lg"
                >
                  {!user ? 'Registrarse' : 'Ver Planes Premium'}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Premium Plans Section */}
      <PremiumPlans />

      {/* Features Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-6xl mx-auto">
            <div className="group animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">Resultados Garantizados</h4>
              <p className="text-muted-foreground text-sm">Programas probados por miles de atletas élite</p>
            </div>
            <div className="group animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">Comunidad Activa</h4>
              <p className="text-muted-foreground text-sm">Únete a miles de atletas como tú</p>
            </div>
            <div className="group animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">Seguimiento Personalizado</h4>
              <p className="text-muted-foreground text-sm">Registra tu progreso y ve tu evolución</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;