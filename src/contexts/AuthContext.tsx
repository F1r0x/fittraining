import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      // 1️⃣ Crear usuario en Supabase Auth y agregar displayName en user_metadata
      const { data: userData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { display_name: displayName },
        },
      });

      if (authError) {
        toast({ title: "Error en el registro", description: authError.message, variant: "destructive" });
        return { error: authError };
      }

      // 2️⃣ Insertar displayName en tabla profiles
      if (userData.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          { user_id: userData.user.id, display_name: displayName }
        ]);

        if (profileError) {
          toast({ title: "Error al crear perfil", description: profileError.message, variant: "destructive" });
          return { error: profileError };
        }
      }

      toast({
        title: "Registro exitoso",
        description: "Por favor verifica tu email para activar tu cuenta.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error durante el registro.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Bienvenido", description: "Has iniciado sesión correctamente." });

      return { error };
    } catch (error: any) {
      toast({ title: "Error inesperado", description: "Ocurrió un error durante el inicio de sesión.", variant: "destructive" });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) toast({ title: "Error", description: "No se pudo cerrar sesión.", variant: "destructive" });
      else toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
    } catch (error) {
      toast({ title: "Error inesperado", description: "Ocurrió un error al cerrar sesión.", variant: "destructive" });
    }
  };

  return <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>{children}</AuthContext.Provider>;
};
