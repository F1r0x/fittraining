import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Camera, Save, Mail, Shield, Bell, Palette } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Error al actualizar el perfil");
        return;
      }

      toast.success("Perfil actualizado correctamente");
      fetchProfile();
    } catch (error) {
      toast.error("Error al actualizar el perfil");
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implementar subida de imagen cuando se configure storage
      toast.info("Función de avatar próximamente disponible");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
          <p className="text-muted-foreground">Gestiona tu cuenta y preferencias</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Perfil Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xl">
                      {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                        <Camera className="h-4 w-4" />
                        Cambiar foto
                      </div>
                    </Label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG hasta 2MB</p>
                  </div>
                </div>

                <Separator />

                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre de usuario</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ingresa tu nombre"
                  />
                </div>

                {/* Email (readonly) */}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                </div>

                <Button onClick={updateProfile} disabled={updating} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {updating ? "Guardando..." : "Guardar cambios"}
                </Button>
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Preferencias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificaciones</Label>
                    <p className="text-sm text-muted-foreground">Recibe notificaciones sobre entrenamientos</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo oscuro</Label>
                    <p className="text-sm text-muted-foreground">Usar tema oscuro en la aplicación</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Cambiar contraseña
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Verificación en dos pasos
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  Eliminar cuenta
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Miembro desde</span>
                  <span className="text-sm font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última actualización</span>
                  <span className="text-sm font-medium">
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;