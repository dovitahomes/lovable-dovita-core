import { PenTool } from "lucide-react";

export default function Diseno() {
  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2">
        <PenTool className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Diseño</h1>
      </div>
      <p className="text-muted-foreground">
        Módulo de Diseño en construcción. Aquí podrás gestionar las fases de diseño y los entregables del cliente.
      </p>
    </div>
  );
}
