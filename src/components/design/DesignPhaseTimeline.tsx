import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDesignPhases, useUpdatePhaseProgress } from "@/hooks/useDesignPhases";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DesignPhaseTimelineProps {
  projectId: string;
}

export function DesignPhaseTimeline({ projectId }: DesignPhaseTimelineProps) {
  const { data: phases, isLoading } = useDesignPhases(projectId);
  const updateProgress = useUpdatePhaseProgress();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (!phases || phases.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay fases creadas para este proyecto
        </CardContent>
      </Card>
    );
  }

  const getPhaseStatus = (phase: any) => {
    const today = new Date();
    const hasStarted = phase.actual_start_date !== null;
    const hasFinished = phase.actual_end_date !== null;
    const isCompleted = phase.progress_pct === 100 || hasFinished;

    if (isCompleted) return 'completed';
    if (!hasStarted && !phase.start_at) return 'not_started';
    
    // Check if delayed
    if (phase.end_at && isAfter(today, new Date(phase.end_at)) && !isCompleted) {
      return 'delayed';
    }
    
    if (hasStarted) return 'in_progress';
    if (phase.start_at && isBefore(today, new Date(phase.start_at))) return 'not_started';
    
    return 'in_progress';
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      not_started: {
        label: 'No Iniciada',
        icon: Clock,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        badgeVariant: 'secondary' as const
      },
      in_progress: {
        label: 'En Proceso',
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        badgeVariant: 'default' as const
      },
      completed: {
        label: 'Completada',
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        badgeVariant: 'outline' as const
      },
      delayed: {
        label: 'Retrasada',
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        badgeVariant: 'destructive' as const
      }
    };
    
    return configs[status as keyof typeof configs] || configs.not_started;
  };

  const calculateDelayDays = (phase: any) => {
    if (!phase.end_at || phase.actual_end_date) return 0;
    const today = new Date();
    const plannedEnd = new Date(phase.end_at);
    if (isAfter(today, plannedEnd)) {
      return differenceInDays(today, plannedEnd);
    }
    return 0;
  };

  const handleProgressUpdate = (phaseId: string, newProgress: number) => {
    updateProgress.mutate({ 
      phaseId, 
      progress_pct: Math.min(100, Math.max(0, newProgress))
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline de Fases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(phase);
            const statusConfig = getStatusConfig(status);
            const StatusIcon = statusConfig.icon;
            const delayDays = calculateDelayDays(phase);
            const progress = phase.progress_pct || 0;

            return (
              <div key={phase.id} className="relative">
                {/* Connection line to next phase */}
                {index < phases.length - 1 && (
                  <div className="absolute left-6 top-16 h-full w-0.5 bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Status Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10",
                    statusConfig.bgColor
                  )}>
                    <StatusIcon className={cn("h-6 w-6", statusConfig.color)} />
                  </div>

                  {/* Phase Content */}
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{phase.phase_name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={statusConfig.badgeVariant}>
                              {statusConfig.label}
                            </Badge>
                            {delayDays > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                Retraso: {delayDays} días
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {progress}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avance
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2 mb-4">
                        <Progress 
                          value={progress} 
                          className="h-2"
                          variant={status === 'delayed' ? 'yellow' : 'default'}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Planificado:</span>
                          <div className="font-medium">
                            {phase.start_at && phase.end_at ? (
                              <>
                                {format(new Date(phase.start_at), "dd MMM", { locale: es })} - {' '}
                                {format(new Date(phase.end_at), "dd MMM yyyy", { locale: es })}
                              </>
                            ) : (
                              'No definido'
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Real:</span>
                          <div className="font-medium">
                            {phase.actual_start_date ? (
                              <>
                                {format(new Date(phase.actual_start_date), "dd MMM", { locale: es })}
                                {phase.actual_end_date && (
                                  <> - {format(new Date(phase.actual_end_date), "dd MMM yyyy", { locale: es })}</>
                                )}
                                {!phase.actual_end_date && <> - En curso</>}
                              </>
                            ) : (
                              'No iniciado'
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Progress Actions */}
                      {status === 'in_progress' && progress < 100 && (
                        <div className="flex gap-2 flex-wrap">
                          {[25, 50, 75, 100].map(value => (
                            <Button
                              key={value}
                              variant="outline"
                              size="sm"
                              onClick={() => handleProgressUpdate(phase.id, value)}
                              disabled={updateProgress.isPending}
                            >
                              {value}%
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
