import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-gym.jpg";

const GymHeroSection = () => {
  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.8), rgba(37, 99, 235, 0.6)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2">
            <span className="text-white">Transforma Tu</span>
            <br />
            <span className="bg-gradient-gym-primary bg-clip-text text-transparent">
              Físico y Mente
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Entrenamientos de gimnasio y fitness personalizados. <br className="hidden sm:block"/>
            Desarrolla fuerza, resistencia y la mejor versión de ti mismo<br className="hidden sm:block"/> con nuestros programas profesionales.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
            <Button
                size="lg"
                onClick={() => {
                  document.getElementById("entrenamiento-diario-gym")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className="bg-gradient-gym-primary hover:opacity-90 transition-all transform hover:scale-105 shadow-gym-glow px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto animate-pulse"
              >
                Entrenamiento Gratis Hoy
            </Button>

            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-gym-primary transition-all duration-300 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
            >
              Ver Planes Fitness
            </Button>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-16 px-4">
            <div className="text-center animate-slide-up">
              <div className="text-2xl sm:text-3xl font-bold text-gym-accent mb-1 sm:mb-2">1000+</div>
              <div className="text-gray-300 text-xs sm:text-base">Rutinas Disponibles</div>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-2xl sm:text-3xl font-bold text-gym-accent mb-1 sm:mb-2">25K+</div>
              <div className="text-gray-300 text-xs sm:text-base">Miembros Activos</div>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-2xl sm:text-3xl font-bold text-gym-accent mb-1 sm:mb-2">98%</div>
              <div className="text-gray-300 text-xs sm:text-base">Resultados Visibles</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-gym-hero opacity-50"></div>
    </section>
  );
};

export default GymHeroSection;