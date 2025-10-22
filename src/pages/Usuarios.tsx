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
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Usuarios() {
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    sucursal_id: ""
  });

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*, sucursales(nombre)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sucursales')
        .select('id, nombre')
        .eq('activa', true);
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('users').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Usuario creado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al crear usuario: " + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const { error } = await supabase.from('users').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Usuario actualizado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al actualizar usuario: " + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Usuario eliminado exitosamente");
    },
    onError: (error) => toast.error("Error al eliminar usuario: " + error.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      sucursal_id: formData.sucursal_id || null
    };
    
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({ full_name: "", email: "", phone: "", sucursal_id: "" });
    setEditingUser(null);
    setOpen(false);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || "",
      sucursal_id: user.sucursal_id || ""
    });
    setOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar' : 'Crear'} Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
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
              <div className="flex gap-2">
                <Button type="submit">{editingUser ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{user.sucursales?.nombre || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(user.id)}>
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