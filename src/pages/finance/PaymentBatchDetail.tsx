import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  usePayBatch,
  usePaymentsOfBatch,
  useUpsertPayBatch,
  useDeletePayBatch,
  useAddPaymentsToBatch,
  useUpdatePayment,
  useMarkPaymentPaid,
  useDeletePayment,
  usePurchaseOrdersForPayment,
} from "@/hooks/usePayments";
import { useProviders } from "@/hooks/useProviders";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentBatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedOCs, setSelectedOCs] = useState<string[]>([]);
  const [groupByProvider, setGroupByProvider] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data: batch, isLoading: batchLoading } = usePayBatch(isNew ? undefined : id);
  const { data: payments, isLoading: paymentsLoading } = usePaymentsOfBatch(
    isNew ? undefined : id
  );
  const { data: providers } = useProviders();
  const { data: purchaseOrders } = usePurchaseOrdersForPayment();

  // Cargar cuentas bancarias
  const { data: bankAccounts } = useQuery({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("activa", true);
      if (error) throw error;
      return data;
    },
  });

  const upsertBatch = useUpsertPayBatch();
  const deleteBatch = useDeletePayBatch();
  const addPayments = useAddPaymentsToBatch();
  const updatePayment = useUpdatePayment();
  const markPaid = useMarkPaymentPaid();
  const deletePayment = useDeletePayment();

  const handleSave = () => {
    if (!title && !isNew) {
      toast({ title: "El título es requerido", variant: "destructive" });
      return;
    }

    upsertBatch.mutate(
      {
        id: isNew ? undefined : id,
        title,
        bank_account_id: bankAccountId || null,
        scheduled_date: scheduledDate || null,
        notes: notes || null,
      },
      {
        onSuccess: (data) => {
          if (isNew) {
            navigate(`/finance/payments/${data.id}`);
          }
        },
      }
    );
  };

  const handleAddPayments = () => {
    if (!id || isNew) {
      toast({ title: "Guarda el lote primero", variant: "destructive" });
      return;
    }

    if (selectedOCs.length === 0) {
      toast({ title: "Selecciona al menos una OC", variant: "destructive" });
      return;
    }

    const paymentsToAdd = selectedOCs.map((poId) => {
      const po = purchaseOrders?.find((p: any) => p.id === poId);
      return {
        pay_batch_id: id,
        proveedor_id: po?.proveedor_id,
        po_id: poId,
        amount: po?.balance || 0,
        currency: "MXN",
        status: "pendiente",
      };
    });

    addPayments.mutate(paymentsToAdd, {
      onSuccess: () => {
        setShowAddDialog(false);
        setSelectedOCs([]);
      },
    });
  };

  const handleMarkPaid = () => {
    if (!selectedPayment) return;

    markPaid.mutate(
      { id: selectedPayment.id, reference: paymentReference },
      {
        onSuccess: () => {
          setSelectedPayment(null);
          setPaymentReference("");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!id || isNew) return;

    deleteBatch.mutate(id, {
      onSuccess: () => {
        navigate("/finance/payments");
      },
    });
  };

  const getTotalPaid = () => {
    return (
      payments
        ?.filter((p: any) => p.status === "pagado")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
    );
  };

  const getTotalPending = () => {
    return (
      payments
        ?.filter((p: any) => p.status === "pendiente")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
    );
  };

  if ((batchLoading || paymentsLoading) && !isNew) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? "Nuevo Lote de Pagos" : title || batch?.title || "Lote de Pagos"}
            </h1>
            {!isNew && batch && <Badge className="mt-2">{batch.status}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={upsertBatch.isPending}>
            {upsertBatch.isPending ? "Guardando..." : "Guardar"}
          </Button>
          {!isNew && batch?.status === "borrador" && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Info del Lote */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Lote</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Pagos Semana 44"
            />
          </div>

          <div>
            <Label>Cuenta Bancaria</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts?.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.numero_cuenta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fecha Programada</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pagos del Lote */}
      {!isNew && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pagos</CardTitle>
            {batch?.status === "borrador" && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Pagos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Seleccionar OCs para Pago</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {purchaseOrders && purchaseOrders.length > 0 ? (
                      <>
                        {purchaseOrders.map((po: any) => (
                          <div
                            key={po.id}
                            className="flex items-center space-x-2 p-4 border rounded-lg"
                          >
                            <Checkbox
                              checked={selectedOCs.includes(po.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedOCs([...selectedOCs, po.id]);
                                } else {
                                  setSelectedOCs(selectedOCs.filter((id) => id !== po.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">
                                {po.providers?.code_short} - {po.providers?.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Folio: {po.folio || po.id.substring(0, 8)} • Proyecto:{" "}
                                {po.projects?.notas} • Monto: $
                                {po.total_estimated.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button onClick={handleAddPayments} className="w-full">
                          Agregar Seleccionados
                        </Button>
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No hay OCs disponibles para pago
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <>
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <div className="font-medium">
                              {payment.providers?.code_short} - {payment.providers?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.purchase_orders && (
                                <>
                                  OC: {payment.purchase_orders.folio ||payment.po_id?.substring(0, 8)}{" "}
                                  • Proyecto: {payment.purchase_orders.projects?.notas}
                                  <br />
                                </>
                              )}
                              Monto: ${Number(payment.amount).toFixed(2)}{" "}
                              {payment.currency}
                              {payment.transfer_date && (
                                <>
                                  {" "}
                                  • Pagado:{" "}
                                  {format(new Date(payment.transfer_date), "dd/MM/yyyy")}
                                </>
                              )}
                              {payment.reference && <> • Ref: {payment.reference}</>}
                            </div>
                            <Badge variant={payment.status === "pagado" ? "default" : "secondary"}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {payment.status === "pendiente" && batch?.status !== "cancelado" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Marcar como Pagado</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Referencia (opcional)</Label>
                                      <Input
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        placeholder="Folio bancario"
                                      />
                                    </div>
                                    <Button onClick={handleMarkPaid} className="w-full">
                                      Confirmar Pago
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            {batch?.status === "borrador" && payment.status === "pendiente" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deletePayment.mutate(payment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Pendiente:</span>
                    <span>${getTotalPending().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Pagado:</span>
                    <span className="text-green-600">${getTotalPaid().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${(getTotalPending() + getTotalPaid()).toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay pagos en este lote. Agrega pagos para comenzar.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El lote y todos sus pagos serán eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
