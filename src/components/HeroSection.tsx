import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-crossfit.jpg";

const HeroSection = () => {
  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2">
            <span className="text-white">Entrena Como Un</span>
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Atleta Elite
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Entrenamientos diarios de Cross Training. <br className="hidden sm:block"/>
            Mejora tu fuerza, resistencia y técnica con nuestros<br className="hidden sm:block"/> programas especializados.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
            <Button
                size="lg"
                onClick={() => {
                  document.getElementById("entrenamiento-diario")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className="bg-gradient-primary hover:opacity-90 transition-all transform hover:scale-105 animate-pulse-glow px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
              >
                Entrenamiento Gratis Hoy
            </Button>

            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-background transition-all duration-300 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
            >
              Ver Planes Premium
            </Button>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-16 px-4">
            <div className="text-center animate-slide-up">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">500+</div>
              <div className="text-gray-300 text-xs sm:text-base">Entrenamientos Disponibles</div>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">10K+</div>
              <div className="text-gray-300 text-xs sm:text-base">Atletas Activos</div>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">95%</div>
              <div className="text-gray-300 text-xs sm:text-base">Satisfacción</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-hero opacity-50"></div>
    </section>
  );
};

export default HeroSection;