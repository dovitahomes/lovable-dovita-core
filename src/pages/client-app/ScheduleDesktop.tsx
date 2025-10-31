import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const phases = [
  {
    id: 1,
    name: "Planificación y Diseño",
    status: "completed",
    progress: 100,
    startDate: "1 Ago 2024",
    endDate: "31 Ago 2024",
  },
  {
    id: 2,
    name: "Preparación del Terreno",
    status: "completed",
    progress: 100,
    startDate: "1 Sep 2024",
    endDate: "15 Sep 2024",
  },
  {
    id: 3,
    name: "Cimentación",
    status: "completed",
    progress: 100,
    startDate: "16 Sep 2024",
    endDate: "30 Sep 2024",
  },
  {
    id: 4,
    name: "Estructura",
    status: "in-progress",
    progress: 85,
    startDate: "1 Oct 2024",
    endDate: "15 Nov 2024",
  },
  {
    id: 5,
    name: "Instalaciones",
    status: "in-progress",
    progress: 60,
    startDate: "10 Nov 2024",
    endDate: "30 Nov 2024",
  },
  {
    id: 6,
    name: "Acabados Interiores",
    status: "pending",
    progress: 0,
    startDate: "1 Dic 2024",
    endDate: "31 Dic 2024",
  },
  {
    id: 7,
    name: "Acabados Exteriores",
    status: "pending",
    progress: 0,
    startDate: "15 Dic 2024",
    endDate: "15 Ene 2025",
  },
  {
    id: 8,
    name: "Inspección Final",
    status: "pending",
    progress: 0,
    startDate: "16 Ene 2025",
    endDate: "31 Ene 2025",
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    case "in-progress":
      return <Clock className="h-5 w-5 text-secondary" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge>Completado</Badge>;
    case "in-progress":
      return <Badge variant="secondary">En Progreso</Badge>;
    default:
      return <Badge variant="outline">Pendiente</Badge>;
  }
};

export default function ScheduleDesktop() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cronograma del Proyecto</h1>
        <p className="text-muted-foreground">Seguimiento de fases y avance temporal</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Fases del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {phases.map((phase, index) => (
              <div key={phase.id} className="relative">
                {index < phases.length - 1 && (
                  <div className="absolute left-[10px] top-[40px] bottom-[-24px] w-0.5 bg-border" />
                )}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(phase.status)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{phase.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {phase.startDate} - {phase.endDate}
                        </p>
                      </div>
                      {getStatusBadge(phase.status)}
                    </div>
                    {phase.status === "in-progress" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">{phase.progress}%</span>
                        </div>
                        <Progress value={phase.progress} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fases Completadas</span>
                  <span className="font-bold">3/8</span>
                </div>
                <Progress value={37.5} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fases en Progreso</span>
                  <span className="font-bold">2</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fases Pendientes</span>
                  <span className="font-bold">3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Hitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">15 Nov 2024</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Finalización de Estructura
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">30 Nov 2024</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Finalización de Instalaciones
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">31 Ene 2025</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Entrega Final del Proyecto
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
