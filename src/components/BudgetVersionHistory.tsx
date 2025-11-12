// ============================================
// DEPRECATED: Use BudgetVersionTimeline instead
// ============================================
// This file is kept for backward compatibility only.
// New implementations should use:
// import { BudgetVersionTimeline } from "@/components/budgets/BudgetVersionTimeline";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBudgetHistory, useBudgetAudit, useCreateBudgetVersion } from "@/hooks/useBudgetAudit";
import { AlertTriangle, History, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BudgetVersionHistoryProps {
  projectId: string;
  currentBudgetId?: string;
}

export function BudgetVersionHistory({ projectId, currentBudgetId }: BudgetVersionHistoryProps) {
  const navigate = useNavigate();
  const { data: history, isLoading } = useBudgetHistory(projectId);
  const { data: audit } = useBudgetAudit(currentBudgetId);
  const createVersionMutation = useCreateBudgetVersion();

  const alertsCount = audit?.filter(a => a.variation_percent && Math.abs(a.variation_percent) > 5).length || 0;

  const handleCreateVersion = () => {
    if (currentBudgetId) {
      createVersionMutation.mutate({ sourceBudgetId: currentBudgetId });
    }
  };

  return (
    <div className="space-y-4">
      {alertsCount > 0 && (
        <Alert variant="destructive">
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
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando historial...
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay versiones previas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Versión</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Partidas</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Alertas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.budget_id}>
                    <TableCell className="font-medium">
                      v{record.version}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {record.type === 'parametrico' ? 'Paramétrico' : 'Ejecutivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'publicado' ? 'default' : 'secondary'}>
                        {record.status === 'publicado' ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.total_items}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(record.budget_total || 0)}
                    </TableCell>
                    <TableCell>
                      {record.alerts_over_5 > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {record.alerts_over_5}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/presupuestos/${record.budget_id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {audit && audit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas de Variación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Valor Anterior</TableHead>
                  <TableHead>Valor Nuevo</TableHead>
                  <TableHead>Variación</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit
                  .filter(a => a.variation_percent && Math.abs(a.variation_percent) > 5)
                  .map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.field}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(alert.old_value || 0)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(alert.new_value || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alert.variation_percent && alert.variation_percent > 0
                              ? 'destructive'
                              : 'default'
                          }
                        >
                          {alert.variation_percent?.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString('es-MX')}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
