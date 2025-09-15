import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Crown, Star, UserCheck, Search, Users } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string;
}

type UserRole = 'suscriptor' | 'afiliado' | 'administrador';

const Profiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      // Obtener perfiles con sus roles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id, 
          display_name,
          avatar_url,
          created_at
        `);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        toast.error("Error al cargar los perfiles");
        return;
      }

      // Obtener roles para cada perfil
      const profilesWithRoles = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .single();
            
          return {
            ...profile,
            role: roleData?.role || 'suscriptor'
          };
        })
      );

      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los perfiles");
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'administrador':
        return {
          label: 'Administrador',
          icon: Crown,
          variant: 'default' as const,
          color: 'text-yellow-600'
        };
      case 'afiliado':
        return {
          label: 'Afiliado',
          icon: Star,
          variant: 'secondary' as const,
          color: 'text-blue-600'
        };
      case 'suscriptor':
      default:
        return {
          label: 'Suscriptor',
          icon: UserCheck,
          variant: 'outline' as const,
          color: 'text-gray-600'
        };
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    if (!searchTerm) return true;
    const displayName = profile.display_name?.toLowerCase() || '';
    return displayName.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Perfiles de Usuarios
          </h1>
          <p className="text-muted-foreground">Explora los perfiles de la comunidad</p>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Grid de perfiles */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProfiles.map((profile) => {
            const roleInfo = getRoleInfo(profile.role || 'suscriptor');
            const IconComponent = roleInfo.icon;
            const isCurrentUser = profile.user_id === user?.id;
            
            return (
              <Card 
                key={profile.id} 
                className={`transition-all hover:shadow-lg ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-primary text-white text-lg">
                        {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center">
                      <h3 className="font-semibold text-lg leading-tight">
                        {profile.display_name || 'Usuario sin nombre'}
                        {isCurrentUser && (
                          <span className="text-xs text-primary ml-2">(Tú)</span>
                        )}
                      </h3>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-col items-center space-y-3">
                    {/* Badge del rol */}
                    <Badge variant={roleInfo.variant} className="flex items-center gap-1">
                      <IconComponent className="h-3 w-3" />
                      {roleInfo.label}
                    </Badge>
                    
                    {/* Fecha de registro */}
                    <p className="text-xs text-muted-foreground text-center">
                      Miembro desde {new Date(profile.created_at).toLocaleDateString('es-ES', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mensaje cuando no hay resultados */}
        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron usuarios</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Intenta con un término de búsqueda diferente' : 'No hay usuarios registrados aún'}
            </p>
          </div>
        )}

        {/* Estadísticas */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {profiles.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Usuarios registrados
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {profiles.filter(p => p.role === 'afiliado').length}
              </div>
              <div className="text-sm text-muted-foreground">
                Afiliados activos
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {profiles.filter(p => p.role === 'administrador').length}
              </div>
              <div className="text-sm text-muted-foreground">
                Administradores
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profiles;