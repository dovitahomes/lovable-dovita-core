import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BankAccountsTab } from "@/components/finance/BankAccountsTab";
import { TransactionsTab } from "@/components/finance/TransactionsTab";
import { BankReconciliationTab } from "@/components/finance/BankReconciliationTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinanzasTesoreria() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header with Back Button */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/finanzas')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Finanzas
        </Button>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Tesorería</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de cuentas bancarias, movimientos y conciliación
            </p>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList>
          <TabsTrigger value="accounts">Cuentas Bancarias</TabsTrigger>
          <TabsTrigger value="transactions">Movimientos</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliación</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-6">
          <BankAccountsTab />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-6">
          <BankReconciliationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
