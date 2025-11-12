import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, DollarSign, Calendar, User, Building2, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CommissionDetailsDialogProps {
  commission: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsPaid?: (id: string) => void;
}

export function CommissionDetailsDialog({
  commission,
  open,
  onOpenChange,
  onMarkAsPaid,
}: CommissionDetailsDialogProps) {
  if (!commission) return null;

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

  const statusConfig = getStatusConfig(commission.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Detalles de Comisión</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Información completa y historial
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Banner */}
          <div className={cn("p-4 rounded-lg", statusConfig.color)}>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              <span className="font-semibold">Estado: {statusConfig.label}</span>
            </div>
          </div>

          {/* Main Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Alianza</span>
              </div>
              <p className="font-semibold text-lg">
                {commission.alianzas?.nombre || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                {commission.alianzas?.tipo} • {commission.alianzas?.comision_porcentaje}% comisión
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Cliente</span>
              </div>
              <p className="font-semibold text-lg">
                {commission.budgets?.projects?.clients?.name || 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Financial Details */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Detalles Financieros
            </h4>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border border-border bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">Monto Base</p>
                <p className="text-xl font-bold">
                  ${commission.base_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">Porcentaje</p>
                <p className="text-xl font-bold text-primary">
                  {commission.percent}%
                </p>
              </div>

              <div className="p-4 rounded-lg border border-primary bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Comisión Total</p>
                <p className="text-xl font-bold text-primary">
                  ${commission.calculated_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Historial
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Comisión Calculada</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(commission.created_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
              </div>

              {commission.paid_at && (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Comisión Pagada</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(commission.paid_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {commission.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </h4>
                <p className="text-sm text-muted-foreground p-3 rounded-lg border border-border bg-muted/20">
                  {commission.notes}
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          {commission.status !== 'pagada' && onMarkAsPaid && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  onMarkAsPaid(commission.id);
                  onOpenChange(false);
                }}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Pagada
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
