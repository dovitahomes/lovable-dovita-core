import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProviders } from "@/hooks/useProviders";

type PaymentStatus = 'pendiente' | 'pagado' | 'cancelado';

interface Payment {
  id: string;
  proveedor_id: string;
  po_id: string | null;
  amount: number;
  status: PaymentStatus;
  transfer_date: string | null;
  reference: string | null;
  evidence_url: string | null;
  notes: string | null;
  pay_batch_id: string | null;
  currency: string;
  created_at: string;
  providers?: { name: string; code_short: string };
  purchase_orders?: { id: string; tu_nodes?: { name: string } };
  pay_batches?: { title: string };
}

const STATUS_COLORS = {
  pendiente: 'bg-yellow-500',
  pagado: 'bg-green-500',
  cancelado: 'bg-red-500',
};

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
};

export default function Pagos() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    proveedor_id: "",
    po_id: "",
    amount: "",
    status: "pendiente" as PaymentStatus,
    transfer_date: "",
    reference: "",
    notes: "",
  });
  
  const queryClient = useQueryClient();
  const { data: providers = [] } = useProviders();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', search, statusFilter, providerFilter],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          providers(name, code_short),
          purchase_orders(id, tu_nodes:subpartida_id(name)),
          pay_batches(title)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (providerFilter !== 'all') {
        query = query.eq('proveedor_id', providerFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Payment[];
    },
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders-for-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, tu_nodes:subpartida_id(name), proveedor_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('payments').insert({
        proveedor_id: data.proveedor_id,
        po_id: data.po_id || null,
        amount: parseFloat(data.amount),
        status: data.status,
        transfer_date: data.transfer_date || null,
        reference: data.reference || null,
        notes: data.notes || null,
        currency: 'MXN',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("Pago creado");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Error al crear pago");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('payments')
        .update({
          proveedor_id: data.proveedor_id,
          po_id: data.po_id || null,
          amount: parseFloat(data.amount),
          status: data.status,
          transfer_date: data.transfer_date || null,
          reference: data.reference || null,
          notes: data.notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("Pago actualizado");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Error al actualizar pago");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("Pago eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar pago");
    },
  });

  const resetForm = () => {
    setFormData({
      proveedor_id: "",
      po_id: "",
      amount: "",
      status: "pendiente",
      transfer_date: "",
      reference: "",
      notes: "",
    });
    setSelectedPayment(null);
  };

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setSelectedPayment(payment);
      setFormData({
        proveedor_id: payment.proveedor_id,
        po_id: payment.po_id || "",
        amount: payment.amount.toString(),
        status: payment.status,
        transfer_date: payment.transfer_date || "",
        reference: payment.reference || "",
        notes: payment.notes || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.proveedor_id || !formData.amount) {
      toast.error("Completa los campos requeridos");
      return;
    }

    if (selectedPayment) {
      updateMutation.mutate({ id: selectedPayment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      payment.providers?.name.toLowerCase().includes(searchLower) ||
      payment.reference?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagos a Proveedores</h1>
          <p className="text-muted-foreground">
            Gestiona los pagos realizados a proveedores
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Pago
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por proveedor o referencia..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pagos</CardTitle>
          <CardDescription>
            {filteredPayments.length} pago{filteredPayments.length !== 1 ? 's' : ''} encontrado{filteredPayments.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>OC Vinculada</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha Transferencia</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No hay pagos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{payment.providers?.name}</div>
                          <div className="text-muted-foreground">{payment.providers?.code_short}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.purchase_orders?.tu_nodes?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[payment.status]}>
                          {STATUS_LABELS[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{payment.reference || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {payment.transfer_date 
                          ? new Date(payment.transfer_date).toLocaleDateString('es-MX')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.pay_batches?.title || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(payment)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(payment.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPayment ? "Editar Pago" : "Nuevo Pago"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="proveedor">Proveedor *</Label>
              <Select value={formData.proveedor_id} onValueChange={(v) => setFormData({ ...formData, proveedor_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code_short} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="po">Orden de Compra (opcional)</Label>
              <Select value={formData.po_id} onValueChange={(v) => setFormData({ ...formData, po_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona OC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin vincular</SelectItem>
                  {purchaseOrders
                    .filter(po => !formData.proveedor_id || po.proveedor_id === formData.proveedor_id)
                    .map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.tu_nodes?.name || po.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Importe *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as PaymentStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="transfer_date">Fecha de Transferencia</Label>
                <Input
                  id="transfer_date"
                  type="date"
                  value={formData.transfer_date}
                  onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Referencia</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Número de transferencia"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {selectedPayment ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
