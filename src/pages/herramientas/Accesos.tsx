import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const Accesos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Accesos</h1>
          <p className="text-muted-foreground">Control de permisos y roles del sistema</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Módulo en Desarrollo</CardTitle>
          <CardDescription>Próximamente: asignación de permisos y roles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este módulo permitirá configurar y asignar permisos específicos a usuarios y roles. La configuración de RLS se realizará al final del desarrollo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accesos;
