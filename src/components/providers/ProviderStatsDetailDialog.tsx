import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Receipt, Eye } from "lucide-react";
import { Provider } from "@/hooks/useProviders";
import { cn } from "@/lib/utils";

interface ProviderStatsDetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  providers: Provider[];
  onViewDetails: (provider: Provider) => void;
}

export function ProviderStatsDetailDialog({
  open,
  onClose,
  title,
  providers,
  onViewDetails,
}: ProviderStatsDetailDialogProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            {title}
            <Badge variant="secondary" className="ml-auto">
              {providers.length} {providers.length === 1 ? "proveedor" : "proveedores"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {providers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron proveedores en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {providers.map((provider, index) => (
              <Card
                key={provider.id}
                className={cn(
                  "group hover:shadow-lg hover:scale-[1.02] transition-all duration-200",
                  "bg-gradient-to-br from-blue-50/50 to-indigo-50/50",
                  "dark:from-blue-950/20 dark:to-indigo-950/20",
                  "border-border hover:border-primary/30",
                  "animate-fade-in"
                )}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {provider.code_short.slice(0, 2).toUpperCase()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name + Code */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-xs">
                            {provider.code_short}
                          </Badge>
                          <Badge
                            variant={provider.activo ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {provider.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm truncate">
                          {provider.name}
                        </h3>
                      </div>

                      {/* Info Chips */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Receipt className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {provider.fiscales_json?.rfc || "Sin RFC"}
                          </span>
                        </div>

                        {provider.contacto_json?.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {provider.contacto_json.email}
                            </span>
                          </div>
                        )}

                        {provider.contacto_json?.telefono && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {provider.contacto_json.telefono}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          onViewDetails(provider);
                          onClose();
                        }}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
