import GymHeroSection from "@/components/GymHeroSection";
import GymDailyWorkout from "@/components/GymDailyWorkout";
import PremiumPlans from "@/components/PremiumPlans";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Crown } from "lucide-react";

const Fitness = () => {
  const navigate = useNavigate();

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
                <Crown className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Entrenamientos Premium
            </h2>
            
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
          </div>
        </div>
      </section>

      <PremiumPlans />
      <Footer />
    </div>
  );
};

export default Fitness;