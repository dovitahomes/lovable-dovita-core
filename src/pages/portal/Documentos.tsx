import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutletContext {
  projectId: string | null;
}

export default function Documentos() {
  const { projectId } = useOutletContext<OutletContext>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Documentos</h2>
        <p className="text-sm text-muted-foreground">Gestiona los documentos de tu proyecto</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Mis Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Aquí aparecerán los documentos que has subido
          </p>
          <Button variant="outline" className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Subir documento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-yellow-600" />
            Documentos Requeridos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay documentos pendientes por entregar
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
