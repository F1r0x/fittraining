import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LogOut, 
  User, 
  BarChart3, 
  Calendar, 
  Crown, 
  Info, 
  Menu, 
  X, 
  Dumbbell, 
  ChevronDown,
  Settings,
  Home,
  Users
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const authContext = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log('Navbar render - authContext:', authContext);

  if (!authContext) {
    console.error('AuthContext not available in Navbar');
    return null;
  }

  const { user, signOut, loading } = authContext;

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </nav>
    );
  }

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

  // Organizar navegación en grupos más claros
  const mainNavItems = [
    {
      label: "Inicio",
      action: () => handlePageNavigation("/"),
      icon: Home,
      show: !isHomePage()
    },
    {
      label: "Mi Panel",
      action: () => handlePageNavigation("/dashboard"),
      icon: BarChart3,
      show: user && !isCurrentPage("/dashboard")
    }
  ];

  const workoutItems = [
    {
      label: "Entrenamientos Premium",
      action: () => handlePageNavigation("/premium-workouts"),
      icon: Crown,
      show: !isCurrentPage("/premium-workouts")
    },
    {
      label: "Ejercicios",
      action: () => handlePageNavigation("/exercises"),
      icon: Dumbbell,
      show: !isCurrentPage("/exercises")
    }
  ];

  const quickActions = [
    {
      label: "Perfiles de Usuarios",
      action: () => handlePageNavigation("/profiles"),
      icon: Users,
      show: user && !isCurrentPage("/profiles")
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

  const visibleMainItems = mainNavItems.filter(item => item.show);
  const visibleWorkoutItems = workoutItems.filter(item => item.show);
  const visibleQuickActions = quickActions.filter(item => item.show);

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
        <div className="hidden lg:flex items-center space-x-6">
          {/* Main Navigation Items */}
          {visibleMainItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={`main-${index}`}
                onClick={item.action}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label={item.label}
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}

          {/* Entrenamientos Dropdown */}
          {visibleWorkoutItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Entrenamientos"
                >
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                  <Dumbbell className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium text-sm">Entrenamientos</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="w-56 bg-background/95 backdrop-blur-xl border border-border/40 shadow-xl"
              >
                {visibleWorkoutItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={`workout-${index}`}
                      onClick={item.action}
                      className="flex items-center space-x-3 py-3 px-4 hover:bg-primary/10 focus:bg-primary/10 cursor-pointer"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Más Opciones Dropdown */}
          {visibleQuickActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Más opciones"
                >
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                  <Menu className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium text-sm">Más</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="w-56 bg-background/95 backdrop-blur-xl border border-border/40 shadow-xl"
              >
                {visibleQuickActions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={`action-${index}`}
                      onClick={item.action}
                      className="flex items-center space-x-3 py-3 px-4 hover:bg-primary/10 focus:bg-primary/10 cursor-pointer"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* User Actions & Mobile Menu */}
        <div className="flex items-center space-x-4">
          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* User Menu Dropdown - Desktop */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="flex items-center space-x-3 px-3 py-2 bg-muted/50 rounded-xl hover:bg-muted/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        aria-label="Menú de usuario"
                      >
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{user?.email?.split('@')[0] || 'Usuario'}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 bg-background/95 backdrop-blur-xl border border-border/40 shadow-xl"
                    >
                      {!isCurrentPage("/dashboard") && (
                        <DropdownMenuItem 
                          onClick={() => handlePageNavigation("/dashboard")}
                          className="flex items-center space-x-3 py-3 px-4 hover:bg-primary/10 cursor-pointer"
                        >
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <span className="font-medium">Mi Panel</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handlePageNavigation("/settings")}
                        className="flex items-center space-x-3 py-3 px-4 hover:bg-primary/10 cursor-pointer"
                      >
                        <Settings className="h-5 w-5 text-primary" />
                        <span className="font-medium">Configuración</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/40" />
                      <DropdownMenuItem 
                        onClick={signOut}
                        className="flex items-center space-x-3 py-3 px-4 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Cerrar Sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Quick Dashboard Access - Mobile/Tablet */}
                {!isCurrentPage("/dashboard") && (
                  <Button 
                    className="hidden sm:inline-flex md:hidden bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    onClick={() => handlePageNavigation("/dashboard")}
                    size="sm"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Panel
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="hidden sm:inline-flex hover:bg-primary/10 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  onClick={() => navigate("/auth")}
                  size="sm"
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  onClick={() => navigate("/auth")}
                  size="sm"
                >
                  Comenzar
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-primary/10 focus:ring-2 focus:ring-primary/50 focus:outline-none"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden relative z-20 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-xl animate-fade-in">
          <div className="container mx-auto px-4 py-6 space-y-4">
            {/* Main Navigation */}
            {visibleMainItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">Principal</h3>
                {visibleMainItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={`mobile-main-${index}`}
                      onClick={item.action}
                      className="flex items-center space-x-4 w-full px-4 py-3 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Entrenamientos */}
            {visibleWorkoutItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">Entrenamientos</h3>
                {visibleWorkoutItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={`mobile-workout-${index}`}
                      onClick={item.action}
                      className="flex items-center space-x-4 w-full px-4 py-3 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Acciones Rápidas */}
            {visibleQuickActions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">Más Opciones</h3>
                {visibleQuickActions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={`mobile-action-${index}`}
                      onClick={item.action}
                      className="flex items-center space-x-4 w-full px-4 py-3 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* User Section */}
            {user && (
              <div className="border-t border-border/40 pt-4 mt-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-3">Cuenta</h3>
                <div className="space-y-2">
                  <div 
                    className="flex items-center space-x-4 w-full px-4 py-3 rounded-xl hover:bg-muted/50 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handlePageNavigation("/settings");
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-foreground">{user.email?.split('@')[0]}</div>
                      <div className="text-sm text-muted-foreground">Ver perfil</div>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center space-x-4 w-full px-4 py-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
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