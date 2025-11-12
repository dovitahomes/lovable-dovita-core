import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InvoiceStatsCards } from "@/components/finance/invoicing/InvoiceStatsCards";
import { InvoicesGrid } from "@/components/finance/invoicing/InvoicesGrid";
import { InvoiceUploadDialog } from "@/components/finance/invoicing/InvoiceUploadDialog";
import { ReconciliationKanban } from "@/components/finance/invoicing/ReconciliationKanban";
import { PaymentBatchesTab } from "@/components/finance/PaymentBatchesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinanzasFacturacion() {
  const navigate = useNavigate();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

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

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
              <FileText className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Facturación</h1>
              <p className="text-sm text-muted-foreground">
                Gestión de facturas XML SAT y lotes de pago
              </p>
            </div>
          </div>
          
          <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Cargar XML SAT
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <InvoiceStatsCards />

      {/* Content Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliación</TabsTrigger>
          <TabsTrigger value="batches">Lotes de Pago</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <InvoicesGrid />
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-6">
          <ReconciliationKanban />
        </TabsContent>

        <TabsContent value="batches" className="mt-6">
          <PaymentBatchesTab />
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <InvoiceUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={() => {
          // Stats and grid will auto-refresh via React Query
        }}
      />
    </div>
  );
}
