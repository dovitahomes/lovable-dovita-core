import { Outlet, useNavigate } from "react-router-dom";
import { ClientAppShell } from "@/components/client/ClientAppShell";
import { useClientAccess } from "@/hooks/useClientAccess";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";

export default function ClientPortalLayout() {
  const { hasAccess, loading: accessLoading } = useClientAccess();
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      
      if (!session) {
        // No session - redirect to login
        navigate('/auth/login', { replace: true });
        return;
      }
      
      setSessionChecked(true);
    };

    checkSession();
  }, [navigate]);

  if (!sessionChecked || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <ClientAppShell>
      <Outlet />
    </ClientAppShell>
  );
}
