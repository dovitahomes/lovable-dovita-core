import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, X, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientBottomNav } from "./ClientBottomNav";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import { getEffectiveClientMode } from "@/lib/auth/role";
import { useSessionReady } from "@/hooks/useSessionReady";

interface ClientAppShellProps {
  children: ReactNode;
}

export function ClientAppShell({ children }: ClientAppShellProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status, isReady } = useSessionReady();
  const isImpersonating = getEffectiveClientMode();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return searchParams.get("project") || localStorage.getItem("client.activeProject");
  });
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Wait for session to be ready
    if (!isReady) return;

    // Redirect if not authenticated
    if (status === 'signed_out') {
      navigate('/auth/login', { replace: true });
      return;
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
    };
    getUser();
  }, [status, isReady, navigate]);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["client-projects", userEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          status,
          clients!inner(name, email)
        `)
        .eq("clients.email", userEmail);

      if (error) throw error;
      return data;
    },
    enabled: !!userEmail && isReady,
    staleTime: CACHE_CONFIG.active.staleTime,
    gcTime: CACHE_CONFIG.active.gcTime,
  });

  // Show loading state while checking session or loading projects
  if (status !== 'ready' || (isReady && !userEmail) || projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (projects?.length && !selectedProjectId) {
      const firstProjectId = projects[0].id;
      setSelectedProjectId(firstProjectId);
      localStorage.setItem("client.activeProject", firstProjectId);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem("client.activeProject", selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const exitImpersonate = () => {
    localStorage.removeItem('dovita_view_as_client');
    localStorage.removeItem('client.activeProject');
    // Remove query param and go back to dashboard
    window.location.href = '/';
  };

  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  const projectName = selectedProject?.clients?.name 
    ? `Proyecto de ${selectedProject.clients.name}` 
    : "Mi Proyecto";

  return (
    <div className="min-h-screen bg-background">
      {isImpersonating && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-primary/10 border-primary/20">
          <AlertDescription className="flex items-center justify-between max-w-md mx-auto px-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-medium">
                👁 Vista Admin
              </div>
              <span className="text-sm text-foreground">
                {selectedProject?.clients?.name || "Cliente"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={exitImpersonate}
              className="h-7 text-xs hover:bg-primary/10"
            >
              <X className="h-3 w-3 mr-1" />
              Salir
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <header className="sticky top-0 z-40 bg-white border-b shadow-sm px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {projects && projects.length > 1 ? (
              <Select value={selectedProjectId || undefined} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full max-w-xs border-none shadow-none focus:ring-0 px-0">
                  <SelectValue placeholder="Seleccionar proyecto">
                    <span className="text-base font-semibold text-foreground">
                      {projectName}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.clients?.name ? `Proyecto de ${project.clients.name}` : "Proyecto"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <h1 className="text-base font-semibold text-foreground truncate">
                {projectName}
              </h1>
            )}
          </div>
          <button 
            className="p-2 hover:bg-accent rounded-full transition-colors"
            aria-label="Menú de usuario"
          >
            <User className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-24 md:pb-4">
        {children}
      </main>

      <ClientBottomNav />
    </div>
  );
}
