import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Eye, FileSpreadsheet, FileDown, AlertTriangle, AlertCircle } from "lucide-react";
import { exportBudgetToXLSX } from "@/utils/exports/excel";
import { exportBudgetToPDF } from "@/utils/exports/pdf";
import { toast } from "sonner";
import { LoadingError } from "@/components/common/LoadingError";
import { useModuleAccess } from "@/hooks/useModuleAccess";

export default function Presupuestos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canView, can } = useModuleAccess();
  
  // Guard de seguridad
  if (!canView('presupuestos')) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para ver este módulo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { data: budgets, isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_budget_history' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    }
  });

  const getStatusBadge = (status: string) => {
    return status === 'publicado' 
      ? <Badge variant="default">Publicado</Badge>
      : <Badge variant="secondary">Borrador</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'parametrico'
      ? <Badge variant="outline">Paramétrico</Badge>
      : <Badge variant="outline">Ejecutivo</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Presupuestos</h1>
        {can('presupuestos', 'create') && (
          <div className="flex gap-2">
            <Button onClick={() => navigate('/presupuestos/wizard/parametrico')}>
              <Plus className="h-4 w-4 mr-2" /> Paramétrico
            </Button>
            <Button variant="secondary" onClick={() => navigate('/presupuestos/wizard/ejecutivo')}>
              <Plus className="h-4 w-4 mr-2" /> Ejecutivo
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingError
            isLoading={isLoading}
            error={error}
            isEmpty={!budgets || budgets.length === 0}
            emptyMessage="Aún no hay presupuestos"
            onRetry={() => queryClient.invalidateQueries({ queryKey: ['budgets'] })}
          />
          {!isLoading && !error && budgets && budgets.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Partidas</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Alertas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.budget_id}>
                    <TableCell className="font-medium">
                      {budget.project_id ? `Proyecto ${budget.project_id.slice(0,8)}` : '-'}
                    </TableCell>
                    <TableCell>{getTypeBadge(budget.type)}</TableCell>
                    <TableCell>{getStatusBadge(budget.status)}</TableCell>
                    <TableCell>v{budget.version}</TableCell>
                    <TableCell>{budget.total_items || 0}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN' 
                      }).format(budget.budget_total || 0)}
                    </TableCell>
                    <TableCell>
                      {budget.alerts_over_5 > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {budget.alerts_over_5}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(budget.created_at).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/presupuestos/${budget.budget_id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await exportBudgetToXLSX(budget.budget_id);
                              toast.success("Excel exportado");
                            } catch (error) {
                              toast.error("Error al exportar: " + (error instanceof Error ? error.message : "Error desconocido"));
                            }
                          }}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await exportBudgetToPDF(budget.budget_id);
                              toast.success("PDF exportado");
                            } catch (error) {
                              toast.error("Error al exportar: " + (error instanceof Error ? error.message : "Error desconocido"));
                            }
                          }}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}