import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BankAccountsTab } from "@/components/finance/BankAccountsTab";
import { PaymentBatchesTab } from "@/components/finance/PaymentBatchesTab";
import { BankReconciliationTab } from "@/components/finance/BankReconciliationTab";
import { TransactionsTab } from "@/components/finance/TransactionsTab";
import { ProviderBalanceTab } from "@/components/finance/ProviderBalanceTab";
import { ReportsTab } from "@/components/finance/ReportsTab";
import { Building2, FileText, DollarSign, ArrowLeftRight, Receipt, TrendingUp, BarChart3, AlertCircle } from "lucide-react";
import { useModuleAccess } from "@/hooks/useModuleAccess";

export default function Finanzas() {
  const { canView } = useModuleAccess();

  if (!canView('finanzas')) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para ver este módulo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Finanzas</h1>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="accounts" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bancos
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Lotes de Pago
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Conciliación
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Receipt className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Saldos
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <BankAccountsTab />
        </TabsContent>

        <TabsContent value="invoices">
          <div className="text-center py-12 text-muted-foreground">
            Módulo de Facturas en desarrollo
          </div>
        </TabsContent>

        <TabsContent value="batches">
          <PaymentBatchesTab />
        </TabsContent>

        <TabsContent value="reconciliation">
          <BankReconciliationTab />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="providers">
          <ProviderBalanceTab />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
