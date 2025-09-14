import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { User, Camera, Save, Mail, Shield, Bell, Palette, Key, Trash2, Lock, Crown, Star, UserCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

type UserRole = 'suscriptor' | 'afiliado' | 'administrador';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Estados para eliminar cuenta
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserRole();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url, created_at, updated_at")
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
        // Si no hay rol, asignar suscriptor por defecto
        setUserRole('suscriptor');
        return;
      }

      setUserRole(data?.role || 'suscriptor');
    } catch (error) {
      console.error("Error:", error);
      setUserRole('suscriptor');
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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo y tamaño de archivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error("La imagen debe ser menor a 2MB");
      return;
    }

    setUpdating(true);
    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Eliminar avatar anterior si existe
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Subir nueva imagen
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Error al subir la imagen");
        return;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Actualizar perfil con nueva URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        toast.error("Error al actualizar el perfil");
        return;
      }

      toast.success("Avatar actualizado correctamente");
      await fetchProfile(); // Recargar datos del perfil
      
    } catch (error) {
      console.error("Avatar change error:", error);
      toast.error("Error al cambiar el avatar");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error("Error al cambiar la contraseña: " + error.message);
        return;
      }

      toast.success("Contraseña cambiada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Error al cambiar la contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "ELIMINAR") {
      toast.error('Escribe "ELIMINAR" para confirmar');
      return;
    }

    try {
      // Eliminar el perfil del usuario
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", user?.id);

      if (profileError) {
        console.error("Error deleting profile:", profileError);
        toast.error("Error al eliminar el perfil");
        return;
      }

      toast.success("Perfil eliminado correctamente. Cerrando sesión...");
      
      // Cerrar sesión del usuario
      setTimeout(async () => {
        await signOut();
        navigate("/");
      }, 1500);
      
    } catch (error) {
      toast.error("Error al eliminar la cuenta");
    }
  };

  const handleEnable2FA = () => {
    toast.info("La verificación en dos pasos estará disponible próximamente");
  };

  const getRoleInfo = (role: UserRole | null) => {
    switch (role) {
      case 'administrador':
        return {
          label: 'Administrador',
          icon: Crown,
          variant: 'default' as const,
          description: 'Acceso completo al sistema'
        };
      case 'afiliado':
        return {
          label: 'Afiliado',
          icon: Star,
          variant: 'secondary' as const,
          description: 'Plan personalizado activo'
        };
      case 'suscriptor':
      default:
        return {
          label: 'Suscriptor',
          icon: UserCheck,
          variant: 'outline' as const,
          description: 'Acceso a entrenamientos básicos'
        };
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

                {/* Rol del usuario */}
                <div className="space-y-2">
                  <Label>Rol de usuario</Label>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const roleInfo = getRoleInfo(userRole);
                      const IconComponent = roleInfo.icon;
                      return (
                        <>
                          <Badge variant={roleInfo.variant} className="flex items-center gap-2">
                            <IconComponent className="h-3 w-3" />
                            {roleInfo.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{roleInfo.description}</span>
                        </>
                      );
                    })()}
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
                {/* Cambiar contraseña */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="h-4 w-4 mr-2" />
                      Cambiar contraseña
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cambiar contraseña</DialogTitle>
                      <DialogDescription>
                        Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva contraseña</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Ingresa tu nueva contraseña"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirma tu nueva contraseña"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleChangePassword} disabled={changingPassword}>
                        <Lock className="h-4 w-4 mr-2" />
                        {changingPassword ? "Cambiando..." : "Cambiar contraseña"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Verificación en dos pasos */}
                <Button variant="outline" className="w-full justify-start" onClick={handleEnable2FA}>
                  <Shield className="h-4 w-4 mr-2" />
                  Verificación en dos pasos
                </Button>

                {/* Eliminar cuenta */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar cuenta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos y entrenamientos.
                        <br /><br />
                        Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                      placeholder="Escribe ELIMINAR"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar cuenta permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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