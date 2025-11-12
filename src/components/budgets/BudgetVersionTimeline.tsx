import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  History, Plus, Eye, FileText, CheckCircle, Edit, 
  AlertTriangle, Clock, GitCompare 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBudgetHistory, useBudgetAudit, useCreateBudgetVersion } from "@/hooks/useBudgetAudit";
import { BudgetVersionDiffModal } from "./BudgetVersionDiffModal";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface BudgetVersionTimelineProps {
  projectId: string;
  currentBudgetId?: string;
}

interface VersionRecord {
  budget_id: string;
  version: number;
  type: string;
  status: string;
  total_items: number;
  budget_total: number;
  alerts_over_5: number;
  created_at: string;
}

export function BudgetVersionTimeline({ projectId, currentBudgetId }: BudgetVersionTimelineProps) {
  const navigate = useNavigate();
  const { data: history, isLoading } = useBudgetHistory(projectId);
  const { data: audit } = useBudgetAudit(currentBudgetId);
  const createVersionMutation = useCreateBudgetVersion();
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<[string, string] | null>(null);

  const alertsCount = audit?.filter(a => a.variation_percent && Math.abs(a.variation_percent) > 5).length || 0;

  const handleCreateVersion = () => {
    if (currentBudgetId) {
      createVersionMutation.mutate({ sourceBudgetId: currentBudgetId });
    }
  };

  const handleCompareVersions = (budgetId: string) => {
    if (!currentBudgetId) return;
    setSelectedVersions([currentBudgetId, budgetId]);
    setShowDiffModal(true);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'publicado') return CheckCircle;
    return Edit;
  };

  const getStatusColor = (status: string) => {
    if (status === 'publicado') return 'text-green-600 dark:text-green-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  const getTypeGradient = (type: string) => {
    return type === 'parametrico'
      ? 'from-blue-500 to-cyan-500'
      : 'from-purple-500 to-pink-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alertsCount > 0 && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Se detectaron {alertsCount} variación(es) mayor al 5% en costos unitarios
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Versiones
            </CardTitle>
            {currentBudgetId && (
              <Button 
                size="sm" 
                onClick={handleCreateVersion}
                disabled={createVersionMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Versión
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No hay versiones previas</p>
            </div>
          ) : (
            <div className="relative space-y-4">
              {/* Timeline Line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />

              {/* Timeline Items */}
              {(history as VersionRecord[]).map((record, index) => {
                const StatusIcon = getStatusIcon(record.status);
                const isCurrent = record.budget_id === currentBudgetId;

                return (
                  <div
                    key={record.budget_id}
                    className={cn(
                      "relative pl-16 pb-4 animate-fade-in",
                      isCurrent && "bg-primary/5 -ml-4 -mr-4 px-4 py-3 rounded-lg"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Timeline Node */}
                    <div className="absolute left-0 flex items-center gap-3">
                      <Avatar className={cn(
                        "h-12 w-12 border-4 border-background",
                        `bg-gradient-to-br ${getTypeGradient(record.type)}`
                      )}>
                        <AvatarFallback className="text-white font-bold bg-transparent">
                          v{record.version}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusIcon className={cn("h-4 w-4", getStatusColor(record.status))} />
                            <Badge 
                              variant={record.status === 'publicado' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {record.status === 'publicado' ? 'Publicado' : 'Borrador'}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs border-0 text-white", `bg-gradient-to-r ${getTypeGradient(record.type)}`)}
                            >
                              {record.type === 'parametrico' ? 'Paramétrico' : 'Ejecutivo'}
                            </Badge>
                            {isCurrent && (
                              <Badge className="text-xs bg-primary">
                                Actual
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-base">
                            Versión {record.version}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(record.created_at), { addSuffix: true, locale: es })}
                            <span className="mx-1">•</span>
                            {new Date(record.created_at).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{record.total_items}</span>
                          <span className="text-muted-foreground">partidas</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-base">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(record.budget_total || 0)}
                          </span>
                        </div>
                        {record.alerts_over_5 > 0 && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {record.alerts_over_5} alerta{record.alerts_over_5 > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/presupuestos/${record.budget_id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Ver
                        </Button>
                        {currentBudgetId && record.budget_id !== currentBudgetId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompareVersions(record.budget_id)}
                          >
                            <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                            Comparar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diff Modal */}
      {selectedVersions && (
        <BudgetVersionDiffModal
          open={showDiffModal}
          onOpenChange={setShowDiffModal}
          budgetId1={selectedVersions[0]}
          budgetId2={selectedVersions[1]}
        />
      )}
    </div>
  );
}
