import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            FitTraining
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#inicio" className="text-foreground hover:text-primary transition-colors">
            Inicio
          </a>
          <a href="#entrenamiento-diario" className="text-foreground hover:text-primary transition-colors">
            Entrenamiento Diario
          </a>
          <a href="#planes" className="text-foreground hover:text-primary transition-colors">
            Planes Premium
          </a>
          <a href="#sobre-nosotros" className="text-foreground hover:text-primary transition-colors">
            Sobre Nosotros
          </a>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="hidden sm:inline-flex">
            Iniciar Sesión
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
            Planes Premium
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;