import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import PreviewBar from '@/components/client-app/PreviewBar';
import { getScheduleTitle } from '@/lib/project-utils';

export default function Schedule() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const phases = currentProject?.phases || [];
  return (
    <div>
      <PreviewBar />
      <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{getScheduleTitle(currentProject)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seguimiento de las fases del proyecto
        </p>
      </div>

      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        {phases.map((phase, index) => (
          <Card key={phase.id} className="relative ml-10">
            {/* Timeline dot */}
            <div className="absolute -left-10 top-6 w-10 flex items-center justify-start">
              {phase.status === 'completed' ? (
                <CheckCircle2 className="h-10 w-10 text-primary bg-background" />
              ) : phase.status === 'in-progress' ? (
                <Clock className="h-10 w-10 text-primary bg-background" />
              ) : (
                <Circle className="h-10 w-10 text-muted-foreground bg-background" />
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{phase.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {phase.startDate} - {phase.endDate}
                  </p>
                </div>
                
                {phase.status === 'completed' && (
                  <Badge className="bg-primary/10 text-primary">Completada</Badge>
                )}
                {phase.status === 'in-progress' && (
                  <Badge className="bg-[hsl(var(--dovita-yellow))]/20 text-[hsl(var(--dovita-yellow))]">En Proceso</Badge>
                )}
                {phase.status === 'pending' && (
                  <Badge className="bg-[hsl(var(--dovita-yellow))]/20 text-[hsl(var(--dovita-yellow))]">Pendiente</Badge>
                )}
              </div>

              {phase.status === 'in-progress' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="font-semibold text-primary">{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} variant="yellow" className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
}
