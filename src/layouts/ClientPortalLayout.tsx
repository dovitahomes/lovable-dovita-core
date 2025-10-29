import { Outlet, useNavigate } from "react-router-dom";
import { ClientAppShell } from "@/components/client/ClientAppShell";
import { useClientAccess } from "@/hooks/useClientAccess";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { LoadingError } from "@/components/common/LoadingError";
import { useQueryClient } from "@tanstack/react-query";

export default function ClientPortalLayout() {
  const { hasAccess, loading: accessLoading, error: accessError } = useClientAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  if (!sessionChecked || accessLoading || accessError || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingError
          isLoading={!sessionChecked || accessLoading}
          error={accessError}
          emptyMessage="No tienes permisos para acceder al portal de cliente"
          onRetry={() => {
            queryClient.clear();
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <ClientAppShell>
      <Outlet />
    </ClientAppShell>
  );
}
