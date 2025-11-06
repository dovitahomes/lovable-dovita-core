import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { getScheduleTitle } from '@/lib/project-utils';

export default function Schedule() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const phases = currentProject?.phases || [];
  const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(
    phases.find(p => p.status === 'in-progress')?.id || phases[0]?.id || null
  );

  const handlePhaseClick = (phaseId: number) => {
    setExpandedPhaseId(expandedPhaseId === phaseId ? null : phaseId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[130px]">
        <div>
          <h1 className="text-2xl font-bold">{getScheduleTitle(currentProject)}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seguimiento de las fases del proyecto
          </p>
        </div>

      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        {phases.map((phase, index) => {
          const isExpanded = expandedPhaseId === phase.id;
          
          return (
          <Card 
            key={phase.id} 
            className="relative ml-10 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handlePhaseClick(phase.id)}
          >
            {/* Timeline dot */}
            <div className="absolute -left-10 top-6 w-10 flex items-center justify-start">
              {phase.status === 'completed' ? (
                <CheckCircle2 className="h-10 w-10 text-green-600 bg-background" />
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
                  <Badge className="bg-green-100 text-green-700">Completada</Badge>
                )}
                {phase.status === 'in-progress' && (
                  <Badge className="bg-blue-100 text-blue-700">En Proceso</Badge>
                )}
                {phase.status === 'pending' && (
                  <Badge variant="secondary">Pendiente</Badge>
                )}
              </div>

              {isExpanded && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="font-semibold text-primary">{phase.progress}%</span>
                  </div>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>
      </div>
    </div>
  );
}
