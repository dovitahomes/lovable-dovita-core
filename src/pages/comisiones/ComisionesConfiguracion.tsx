import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BACKOFFICE_ROUTES } from "@/config/routes";
import { CommissionConfigTab } from "@/components/commissions/CommissionConfigTab";
import { CommissionRulesTab } from "@/components/commissions/CommissionRulesTab";
import { Settings } from "lucide-react";

export default function ComisionesConfiguracion() {
  return (
    <div className="space-y-6 max-w-full overflow-x-hidden px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={BACKOFFICE_ROUTES.COMISIONES}>Comisiones</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Configuración y Reglas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Configuración y Reglas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona porcentajes, reglas de cálculo y configuración global
          </p>
        </div>
      </div>

      {/* Tabs - Config and Rules */}
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="config" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Configuración Global</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Reglas de Cálculo</span>
            <span className="sm:hidden">Reglas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <CommissionConfigTab />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <CommissionRulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
