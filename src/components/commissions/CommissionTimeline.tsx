import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCommissionSummary } from "@/hooks/useCommissionRules";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock, Eye, DollarSign, Receipt } from "lucide-react";

export function CommissionTimeline() {
  const { data: commissions, isLoading } = useCommissionSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentCommissions = (commissions || []).slice(0, 10);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      calculada: {
        icon: Clock,
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: "Calculada"
      },
      pendiente: {
        icon: Clock,
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        label: "Pendiente"
      },
      pagada: {
        icon: CheckCircle2,
        color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: "Pagada"
      },
    };
    return configs[status] || configs.pendiente;
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Últimas Comisiones</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCommissions.length > 0 ? (
            recentCommissions.map((commission, index) => {
              const statusConfig = getStatusConfig(commission.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={commission.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Status indicator */}
                  <div className={`p-2 rounded-lg ${statusConfig.color}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  {/* Commission info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {commission.client_name || "Sin cliente"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {commission.tipo === 'alianza' ? 'Alianza' : 'Colaborador'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {commission.collaborator_name} • {commission.percent}% de{' '}
                      ${commission.base_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-semibold text-foreground">
                        ${commission.commission_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(commission.created_at), "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <Badge className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay comisiones registradas
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
