import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Hammer } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FinanzasConstruccion() {
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
            <Hammer className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Construcción</h1>
            <p className="text-sm text-muted-foreground">
              Monitoreo de gastos por proyecto y consumo de presupuesto
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Proyecto</CardTitle>
          <CardDescription>
            Vista detallada del consumo presupuestal por proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Módulo en desarrollo - Se implementará en siguientes fases
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
