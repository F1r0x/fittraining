import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Heart } from "lucide-react";

const PremiumPlans = () => {
  return (
    <section id="planes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-4">
            <span className="text-foreground">Suscripción </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">Premium</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
            Accede a todos nuestros entrenamientos y funcionalidades premium con una sola suscripción.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto items-center">
          {/* Premium Subscription Card */}
          <div className="w-full lg:w-2/3">
            <Card className="relative shadow-card border-0 bg-card/50 backdrop-blur-sm hover:shadow-glow transition-all duration-300 transform hover:scale-105 ring-2 ring-primary">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white px-4 py-1">
                Acceso Completo
              </Badge>
              
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-fitness-orange to-fitness-orange-light flex items-center justify-center text-white">
                  <Zap className="w-10 h-10" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  Plan Premium
                </CardTitle>
                <p className="text-muted-foreground text-sm mb-4">
                  La experiencia fitness definitiva
                </p>
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">39€</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Todos los entrenamientos disponibles</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">WODs diarios personalizados</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Seguimiento de progreso avanzado</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Acceso a biblioteca de ejercicios</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Comunidad exclusiva de atletas</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Soporte prioritario 24/7</span>
                  </li>
                </ul>
                
                <Button className="w-full mt-6 bg-gradient-primary hover:opacity-90 transition-all duration-300 py-6 text-lg">
                  Comenzar Suscripción Premium
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Donation Card */}
          <div className="w-full lg:w-1/3">
            <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm hover:shadow-glow transition-all duration-300 transform hover:scale-105 h-full">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white">
                  <Heart className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground mb-2">
                  Apóyanos
                </CardTitle>
                <p className="text-muted-foreground text-sm mb-4">
                  Ayúdanos a mantener la plataforma gratuita para todos
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-center text-foreground text-sm mb-6">
                  Tu donación nos ayuda a crear más contenido y mejorar la experiencia para toda la comunidad.
                </p>
                
                <Button 
                  variant="outline" 
                  className="w-full border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300 py-4"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Hacer Donación
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Tienes preguntas sobre la suscripción?
          </p>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
            Contactar Soporte
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PremiumPlans;