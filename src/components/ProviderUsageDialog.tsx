import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProviderUsage } from "@/hooks/useProviderUsage";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LoadingError } from "./common/LoadingError";
import { ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface ProviderUsageDialogProps {
  open: boolean;
  onClose: () => void;
  providerId: string | null;
  providerName?: string;
}

const estadoColors: Record<string, "default" | "secondary" | "destructive"> = {
  solicitado: "secondary",
  ordenado: "default",
  recibido: "default",
  cancelado: "destructive",
};

const paymentStatusColors: Record<string, "default" | "secondary" | "destructive"> = {
  pendiente: "secondary",
  procesado: "default",
  completado: "default",
  cancelado: "destructive",
};

export function ProviderUsageDialog({
  open,
  onClose,
  providerId,
  providerName,
}: ProviderUsageDialogProps) {
  const { data, isLoading, error } = useProviderUsage(providerId || undefined);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uso del Proveedor: {providerName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="purchase-orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase-orders">
              Órdenes de Compra ({data?.purchaseOrders.length || 0})
            </TabsTrigger>
            <TabsTrigger value="payments">
              Pagos ({data?.payments.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase-orders" className="mt-4">
            <LoadingError
              isLoading={isLoading}
              error={error}
              isEmpty={!data?.purchaseOrders.length}
              emptyMessage="No hay órdenes de compra en los últimos 6 meses"
            />
            {!isLoading && !error && data?.purchaseOrders && data.purchaseOrders.length > 0 && (
              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Subpartida</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Req.</TableHead>
                      <TableHead>Creada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.project_name}</TableCell>
                        <TableCell className="text-sm">{po.subpartida_name}</TableCell>
                        <TableCell>{po.qty_solicitada}</TableCell>
                        <TableCell>
                          <Badge variant={estadoColors[po.estado] || "secondary"}>
                            {po.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {po.fecha_requerida
                            ? format(new Date(po.fecha_requerida), "dd MMM yyyy", {
                                locale: es,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(po.created_at), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end">
                  <Button variant="link" size="sm" className="gap-1">
                    Ver todas las OCs <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <LoadingError
              isLoading={isLoading}
              error={error}
              isEmpty={!data?.payments.length}
              emptyMessage="No hay pagos registrados en los últimos 6 meses"
            />
            {!isLoading && !error && data?.payments && data.payments.length > 0 && (
              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Fecha Transferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={paymentStatusColors[payment.status] || "secondary"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{payment.reference || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {payment.transfer_date
                            ? format(new Date(payment.transfer_date), "dd MMM yyyy", {
                                locale: es,
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end">
                  <Button variant="link" size="sm" className="gap-1">
                    Ver todos los pagos <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
