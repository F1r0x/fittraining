import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Política de Cookies
          </h1>
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>¿Qué son las cookies?</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-muted-foreground">
                  Las cookies son pequeños archivos de texto que se almacenan en su dispositivo 
                  cuando visita un sitio web. Son ampliamente utilizadas para hacer que los 
                  sitios web funcionen, o funcionen de manera más eficiente, así como para 
                  proporcionar información a los propietarios del sitio.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>¿Cómo utilizamos las cookies?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Cookies esenciales</h4>
                    <p className="text-muted-foreground text-sm">
                      Estas cookies son necesarias para el funcionamiento del sitio web y 
                      no se pueden desactivar. Normalmente se establecen en respuesta a 
                      acciones realizadas por usted, como configurar sus preferencias de 
                      privacidad, iniciar sesión o completar formularios.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Cookies de rendimiento</h4>
                    <p className="text-muted-foreground text-sm">
                      Estas cookies nos permiten contar las visitas y las fuentes de tráfico 
                      para poder medir y mejorar el rendimiento de nuestro sitio. Nos ayudan 
                      a saber qué páginas son las más y menos populares.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Cookies funcionales</h4>
                    <p className="text-muted-foreground text-sm">
                      Estas cookies permiten que el sitio web proporcione funcionalidades 
                      mejoradas y personalización. Pueden ser establecidas por nosotros o 
                      por terceros cuyos servicios hemos agregado a nuestras páginas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookies de terceros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Supabase</h4>
                    <p className="text-muted-foreground text-sm">
                      Utilizamos Supabase para la autenticación y el almacenamiento de datos. 
                      Supabase puede establecer cookies para mantener su sesión de usuario activa.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Análisis web</h4>
                    <p className="text-muted-foreground text-sm">
                      Podemos utilizar servicios de análisis web para entender cómo los usuarios 
                      interactúan con nuestro sitio web y mejorar la experiencia del usuario.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestión de cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Puede controlar y/o eliminar las cookies como desee. Para más detalles, 
                    consulte aboutcookies.org. Puede eliminar todas las cookies que ya están 
                    en su computadora y puede configurar la mayoría de los navegadores para 
                    evitar que se coloquen.
                  </p>
                  
                  <div>
                    <h4 className="font-semibold mb-2">En su navegador</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Chrome: Configuración &gt; Privacidad y seguridad &gt; Cookies</li>
                      <li>Firefox: Preferencias &gt; Privacidad y seguridad &gt; Cookies</li>
                      <li>Safari: Preferencias &gt; Privacidad &gt; Cookies</li>
                      <li>Edge: Configuración &gt; Cookies y permisos del sitio</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actualizaciones de esta política</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Podemos actualizar esta Política de Cookies periódicamente para reflejar 
                  cambios en nuestras prácticas o por otras razones operativas, legales o 
                  reglamentarias. Le recomendamos que revise esta página regularmente para 
                  mantenerse informado sobre nuestro uso de cookies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Si tiene preguntas sobre esta Política de Cookies, puede contactarnos en:
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-primary font-semibold">Email: info@fittraining.es</p>
                  <p className="text-primary font-semibold">Teléfono: +34 123 456 789</p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              <p>Última actualización: 10 de septiembre de 2024</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cookies;