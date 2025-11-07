import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Percent } from "lucide-react";
import { AllianceCommissionsTab } from "@/components/commissions/AllianceCommissionsTab";
import { CollaboratorCommissionsTab } from "@/components/commissions/CollaboratorCommissionsTab";
import { CommissionConfigTab } from "@/components/commissions/CommissionConfigTab";
import { CommissionRulesTab } from "@/components/commissions/CommissionRulesTab";
import { CommissionSummaryTab } from "@/components/commissions/CommissionSummaryTab";

export default function Comisiones() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Percent className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Comisiones</h1>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="alliances">Alianzas</TabsTrigger>
          <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <CommissionSummaryTab />
        </TabsContent>

        <TabsContent value="rules">
          <CommissionRulesTab />
        </TabsContent>

        <TabsContent value="alliances">
          <AllianceCommissionsTab />
        </TabsContent>

        <TabsContent value="collaborators">
          <CollaboratorCommissionsTab />
        </TabsContent>

        <TabsContent value="config">
          <CommissionConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
