import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Package, Camera, Users, Calendar } from "lucide-react";
import { PurchaseOrdersTab } from "@/components/construction/PurchaseOrdersTab";
import { ConstructionPhotosTab } from "@/components/construction/ConstructionPhotosTab";
import { ProjectTeamTab } from "@/components/construction/ProjectTeamTab";
import { GanttProgressTab } from "@/components/construction/GanttProgressTab";
import { LoadingError } from "@/components/common/LoadingError";
import { TableSkeleton } from "@/components/common/Skeletons";

export default function Construccion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(false);
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients(name),
          budgets!inner(
            id,
            type,
            status,
            shared_with_construction
          )
        `)
        .eq("id", id)
        .eq("budgets.type", "ejecutivo")
        .eq("budgets.status", "publicado")
        .eq("budgets.shared_with_construction", true)
        .maybeSingle();

      if (error) throw error;

      if (!data || !data.budgets || data.budgets.length === 0) {
        toast.error("Este proyecto no tiene un presupuesto ejecutivo compartido");
        navigate("/proyectos");
        return;
      }

      setProject(data);
    } catch (err) {
      console.error("Error al cargar proyecto:", err);
      setError(true);
      toast.error("Error al cargar el proyecto");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <LoadingError onRetry={loadProject} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <TableSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">
          No se encontró el proyecto
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/proyectos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Construcción</h1>
            <p className="text-muted-foreground">{project.clients?.name}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Órdenes de Compra
          </TabsTrigger>
          <TabsTrigger value="gantt" className="gap-2">
            <Calendar className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-2">
            <Camera className="h-4 w-4" />
            Fotos de Obra
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <PurchaseOrdersTab projectId={project.id} budgetId={project.budgets[0]?.id} />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttProgressTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="photos">
          <ConstructionPhotosTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="team">
          <ProjectTeamTab projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
