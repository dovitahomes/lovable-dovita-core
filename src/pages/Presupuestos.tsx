import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, AlertCircle } from "lucide-react";
import { exportBudgetToXLSX } from "@/utils/exports/excel";
import { exportBudgetToPDF } from "@/utils/exports/pdf";
import { toast } from "sonner";
import { LoadingError } from "@/components/common/LoadingError";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { BudgetStatsCards } from "@/components/budgets/BudgetStatsCards";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetFilters } from "@/components/budgets/BudgetFilters";
import { ParametricBudgetWizard } from "@/components/budgets/parametric/ParametricBudgetWizard";
import { ExecutiveBudgetWizard } from "@/components/budgets/executive/ExecutiveBudgetWizard";

export default function Presupuestos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canView, can } = useModuleAccess();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showParametricWizard, setShowParametricWizard] = useState(false);
  const [showExecutiveWizard, setShowExecutiveWizard] = useState(false);
  
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

  // Apply filters
  const filteredBudgets = budgets?.filter((budget) => {
    if (activeFilters.length === 0) return true;

    const matchesStatus = 
      (activeFilters.includes('publicado') && budget.status === 'publicado') ||
      (activeFilters.includes('borrador') && budget.status === 'borrador') ||
      (!activeFilters.includes('publicado') && !activeFilters.includes('borrador'));

    const matchesType = 
      (activeFilters.includes('parametrico') && budget.type === 'parametrico') ||
      (activeFilters.includes('ejecutivo') && budget.type === 'ejecutivo') ||
      (!activeFilters.includes('parametrico') && !activeFilters.includes('ejecutivo'));

    const matchesAlerts = 
      !activeFilters.includes('con_alertas') || budget.alerts_over_5 > 0;

    return matchesStatus && matchesType && matchesAlerts;
  });

  const handleFilterToggle = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
  };
  
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
            <Button onClick={() => setShowParametricWizard(true)}>
              <Plus className="h-4 w-4 mr-2" /> Paramétrico
            </Button>
            <Button variant="secondary" onClick={() => setShowExecutiveWizard(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ejecutivo
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <BudgetStatsCards />

      {/* Filters */}
      <BudgetFilters
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        onClearAll={handleClearFilters}
      />

      {/* Budgets Grid */}
      <div>
        <LoadingError
          isLoading={isLoading}
          error={error}
          isEmpty={!filteredBudgets || filteredBudgets.length === 0}
          emptyMessage={activeFilters.length > 0 ? "No hay presupuestos que coincidan con los filtros" : "Aún no hay presupuestos"}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['budgets'] })}
        />
        {!isLoading && !error && filteredBudgets && filteredBudgets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredBudgets.map((budget, index) => (
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

      {/* Parametric Budget Wizard */}
      <ParametricBudgetWizard
        open={showParametricWizard}
        onClose={() => {
          setShowParametricWizard(false);
          queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }}
      />

      {/* Executive Budget Wizard */}
      <ExecutiveBudgetWizard
        open={showExecutiveWizard}
        onClose={() => {
          setShowExecutiveWizard(false);
          queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }}
      />
    </div>
  );
}