import { Outlet } from "react-router-dom";
import { ClientAppShell } from "@/components/client/ClientAppShell";
import { useClientAccess } from "@/hooks/useClientAccess";

export default function ClientPortalLayout() {
  const { hasAccess, loading: accessLoading } = useClientAccess();

  if (accessLoading) {
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
