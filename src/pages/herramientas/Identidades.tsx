import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const Identidades = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Identidades</h1>
          <p className="text-muted-foreground">Gestión de credenciales para clientes y colaboradores</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Módulo en Desarrollo</CardTitle>
          <CardDescription>Próximamente: gestión de identidades y credenciales</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este módulo permitirá crear y gestionar credenciales para clientes y colaboradores del sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Identidades;
