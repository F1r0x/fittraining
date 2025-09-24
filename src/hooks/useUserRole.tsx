import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type UserRole = 'suscriptor' | 'afiliado' | 'administrador';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    fetchUserRole();
  }, [user?.id]);

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
        setRole('suscriptor');
      } else {
        setRole(data?.role || 'suscriptor');
      }
    } catch (error) {
      console.error("Error:", error);
      setRole('suscriptor');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'administrador';
  const isAffiliate = role === 'afiliado';
  const isSubscriptor = role === 'suscriptor';

  return {
    role,
    loading,
    isAdmin,
    isAffiliate,
    isSubscriptor,
    hasRole: (requiredRole: UserRole) => role === requiredRole,
    hasAnyRole: (requiredRoles: UserRole[]) => role ? requiredRoles.includes(role) : false
  };
};