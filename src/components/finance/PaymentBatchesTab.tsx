import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaymentBatches, usePaymentBatchItems, useCreatePaymentBatch, useAddInvoiceToPaymentBatch, useRemoveInvoiceFromPaymentBatch, useMarkPaymentBatchAsPaid } from "@/hooks/usePaymentBatches";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Eye, Trash2, Check, FileText, DollarSign } from "lucide-react";

export function PaymentBatchesTab() {
  const { data: batches, isLoading } = usePaymentBatches();
  const createMutation = useCreatePaymentBatch();
  const markAsPaidMutation = useMarkPaymentBatchAsPaid();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    bank_account_id: "",
    scheduled_date: "",
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*, banks(nombre)")
        .eq("activa", true);
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setDialogOpen(false);
        setFormData({ title: "", bank_account_id: "", scheduled_date: "" });
      },
    });
  };

  const handleMarkAsPaid = (batchId: string) => {
    if (confirm("¿Marcar este lote como pagado? Esto actualizará el estado de todas las facturas.")) {
      markAsPaidMutation.mutate(batchId);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      borrador: { variant: "secondary", label: "Borrador" },
      programado: { variant: "default", label: "Programado" },
      pagado: { variant: "outline", label: "Pagado" },
    };
    const config = variants[status] || variants.borrador;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Lotes de Pago
            </CardTitle>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lote
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando lotes...
            </div>
          ) : !batches || batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay lotes de pago creados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Facturas</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha Programada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.batch_id}>
                    <TableCell className="font-medium">
                      {batch.title || `Lote ${batch.batch_id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {batch.bank_name || "—"}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {batch.numero_cuenta || ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{batch.invoice_count}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(batch.total_amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {batch.scheduled_date
                        ? new Date(batch.scheduled_date).toLocaleDateString('es-MX')
                        : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(batch.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBatch(batch.batch_id);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {batch.status === "borrador" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(batch.batch_id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear lote */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Lote de Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Pago Proveedores Enero"
              />
            </div>
            <div>
              <Label>Cuenta Bancaria</Label>
              <Select
                value={formData.bank_account_id}
                onValueChange={(v) => setFormData({ ...formData, bank_account_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.banks?.nombre} - {account.numero_cuenta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha Programada</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Crear Lote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles del lote */}
      {selectedBatch && (
        <PaymentBatchDetailsDialog
          batchId={selectedBatch}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
}

// Componente auxiliar para mostrar detalles del lote
function PaymentBatchDetailsDialog({
  batchId,
  open,
  onOpenChange,
}: {
  batchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: items } = usePaymentBatchItems(batchId);
  const removeMutation = useRemoveInvoiceFromPaymentBatch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles del Lote
          </DialogTitle>
        </DialogHeader>
        <div>
          {!items || items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay facturas en este lote
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UUID Factura</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-mono max-w-xs truncate">
                      {item.invoices?.uuid || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.invoices?.providers?.name || "—"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(item.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
