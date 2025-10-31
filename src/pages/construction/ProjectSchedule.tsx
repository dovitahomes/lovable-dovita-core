import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle, AlertCircle } from "lucide-react";
import { useSharedExecutiveGantt } from "@/hooks/useSharedExecutiveGantt";
import { useBudgetMajors } from "@/hooks/useBudgetMajors";
import { useCorporateContent } from "@/hooks/useCorporateContent";
import { GanttGrid } from "@/components/gantt/GanttGrid";
import { GanttSummary } from "@/components/gantt/GanttSummary";
import { calculateGanttWeeks, groupWeeksByMonth } from "@/utils/ganttTime";
import { exportGanttToPDF } from "@/utils/pdf/ganttExport";
import { toast } from "sonner";

export default function ProjectSchedule() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: ganttData, isLoading } = useSharedExecutiveGantt(projectId || null);
  const { data: budgetMajors = [] } = useBudgetMajors(projectId || null);
  const { data: corporate } = useCorporateContent();

  if (isLoading) {
    return (
      <div className="p-6">
        <p>Cargando cronograma...</p>
      </div>
    );
  }

  if (!ganttData || !ganttData.plan) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            No hay un cronograma ejecutivo compartido para este proyecto.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { plan, items, ministrations } = ganttData;

  // Enrich items with budget data
  const enrichedItems = items.map((item) => {
    const mayor = budgetMajors.find((m) => m.mayor_id === item.major_id);
    return { ...item, mayor };
  });

  const totalBudget = budgetMajors.reduce((sum, m) => sum + m.importe, 0);

  // Calculate timeline
  const allDates = items.map((it) => [new Date(it.start_date), new Date(it.end_date)]).flat();
  const timelineStart = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date();
  const timelineEnd = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date();

  const weeks = calculateGanttWeeks(timelineStart, timelineEnd);
  const monthsMap = groupWeeksByMonth(weeks);

  // Calculate alerts
  const now = new Date();
  const maxEndDate = new Date(Math.max(...items.map((it) => new Date(it.end_date).getTime())));
  const minStartDate = new Date(Math.min(...items.map((it) => new Date(it.start_date).getTime())));

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksTotal = Math.ceil((maxEndDate.getTime() - minStartDate.getTime()) / msPerWeek);
  const weeksRemaining = Math.ceil((maxEndDate.getTime() - now.getTime()) / msPerWeek);

  const primaryColor = corporate?.color_primario || "#1e40af";
  const secondaryColor = corporate?.color_secundario || "#059669";

  const handleExportPDF = () => {
    if (!projectId) return;
    const monthsMap = groupWeeksByMonth(weeks);
    
    exportGanttToPDF({
      projectName: `Proyecto ${projectId.slice(0, 8)}`,
      ganttType: "ejecutivo",
      items: enrichedItems,
      ministrations,
      weeks,
      monthsMap,
      corporateData: corporate || null,
      timelineStart,
      timelineEnd,
    });
    toast.success("PDF exportado correctamente");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cronograma de Construcción</h1>
          <p className="text-sm text-muted-foreground">Vista de solo lectura del plan ejecutivo</p>
        </div>
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Ver PDF
        </Button>
      </div>

      {/* Alertas de temporalidad */}
      {weeksRemaining <= 2 && weeksRemaining >= 0 && (
        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Se aproxima el fin de la temporalidad para este plan ({weeksRemaining} semanas restantes)
          </AlertDescription>
        </Alert>
      )}

      {weeksRemaining < 0 && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            El plan superó su temporalidad prevista (excedido por {Math.abs(weeksRemaining)} semanas)
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de Gantt */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma por Mayores</CardTitle>
        </CardHeader>
        <CardContent>
          <GanttGrid
            items={enrichedItems}
            weeks={weeks}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            totalBudget={totalBudget}
            onRemoveItem={() => {}}
            readOnly
          />
        </CardContent>
      </Card>

      {/* Chips por mayor con alertas */}
      {enrichedItems.some((item) => {
        const endDate = new Date(item.end_date);
        const weeksToEnd = Math.ceil((endDate.getTime() - now.getTime()) / msPerWeek);
        return weeksToEnd <= 2 && weeksToEnd >= 0;
      }) && (
        <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <div className="flex flex-wrap gap-2 mt-2">
              {enrichedItems
                .filter((item) => {
                  const endDate = new Date(item.end_date);
                  const weeksToEnd = Math.ceil((endDate.getTime() - now.getTime()) / msPerWeek);
                  return weeksToEnd <= 2 && weeksToEnd >= 0;
                })
                .map((item) => {
                  const endDate = new Date(item.end_date);
                  const weeksToEnd = Math.ceil((endDate.getTime() - now.getTime()) / msPerWeek);
                  return (
                    <span
                      key={item.id}
                      className="px-2 py-1 bg-orange-100 dark:bg-orange-800 text-orange-900 dark:text-orange-100 rounded text-xs"
                    >
                      {item.tu_nodes?.name || "Mayor"} (⚠ {weeksToEnd} semanas)
                    </span>
                  );
                })}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Resumen */}
      <GanttSummary
        ministrations={ministrations}
        timelineStart={timelineStart}
        timelineEnd={timelineEnd}
        totalBudget={totalBudget}
      />
    </div>
  );
}
