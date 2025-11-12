import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Download, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  IncomeVsExpensesChart, 
  ExpenseDistributionChart, 
  BalanceTrendChart, 
  FinancialHeatmap 
} from "@/components/finance/reports";
import { ProviderBalancesGrid } from "@/components/finance/provider-balances";
import { useIncomeVsExpenses, useExpenseDistribution } from "@/hooks/finance/useFinancialReports";
import { useTreasuryStats } from "@/hooks/finance/useTreasuryStats";
import { subMonths } from "date-fns";
import { 
  exportCashFlowPDF, 
  exportCashFlowExcel,
  exportExpenseDistributionPDF,
  exportExpenseDistributionExcel,
  exportProfitLossPDF,
  exportBalanceSheetPDF
} from "@/utils/exports/financialReports";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FinanzasReportes() {
  const navigate = useNavigate();
  const { data: cashFlowData } = useIncomeVsExpenses(6);
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);
  const { data: expenseData } = useExpenseDistribution(startDate, endDate);
  const { data: treasuryStats } = useTreasuryStats();

  const handleExportCashFlow = async (format: 'pdf' | 'excel') => {
    if (!cashFlowData) {
      toast.error('No hay datos disponibles para exportar');
      return;
    }
    
    try {
      const start = subMonths(new Date(), 6);
      const end = new Date();
      
      if (format === 'pdf') {
        await exportCashFlowPDF(cashFlowData, start, end);
      } else {
        await exportCashFlowExcel(cashFlowData, start, end);
      }
      toast.success(`Reporte exportado en formato ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error al exportar reporte');
      console.error(error);
    }
  };

  const handleExportExpenses = async (format: 'pdf' | 'excel') => {
    if (!expenseData) {
      toast.error('No hay datos disponibles para exportar');
      return;
    }
    
    try {
      if (format === 'pdf') {
        await exportExpenseDistributionPDF(expenseData, startDate, endDate);
      } else {
        await exportExpenseDistributionExcel(expenseData, startDate, endDate);
      }
      toast.success(`Reporte exportado en formato ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error al exportar reporte');
      console.error(error);
    }
  };

  const handleExportProfitLoss = async () => {
    if (!cashFlowData) {
      toast.error('No hay datos disponibles para exportar');
      return;
    }
    
    try {
      const start = subMonths(new Date(), 6);
      const end = new Date();
      await exportProfitLossPDF(cashFlowData, start, end);
      toast.success('Estado de Resultados exportado');
    } catch (error) {
      toast.error('Error al exportar reporte');
      console.error(error);
    }
  };

  const handleExportBalanceSheet = async () => {
    if (!treasuryStats) {
      toast.error('No hay datos disponibles para exportar');
      return;
    }
    
    try {
      await exportBalanceSheetPDF(treasuryStats.totalBalance);
      toast.success('Balance General exportado');
    } catch (error) {
      toast.error('Error al exportar reporte');
      console.error(error);
    }
  };

  return (
    <div className="container max-w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header with Back Button */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/finanzas')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Finanzas
        </Button>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
            <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Reportes</h1>
            <p className="text-sm text-muted-foreground">
              Generación de reportes financieros y análisis de saldos
            </p>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="charts">Gráficas</TabsTrigger>
          <TabsTrigger value="balances">Saldos Proveedores</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="mt-6 space-y-6">
          {/* Export Actions */}
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Flujo de Caja
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Exportar</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportCashFlow('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportCashFlow('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Distribución Gastos
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Exportar</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportExpenses('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportExpenses('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportProfitLoss}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Estado de Resultados (P&L)
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportBalanceSheet}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Balance General
            </Button>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncomeVsExpensesChart />
            <ExpenseDistributionChart />
            <BalanceTrendChart />
            <FinancialHeatmap />
          </div>
        </TabsContent>

        <TabsContent value="balances" className="mt-6">
          <ProviderBalancesGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}
