import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Dumbbell, Heart, Repeat } from "lucide-react";

const PremiumPlans = () => {
  const plans = [
    {
      id: 1,
      title: "Plan Fuerza",
      description: "Desarrolla tu fuerza máxima",
      icon: <Dumbbell className="w-8 h-8" />,
      price: "29€",
      period: "/mes",
      features: [
        "Entrenamientos de fuerza 5x/semana",
        "Progresión personalizada",
        "Videos técnicos detallados",
        "Seguimiento de 1RM",
      ],
      popular: false,
      gradient: "from-fitness-blue to-fitness-blue-light",
    },
    {
      id: 2,
      title: "Plan Completo",
      description: "La experiencia fitness definitiva",
      icon: <Zap className="w-8 h-8" />,
      price: "49€",
      period: "/mes",
      features: [
        "Todos los entrenamientos disponibles",
        "Planes personalizados",
        "Nutrición incluida",
        "Soporte 24/7",
        "App móvil premium",
        "Comunidad exclusiva",
      ],
      popular: true,
      gradient: "from-fitness-orange to-fitness-orange-light",
    },
    {
      id: 3,
      title: "Plan Cardio",
      description: "Mejora tu resistencia cardiovascular",
      icon: <Heart className="w-8 h-8" />,
      price: "24€",
      period: "/mes",
      features: [
        "Entrenamientos cardio especializados",
        "HIIT y entrenamiento metabólico",
        "Monitores de frecuencia cardíaca",
        "Planes de running",
      ],
      popular: false,
      gradient: "from-fitness-gray to-fitness-gray-light",
    },
    {
      id: 4,
      title: "Plan Funcional",
      description: "Movimientos naturales y funcionales",
      icon: <Repeat className="w-8 h-8" />,
      price: "34€",
      period: "/mes",
      features: [
        "Entrenamientos funcionales",
        "Mobility y flexibilidad",
        "Ejercicios con peso corporal",
        "Rehabilitación preventiva",
      ],
      popular: false,
      gradient: "from-fitness-blue to-fitness-gray",
    },
  ];

  return (
    <section id="planes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-4">
            <span className="text-foreground">Planes </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">Premium</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
            Elige el plan que mejor se adapte a tus objetivos fitness. 
            Todos incluyen acceso completo a nuestra plataforma.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative shadow-card border-0 bg-card/50 backdrop-blur-sm hover:shadow-glow transition-all duration-300 transform hover:scale-105 ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white px-4 py-1">
                  Más Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center text-white`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-xl font-bold text-foreground mb-2">
                  {plan.title}
                </CardTitle>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="text-center">
                  <span className="text-3xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full mt-6 ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90' 
                      : 'bg-fitness-gray hover:bg-fitness-gray-light'
                  } transition-all duration-300`}
                >
                  Comenzar Ahora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Necesitas ayuda para elegir? Contáctanos
          </p>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
            Hablar con un Experto
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PremiumPlans;