import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, TrendingUp, AlertCircle, MessageSquare } from "lucide-react";
import { useMyProjects, useClientFinancialSummary } from "@/features/client/hooks";
import { useNavigate } from "react-router-dom";

export default function ClientPagos() {
  const { currentProject, projects, isLoading: projectsLoading } = useMyProjects();
  const navigate = useNavigate();
  const projectId = currentProject?.id || null;
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: financialData, isLoading } = useClientFinancialSummary(projectId);
  const financialSummary = financialData?.[0];

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '$0.00 MXN';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const balance = (financialSummary?.total_deposits || 0) - (financialSummary?.total_expenses || 0);

  if (projectsLoading) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!projectId || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay proyectos</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          No tienes proyectos asignados en este momento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Estado de Pagos</h1>
        <p className="text-sm text-muted-foreground">Resumen financiero de tu proyecto</p>
      </div>

      <div className="grid gap-4">
        {/* Deposits Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Depósitos Realizados</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-40" />
                ) : (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(financialSummary?.total_deposits)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Total de Gastos</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-40" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(financialSummary?.total_expenses)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className={balance >= 0 ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-orange-500'}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-orange-100 dark:bg-orange-900/20'}`}>
                <DollarSign className={`h-5 w-5 ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Balance</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-40" />
                ) : (
                  <>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {formatCurrency(balance)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {balance >= 0 ? 'A favor' : 'Pendiente'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment CTA */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">¿Necesitas realizar un pago?</h3>
              <p className="text-sm text-muted-foreground">
                Próximamente podrás realizar pagos directamente desde el portal
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => setShowPaymentModal(true)} variant="default">
                Ver información de pago
              </Button>
              <Button onClick={() => navigate('/client/chat')} variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contactar equipo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Próximamente: Liga de pago</DialogTitle>
            <DialogDescription>
              Esta funcionalidad estará disponible muy pronto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-lg border">
              <p className="text-sm font-medium mb-3">Proyecto actual:</p>
              <p className="text-sm text-muted-foreground">
                {currentProject?.clients?.name || 'N/A'}
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Estamos trabajando en:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                <li>Pagos en línea con tarjeta</li>
                <li>Generación automática de recibos</li>
                <li>Historial completo de transacciones</li>
              </ul>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-3">
                Mientras tanto, contacta a tu Project Manager para coordinar pagos mediante:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                  <li>Transferencia bancaria</li>
                  <li>Depósito en sucursal</li>
                  <li>Pago con cheque</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
