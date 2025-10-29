import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { FinancialSummary } from "@/components/client/FinancialSummary";
import { ClientTabBar } from "@/components/client/ClientTabBar";
import { PhotoViewer } from "@/components/client/PhotoViewer";
// Legacy component - new dedicated chat page at /client/chat uses different implementation
import { ClientChat } from "@/components/client/ClientChat";
import { ClientCalendar } from "@/components/client/ClientCalendar";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ClientPortal() {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const [userEmail, setUserEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState("resumen");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    // Redirect if not a client
    if (role && role !== "cliente") {
      navigate("/");
    }

    // Get user email
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
    };
    getUser();
  }, [role, navigate]);

  const { data: projects, error: projectsError, refetch: refetchProjects } = useQuery({
    queryKey: ["client-projects", userEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients (name, email)
        `)
        .eq("clients.email", userEmail);

      if (error) throw error;
      return data;
    },
    enabled: !!userEmail,
    staleTime: CACHE_CONFIG.active.staleTime,
    gcTime: CACHE_CONFIG.active.gcTime,
  });

  const { data: budgets, error: budgetsError } = useQuery({
    queryKey: ["client-budgets", projects],
    queryFn: async () => {
      if (!projects?.length) return [];

      const { data, error } = await supabase
        .from("budgets")
        .select(`
          *,
          budget_items (
            id,
            mayor_id,
            total,
            cant_necesaria,
            unidad,
            descripcion
          )
        `)
        .in("project_id", projects.map((p) => p.id))
        .eq("cliente_view_enabled", true)
        .eq("status", "publicado");

      if (error) throw error;
      return data;
    },
    enabled: !!projects?.length,
    staleTime: CACHE_CONFIG.active.staleTime,
    gcTime: CACHE_CONFIG.active.gcTime,
  });

  const { data: documents, error: documentsError } = useQuery({
    queryKey: ["client-documents", projects],
    queryFn: async () => {
      if (!projects?.length) return [];

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projects.map((p) => p.id))
        .eq("visibilidad", "cliente")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projects?.length,
    staleTime: CACHE_CONFIG.active.staleTime,
    gcTime: CACHE_CONFIG.active.gcTime,
  });

  const { data: photos, error: photosError } = useQuery({
    queryKey: ["client-photos", projects],
    queryFn: async () => {
      if (!projects?.length) return [];

      const { data, error } = await supabase
        .from("construction_photos")
        .select("*")
        .in("project_id", projects.map((p) => p.id))
        .eq("visibilidad", "cliente")
        .order("fecha_foto", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projects?.length,
    staleTime: CACHE_CONFIG.active.staleTime,
    gcTime: CACHE_CONFIG.active.gcTime,
  });

  if (projectsError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Portal del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-sm text-destructive text-center">Error al cargar proyectos</p>
            <Button onClick={() => refetchProjects()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Portal del Cliente</CardTitle>
            <CardDescription>No tienes proyectos asignados</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const project = projects[0]; // Single project view for clients

  // Calculate budget summary by mayor (hide unit costs)
  const budgetSummary = budgets?.[0]?.budget_items?.reduce((acc: any, item: any) => {
    const mayorId = item.mayor_id || "sin-categoria";
    if (!acc[mayorId]) {
      acc[mayorId] = {
        total: 0,
        items: 0,
      };
    }
    acc[mayorId].total += Number(item.total || 0);
    acc[mayorId].items += 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      {/* Header */}
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mi Proyecto</h1>
            <p className="text-sm md:text-base text-muted-foreground">{project.clients?.name}</p>
          </div>
          <Badge variant="outline" className="text-sm md:text-lg px-3 py-1 md:px-4 md:py-2">
            {project.status}
          </Badge>
        </div>
      </header>

      {/* Content based on active tab */}
      <main>
        {activeTab === "resumen" && (
          <section aria-labelledby="project-info-heading">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle id="project-info-heading">Información del Proyecto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge className="ml-2">{project.status}</Badge>
                  </div>
                  {project.terreno_m2 && (
                    <div>
                      <span className="text-muted-foreground">Terreno:</span>
                      <span className="ml-2 font-semibold">{project.terreno_m2} m²</span>
                    </div>
                  )}
                  {project.notas && (
                    <div>
                      <span className="text-muted-foreground">Notas:</span>
                      <p className="mt-1 text-sm">{project.notas}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Presupuesto</CardTitle>
                  <CardDescription>Total por partida (sin desglose de costos)</CardDescription>
                </CardHeader>
                <CardContent>
                  {budgetsError ? (
                    <p className="text-sm text-destructive text-center py-4">
                      Error al cargar presupuesto
                    </p>
                  ) : budgetSummary ? (
                    <div className="space-y-2">
                      <TooltipProvider>
                        {Object.entries(budgetSummary).map(([mayorId, data]: [string, any]) => (
                          <Tooltip key={mayorId}>
                            <TooltipTrigger asChild>
                              <div className="flex justify-between items-center p-2 border rounded cursor-help">
                                <span className="text-sm font-medium truncate">
                                  Partida {mayorId.slice(0, 8)}
                                </span>
                                <span className="font-semibold text-primary">
                                  ${data.total.toLocaleString("es-MX", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Partida: {mayorId}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No hay presupuesto disponible
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {activeTab === "finanzas" && (
          <FinancialSummary projectId={project.id} />
        )}
        
        {activeTab === "documentos" && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Documentos</CardTitle>
              <CardDescription>Documentos compartidos por el equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {documentsError ? (
                <p className="text-sm text-destructive text-center py-8">
                  Error al cargar documentos
                </p>
              ) : documents?.length ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tipo_carpeta} • {new Date(doc.created_at).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.file_url, "_blank")}
                        aria-label={`Ver documento ${doc.nombre}`}
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" aria-hidden="true" />
                  <h3 className="text-lg font-medium mb-2">No hay documentos</h3>
                  <p className="text-sm text-muted-foreground">
                    Los documentos compartidos por el equipo aparecerán aquí
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "fotos" && (
          <Card>
            <CardHeader>
              <CardTitle>Avances de Obra</CardTitle>
              <CardDescription>Registro fotográfico del progreso</CardDescription>
            </CardHeader>
            <CardContent>
              {photosError ? (
                <p className="text-sm text-destructive text-center py-8">
                  Error al cargar fotos
                </p>
              ) : photos?.length ? (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  {photos.map((photo, index) => (
                    <div 
                      key={photo.id} 
                      className="border rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedPhotoIndex(index)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver foto ${photo.descripcion || index + 1}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPhotoIndex(index);
                        }
                      }}
                    >
                      <img
                        src={photo.file_url}
                        alt={photo.descripcion || "Foto de obra"}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-2">
                        {photo.descripcion && (
                          <p className="text-sm truncate" title={photo.descripcion}>
                            {photo.descripcion}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(photo.fecha_foto).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" aria-hidden="true" />
                  <h3 className="text-lg font-medium mb-2">No hay fotos de avance</h3>
                  <p className="text-sm text-muted-foreground">
                    Las fotos del progreso de obra aparecerán aquí
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "calendario" && (
          <ClientCalendar projectId={project.id} />
        )}

        {activeTab === "chat" && (
          <ClientChat projectId={project.id} />
        )}
      </main>

      {/* Mobile TabBar */}
      <ClientTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Photo Viewer */}
      {selectedPhotoIndex !== null && photos && (
        <PhotoViewer
          photos={photos}
          initialIndex={selectedPhotoIndex}
          isOpen={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  );
}
