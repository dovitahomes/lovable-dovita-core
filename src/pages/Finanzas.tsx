import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign } from "lucide-react";
import { BankAccountsTab } from "@/components/finance/BankAccountsTab";
import { PurchaseOrdersTab } from "@/components/finance/PurchaseOrdersTab";
import { TransactionsTab } from "@/components/finance/TransactionsTab";
import { ReportsTab } from "@/components/finance/ReportsTab";
import { ProviderBalanceTab } from "@/components/finance/ProviderBalanceTab";

export default function Finanzas() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Finanzas</h1>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="accounts">Cuentas Bancarias</TabsTrigger>
          <TabsTrigger value="purchase-orders">Órdenes de Compra</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="providers">Proveedores</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <BankAccountsTab />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrdersTab />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="providers">
          <ProviderBalanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
