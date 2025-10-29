import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDemoSession } from "@/auth/DemoGuard";
import { waitForSession } from "@/lib/authClient";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const demoSession = useDemoSession();
  const [sessionChecking, setSessionChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    // If demo mode is active, use demo session
    if (demoSession.isDemoMode) {
      setHasSession(true);
      setIsAdmin(demoSession.role === 'admin');
      setSessionChecking(false);
      return;
    }

    // Wait for session with timeout (non-blocking)
    const checkSession = async () => {
      console.info('[route-guard] Checking session...');
      const session = await waitForSession({ timeoutMs: 20000 });
      
      if (session) {
        console.info('[route-guard] ✓ Session found');
        setHasSession(true);
        
        // Check admin role if required
        if (requireAdmin) {
          setCheckingAdmin(true);
          checkAdminRole(session.user.id);
        }
      } else {
        console.warn('[route-guard] ⚠️ No session after 20s');
        setHasSession(false);
      }
      
      setSessionChecking(false);
    };

    checkSession();
  }, [requireAdmin, demoSession]);

  const checkAdminRole = async (userId: string) => {
    try {
      console.info('[route-guard] Checking admin role...');
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!data);
      console.info('[route-guard] Admin:', !!data);
    } catch (error) {
      console.error('[route-guard] Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  // Show loading state while checking session (max 20s due to waitForSession timeout)
  if (sessionChecking || checkingAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando sesión...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!hasSession && !demoSession.isDemoMode) {
    console.info('[route-guard] → Redirecting to login');
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

  console.info('[route-guard] ✓ Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
