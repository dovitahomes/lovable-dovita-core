import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useProject } from "@/contexts/client-app/ProjectContext";
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import PreviewBar from '@/components/client-app/PreviewBar';
import { getScheduleTitle, getScheduleSubtitle } from "@/lib/project-utils";

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
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const phases = currentProject?.phases || [];
  const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(
    phases.find(p => p.status === 'in-progress')?.id || phases[0]?.id || null
  );
  
  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const inProgressPhases = phases.filter(p => p.status === 'in-progress').length;
  const pendingPhases = phases.filter(p => p.status === 'pending').length;
  const completionPercentage = phases.length > 0 ? (completedPhases / phases.length) * 100 : 0;

  const handlePhaseClick = (phaseId: number) => {
    setExpandedPhaseId(expandedPhaseId === phaseId ? null : phaseId);
  };

  return (
    <div>
      <PreviewBar />
      <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div>
        <h1 className="text-3xl font-bold mb-2">{getScheduleTitle(currentProject)}</h1>
        <p className="text-muted-foreground">{getScheduleSubtitle(currentProject)}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Fases del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {phases.map((phase, index) => {
              const isExpanded = expandedPhaseId === phase.id;
              
              return (
              <div 
                key={phase.id} 
                className="relative cursor-pointer hover:bg-accent/5 p-2 -m-2 rounded-lg transition-colors"
                onClick={() => handlePhaseClick(phase.id)}
              >
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
                    {isExpanded && (
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
              );
            })}
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
                  <span className="font-bold">{completedPhases}/{phases.length}</span>
                </div>
                <Progress value={completionPercentage} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fases en Progreso</span>
                  <span className="font-bold">{inProgressPhases}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fases Pendientes</span>
                  <span className="font-bold">{pendingPhases}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Hitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {phases.filter(p => p.status === 'in-progress' || p.status === 'pending').slice(0, 3).map((phase) => (
                <div key={phase.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{phase.endDate}</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {phase.status === 'in-progress' ? 'Finalización de' : 'Inicio de'} {phase.name}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
