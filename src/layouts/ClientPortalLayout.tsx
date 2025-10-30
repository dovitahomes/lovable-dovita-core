import { Outlet, useNavigate } from "react-router-dom";
import { ClientAppShell } from "@/components/client/ClientAppShell";
import { useClientAccess } from "@/hooks/useClientAccess";
import { useEffect } from "react";
import { LoadingError } from "@/components/common/LoadingError";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionReady } from "@/hooks/useSessionReady";

export default function ClientPortalLayout() {
  const { hasAccess, loading: accessLoading, error: accessError } = useClientAccess();
  const { status, isReady } = useSessionReady();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Redirect to login if not authenticated after session check
    if (status === 'no-session') {
      navigate('/auth/login', { replace: true });
    }
  }, [status, navigate]);

  if (!isReady || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingError
          isLoading={true}
          emptyMessage="Verificando acceso..."
        />
      </div>
    );
  }

  if (accessError || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingError
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
