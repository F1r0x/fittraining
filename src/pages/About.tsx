import { Dumbbell, Target, Users, Trophy, Clock, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              FitTraining
            </h1>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Tu plataforma definitiva para Cross Training
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Diseñada por atletas, para atletas. FitTraining te ofrece las herramientas 
            profesionales que necesitas para llevar tu rendimiento al siguiente nivel.
          </p>
        </section>

        {/* Mission & Vision */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  Nuestra Misión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Democratizar el acceso a entrenamientos de alta calidad y herramientas 
                  profesionales de seguimiento, permitiendo a cada atleta alcanzar su 
                  máximo potencial independientemente de su nivel actual.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-primary" />
                  Nuestra Visión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Convertirnos en la plataforma líder mundial para el Cross Training, 
                  creando una comunidad global de atletas que se inspiran y motivan 
                  mutuamente para superar sus límites.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What We Offer */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">¿Qué ofrecemos?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  WODs Diarios
                </CardTitle>
                <CardDescription>Entrenamientos del día profesionales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Entrenamientos diarios diseñados por coaches profesionales, 
                  escalables para todos los niveles con variaciones y modificaciones.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Seguimiento de PRs
                </CardTitle>
                <CardDescription>Registra tus récords personales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sistema completo para registrar y seguir tus marcas personales 
                  en todos los movimientos principales del Cross Training.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Comunidad
                </CardTitle>
                <CardDescription>Conecta con otros atletas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Únete a una comunidad activa de atletas, comparte tus logros 
                  y encuentra motivación en el progreso de otros.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Our Approach */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Nuestro Enfoque</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                En FitTraining creemos que el Cross Training es más que un método de entrenamiento: 
                es una filosofía de vida. Nuestro enfoque se basa en tres pilares fundamentales:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-primary">Funcionalidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Movimientos naturales que mejoran tu vida diaria
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-primary">Variedad</h4>
                  <p className="text-sm text-muted-foreground">
                    Entrenamientos diversos que mantienen la motivación
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-primary">Intensidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Entrenamientos que desafían tus límites de forma segura
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Info */}
        <section className="text-center">
          <h3 className="text-2xl font-bold mb-6">¿Tienes preguntas?</h3>
          <p className="text-muted-foreground mb-6">
            Estamos aquí para ayudarte en tu journey fitness. No dudes en contactarnos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <p className="text-primary font-semibold">info@fittraining.es</p>
            <span className="hidden sm:inline text-muted-foreground">|</span>
            <p className="text-primary font-semibold">+34 123 456 789</p>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;