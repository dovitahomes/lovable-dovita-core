import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, AlertCircle } from "lucide-react";
import { InvoicesTab } from "@/components/accounting/InvoicesTab";
import { AccountsReportsTab } from "@/components/accounting/AccountsReportsTab";
import { useModuleAccess } from "@/hooks/useModuleAccess";

export default function Contabilidad() {
  const { canView } = useModuleAccess();

  if (!canView('contabilidad')) {
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
        <FileText className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Contabilidad</h1>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Facturas CFDI</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas por Cobrar/Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountsReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
