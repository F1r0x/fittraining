import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

type UserRole = 'suscriptor' | 'afiliado' | 'administrador';

export const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user?.id) {
      fetchUserRole();
    }
  }, [user, loading, navigate]);

  const fetchUserRole = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole('suscriptor');
      } else {
        setUserRole(data?.role || 'suscriptor');
      }
    } catch (error) {
      console.error("Error:", error);
      setUserRole('suscriptor');
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Acceso Restringido
            </h2>
            
            <p className="text-muted-foreground mb-4">
              Esta sección está disponible únicamente para usuarios {allowedRoles.includes('afiliado') ? 'Afiliados' : ''} 
              {allowedRoles.includes('afiliado') && allowedRoles.includes('administrador') ? ' y ' : ''}
              {allowedRoles.includes('administrador') ? 'Administradores' : ''}.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Tu rol actual: {userRole}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {userRole === 'suscriptor' ? 
                  'Considera actualizar a un plan Afiliado para acceder a entrenamientos premium.' :
                  'Contacta con el administrador si necesitas permisos adicionales.'
                }
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/fitness')}
                className="flex-1"
              >
                Volver a Fitness
              </Button>
              <Button 
                onClick={() => navigate('/fitness#planes')}
                className="flex-1"
              >
                Ver Planes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};