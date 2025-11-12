import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InvoiceStatsCards } from "@/components/finance/invoicing/InvoiceStatsCards";
import { InvoicesGrid } from "@/components/finance/invoicing/InvoicesGrid";
import { InvoiceUploadDialog } from "@/components/finance/invoicing/InvoiceUploadDialog";
import { ReconciliationKanban } from "@/components/finance/invoicing/ReconciliationKanban";
import { PaymentBatchesTab } from "@/components/finance/PaymentBatchesTab";
import { PaymentBatchBuilder } from "@/components/finance/invoicing/PaymentBatchBuilder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinanzasFacturacion() {
  const navigate = useNavigate();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
              <FileText className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Facturación</h1>
              <p className="text-sm text-muted-foreground">
                Gestión de facturas XML SAT y lotes de pago
              </p>
            </div>
          </div>
          
          <Button onClick={() => setShowUploadDialog(true)} className="gap-2 w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Cargar XML SAT</span>
            <span className="sm:hidden">Cargar XML</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <InvoiceStatsCards />

      {/* Content Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="invoices" className="text-xs sm:text-sm">Facturas</TabsTrigger>
          <TabsTrigger value="reconciliation" className="text-xs sm:text-sm">Conciliación</TabsTrigger>
          <TabsTrigger value="batches" className="text-xs sm:text-sm">Lotes</TabsTrigger>
          <TabsTrigger value="builder" className="text-xs sm:text-sm">Crear</TabsTrigger>
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

        <TabsContent value="builder" className="mt-6">
          <PaymentBatchBuilder />
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
