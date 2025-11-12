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
import { AllianceCommissionsTab } from "@/components/commissions/AllianceCommissionsTab";
import { Handshake } from "lucide-react";

export default function ComisionesAlianzas() {
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
            <BreadcrumbPage>Comisiones por Alianzas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
          <Handshake className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Comisiones por Alianzas</h1>
          <p className="text-muted-foreground">
            Gestiona comisiones generadas por alianzas comerciales e inmobiliarias
          </p>
        </div>
      </div>

      {/* Content - Reuse existing tab */}
      <AllianceCommissionsTab />
    </div>
  );
}
