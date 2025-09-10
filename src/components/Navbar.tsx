import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (sectionId: string) => {
    if (location.pathname !== '/') {
      // If not on home page, navigate to home first
      navigate('/', { replace: true });
      // Wait for navigation to complete, then scroll to section
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on home page, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigation("inicio")}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            FitTraining
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => handleNavigation("inicio")}
            className="text-foreground hover:text-primary transition-colors"
          >
            Inicio
          </button>
          {user && (
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Mi Panel
            </button>
          )}
          <button 
            onClick={() => handleNavigation("entrenamiento-diario")}
            className="text-foreground hover:text-primary transition-colors"
          >
            Entrenamiento Diario
          </button>
          <button 
            onClick={() => handleNavigation("planes")}
            className="text-foreground hover:text-primary transition-colors"
          >
            Planes Premium
          </button>
          <button 
            onClick={() => navigate("/about")}
            className="text-foreground hover:text-primary transition-colors"
          >
            Sobre Nosotros
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                variant="ghost"
                onClick={signOut}
                className="hidden sm:inline-flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
              <Button 
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={() => navigate("/dashboard")}
              >
                Mi Panel
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="hidden sm:inline-flex"
                onClick={() => navigate("/auth")}
              >
                Iniciar Sesión
              </Button>
              <Button 
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={() => navigate("/auth")}
              >
                Comenzar
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;