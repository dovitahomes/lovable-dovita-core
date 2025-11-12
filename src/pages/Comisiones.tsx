import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Percent, AlertCircle } from "lucide-react";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import ComisionesIndex from "@/pages/comisiones/ComisionesIndex";

export default function Comisiones() {
  const { canView } = useModuleAccess();

  if (!canView('comisiones')) {
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
        <Percent className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Comisiones</h1>
      </div>

      <ComisionesIndex />
    </div>
  );
}
