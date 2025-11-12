import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BACKOFFICE_ROUTES } from "@/config/routes";
import { CommissionSummaryTab } from "@/components/commissions/CommissionSummaryTab";
import { DollarSign } from "lucide-react";

export default function ComisionesResumen() {
  return (
    <div className="space-y-6">
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
            <BreadcrumbPage>Resumen Financiero</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
          <DollarSign className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Resumen Financiero</h1>
          <p className="text-muted-foreground">
            Vista general de comisiones, pendientes, pagadas y métricas clave
          </p>
        </div>
      </div>

      {/* Content - Reuse existing tab */}
      <CommissionSummaryTab />
    </div>
  );
}
