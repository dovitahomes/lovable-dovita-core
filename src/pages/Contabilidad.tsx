import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { InvoicesTab } from "@/components/accounting/InvoicesTab";
import { AccountsReportsTab } from "@/components/accounting/AccountsReportsTab";

export default function Contabilidad() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Contabilidad</h1>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Facturas CFDI</TabsTrigger>
          <TabsTrigger value="reports">Cuentas por Cobrar/Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>

        <TabsContent value="reports">
          <AccountsReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
