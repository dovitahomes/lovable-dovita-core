import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, FileText, CreditCard } from "lucide-react";
import { useMyProjects, useClientFinancialSummary } from "@/features/client/hooks";

export default function ClientPagos() {
  const { currentProject } = useMyProjects();
  const projectId = currentProject?.id || null;
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: financialData, isLoading } = useClientFinancialSummary(projectId);
  const financialSummary = financialData?.[0];

  if (!projectId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Estado de Pagos</h1>

      <div className="grid gap-4">
        {/* Total Expenses Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1">Total de Gastos</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-semibold">
                  ${financialSummary?.total_expenses?.toLocaleString('es-MX') || '0'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Deposits Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1">Depósitos Realizados</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-semibold text-green-600">
                  ${financialSummary?.total_deposits?.toLocaleString('es-MX') || '0'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Invoices Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1">Facturas Pendientes</h3>
              <p className="text-sm text-muted-foreground">
                Próximamente podrás ver y descargar tus facturas aquí
              </p>
            </div>
          </div>
        </Card>

        {/* Payment CTA */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-center">
            <h3 className="font-medium mb-2">¿Necesitas realizar un pago?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Próximamente podrás realizar pagos directamente desde el portal
            </p>
            <Button onClick={() => setShowPaymentModal(true)} variant="default">
              Información de pago
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Información de pago</DialogTitle>
            <DialogDescription>
              Esta funcionalidad estará disponible próximamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Mientras tanto, puedes contactar con tu Project Manager para coordinar los pagos.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Métodos de pago disponibles:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Transferencia bancaria</li>
                <li>Depósito en efectivo</li>
                <li>Cheque</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
