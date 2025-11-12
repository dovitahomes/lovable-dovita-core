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
import { CollaboratorCommissionsTab } from "@/components/commissions/CollaboratorCommissionsTab";
import { Users } from "lucide-react";

export default function ComisionesColaboradores() {
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
            <BreadcrumbPage>Comisiones por Colaboradores</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Comisiones por Colaboradores</h1>
          <p className="text-muted-foreground">
            Gestiona comisiones del equipo interno por proyectos y ventas
          </p>
        </div>
      </div>

      {/* Content - Reuse existing tab */}
      <CollaboratorCommissionsTab />
    </div>
  );
}
