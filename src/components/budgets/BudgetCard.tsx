import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, TrendingUp, AlertTriangle, Eye, FileSpreadsheet, FileDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Budget {
  budget_id: string;
  project_id: string | null;
  type: string;
  status: string;
  version: number;
  total_items: number;
  budget_total: number;
  alerts_over_5: number;
  created_at: string;
}

interface BudgetCardProps {
  budget: Budget;
  onView: (budgetId: string) => void;
  onExportExcel: (budgetId: string) => void;
  onExportPDF: (budgetId: string) => void;
  index?: number;
}

export function BudgetCard({
  budget,
  onView,
  onExportExcel,
  onExportPDF,
  index = 0,
}: BudgetCardProps) {
  // Get initials from project_id or budget_id
  const initials = budget.project_id 
    ? budget.project_id.slice(0, 2).toUpperCase() 
    : budget.budget_id.slice(0, 2).toUpperCase();

  // Type badge color
  const typeColor = budget.type === 'parametrico' 
    ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
    : 'bg-gradient-to-r from-purple-500 to-pink-500';

  return (
    <Card
      className={cn(
        "group hover:scale-[1.02] transition-all duration-200 hover:shadow-xl",
        "bg-gradient-to-br from-violet-50/50 to-purple-50/50",
        "dark:from-violet-950/20 dark:to-purple-950/20",
        "border-border hover:border-primary/20",
        "animate-fade-in overflow-hidden"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar with Initials */}
          <Avatar className="h-12 w-12 bg-gradient-to-br from-violet-500 to-purple-500">
            <AvatarFallback className="text-white font-bold bg-transparent">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Project ID and Version */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn("text-white border-0", typeColor)}>
                v{budget.version}
              </Badge>
              <Badge variant={budget.status === 'publicado' ? 'default' : 'secondary'} className="shrink-0">
                {budget.status === 'publicado' ? 'Publicado' : 'Borrador'}
              </Badge>
            </div>
            <h3 className="font-semibold text-base truncate">
              {budget.project_id ? `Proyecto ${budget.project_id.slice(0, 8)}` : 'Sin proyecto'}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Type Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {budget.type === 'parametrico' ? 'Paramétrico' : 'Ejecutivo'}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(budget.created_at).toLocaleDateString('es-MX')}</span>
          </div>
        </div>

        {/* Amount and Items */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-bold text-lg truncate">
              {new Intl.NumberFormat('es-MX', { 
                style: 'currency', 
                currency: 'MXN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(budget.budget_total || 0)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{budget.total_items || 0} partidas</span>
          </div>

          {/* Price Alerts */}
          {budget.alerts_over_5 > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {budget.alerts_over_5} alerta{budget.alerts_over_5 > 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1 pt-2 border-t opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(budget.budget_id)}
            title="Ver presupuesto"
            className="h-8 w-8 md:h-6 md:w-6 p-0"
          >
            <Eye className="h-4 w-4 md:h-3.5 md:w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onExportExcel(budget.budget_id)}
            title="Exportar Excel"
            className="h-8 w-8 md:h-6 md:w-6 p-0"
          >
            <FileSpreadsheet className="h-4 w-4 md:h-3.5 md:w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onExportPDF(budget.budget_id)}
            title="Exportar PDF"
            className="h-8 w-8 md:h-6 md:w-6 p-0"
          >
            <FileDown className="h-4 w-4 md:h-3.5 md:w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
