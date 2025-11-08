import { useClientConstructionProgress } from '@/hooks/client-app/useClientConstructionProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProjectProgressTabProps {
  projectId: string;
}

export default function ProjectProgressTab({ projectId }: ProjectProgressTabProps) {
  const { data: progress, isLoading } = useClientConstructionProgress(projectId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!progress || progress.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No hay información de avance de obra disponible
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {progress.map((stage) => {
        const percentage = stage.progress || 0;
        const hasAlert = stage.alert_80;
        
        return (
          <Card key={stage.stage_id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{stage.name}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {percentage}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={percentage} className="h-3 mb-2" />
              
              {hasAlert && (
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta etapa está cerca de completarse. Pronto iniciaremos la siguiente fase.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Consumido:</span>
                  <span>${(stage.total_consumed || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Presupuestado:</span>
                  <span>${(stage.total_budgeted || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
