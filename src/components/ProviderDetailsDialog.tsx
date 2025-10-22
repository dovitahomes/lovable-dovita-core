import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProviderDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  provider: any;
}

export function ProviderDetailsDialog({
  open,
  onClose,
  provider,
}: ProviderDetailsDialogProps) {
  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-primary">{provider.code_short}</span>
            <span>{provider.name}</span>
            <Badge variant={provider.activo ? "default" : "secondary"}>
              {provider.activo ? "Activo" : "Inactivo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Datos Fiscales */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Datos Fiscales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">RFC</p>
                <p className="font-mono font-medium">
                  {provider.fiscales_json?.rfc || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Régimen Fiscal</p>
                <p className="font-medium">
                  {provider.fiscales_json?.regimen_fiscal || "No especificado"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Razón Social</p>
                <p className="font-medium">
                  {provider.fiscales_json?.razon_social || "No especificada"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Dirección Fiscal</p>
                <p className="font-medium">
                  {provider.fiscales_json?.direccion_fiscal || "No especificada"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Términos */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Términos y Condiciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo de Entrega</p>
                <p className="font-medium">
                  {provider.terms_json?.tiempo_entrega || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pago</p>
                <p className="font-medium">
                  {provider.terms_json?.forma_pago || "No especificada"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Condiciones</p>
                <p className="font-medium">
                  {provider.terms_json?.condiciones || "No especificadas"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">
                  {provider.contacto_json?.nombre || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Puesto</p>
                <p className="font-medium">
                  {provider.contacto_json?.puesto || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">
                  {provider.contacto_json?.email || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">
                  {provider.contacto_json?.telefono || "No especificado"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
