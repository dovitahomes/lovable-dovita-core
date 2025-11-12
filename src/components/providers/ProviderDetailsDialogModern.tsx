import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, FileText, Users } from "lucide-react";
import { ProviderUsageChart } from "./ProviderUsageChart";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProviderDetailsDialogModernProps {
  open: boolean;
  onClose: () => void;
  provider: any;
}

export function ProviderDetailsDialogModern({
  open,
  onClose,
  provider,
}: ProviderDetailsDialogModernProps) {
  // Query for budget items where this provider is used
  const { data: budgetUsage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ["provider-budget-usage", provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];

      const { data, error } = await supabase
        .from("budget_items")
        .select(`
          id,
          descripcion,
          total,
          created_at,
          budgets!inner(
            id,
            type,
            version,
            projects!inner(
              id,
              project_name,
              clients(name)
            )
          )
        `)
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!provider?.id && open,
  });

  if (!provider) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
              {provider.code_short}
            </Badge>
            <span className="text-2xl">{provider.name}</span>
            <Badge variant={provider.activo ? "default" : "secondary"}>
              {provider.activo ? "Activo" : "Inactivo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="fiscales">Fiscales</TabsTrigger>
            <TabsTrigger value="terminos">Términos</TabsTrigger>
            <TabsTrigger value="uso">Uso en Proyectos</TabsTrigger>
          </TabsList>

          {/* Tab: Información */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Código</p>
                    <p className="font-mono font-semibold">{provider.code_short}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nombre</p>
                    <p className="font-semibold">{provider.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nombre de Contacto</p>
                    <p className="font-medium">
                      {provider.contacto_json?.nombre || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Puesto</p>
                    <p className="font-medium">
                      {provider.contacto_json?.puesto || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">
                      {provider.contacto_json?.email || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                    <p className="font-medium">
                      {provider.contacto_json?.telefono || "No especificado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Fiscales */}
          <TabsContent value="fiscales" className="space-y-4">
            <Card className="bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Datos Fiscales</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">RFC</p>
                    <p className="font-mono font-medium">
                      {provider.fiscales_json?.rfc || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Régimen Fiscal</p>
                    <p className="font-medium">
                      {provider.fiscales_json?.regimen_fiscal || "No especificado"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Razón Social</p>
                    <p className="font-medium">
                      {provider.fiscales_json?.razon_social || "No especificada"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Dirección Fiscal</p>
                    <p className="font-medium">
                      {provider.fiscales_json?.direccion_fiscal || "No especificada"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Términos */}
          <TabsContent value="terminos" className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Términos y Condiciones</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tiempo de Entrega</p>
                    <p className="font-medium">
                      {provider.terms_json?.tiempo_entrega || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Forma de Pago</p>
                    <p className="font-medium">
                      {provider.terms_json?.forma_pago || "No especificada"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Condiciones</p>
                    <p className="font-medium whitespace-pre-wrap">
                      {provider.terms_json?.condiciones || "No especificadas"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Uso en Proyectos */}
          <TabsContent value="uso" className="space-y-4">
            {/* Chart */}
            <ProviderUsageChart providerId={provider.id} />

            {/* Timeline of Budget Items */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Últimos Presupuestos</h3>
                </div>

                {isLoadingUsage ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : budgetUsage && budgetUsage.length > 0 ? (
                  <div className="space-y-3">
                    {budgetUsage.map((item: any) => {
                      const budget = item.budgets;
                      const project = budget?.projects;
                      const client = project?.clients;

                      return (
                        <Card key={item.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="outline" className="shrink-0">
                                    {budget?.type === "parametrico"
                                      ? "Paramétrico"
                                      : "Ejecutivo"}
                                  </Badge>
                                  <Badge variant="secondary" className="shrink-0">
                                    v{budget?.version || 1}
                                  </Badge>
                                </div>
                                <p className="font-semibold text-sm">
                                  {project?.project_name || "Proyecto sin nombre"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Cliente: {client?.name || "Sin cliente"}
                                </p>
                                {item.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {item.descripcion}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-lg">
                                  {formatCurrency(item.total || 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), "dd MMM yyyy", {
                                    locale: es,
                                  })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron presupuestos con este proveedor
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
