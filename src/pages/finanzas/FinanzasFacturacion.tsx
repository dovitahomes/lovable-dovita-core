import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PaymentBatchesTab } from "@/components/finance/PaymentBatchesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinanzasFacturacion() {
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
            <FileText className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Facturación</h1>
            <p className="text-sm text-muted-foreground">
              Administración de facturas, lotes de pago y XML SAT
            </p>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="batches">Lotes de Pago</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Módulo de Facturas en desarrollo
          </div>
        </TabsContent>

        <TabsContent value="batches" className="mt-6">
          <PaymentBatchesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
