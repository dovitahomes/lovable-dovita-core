import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowRight, TrendingUp, TrendingDown, 
  Minus, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetVersionDiffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId1: string;
  budgetId2: string;
}

interface BudgetData {
  budget_id: string;
  version: number;
  type: string;
  status: string;
  total_items: number;
  budget_total: number;
  alerts_over_5: number;
  created_at: string;
}

export function BudgetVersionDiffModal({
  open,
  onOpenChange,
  budgetId1,
  budgetId2,
}: BudgetVersionDiffModalProps) {
  const { data: budget1, isLoading: loading1 } = useQuery({
    queryKey: ['budget', budgetId1],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_budget_history' as any)
        .select('*')
        .eq('budget_id', budgetId1)
        .single();
      
      if (error) throw error;
      return data as any as BudgetData;
    },
    enabled: open && !!budgetId1,
  });

  const { data: budget2, isLoading: loading2 } = useQuery({
    queryKey: ['budget', budgetId2],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_budget_history' as any)
        .select('*')
        .eq('budget_id', budgetId2)
        .single();
      
      if (error) throw error;
      return data as any as BudgetData;
    },
    enabled: open && !!budgetId2,
  });

  const isLoading = loading1 || loading2;

  const calculateDiff = (val1: number, val2: number) => {
    const diff = val2 - val1;
    const percent = val1 !== 0 ? (diff / val1) * 100 : 0;
    return { diff, percent };
  };

  const renderDiffBadge = (diff: number, percent: number, isMoney: boolean = false) => {
    const isPositive = diff > 0;
    const isNeutral = diff === 0;

    if (isNeutral) {
      return (
        <Badge variant="outline" className="gap-1">
          <Minus className="h-3 w-3" />
          Sin cambios
        </Badge>
      );
    }

    return (
      <Badge
        variant={isPositive ? "destructive" : "default"}
        className={cn(
          "gap-1",
          isPositive && "bg-red-500",
          !isPositive && "bg-green-500"
        )}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPositive ? '+' : ''}
        {isMoney 
          ? new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(diff)
          : diff
        }
        {' '}
        ({percent > 0 ? '+' : ''}{percent.toFixed(2)}%)
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Comparar Versiones
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : !budget1 || !budget2 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar las versiones para comparar
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Version Headers */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="space-y-2 p-4 rounded-lg border bg-card">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  Versión {budget1.version}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {new Date(budget1.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />

              <div className="space-y-2 p-4 rounded-lg border bg-card">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Versión {budget2.version}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {new Date(budget2.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Comparisons */}
            <div className="space-y-4">
              {/* Total Budget */}
              <div className="p-4 rounded-lg border bg-card space-y-3">
                <h4 className="font-semibold text-sm">Total del Presupuesto</h4>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(budget1.budget_total || 0)}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(budget2.budget_total || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  {(() => {
                    const totalDiff = calculateDiff(budget1.budget_total || 0, budget2.budget_total || 0);
                    return renderDiffBadge(totalDiff.diff, totalDiff.percent, true);
                  })()}
                </div>
              </div>

              {/* Total Items */}
              <div className="p-4 rounded-lg border bg-card space-y-3">
                <h4 className="font-semibold text-sm">Número de Partidas</h4>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="text-right">
                    <p className="text-xl font-bold">{budget1.total_items || 0}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xl font-bold">{budget2.total_items || 0}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  {(() => {
                    const itemsDiff = calculateDiff(budget1.total_items || 0, budget2.total_items || 0);
                    return renderDiffBadge(itemsDiff.diff, itemsDiff.percent);
                  })()}
                </div>
              </div>

              {/* Alerts */}
              <div className="p-4 rounded-lg border bg-card space-y-3">
                <h4 className="font-semibold text-sm">Alertas de Precios</h4>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="text-right">
                    <p className="text-xl font-bold">{budget1.alerts_over_5 || 0}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xl font-bold">{budget2.alerts_over_5 || 0}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  {(() => {
                    const alertsDiff = calculateDiff(budget1.alerts_over_5 || 0, budget2.alerts_over_5 || 0);
                    return renderDiffBadge(alertsDiff.diff, alertsDiff.percent);
                  })()}
                </div>
              </div>

              {/* Status Change */}
              {budget1.status !== budget2.status && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    El estado cambió de <Badge variant="outline">{budget1.status}</Badge> a{' '}
                    <Badge variant="outline">{budget2.status}</Badge>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
