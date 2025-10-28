import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, CreditCard } from "lucide-react";

export default function ClientPagos() {
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const storedProjectId = localStorage.getItem("client.activeProject");
    if (storedProjectId) {
      setProjectId(storedProjectId);
    }
  }, []);

  const { data: financialSummary, isLoading } = useQuery({
    queryKey: ["client-financial-summary", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("vw_client_financial_summary")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

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
      </div>
    </div>
  );
}
