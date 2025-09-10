import { Dumbbell, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-fitness-gray-light py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                FitTraining
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Tu plataforma definitiva para entrenamientos de Cross Training. 
              Entrena como un atleta elite con nuestros programas especializados.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Instagram
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Facebook
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                YouTube
              </a>
            </div>
          </div>
          
          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-muted-foreground hover:text-primary transition-colors">Inicio</a></li>
              <li><a href="#entrenamiento-diario" className="text-muted-foreground hover:text-primary transition-colors">Entrenamiento Diario</a></li>
              <li><a href="#planes" className="text-muted-foreground hover:text-primary transition-colors">Planes Premium</a></li>
              <li><a href="/about" className="text-muted-foreground hover:text-primary transition-colors">Sobre Nosotros</a></li>
            </ul>
          </div>
          
          {/* Enlaces legales */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidad</a></li>
              <li><a href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">Política de Cookies</a></li>
            </ul>
          </div>
          
          {/* Contacto */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-sm">info@fittraining.es</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-sm">+34 123 456 789</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-sm">Madrid, España</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 FitTraining. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;