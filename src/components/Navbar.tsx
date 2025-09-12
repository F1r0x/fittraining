import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, BarChart3, Calendar, Crown, Info, Menu, X, Dumbbell, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handlePageNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const isCurrentPage = (path: string) => location.pathname === path;
  const isHomePage = () => location.pathname === '/' || location.pathname === '/index';

  const navigationItems = [
    {
      label: "Mi Panel", 
      action: () => handlePageNavigation("/dashboard"),
      icon: BarChart3,
      show: user && !isCurrentPage("/dashboard")
    },
    {
      label: "CrossTraining",
      action: () => handlePageNavigation("/crosstraining"),
      icon: Zap,
      show: !isCurrentPage("/crosstraining")
    },
    {
      label: "Fitness & Gym", 
      action: () => handlePageNavigation("/fitness"),
      icon: Dumbbell,
      show: !isCurrentPage("/fitness")
    },
    {
      label: "Ejercicios",
      action: () => handlePageNavigation("/exercises"),
      icon: Dumbbell,
      show: !isCurrentPage("/exercises")
    },
    {
      label: "Entrenamiento Diario",
      action: () => handleNavigation("entrenamiento-diario"),
      icon: Calendar,
      show: !isHomePage()
    },
    {
      label: "Planes Premium",
      action: () => handleNavigation("planes"),
      icon: Crown,
      show: !isHomePage()
    },
    {
      label: "Sobre Nosotros",
      action: () => handlePageNavigation("/about"),
      icon: Info,
      show: !isCurrentPage("/about")
    }
  ];

  const visibleItems = navigationItems.filter(item => item.show);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none z-0"></div>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative z-10">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer group"
          onClick={() => handleNavigation("inicio")}
        >
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow duration-300">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <span className="text-xl font-black bg-gradient-primary bg-clip-text text-transparent">
            FitTraining
          </span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-2">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full"></div>
                <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile menu and User Actions Container */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div 
                  className="hidden md:flex items-center space-x-3 px-3 py-2 bg-muted/50 rounded-full cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => navigate("/settings")}
                >
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{user.email?.split('@')[0]}</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className="hidden md:inline-flex hover:bg-destructive/10 hover:text-destructive"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
                {!isCurrentPage("/dashboard") && (
                  <Button 
                    className="hidden sm:inline-flex bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    onClick={() => handlePageNavigation("/dashboard")}
                    size="sm"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Mi Panel
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="hidden sm:inline-flex hover:bg-primary/10"
                  onClick={() => navigate("/auth")}
                  size="sm"
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  onClick={() => navigate("/auth")}
                  size="sm"
                >
                  Comenzar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden relative z-20 bg-background border-b border-border/40 shadow-xl">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {visibleItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
            
            {user && (
              <div className="border-t border-border/40 pt-4 mt-4">
                <div className="flex items-center justify-between px-4 py-2">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                    onClick={() => handlePageNavigation("/settings")}
                  >
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    size="sm"
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;