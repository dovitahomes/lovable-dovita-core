import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TreasuryStatsCards } from "@/components/finance/treasury/TreasuryStatsCards";
import { CashFlowChart } from "@/components/finance/treasury/CashFlowChart";
import { BankAccountsGrid } from "@/components/finance/treasury/BankAccountsGrid";
import { RecentTransactionsTimeline } from "@/components/finance/treasury/RecentTransactionsTimeline";
import { BankAccountsTab } from "@/components/finance/BankAccountsTab";
import { TransactionsTab } from "@/components/finance/TransactionsTab";
import { BankReconciliationTab } from "@/components/finance/BankReconciliationTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinanzasTesoreria() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-full mx-auto px-4 sm:px-6 py-6 space-y-6 overflow-x-hidden">
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Tesorería</h1>
            <p className="text-sm text-muted-foreground">
              Dashboard de salud financiera y gestión de cuentas
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <TreasuryStatsCards />

      {/* Cash Flow Chart */}
      <CashFlowChart />

      {/* Bank Accounts Grid & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BankAccountsGrid />
        <RecentTransactionsTimeline />
      </div>

      {/* Management Tabs */}
      <div className="pt-6 border-t">
        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="accounts" className="text-xs sm:text-sm">Bancos</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm">Movimientos</TabsTrigger>
            <TabsTrigger value="reconciliation" className="text-xs sm:text-sm">Conciliar</TabsTrigger>
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
    </div>
  );
}
