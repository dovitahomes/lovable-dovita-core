import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Home, FileText, PenTool, Hammer, Calendar, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export default function ClientLayout() {
  const [activeTab, setActiveTab] = useState(() => 
    localStorage.getItem("client.activeTab") || "overview"
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() =>
    localStorage.getItem("client.activeProject")
  );
  const [userEmail, setUserEmail] = useState<string>("");

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("client.activeTab", tab);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    localStorage.setItem("client.activeProject", projectId);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "diseno", label: "Diseño", icon: PenTool },
    { id: "obra", label: "Obra", icon: Hammer },
    { id: "calendario", label: "Calendario", icon: Calendar },
    { id: "chat", label: "Chat", icon: MessageCircle },
  ];

  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  const projectName = selectedProject?.clients?.name 
    ? `Proyecto de ${selectedProject.clients.name}` 
    : "Mi Proyecto";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {projects && projects.length > 1 ? (
              <Select value={selectedProjectId || undefined} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full max-w-xs border-none shadow-none focus:ring-0">
                  <SelectValue placeholder="Seleccionar proyecto">
                    <span className="text-lg font-semibold text-[hsl(var(--dovita-blue))]">
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
              <h1 className="text-lg font-semibold text-[hsl(var(--dovita-blue))] truncate">
                {projectName}
              </h1>
            )}
          </div>
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Menú de usuario"
          >
            <User className="h-6 w-6 text-[hsl(var(--dovita-dark))]" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[hsl(var(--dovita-blue))]">Resumen del Proyecto</h2>
            <p className="text-[hsl(var(--dovita-dark))] opacity-70">
              Contenido de overview - en desarrollo
            </p>
          </div>
        )}
        
        {activeTab === "documentos" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[hsl(var(--dovita-blue))]">Documentos</h2>
            <p className="text-[hsl(var(--dovita-dark))] opacity-70">
              Contenido de documentos - en desarrollo
            </p>
          </div>
        )}
        
        {activeTab === "diseno" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[hsl(var(--dovita-blue))]">Diseño</h2>
            <p className="text-[hsl(var(--dovita-dark))] opacity-70">
              Contenido de diseño - en desarrollo
            </p>
          </div>
        )}
        
        {activeTab === "obra" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[hsl(var(--dovita-blue))]">Avances de Obra</h2>
            <p className="text-[hsl(var(--dovita-dark))] opacity-70">
              Contenido de obra - en desarrollo
            </p>
          </div>
        )}
        
        {activeTab === "calendario" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[hsl(var(--dovita-blue))]">Calendario</h2>
            <p className="text-[hsl(var(--dovita-dark))] opacity-70">
              Contenido de calendario - en desarrollo
            </p>
          </div>
        )}
        
        {activeTab === "chat" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[hsl(var(--dovita-blue))]">Chat</h2>
            <p className="text-[hsl(var(--dovita-dark))] opacity-70">
              Contenido de chat - en desarrollo
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
        aria-label="Navegación principal"
      >
        <div className="max-w-md mx-auto grid grid-cols-6 h-20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive
                    ? "text-[hsl(var(--dovita-blue))]"
                    : "text-gray-500 hover:text-[hsl(var(--dovita-blue))]"
                )}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )} 
                  aria-hidden="true" 
                />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
