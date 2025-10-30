import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  useDesignPhases, 
  useSeedDefaultPhases, 
  useStartPhase, 
  useFinishPhase 
} from "@/hooks/useDesignPhases";
import { Play, CheckCircle2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PhasesSectionProps {
  projectId: string;
}

export function PhasesSection({ projectId }: PhasesSectionProps) {
  const { data: phases, isLoading } = useDesignPhases(projectId);
  const seedPhases = useSeedDefaultPhases();
  const startPhase = useStartPhase();
  const finishPhase = useFinishPhase();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (!phases || phases.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">No hay fases creadas para este proyecto</p>
          <Button 
            onClick={() => seedPhases.mutate(projectId)}
            disabled={seedPhases.isPending}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear fases por defecto
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pendiente: "secondary",
      en_proceso: "default",
      terminada: "outline",
    } as const;
    
    const labels = {
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      terminada: "Terminada",
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {phases.map((phase) => (
        <Card key={phase.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{phase.phase_name}</h4>
                  {getStatusBadge(phase.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {phase.start_at && (
                    <span>
                      Inicio: {format(new Date(phase.start_at), "dd MMM yyyy", { locale: es })}
                    </span>
                  )}
                  {phase.start_at && phase.end_at && <span className="mx-2">•</span>}
                  {phase.end_at && (
                    <span>
                      Fin: {format(new Date(phase.end_at), "dd MMM yyyy", { locale: es })}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {phase.status === 'pendiente' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startPhase.mutate(phase.id)}
                    disabled={startPhase.isPending}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Iniciar
                  </Button>
                )}
                
                {phase.status === 'en_proceso' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => finishPhase.mutate(phase.id)}
                    disabled={finishPhase.isPending}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Terminar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
