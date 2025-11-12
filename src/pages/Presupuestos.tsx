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
import { BudgetStatsCards } from "@/components/budgets/BudgetStatsCards";
import { BudgetCard } from "@/components/budgets/BudgetCard";

export default function Presupuestos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canView, can } = useModuleAccess();
  
  // IMPORTANTE: Todos los hooks deben llamarse ANTES de cualquier return condicional
  const { data: budgets, isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_budget_history' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: canView('presupuestos'), // Solo ejecutar query si tiene permisos
  });
  
  // Guard de seguridad DESPUÉS de todos los hooks
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

  const handleExportExcel = async (budgetId: string) => {
    try {
      await exportBudgetToXLSX(budgetId);
      toast.success("Excel exportado");
    } catch (error) {
      toast.error("Error al exportar: " + (error instanceof Error ? error.message : "Error desconocido"));
    }
  };

  const handleExportPDF = async (budgetId: string) => {
    try {
      await exportBudgetToPDF(budgetId);
      toast.success("PDF exportado");
    } catch (error) {
      toast.error("Error al exportar: " + (error instanceof Error ? error.message : "Error desconocido"));
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-full overflow-x-hidden">
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

      {/* Stats Cards */}
      <BudgetStatsCards />

      {/* Budgets Grid */}
      <div>
        <LoadingError
          isLoading={isLoading}
          error={error}
          isEmpty={!budgets || budgets.length === 0}
          emptyMessage="Aún no hay presupuestos"
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['budgets'] })}
        />
        {!isLoading && !error && budgets && budgets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {budgets.map((budget, index) => (
              <BudgetCard
                key={budget.budget_id}
                budget={budget}
                onView={(budgetId) => navigate(`/presupuestos/${budgetId}`)}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}