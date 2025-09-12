import GymHeroSection from "@/components/GymHeroSection";
import GymDailyWorkout from "@/components/GymDailyWorkout";
import PremiumPlans from "@/components/PremiumPlans";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Crown, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Fitness = () => {
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
      <GymHeroSection />
      <GymDailyWorkout />
      
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
                  onClick={() => user ? navigate('/fitness#planes') : navigate('/auth')}
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

      <PremiumPlans />
      <Footer />
    </div>
  );
};

export default Fitness;