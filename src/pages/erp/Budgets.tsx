import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, FileSpreadsheet, FileDown } from "lucide-react";
import { exportBudgetToXLSX } from "@/utils/exports/excel";
import { exportBudgetToPDF } from "@/utils/exports/pdf";
import { toast } from "sonner";
import { LoadingError } from "@/components/common/LoadingError";

export default function Budgets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: budgets, isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          projects (
            id,
            clients (name)
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
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
        <Button onClick={() => navigate('/erp/budgets/new')}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Presupuesto
        </Button>
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
                  <TableHead>IVA</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      {budget.projects?.clients?.name || '-'}
                    </TableCell>
                    <TableCell>{getTypeBadge(budget.type)}</TableCell>
                    <TableCell>{getStatusBadge(budget.status)}</TableCell>
                    <TableCell>v{budget.version}</TableCell>
                    <TableCell>{budget.iva_enabled ? 'Sí' : 'No'}</TableCell>
                    <TableCell>
                      {new Date(budget.updated_at).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/erp/budgets/${budget.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await exportBudgetToXLSX(budget.id);
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
                              await exportBudgetToPDF(budget.id);
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
