import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Home, FileText, PenTool, Image, Calendar, MessageSquare, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import { ModernMobileMenu } from "@/components/ui/modern-mobile-menu";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClientLayout() {
  const navigate = useNavigate();
  // Temporarily disabled - will be restored in Prompt 2
  const hasAccess = true;
  const accessLoading = false;
  const isImpersonating = false;
  const exitImpersonate = () => {};
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() =>
    localStorage.getItem("client.activeProject")
  );
  const [userEmail, setUserEmail] = useState<string>("");

  // Show loading while checking access
  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
    };
    getUser();
  }, []);

  const { data: projects } = useQuery({
    queryKey: ["client-projects", userEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          status,
          terreno_m2,
          notas,
          clients!inner(name, email)
        `)
        .eq("clients.email", userEmail);

      if (error) throw error;
      return data;
    },
    enabled: !!userEmail,
    staleTime: CACHE_CONFIG.active.staleTime,
    gcTime: CACHE_CONFIG.active.gcTime,
  });

  useEffect(() => {
    if (projects?.length && !selectedProjectId) {
      const firstProjectId = projects[0].id;
      setSelectedProjectId(firstProjectId);
      localStorage.setItem("client.activeProject", firstProjectId);
    }
  }, [projects, selectedProjectId]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    localStorage.setItem("client.activeProject", projectId);
  };

  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  const projectName = selectedProject?.clients?.name 
    ? `Proyecto de ${selectedProject.clients.name}` 
    : "Mi Proyecto";

  const menuItems = [
    { label: "Inicio", icon: Home, href: "/client/overview" },
    { label: "Docs", icon: FileText, href: "/client/documentos" },
    { label: "Diseño", icon: PenTool, href: "/client/diseno" },
    { label: "Citas", icon: Calendar, href: "/client/calendario" },
    { label: "Chat", icon: MessageSquare, href: "/client/chat" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Impersonate banner */}
      {isImpersonating && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-yellow-50 border-yellow-200">
          <AlertDescription className="flex items-center justify-between max-w-4xl mx-auto">
            <span className="text-sm font-medium text-yellow-900">
              Estás viendo como cliente
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={exitImpersonate}
              className="h-8 text-yellow-900 hover:bg-yellow-100"
            >
              <X className="h-4 w-4 mr-1" />
              Salir
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3.5 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {projects && projects.length > 1 ? (
              <Select value={selectedProjectId || undefined} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full max-w-xs border-none shadow-none focus:ring-0 px-0">
                  <SelectValue placeholder="Seleccionar proyecto">
                    <span className="text-base font-semibold text-slate-900">
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
              <h1 className="text-base font-semibold text-slate-900 truncate">
                {projectName}
              </h1>
            )}
          </div>
          <button 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Menú de usuario"
          >
            <User className="h-5 w-5 text-slate-700" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-5 pb-24">
        <Outlet context={{ projectId: selectedProjectId }} />
      </main>

      {/* Modern Mobile Bottom Navigation */}
      <ModernMobileMenu items={menuItems} accentColor="var(--brand-accent)" />
    </div>
  );
}
