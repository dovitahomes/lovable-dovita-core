import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReportsTab } from "@/components/finance/ReportsTab";
import { ProviderBalanceTab } from "@/components/finance/ProviderBalanceTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinanzasReportes() {
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
            <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Reportes</h1>
            <p className="text-sm text-muted-foreground">
              Generación de reportes financieros y análisis de saldos
            </p>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="balances">Saldos Proveedores</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-6">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="balances" className="mt-6">
          <ProviderBalanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
