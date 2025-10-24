import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, FileText, Image, Calendar, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { FinancialSummary } from "@/components/client/FinancialSummary";

export default function ClientPortal() {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const [userEmail, setUserEmail] = useState<string>("");

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

  const { data: projects } = useQuery({
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
  });

  const { data: budgets } = useQuery({
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
  });

  const { data: documents } = useQuery({
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
  });

  const { data: photos } = useQuery({
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
  });

  const { data: ganttPlans } = useQuery({
    queryKey: ["client-gantt", projects],
    queryFn: async () => {
      if (!projects?.length) return [];

      const { data, error } = await supabase
        .from("gantt_plans")
        .select(`
          *,
          gantt_items (
            *,
            tu_nodes:major_id (name)
          ),
          gantt_ministrations (*)
        `)
        .in("project_id", projects.map((p) => p.id))
        .eq("shared_with_construction", true)
        .eq("type", "ejecutivo");

      if (error) throw error;
      return data;
    },
    enabled: !!projects?.length,
  });

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mi Proyecto</h1>
          <p className="text-muted-foreground">{project.clients?.name}</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {project.status}
        </Badge>
      </div>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen">
            <FolderKanban className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="finanzas">
            <DollarSign className="h-4 w-4 mr-2" />
            Finanzas
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <FileText className="h-4 w-4 mr-2" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="fotos">
            <Image className="h-4 w-4 mr-2" />
            Fotos de Obra
          </TabsTrigger>
          <TabsTrigger value="calendario">
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información del Proyecto</CardTitle>
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
                {budgetSummary ? (
                  <div className="space-y-2">
                    {Object.entries(budgetSummary).map(([mayorId, data]: [string, any]) => (
                      <div key={mayorId} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm font-medium">
                          Partida {mayorId.slice(0, 8)}
                        </span>
                        <span className="font-semibold text-primary">
                          ${data.total.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay presupuesto disponible
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finanzas">
          <FinancialSummary projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Mis Documentos</CardTitle>
              <CardDescription>Documentos compartidos por el equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {documents?.length ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tipo_carpeta} • {new Date(doc.created_at).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.file_url, "_blank")}
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay documentos disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fotos">
          <Card>
            <CardHeader>
              <CardTitle>Fotos de Obra</CardTitle>
              <CardDescription>Registro fotográfico del avance</CardDescription>
            </CardHeader>
            <CardContent>
              {photos?.length ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="border rounded-lg overflow-hidden">
                      <img
                        src={photo.file_url}
                        alt={photo.descripcion || "Foto de obra"}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-2">
                        <p className="text-sm">{photo.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(photo.fecha_foto).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay fotos disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma del Proyecto</CardTitle>
              <CardDescription>Fechas estimadas de las fases</CardDescription>
            </CardHeader>
            <CardContent>
              {ganttPlans?.length ? (
                <div className="space-y-4">
                  {ganttPlans[0]?.gantt_items?.map((item: any) => (
                    <div key={item.id} className="border-l-4 border-primary pl-4 py-2">
                      <h4 className="font-semibold">{item.tu_nodes?.name || "Fase"}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.start_date).toLocaleDateString("es-MX")} -{" "}
                        {new Date(item.end_date).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay cronograma disponible
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
