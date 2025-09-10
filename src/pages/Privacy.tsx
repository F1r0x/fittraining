import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Política de Privacidad
          </h1>
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Información general</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  En FitTraining, respetamos su privacidad y nos comprometemos a proteger 
                  sus datos personales. Esta Política de Privacidad le informa sobre cómo 
                  recopilamos, utilizamos y protegemos su información cuando utiliza nuestros 
                  servicios.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsable del tratamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-muted-foreground"><strong>Entidad:</strong> FitTraining S.L.</p>
                  <p className="text-muted-foreground"><strong>Dirección:</strong> Madrid, España</p>
                  <p className="text-muted-foreground"><strong>Email:</strong> info@fittraining.es</p>
                  <p className="text-muted-foreground"><strong>Teléfono:</strong> +34 123 456 789</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos que recopilamos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Datos de registro</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Dirección de correo electrónico</li>
                      <li>Nombre de usuario</li>
                      <li>Contraseña (encriptada)</li>
                      <li>Fecha de registro</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Datos de actividad</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Registros de entrenamientos</li>
                      <li>Marcas personales (PRs)</li>
                      <li>Fechas y tiempos de ejercicios</li>
                      <li>Notas y comentarios sobre entrenamientos</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Datos técnicos</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Dirección IP</li>
                      <li>Tipo de navegador y versión</li>
                      <li>Sistema operativo</li>
                      <li>Páginas visitadas y tiempo de permanencia</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Base legal y finalidades del tratamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Ejecución del contrato</h4>
                    <p className="text-muted-foreground text-sm">
                      Procesamos sus datos para proporcionarle nuestros servicios de 
                      entrenamiento, incluyendo el registro de sus workouts y el 
                      seguimiento de su progreso.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Interés legítimo</h4>
                    <p className="text-muted-foreground text-sm">
                      Para mejorar nuestros servicios, analizar el uso de la plataforma 
                      y garantizar la seguridad de nuestros sistemas.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Consentimiento</h4>
                    <p className="text-muted-foreground text-sm">
                      Para el envío de comunicaciones comerciales y newsletters, 
                      cuando haya dado su consentimiento expreso.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compartir datos con terceros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Proveedores de servicios</h4>
                    <p className="text-muted-foreground text-sm">
                      Utilizamos Supabase para el almacenamiento y procesamiento de datos. 
                      Supabase cumple con el RGPD y tiene las medidas de seguridad adecuadas.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">No vendemos sus datos</h4>
                    <p className="text-muted-foreground text-sm">
                      Nunca vendemos, alquilamos o comercializamos sus datos personales 
                      a terceros para fines comerciales.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sus derechos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Bajo el RGPD, usted tiene derecho a:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
                    <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                    <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
                    <li><strong>Limitación:</strong> Restringir el procesamiento de sus datos</li>
                    <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado</li>
                    <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
                    <li><strong>Retirar consentimiento:</strong> En cualquier momento</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seguridad de los datos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Implementamos medidas técnicas y organizativas apropiadas para proteger 
                    sus datos personales contra el procesamiento no autorizado o ilegal y 
                    contra la pérdida, destrucción o daño accidental.
                  </p>
                  
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Encriptación de datos en tránsito y en reposo</li>
                    <li>Autenticación segura y control de acceso</li>
                    <li>Monitoreo regular de seguridad</li>
                    <li>Copias de seguridad regulares</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retención de datos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Conservamos sus datos personales solo durante el tiempo necesario para 
                  cumplir con las finalidades para las que fueron recopilados, incluyendo 
                  cualquier período de retención requerido por la ley. Los datos de cuenta 
                  se mantienen mientras la cuenta esté activa. Los datos de entrenamiento 
                  se conservan para permitir el seguimiento histórico del progreso.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transferencias internacionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sus datos pueden ser transferidos y procesados en países fuera del 
                  Espacio Económico Europeo (EEE). En tales casos, nos aseguramos de 
                  que existan salvaguardas adecuadas, como las Cláusulas Contractuales 
                  Tipo de la UE o certificaciones de adecuación.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cambios en esta política</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Podemos actualizar esta Política de Privacidad ocasionalmente. 
                  Le notificaremos sobre cambios significativos publicando la nueva 
                  política en esta página y, cuando sea apropiado, por otros medios.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacto y reclamaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Si tiene preguntas sobre esta política o desea ejercer sus derechos, 
                    contáctenos en:
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-primary font-semibold">Email: info@fittraining.es</p>
                    <p className="text-primary font-semibold">Teléfono: +34 123 456 789</p>
                  </div>
                  
                  <p className="text-muted-foreground text-sm">
                    También tiene derecho a presentar una reclamación ante la Agencia 
                    Española de Protección de Datos (AEPD) si considera que el tratamiento 
                    de sus datos personales infringe la normativa aplicable.
                  </p>
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

export default Privacy;