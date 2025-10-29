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

  useEffect(() => {
    // Demo mode
    if (demoSession.isDemoMode) {
      setHasSession(true);
      setIsAdmin(demoSession.role === 'admin');
      setSessionChecking(false);
      return;
    }

    // Check session rápidamente (max 5s)
    const checkSession = async () => {
      console.info('[route-guard] Checking session...');
      const session = await waitForSession({ timeoutMs: 5000 });
      
      if (session) {
        console.info('[route-guard] ✓ Session found');
        setHasSession(true);
        
        // Check admin in parallel if needed (non-blocking)
        if (requireAdmin) {
          (async () => {
            try {
              const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .eq("role", "admin")
                .maybeSingle();
              
              setIsAdmin(!!data);
              console.info('[route-guard] Admin:', !!data);
            } catch (error) {
              console.error('[route-guard] Error checking admin:', error);
              setIsAdmin(false);
            }
          })();
        }
      } else {
        console.warn('[route-guard] ⚠️ No session');
        setHasSession(false);
      }
      
      setSessionChecking(false);
    };

    checkSession();
  }, [requireAdmin, demoSession]);

  // Spinner pequeño (max 5s)
  if (sessionChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando sesión… (máx. 5s)</p>
      </div>
    );
  }

  // Redirect to login
  if (!hasSession && !demoSession.isDemoMode) {
    console.info('[route-guard] → Redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  // Check admin (non-blocking ya que isAdmin se carga en paralelo)
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
