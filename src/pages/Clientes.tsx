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
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Clientes() {
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    person_type: "fisica" as "fisica" | "moral",
    name: "",
    email: "",
    phone: "",
    fiscal_data: "",
    address_data: ""
  });

  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('clients').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente creado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al crear cliente: " + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const { error } = await supabase.from('clients').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente actualizado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al actualizar cliente: " + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente eliminado exitosamente");
    },
    onError: (error) => toast.error("Error al eliminar cliente: " + error.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      person_type: formData.person_type,
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      fiscal_json: formData.fiscal_data ? JSON.parse(formData.fiscal_data) : null,
      address_json: formData.address_data ? JSON.parse(formData.address_data) : null
    };
    
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({ person_type: "fisica", name: "", email: "", phone: "", fiscal_data: "", address_data: "" });
    setEditingClient(null);
    setOpen(false);
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      person_type: client.person_type,
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      fiscal_data: client.fiscal_json ? JSON.stringify(client.fiscal_json, null, 2) : "",
      address_data: client.address_json ? JSON.stringify(client.address_json, null, 2) : ""
    });
    setOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar' : 'Crear'} Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tipo de Persona</Label>
                <Select value={formData.person_type} onValueChange={(value: any) => setFormData({ ...formData, person_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica">Física</SelectItem>
                    <SelectItem value="moral">Moral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Datos Fiscales (JSON)</Label>
                <Textarea
                  value={formData.fiscal_data}
                  onChange={(e) => setFormData({ ...formData, fiscal_data: e.target.value })}
                  placeholder='{"rfc": "...", "razon_social": "..."}'
                  rows={3}
                />
              </div>
              <div>
                <Label>Dirección (JSON)</Label>
                <Textarea
                  value={formData.address_data}
                  onChange={(e) => setFormData({ ...formData, address_data: e.target.value })}
                  placeholder='{"calle": "...", "ciudad": "...", "cp": "..."}'
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingClient ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="capitalize">{client.person_type}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(client.id)}>
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