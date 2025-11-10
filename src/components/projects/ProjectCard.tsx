import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  MapPin, 
  Calendar,
  DollarSign,
  FileText,
  User
} from "lucide-react";
import { ProjectHealthIndicator } from "./ProjectHealthIndicator";
import { useNavigate } from "react-router-dom";
import { generateRoute } from "@/config/routes";
import { useQuery } from "@tanstack/react-query";
import { getProjectHealth, getProjectProgress, getDaysRemaining } from "@/lib/project-utils";
import { supabase } from "@/integrations/supabase/client";

interface ProjectCardProps {
  project: {
    id: string;
    status: string;
    client_id: string;
    project_name?: string;
    terreno_m2?: number;
    ubicacion_json?: any;
    created_at: string;
  };
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  prospecto: { label: "Prospecto", variant: "outline" },
  en_diseno: { label: "En Diseño", variant: "secondary" },
  presupuestado: { label: "Presupuestado", variant: "default" },
  en_construccion: { label: "En Construcción", variant: "default" },
  completado: { label: "Completado", variant: "secondary" },
  pausado: { label: "Pausado", variant: "outline" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  // Obtener nombre del cliente y project_name si no viene en props
  const { data: projectData } = useQuery({
    queryKey: ['project-basic', project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('project_name, clients(name)')
        .eq('id', project.id)
        .single();
      return data;
    },
    enabled: !!project.id,
  });

  // Obtener salud del proyecto
  const { data: health } = useQuery({
    queryKey: ['project-health', project.id],
    queryFn: () => getProjectHealth(project.id),
  });

  // Obtener progreso
  const { data: progress } = useQuery({
    queryKey: ['project-progress', project.id],
    queryFn: () => getProjectProgress(project.id),
  });

  // Obtener días restantes
  const { data: daysRemaining } = useQuery({
    queryKey: ['project-days-remaining', project.id],
    queryFn: () => getDaysRemaining(project.id),
  });

  // Obtener consumo presupuestario
  const { data: budgetData } = useQuery({
    queryKey: ['project-budget-consumed', project.id],
    queryFn: async () => {
      const { data: budget } = await supabase
        .from('budgets')
        .select(`
          id,
          budget_items (
            total
          )
        `)
        .eq('project_id', project.id)
        .eq('type', 'ejecutivo')
        .eq('status', 'publicado')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!budget) return { total: 0, consumed: 0, percent: 0 };

      const total = (budget.budget_items as any[])?.reduce(
        (sum, item) => sum + (item.total || 0),
        0
      ) || 0;

      // Simplificar: calcular basado en qty_ordenada
      const { data: orders } = await supabase
        .from('purchase_orders')
        .select('qty_ordenada')
        .eq('project_id', project.id);

      const orderedQty = orders?.reduce((sum, order) => sum + (order.qty_ordenada || 0), 0) || 0;
      const consumed = total > 0 ? (orderedQty / 100) * total : 0;
      const percent = total > 0 ? Math.round((consumed / total) * 100) : 0;

      return { total, consumed, percent };
    },
  });

  const handleClick = () => {
    navigate(generateRoute.proyectoDetalle(project.id));
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group">
      {/* Header with project image placeholder */}
      <div 
        className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden"
        onClick={handleClick}
      >
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute top-3 right-3">
          {health && (
            <ProjectHealthIndicator 
              status={health.status} 
              details={health.details}
              showLabel={false}
              size="lg"
            />
          )}
        </div>
      </div>

      <CardContent className="pt-4 pb-3" onClick={handleClick}>
        {/* Title and client */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {project.project_name || projectData?.project_name || projectData?.clients?.name || 'Proyecto sin nombre'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cliente: {projectData?.clients?.name || 'N/A'}
          </p>
          {project.ubicacion_json?.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {project.ubicacion_json.address}
            </p>
          )}
        </div>

        {/* Status badge and health */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={STATUS_LABELS[project.status]?.variant || "outline"}>
            {STATUS_LABELS[project.status]?.label || project.status}
          </Badge>
          {health && (
            <ProjectHealthIndicator 
              status={health.status} 
              details={health.details}
              size="sm"
            />
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progreso general</span>
            <span className="font-medium">{progress || 0}%</span>
          </div>
          <Progress value={progress || 0} className="h-2" />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground">Presupuesto</p>
            <p className="text-sm font-medium">
              {budgetData?.percent || 0}%
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground">Días rest.</p>
            <p className="text-sm font-medium">
              {daysRemaining !== null && daysRemaining !== undefined 
                ? daysRemaining 
                : '-'}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground">Docs pend.</p>
            <p className="text-sm font-medium">
              {health?.missingDocs || 0}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={handleClick}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalle
        </Button>
      </CardFooter>
    </Card>
  );
}
