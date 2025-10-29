import { useState } from "react";
import { useClientProjects, useClientFinancialSummary } from "@/features/client/hooks";
import { ClientCard } from "@/components/client/ClientCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useToastError } from "@/hooks/useToastError";
import { useNavigate } from "react-router-dom";

export default function ClientPagos() {
  const navigate = useNavigate();
  const { showErrorWithRetry } = useToastError();
  const { projects, loading: projectsLoading, selectedProjectId } = useClientProjects();
  const { data: financialData, isLoading: financialLoading, error, refetch } = useClientFinancialSummary(selectedProjectId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const loading = projectsLoading || financialLoading;

  // Error handling
  if (error && !loading) {
    showErrorWithRetry(error, () => refetch(), "No pudimos cargar tus pagos");
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-br from-[hsl(var(--dovita-blue))] to-blue-700 text-white px-4 py-6">
          <h1 className="text-2xl font-bold">Pagos</h1>
          <p className="text-sm text-white/80 mt-1">Resumen financiero de tu proyecto</p>
        </div>
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Empty state - no projects
  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <CreditCard className="h-16 w-16 text-slate-300 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900">Sin proyectos</h2>
          <p className="text-slate-500 max-w-sm">
            Aún no tienes proyectos con pagos disponibles.
          </p>
        </div>
      </div>
    );
  }

  // Empty state - no financial data
  if (!financialData || financialData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-br from-[hsl(var(--dovita-blue))] to-blue-700 text-white px-4 py-6">
          <h1 className="text-2xl font-bold">Pagos</h1>
          <p className="text-sm text-white/80 mt-1">Resumen financiero de tu proyecto</p>
        </div>
        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <CreditCard className="h-16 w-16 text-slate-300 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900">Sin información financiera</h2>
            <p className="text-slate-500 max-w-sm">
              Aún no tienes proyectos con pagos disponibles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const summary = financialData[0];
  const balance = summary.balance;
  const isPositive = balance >= 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--dovita-blue))] to-blue-700 text-white px-4 py-6">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <p className="text-sm text-white/80 mt-1">Resumen financiero de tu proyecto</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Project Info */}
        <ClientCard title="Proyecto" subtitle={summary.client_name}>
          <div className="text-xs text-slate-500">
            ID: {summary.project_id.slice(0, 8)}...
          </div>
        </ClientCard>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-3">
          <ClientCard
            title="Depósitos"
            icon={TrendingUp}
            rightMetric={formatCurrency(summary.total_deposits)}
          />
          <ClientCard
            title="Gastos"
            icon={TrendingDown}
            rightMetric={formatCurrency(summary.total_expenses)}
          />
        </div>

        {/* Balance */}
        <ClientCard
          title="Balance"
          icon={DollarSign}
          className={isPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
        >
          <div className={`text-2xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(balance)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isPositive ? "A tu favor" : "Pendiente de pago"}
          </p>
        </ClientCard>

        {/* Payment CTA */}
        <ClientCard title="Realizar Pago" icon={CreditCard}>
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-[hsl(var(--dovita-blue))] hover:bg-[hsl(var(--dovita-blue))]/90 text-white"
          >
            Pagar
          </Button>
        </ClientCard>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Próximamente</DialogTitle>
            <DialogDescription>
              Aquí podrás pagar con tarjeta o en comercios participantes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowPaymentModal(false)} className="w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
