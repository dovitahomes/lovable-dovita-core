import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import { Overview } from "@/pages/client/Overview";
import { ClientTabBar } from "@/components/client/ClientTabBar";
import { ClientDocumentsPage } from "./client/documents/ClientDocumentsPage";

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

  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  const projectName = selectedProject?.clients?.name 
    ? `Proyecto de ${selectedProject.clients.name}` 
    : "Mi Proyecto";

  return (
    <div className="min-h-screen bg-white">
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
      <main className="max-w-md mx-auto px-4 py-5 pb-20">
      {activeTab === "overview" && <Overview />}
        
        {activeTab === "documentos" && (
          <ClientDocumentsPage projectId={selectedProjectId} />
        )}
        
        {activeTab === "diseno" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Diseño</h2>
            <p className="text-slate-600">
              Contenido de diseño - en desarrollo
            </p>
          </div>
        )}
        
        {activeTab === "obra" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Avances de Obra</h2>
            <p className="text-slate-600">
              Contenido de obra - en desarrollo
            </p>
          </div>
        )}
        
        {activeTab === "calendario" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Calendario</h2>
            <p className="text-slate-600">
              Contenido de calendario - en desarrollo
            </p>
          </div>
        )}
        
        {activeTab === "chat" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Chat</h2>
            <p className="text-slate-600">
              Contenido de chat - en desarrollo
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <ClientTabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
