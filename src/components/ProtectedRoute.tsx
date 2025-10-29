import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDemoSession } from "@/auth/DemoGuard";
import { useSessionReady } from "@/hooks/useSessionReady";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const demoSession = useDemoSession();
  const { status, session } = useSessionReady();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    // If demo mode is active, use demo session
    if (demoSession.isDemoMode) {
      setIsAdmin(demoSession.role === 'admin');
      return;
    }

    // Check admin role if required and authenticated
    if (requireAdmin && status === 'authenticated' && session?.user) {
      setCheckingAdmin(true);
      checkAdminRole(session.user.id);
    }
  }, [requireAdmin, status, session, demoSession]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!data);
    } catch (error) {
      console.error('[ProtectedRoute] Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  // Show loading state while checking session
  if (status === 'loading' || (requireAdmin && checkingAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando sesión...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated' && !demoSession.isDemoMode) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check admin access
  if (requireAdmin && !isAdmin && !demoSession.isDemoMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos de administrador.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
