import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

type BatchStatus = 'borrador' | 'programado' | 'pagado' | 'cancelado';

interface PayBatch {
  id: string;
  title: string | null;
  bank_account_id: string | null;
  scheduled_date: string | null;
  status: BatchStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  bank_accounts?: { account_alias: string; numero_cuenta: string };
}

const STATUS_COLORS = {
  borrador: 'bg-gray-500',
  programado: 'bg-blue-500',
  pagado: 'bg-green-500',
  cancelado: 'bg-red-500',
};

const STATUS_LABELS = {
  borrador: 'Borrador',
  programado: 'Programado',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
};

export default function LotesPago() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<PayBatch | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    bank_account_id: "",
    scheduled_date: "",
    status: "borrador" as BatchStatus,
    notes: "",
  });
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['pay-batches', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('pay_batches')
        .select(`
          *,
          bank_accounts(account_alias, numero_cuenta)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PayBatch[];
    },
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('activa', true)
        .order('account_alias');
      if (error) throw error;
      return data;
    },
  });

  const { data: batchTotals } = useQuery({
    queryKey: ['batch-totals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('pay_batch_id, amount');
      if (error) throw error;
      
      const totals: Record<string, number> = {};
      data.forEach(p => {
        if (p.pay_batch_id) {
          totals[p.pay_batch_id] = (totals[p.pay_batch_id] || 0) + p.amount;
        }
      });
      return totals;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('pay_batches').insert({
        title: data.title || null,
        bank_account_id: data.bank_account_id || null,
        scheduled_date: data.scheduled_date || null,
        status: data.status,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-batches'] });
      toast.success("Lote creado");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Error al crear lote");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('pay_batches')
        .update({
          title: data.title || null,
          bank_account_id: data.bank_account_id || null,
          scheduled_date: data.scheduled_date || null,
          status: data.status,
          notes: data.notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-batches'] });
      toast.success("Lote actualizado");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Error al actualizar lote");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pay_batches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-batches'] });
      toast.success("Lote eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar lote");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      bank_account_id: "",
      scheduled_date: "",
      status: "borrador",
      notes: "",
    });
    setSelectedBatch(null);
  };

  const handleOpenDialog = (batch?: PayBatch) => {
    if (batch) {
      setSelectedBatch(batch);
      setFormData({
        title: batch.title || "",
        bank_account_id: batch.bank_account_id || "",
        scheduled_date: batch.scheduled_date || "",
        status: batch.status,
        notes: batch.notes || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error("El título es requerido");
      return;
    }

    if (selectedBatch) {
      updateMutation.mutate({ id: selectedBatch.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredBatches = batches.filter(batch => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return batch.title?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lotes de Pago</h1>
          <p className="text-muted-foreground">
            Gestiona lotes de pagos agrupados
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Lote
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra lotes de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
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
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="programado">Programado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Lotes</CardTitle>
          <CardDescription>
            {filteredBatches.length} lote{filteredBatches.length !== 1 ? 's' : ''} encontrado{filteredBatches.length !== 1 ? 's' : ''}
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
                  <TableHead>Título</TableHead>
                  <TableHead>Cuenta Bancaria</TableHead>
                  <TableHead>Fecha Programada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay lotes de pago
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.title || 'Sin título'}</TableCell>
                      <TableCell className="text-sm">
                        {batch.bank_accounts 
                          ? `${batch.bank_accounts.account_alias} - ${batch.bank_accounts.numero_cuenta}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {batch.scheduled_date 
                          ? new Date(batch.scheduled_date).toLocaleDateString('es-MX')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[batch.status]}>
                          {STATUS_LABELS[batch.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(batchTotals?.[batch.id] || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/lotes-pago/${batch.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(batch)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(batch.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBatch ? "Editar Lote" : "Nuevo Lote"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Pago quincenal proveedores"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank_account">Cuenta Bancaria</Label>
              <Select value={formData.bank_account_id} onValueChange={(v) => setFormData({ ...formData, bank_account_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cuenta</SelectItem>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_alias} - {acc.numero_cuenta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduled_date">Fecha Programada</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as BatchStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
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
              {selectedBatch ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
