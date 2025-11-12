import { useNavigate } from "react-router-dom";
import { useProjectById } from "@/hooks/useProjects";
import { useConstructionStats } from "@/hooks/construction/useConstructionStats";
import { DashboardCard } from "@/components/construction/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, TrendingUp, Camera, Package, Users } from "lucide-react";

interface ConstruccionDashboardProps {
  projectId: string;
}

export default function ConstruccionDashboard({ projectId }: ConstruccionDashboardProps) {
  const navigate = useNavigate();
  const { data: project } = useProjectById(projectId);
  const { data: stats, isLoading } = useConstructionStats(projectId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/proyectos')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate('/proyectos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Construcción
          </h1>
          {project && (
            <p className="text-muted-foreground mt-1">
              Proyecto: {project.clients?.name || "Sin nombre"}
            </p>
          )}
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Etapas y Avance */}
        <DashboardCard
          title="Etapas y Avance"
          description="Gestiona etapas, progreso y cronograma Gantt"
          icon={TrendingUp}
          gradient="from-blue-500 to-cyan-500"
          onClick={() => navigate(`/construccion/${projectId}/etapas`)}
          stats={[
            { label: "Etapas Activas", value: stats?.activeStages || 0 },
            { label: "Progreso Global", value: `${stats?.globalProgress || 0}%` },
          ]}
        />

        {/* Card 2: Fotografías Geolocalizadas */}
        <DashboardCard
          title="Fotografías de Obra"
          description="Galería de fotos con ubicación en mapa"
          icon={Camera}
          gradient="from-purple-500 to-pink-500"
          onClick={() => navigate(`/construccion/${projectId}/fotos`)}
          stats={[
            { label: "Fotos Totales", value: stats?.totalPhotos || 0 },
            { label: "Esta Semana", value: `+${stats?.photosThisWeek || 0}` },
          ]}
        />

        {/* Card 3: Materiales y Órdenes */}
        <DashboardCard
          title="Materiales y Compras"
          description="Consumo de materiales y órdenes de compra"
          icon={Package}
          gradient="from-orange-500 to-red-500"
          onClick={() => navigate(`/construccion/${projectId}/materiales`)}
          stats={[
            { label: "OCs Activas", value: stats?.activeOrders || 0 },
            { label: "Pendientes", value: stats?.pendingOrders || 0 },
          ]}
        />

        {/* Card 4: Equipo de Proyecto */}
        <DashboardCard
          title="Equipo de Proyecto"
          description="Colaboradores asignados a la obra"
          icon={Users}
          gradient="from-green-500 to-emerald-500"
          onClick={() => navigate(`/construccion/${projectId}/equipo`)}
          stats={[
            { label: "Miembros", value: stats?.teamMembers || 0 },
            { label: "En Sitio Hoy", value: stats?.onSiteToday || 0 },
          ]}
        />
      </div>
    </div>
  );
}
