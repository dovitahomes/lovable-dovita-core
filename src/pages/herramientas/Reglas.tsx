import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Reglas = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Centro de Reglas</h1>
          <p className="text-muted-foreground">Configuración de reglas de negocio</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Módulo en Desarrollo</CardTitle>
          <CardDescription>Próximamente: panel de configuración de reglas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este módulo permitirá configurar reglas de negocio con vigencias y alcance específico para diferentes procesos del sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reglas;
