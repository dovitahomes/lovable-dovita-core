import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Leads() {
  const [open, setOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [filterSucursal, setFilterSucursal] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formData, setFormData] = useState({
    client_id: "",
    contacto_data: "",
    origen: "",
    sucursal_id: "",
    notas: "",
    status: "nuevo" as "nuevo" | "contactado" | "calificado" | "convertido" | "perdido"
  });

  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', filterSucursal, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*, clients(name), sucursales(nombre)')
        .order('created_at', { ascending: false });
      
      if (filterSucursal) query = query.eq('sucursal_id', filterSucursal);
      if (filterStatus) query = query.eq('status', filterStatus as any);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, name');
      if (error) throw error;
      return data;
    }
  });

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sucursales').select('id, nombre').eq('activa', true);
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('leads').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead creado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al crear lead: " + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const { error } = await supabase.from('leads').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead actualizado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al actualizar lead: " + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead eliminado exitosamente");
    },
    onError: (error) => toast.error("Error al eliminar lead: " + error.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      client_id: formData.client_id || null,
      contacto_json: formData.contacto_data ? JSON.parse(formData.contacto_data) : null,
      origen: formData.origen || null,
      sucursal_id: formData.sucursal_id || null,
      notas: formData.notas || null,
      status: formData.status
    };
    
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({ client_id: "", contacto_data: "", origen: "", sucursal_id: "", notas: "", status: "nuevo" });
    setEditingLead(null);
    setOpen(false);
  };

  const handleEdit = (lead: any) => {
    setEditingLead(lead);
    setFormData({
      client_id: lead.client_id || "",
      contacto_data: lead.contacto_json ? JSON.stringify(lead.contacto_json, null, 2) : "",
      origen: lead.origen || "",
      sucursal_id: lead.sucursal_id || "",
      notas: lead.notas || "",
      status: lead.status
    });
    setOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      nuevo: "default",
      contactado: "secondary",
      calificado: "outline",
      convertido: "default",
      perdido: "destructive"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLead ? 'Editar' : 'Crear'} Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Cliente (opcional)</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin cliente</SelectItem>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contacto (JSON)</Label>
                <Textarea
                  value={formData.contacto_data}
                  onChange={(e) => setFormData({ ...formData, contacto_data: e.target.value })}
                  placeholder='{"nombre": "...", "telefono": "...", "email": "..."}'
                  rows={3}
                />
              </div>
              <div>
                <Label>Origen</Label>
                <Input
                  value={formData.origen}
                  onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                  placeholder="Facebook, Referido, etc."
                />
              </div>
              <div>
                <Label>Sucursal</Label>
                <Select value={formData.sucursal_id} onValueChange={(value) => setFormData({ ...formData, sucursal_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin sucursal</SelectItem>
                    {sucursales?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="contactado">Contactado</SelectItem>
                    <SelectItem value="calificado">Calificado</SelectItem>
                    <SelectItem value="convertido">Convertido</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingLead ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label>Sucursal</Label>
            <Select value={filterSucursal} onValueChange={setFilterSucursal}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {sucursales?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Estado</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="contactado">Contactado</SelectItem>
                <SelectItem value="calificado">Calificado</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.clients?.name || '-'}</TableCell>
                    <TableCell>{lead.origen || '-'}</TableCell>
                    <TableCell>{lead.sucursales?.nombre || '-'}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(lead)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}